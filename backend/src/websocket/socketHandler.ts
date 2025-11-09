import { Server, Socket } from 'socket.io';
import authService from '../services/authService';
import { User, AlertRule, Article, Category } from '../models';
import { logger } from '../utils/logger';
import { IArticle } from '../../../shared/src';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const setupWebSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const payload = authService.verifyToken(token);

      // Attach user info to socket
      socket.userId = payload.userId;
      socket.userRole = payload.role;

      logger.debug(`WebSocket authenticated: User ${payload.userId}`);
      next();
    } catch (error: any) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`WebSocket connected: ${socket.id} (User: ${socket.userId})`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });

    // Handle ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  logger.info('✅ WebSocket handlers configured');
};

// Emit new article to all connected clients
export const emitNewArticle = async (io: Server, article: any) => {
  try {
    // Get all active alert rules
    const alertRules = await AlertRule.findAll({
      where: { is_active: true },
      include: [{ model: User, as: 'user' }],
    });

    // Get article categories
    const articleWithCategories = await Article.findByPk(article.id, {
      include: [
        { model: Category, as: 'categories', through: { attributes: [] } },
      ],
    });

    if (!articleWithCategories) return;

    const articleData = articleWithCategories.toJSON() as any;

    // Check each alert rule
    for (const rule of alertRules) {
      const conditions = rule.conditions;
      let matches = true;

      // Check category condition
      if (conditions.categories && conditions.categories.length > 0) {
        const articleCategoryIds = articleData.categories.map((c: any) => c.id);
        const hasMatchingCategory = conditions.categories.some((catId: string) =>
          articleCategoryIds.includes(catId)
        );
        if (!hasMatchingCategory) matches = false;
      }

      // Check region condition
      if (conditions.regions && conditions.regions.length > 0 && article.primary_region) {
        if (!conditions.regions.includes(article.primary_region)) matches = false;
      }

      // Check relevance condition
      if (conditions.min_relevance && article.relevance_score < conditions.min_relevance) {
        matches = false;
      }

      // Check priority condition
      if (conditions.priority && conditions.priority.length > 0) {
        if (!conditions.priority.includes(article.priority)) matches = false;
      }

      // Check keywords condition
      if (conditions.keywords && conditions.keywords.length > 0) {
        const content = `${article.title} ${article.content || ''}`.toLowerCase();
        const hasKeyword = conditions.keywords.some((keyword: string) =>
          content.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) matches = false;
      }

      // If all conditions match, send notification
      if (matches && rule.user_id) {
        io.to(`user:${rule.user_id}`).emit('new-article', {
          article: {
            id: article.id,
            title: article.title,
            summary: article.summary,
            published_at: article.published_at,
            relevance_score: article.relevance_score,
            priority: article.priority,
            categories: articleData.categories,
            primary_region: article.primary_region,
          },
          notification_methods: rule.notification_methods,
          alert_rule_name: rule.name,
        });

        // Update alert rule stats
        rule.triggered_count += 1;
        rule.last_triggered_at = new Date();
        await rule.save();
      }
    }

    // Also broadcast to all clients (for dashboard updates)
    io.emit('article-update', {
      action: 'new',
      article: {
        id: article.id,
        title: article.title,
        published_at: article.published_at,
        priority: article.priority,
      },
    });
  } catch (error) {
    logger.error('Error emitting new article:', error);
  }
};

// Emit aggregation status updates
export const emitAggregationStatus = (
  io: Server,
  status: {
    status: string;
    progress?: number;
    articles_collected?: number;
    error?: string;
  }
) => {
  io.emit('aggregation-status', status);
};

// Emit system alerts (admin only)
export const emitSystemAlert = (
  io: Server,
  alert: {
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
  }
) => {
  // Emit only to admin users
  io.emit('system-alert', alert);
  logger.warn(`System alert emitted: ${alert.message}`);
};

// Emit source error (admin only)
export const emitSourceError = (
  io: Server,
  source: {
    source_name: string;
    error_message: string;
  }
) => {
  io.emit('source-error', source);
};

export default setupWebSocketHandlers;
