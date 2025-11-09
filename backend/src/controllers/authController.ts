import { Response } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/authService';
import { User, AuditLog } from '../models';
import { logger } from '../utils/logger';
import { generateRandomToken } from '../utils/encryption';

class AuthController {
  // POST /api/auth/register (Admin only)
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, full_name, phone_number, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Email already registered',
        });
        return;
      }

      // Generate temporary password
      const temporaryPassword = generateRandomToken(12);
      const password_hash = await authService.hashPassword(temporaryPassword);

      // Create user
      const user = await User.create({
        email,
        full_name,
        phone_number,
        role,
        password_hash,
        mfa_enabled: false,
        is_active: true,
      });

      // Log action
      await AuditLog.create({
        user_id: req.user?.id,
        action: 'user_created',
        resource_type: 'user',
        resource_id: user.id,
        details: { email, role },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      logger.info(`New user created: ${email} by ${req.user?.email}`);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
          },
          temporary_password: temporaryPassword,
        },
        message: 'User created successfully. Temporary password must be changed on first login.',
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  }

  // POST /api/auth/login
  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;

      const result = await authService.attemptLogin(email, password, ipAddress);

      // Log login attempt
      await AuditLog.create({
        user_id: result.user.id,
        action: 'login_attempt',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      if (result.requires_mfa) {
        // Return session ID for MFA verification
        res.status(200).json({
          success: true,
          data: {
            requires_mfa: true,
            session_id: result.session_id,
          },
        });
      } else {
        // No MFA required, create session immediately
        const tokens = await authService.createSession(
          result.user.id,
          req.ip,
          req.get('user-agent')
        );

        // Set httpOnly cookies
        res.cookie('access_token', tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refresh_token', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        await AuditLog.create({
          user_id: result.user.id,
          action: 'login_success',
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          status: 'success',
        });

        res.status(200).json({
          success: true,
          data: {
            user: {
              id: result.user.id,
              email: result.user.email,
              full_name: result.user.full_name,
              role: result.user.role,
            },
          },
        });
      }
    } catch (error: any) {
      await AuditLog.create({
        action: 'login_failed',
        details: { email: req.body.email, error: error.message },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'failure',
      });

      res.status(401).json({
        success: false,
        error: error.message || 'Login failed',
      });
    }
  }

  // POST /api/auth/verify-mfa
  async verifyMFA(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { session_id, code } = req.body;

      // In production, retrieve userId from Redis using session_id
      // For now, this is a simplified implementation
      // const userId = await redisClient.get(`mfa_session:${session_id}`);

      // Placeholder: In real implementation, get userId from temporary session
      const userId = req.body.user_id; // This should come from Redis session

      const verified = await authService.verifyMFA(userId, code);

      if (!verified) {
        res.status(401).json({
          success: false,
          error: 'Invalid MFA code',
        });
        return;
      }

      // Create session
      const tokens = await authService.createSession(
        userId,
        req.ip,
        req.get('user-agent')
      );

      // Set httpOnly cookies
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const user = await User.findByPk(userId);

      await AuditLog.create({
        user_id: userId,
        action: 'mfa_verified',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user!.id,
            email: user!.email,
            full_name: user!.full_name,
            role: user!.role,
          },
        },
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'MFA verification failed',
      });
    }
  }

  // POST /api/auth/setup-mfa
  async setupMFA(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const result = await authService.setupMFA(req.user.id);

      await AuditLog.create({
        user_id: req.user.id,
        action: 'mfa_setup_initiated',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'MFA setup failed',
      });
    }
  }

  // POST /api/auth/confirm-mfa
  async confirmMFA(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { code } = req.body;
      await authService.confirmMFA(req.user.id, code);

      await AuditLog.create({
        user_id: req.user.id,
        action: 'mfa_enabled',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(200).json({
        success: true,
        message: 'MFA enabled successfully',
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'MFA confirmation failed',
      });
    }
  }

  // POST /api/auth/logout
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          action: 'logout',
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          status: 'success',
        });
      }

      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  // POST /api/auth/refresh
  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'No refresh token provided',
        });
        return;
      }

      const newAccessToken = await authService.refreshAccessToken(refreshToken);

      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed',
      });
    }
  }

  // POST /api/auth/forgot-password
  async forgotPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const resetToken = await authService.generatePasswordResetToken(email);

      // In production: Send email with reset link
      // await emailService.sendPasswordReset(email, resetToken);

      logger.info(`Password reset requested for: ${email}`);

      // Always return success for security (don't reveal if email exists)
      res.status(200).json({
        success: true,
        message: 'If account exists, reset link sent to email',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Password reset request failed',
      });
    }
  }

  // POST /api/auth/reset-password
  async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { token, new_password } = req.body;
      await authService.resetPassword(token, new_password);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Password reset failed',
      });
    }
  }
}

export default new AuthController();
