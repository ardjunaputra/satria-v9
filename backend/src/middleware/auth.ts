import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/authService';
import { User } from '../models';
import { AuthenticationError } from '../types';
import { logger } from '../utils/logger';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.access_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    // Verify token
    const payload = authService.verifyToken(token);

    // Get user from database
    const user = await User.findByPk(payload.userId);

    if (!user || !user.is_active) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      role: user.role,
      mfa_enabled: user.mfa_enabled,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.access_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const payload = authService.verifyToken(token);
      const user = await User.findByPk(payload.userId);

      if (user && user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone_number: user.phone_number,
          role: user.role,
          mfa_enabled: user.mfa_enabled,
          is_active: user.is_active,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};
