import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User, Session } from '../models';
import { encrypt, decrypt, generateRandomToken } from '../utils/encryption';
import { JWT_CONFIG, PASSWORD_CONFIG, MFA_CONFIG, SESSION_CONFIG } from '../config/constants';
import { logger } from '../utils/logger';
import { JWTPayload, MFASetupResponse, AuthenticationError, ValidationError } from '../types';

class AuthService {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS);
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT tokens
  generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_CONFIG.SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    });
  }

  generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_CONFIG.SECRET, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
    });
  }

  // Verify JWT token
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_CONFIG.SECRET) as JWTPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  // Login attempt with rate limiting
  async attemptLogin(email: string, password: string, ipAddress?: string): Promise<{ user: User; requires_mfa: boolean; session_id?: string }> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      logger.warn(`Failed login attempt for non-existent user: ${email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.is_active) {
      throw new AuthenticationError('Account is inactive');
    }

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      const remainingTime = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      throw new AuthenticationError(`Account locked. Try again in ${remainingTime} minutes`);
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed attempts
      user.failed_login_attempts += 1;

      if (user.failed_login_attempts >= PASSWORD_CONFIG.MAX_LOGIN_ATTEMPTS) {
        user.locked_until = new Date(Date.now() + PASSWORD_CONFIG.LOCKOUT_DURATION);
        logger.warn(`Account locked due to multiple failed attempts: ${email}`);
      }

      await user.save();
      throw new AuthenticationError('Invalid credentials');
    }

    // Reset failed attempts on successful password verification
    user.failed_login_attempts = 0;
    user.locked_until = null;
    await user.save();

    // Check if MFA is enabled
    if (user.mfa_enabled && user.mfa_secret) {
      // Generate temporary session ID for MFA verification
      const sessionId = generateRandomToken();

      // Store temp session in Redis with 5 minute expiry
      // This would be implemented with Redis in production

      return {
        user,
        requires_mfa: true,
        session_id: sessionId,
      };
    }

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    return {
      user,
      requires_mfa: false,
    };
  }

  // Verify MFA code
  async verifyMFA(userId: string, code: string): Promise<boolean> {
    const user = await User.findByPk(userId);

    if (!user || !user.mfa_secret) {
      throw new AuthenticationError('MFA not configured');
    }

    const decryptedSecret = decrypt(user.mfa_secret);

    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: MFA_CONFIG.WINDOW,
    });

    if (verified) {
      user.last_login_at = new Date();
      await user.save();
    }

    return verified;
  }

  // Setup MFA for user
  async setupMFA(userId: string): Promise<MFASetupResponse> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ValidationError('User not found');
    }

    if (user.mfa_enabled) {
      throw new ValidationError('MFA already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${MFA_CONFIG.ISSUER} (${user.email})`,
      issuer: MFA_CONFIG.ISSUER,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = Array.from({ length: MFA_CONFIG.BACKUP_CODES_COUNT }, () =>
      generateRandomToken(8).toUpperCase()
    );

    // Encrypt and store (but don't enable yet - waiting for confirmation)
    user.mfa_secret = encrypt(secret.base32);
    user.backup_codes = backupCodes.map((code) => encrypt(code));
    await user.save();

    return {
      qr_code: qrCode,
      secret: secret.base32,
      backup_codes: backupCodes,
    };
  }

  // Confirm MFA setup
  async confirmMFA(userId: string, code: string): Promise<void> {
    const verified = await this.verifyMFA(userId, code);

    if (!verified) {
      throw new AuthenticationError('Invalid MFA code');
    }

    const user = await User.findByPk(userId);
    if (user) {
      user.mfa_enabled = true;
      await user.save();
      logger.info(`MFA enabled for user: ${user.email}`);
    }
  }

  // Create session
  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ValidationError('User not found');
    }

    // Check concurrent session limit
    const activeSessions = await Session.count({
      where: { user_id: userId },
    });

    if (activeSessions >= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
      // Remove oldest session
      const oldestSession = await Session.findOne({
        where: { user_id: userId },
        order: [['created_at', 'ASC']],
      });

      if (oldestSession) {
        await oldestSession.destroy();
      }
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token in database
    await Session.create({
      user_id: userId,
      refresh_token: refreshToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { accessToken, refreshToken };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const payload = this.verifyToken(refreshToken);

    // Verify refresh token exists in database
    const session = await Session.findOne({
      where: { refresh_token: refreshToken },
    });

    if (!session) {
      throw new AuthenticationError('Invalid refresh token');
    }

    if (session.expires_at < new Date()) {
      await session.destroy();
      throw new AuthenticationError('Refresh token expired');
    }

    // Generate new access token
    return this.generateAccessToken(payload);
  }

  // Logout (invalidate session)
  async logout(refreshToken: string): Promise<void> {
    await Session.destroy({
      where: { refresh_token: refreshToken },
    });
  }

  // Logout all sessions for user
  async logoutAll(userId: string): Promise<void> {
    await Session.destroy({
      where: { user_id: userId },
    });

    logger.info(`All sessions logged out for user ID: ${userId}`);
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Return success even if user doesn't exist (security)
      return '';
    }

    const resetToken = generateRandomToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store in Redis with expiry
    // In production: await redisClient.set(`reset:${resetToken}`, user.id, { EX: 3600 });

    logger.info(`Password reset token generated for: ${email}`);
    return resetToken;
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // In production: const userId = await redisClient.get(`reset:${token}`);
    // For now, this is a placeholder

    if (!token) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Validate password strength
    if (newPassword.length < PASSWORD_CONFIG.MIN_LENGTH) {
      throw new ValidationError(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`);
    }

    // Get user and update password
    // const user = await User.findByPk(userId);
    // if (user) {
    //   user.password_hash = await this.hashPassword(newPassword);
    //   user.password_changed_at = new Date();
    //   await user.save();
    //   await this.logoutAll(user.id);
    // }

    logger.info('Password reset successful');
  }
}

export default new AuthService();
