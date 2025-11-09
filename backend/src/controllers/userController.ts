import { Response } from 'express';
import { AuthRequest, NotFoundError, AuthorizationError } from '../types';
import { User, AuditLog } from '../models';
import authService from '../services/authService';
import { logger } from '../utils/logger';

class UserController {
  // GET /api/users - Get all users (Admin only)
  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, role, is_active } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const offset = (pageNum - 1) * limitNum;

      const where: any = {};
      if (role) where.role = role;
      if (is_active !== undefined) where.is_active = is_active === 'true';

      const { rows: users, count: total } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password_hash', 'mfa_secret', 'backup_codes'] },
        limit: limitNum,
        offset,
        order: [['created_at', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
      });
    }
  }

  // GET /api/users/:id - Get user details
  async getUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      // Can only view own profile unless admin
      if (id !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Access denied');
      }

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash', 'mfa_secret', 'backup_codes'] },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Get user error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch user',
        });
      }
    }
  }

  // PUT /api/users/:id - Update user
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { full_name, phone_number, role, is_active } = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check permissions
      const isOwnProfile = id === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isOwnProfile && !isAdmin) {
        throw new AuthorizationError('Access denied');
      }

      // Only allow updating certain fields based on permissions
      if (full_name) user.full_name = full_name;
      if (phone_number !== undefined) user.phone_number = phone_number;

      // Only admin can change role and status
      if (isAdmin) {
        if (role) user.role = role;
        if (is_active !== undefined) user.is_active = is_active;
      }

      await user.save();

      await AuditLog.create({
        user_id: req.user.id,
        action: 'user_updated',
        resource_type: 'user',
        resource_id: user.id,
        details: { changed_fields: Object.keys(req.body) },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      // Remove sensitive fields
      const userData = user.toJSON() as any;
      delete userData.password_hash;
      delete userData.mfa_secret;
      delete userData.backup_codes;

      res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Update user error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update user',
        });
      }
    }
  }

  // DELETE /api/users/:id - Deactivate user (Admin only)
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Soft delete by deactivating
      user.is_active = false;
      await user.save();

      await AuditLog.create({
        user_id: req.user?.id,
        action: 'user_deleted',
        resource_type: 'user',
        resource_id: user.id,
        details: { email: user.email },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      logger.info(`User deactivated: ${user.email}`);

      res.status(204).send();
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Delete user error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete user',
        });
      }
    }
  }

  // PUT /api/users/:id/password - Change password
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { current_password, new_password } = req.body;

      // Can only change own password
      if (id !== req.user.id) {
        throw new AuthorizationError('Can only change own password');
      }

      const user = await User.findByPk(id);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isValidPassword = await authService.verifyPassword(
        current_password,
        user.password_hash
      );

      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
        });
        return;
      }

      // Update password
      user.password_hash = await authService.hashPassword(new_password);
      user.password_changed_at = new Date();
      await user.save();

      // Logout all other sessions
      await authService.logoutAll(user.id);

      await AuditLog.create({
        user_id: req.user.id,
        action: 'password_changed',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      logger.info(`Password changed for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Change password error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to change password',
        });
      }
    }
  }
}

export default new UserController();
