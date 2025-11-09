import { Response } from 'express';
import { AuthRequest } from '../types';
import { SystemStatus, Source, Category, Keyword, AuditLog } from '../models';
import aggregationJob from '../jobs/aggregationJob';
import cleanupJob from '../jobs/cleanupJob';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

class AdminController {
  // GET /api/admin/system-status - Get system status
  async getSystemStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const systemStatus = await SystemStatus.findByPk(1);

      if (!systemStatus) {
        res.status(404).json({
          success: false,
          error: 'System status not found',
        });
        return;
      }

      // Get source statuses
      const sources = await Source.findAll({
        attributes: ['id', 'name', 'status', 'last_success_at', 'error_count', 'source_type'],
        order: [['name', 'ASC']],
      });

      // Get aggregation queue stats
      const queueStats = await aggregationJob.getStats();

      res.status(200).json({
        success: true,
        data: {
          last_refresh_time: systemStatus.last_refresh_time,
          next_refresh_time: systemStatus.next_refresh_time,
          articles_collected_today: systemStatus.articles_collected_today,
          aggregation_running: systemStatus.aggregation_running,
          system_version: systemStatus.system_version,
          sources,
          queue_stats: queueStats,
        },
      });
    } catch (error: any) {
      logger.error('Get system status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch system status',
      });
    }
  }

  // POST /api/admin/trigger-aggregation - Manually trigger aggregation
  async triggerAggregation(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const systemStatus = await SystemStatus.findByPk(1);

      if (systemStatus?.aggregation_running) {
        res.status(409).json({
          success: false,
          error: 'Aggregation cycle already running',
        });
        return;
      }

      await aggregationJob.triggerManual(req.user.id);

      await AuditLog.create({
        user_id: req.user.id,
        action: 'aggregation_triggered',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(202).json({
        success: true,
        message: 'Aggregation cycle triggered',
      });
    } catch (error: any) {
      logger.error('Trigger aggregation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger aggregation',
      });
    }
  }

  // GET /api/admin/audit-logs - Get audit logs
  async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 50,
        user_id,
        action,
        start_date,
        end_date,
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const offset = (pageNum - 1) * limitNum;

      const where: any = {};

      if (user_id) where.user_id = user_id;
      if (action) where.action = action;

      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) where.created_at[Op.gte] = new Date(start_date as string);
        if (end_date) where.created_at[Op.lte] = new Date(end_date as string);
      }

      const { rows: logs, count: total } = await AuditLog.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order: [['created_at', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs',
      });
    }
  }

  // GET /api/admin/categories - Get all categories
  async getCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = await Category.findAll({
        include: [
          {
            model: Keyword,
            as: 'keywords',
            where: { is_active: true },
            required: false,
          },
        ],
        order: [['name', 'ASC']],
      });

      res.status(200).json({
        success: true,
        data: { categories },
      });
    } catch (error: any) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
      });
    }
  }

  // POST /api/admin/categories - Create category
  async createCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, slug, description, color } = req.body;

      const category = await Category.create({
        name,
        slug,
        description,
        color,
        is_active: true,
      });

      await AuditLog.create({
        user_id: req.user?.id,
        action: 'category_created',
        resource_type: 'category',
        resource_id: category.id,
        details: { name, slug },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Create category error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create category',
      });
    }
  }

  // PUT /api/admin/sources/:id - Update source configuration
  async updateSource(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, url, api_key, config, is_active, credibility_score } = req.body;

      const source = await Source.findByPk(id);

      if (!source) {
        res.status(404).json({
          success: false,
          error: 'Source not found',
        });
        return;
      }

      source.name = name || source.name;
      source.url = url !== undefined ? url : source.url;
      source.api_key = api_key !== undefined ? api_key : source.api_key;
      source.config = config || source.config;
      source.is_active = is_active !== undefined ? is_active : source.is_active;
      source.credibility_score = credibility_score || source.credibility_score;

      await source.save();

      await AuditLog.create({
        user_id: req.user?.id,
        action: 'source_updated',
        resource_type: 'source',
        resource_id: source.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(200).json({
        success: true,
        data: source,
      });
    } catch (error: any) {
      logger.error('Update source error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update source',
      });
    }
  }

  // GET /api/admin/job-queue - Get job queue status
  async getJobQueue(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await aggregationJob.getStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get job queue error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch job queue status',
      });
    }
  }

  // POST /api/admin/cleanup - Trigger manual cleanup
  async triggerCleanup(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { retention_days } = req.body;

      await cleanupJob.triggerManual(retention_days);

      await AuditLog.create({
        user_id: req.user?.id,
        action: 'cleanup_triggered',
        details: { retention_days },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(202).json({
        success: true,
        message: 'Cleanup job triggered',
      });
    } catch (error: any) {
      logger.error('Trigger cleanup error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger cleanup',
      });
    }
  }
}

export default new AdminController();
