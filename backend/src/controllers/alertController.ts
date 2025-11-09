import { Response } from 'express';
import { AuthRequest, NotFoundError, AuthorizationError } from '../types';
import { AlertRule, AuditLog } from '../models';
import { logger } from '../utils/logger';

class AlertController {
  // POST /api/alerts - Create alert rule
  async createAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { name, conditions, notification_methods, is_active } = req.body;

      const alertRule = await AlertRule.create({
        user_id: req.user.id,
        name,
        conditions,
        notification_methods,
        is_active: is_active !== undefined ? is_active : true,
      });

      await AuditLog.create({
        user_id: req.user.id,
        action: 'alert_rule_created',
        resource_type: 'alert_rule',
        resource_id: alertRule.id,
        details: { name },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(201).json({
        success: true,
        data: alertRule,
      });
    } catch (error: any) {
      logger.error('Create alert error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create alert rule',
      });
    }
  }

  // GET /api/alerts - Get user's alert rules
  async getAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const alerts = await AlertRule.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data: { alerts },
      });
    } catch (error: any) {
      logger.error('Get alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch alert rules',
      });
    }
  }

  // GET /api/alerts/:id - Get specific alert rule
  async getAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const alertRule = await AlertRule.findByPk(id);

      if (!alertRule) {
        throw new NotFoundError('Alert rule not found');
      }

      // Only owner can view
      if (alertRule.user_id !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Access denied');
      }

      res.status(200).json({
        success: true,
        data: alertRule,
      });
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Get alert error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch alert rule',
        });
      }
    }
  }

  // PUT /api/alerts/:id - Update alert rule
  async updateAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { name, conditions, notification_methods, is_active } = req.body;

      const alertRule = await AlertRule.findByPk(id);

      if (!alertRule) {
        throw new NotFoundError('Alert rule not found');
      }

      // Only owner can update
      if (alertRule.user_id !== req.user.id) {
        throw new AuthorizationError('Only owner can update this alert rule');
      }

      alertRule.name = name || alertRule.name;
      alertRule.conditions = conditions || alertRule.conditions;
      alertRule.notification_methods = notification_methods || alertRule.notification_methods;

      if (is_active !== undefined) {
        alertRule.is_active = is_active;
      }

      await alertRule.save();

      await AuditLog.create({
        user_id: req.user.id,
        action: 'alert_rule_updated',
        resource_type: 'alert_rule',
        resource_id: alertRule.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(200).json({
        success: true,
        data: alertRule,
      });
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Update alert error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update alert rule',
        });
      }
    }
  }

  // DELETE /api/alerts/:id - Delete alert rule
  async deleteAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const alertRule = await AlertRule.findByPk(id);

      if (!alertRule) {
        throw new NotFoundError('Alert rule not found');
      }

      // Only owner or admin can delete
      if (alertRule.user_id !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Access denied');
      }

      await alertRule.destroy();

      await AuditLog.create({
        user_id: req.user.id,
        action: 'alert_rule_deleted',
        resource_type: 'alert_rule',
        resource_id: id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(204).send();
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Delete alert error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete alert rule',
        });
      }
    }
  }

  // GET /api/alerts/history - Get triggered alerts history
  async getAlertHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const offset = (pageNum - 1) * limitNum;

      // Get user's alert rules that have been triggered
      const alerts = await AlertRule.findAll({
        where: {
          user_id: req.user.id,
          triggered_count: { $gt: 0 },
        },
        order: [['last_triggered_at', 'DESC']],
        limit: limitNum,
        offset,
      });

      const total = await AlertRule.count({
        where: {
          user_id: req.user.id,
          triggered_count: { $gt: 0 },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          history: alerts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get alert history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch alert history',
      });
    }
  }
}

export default new AlertController();
