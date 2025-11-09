import { Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { AuthRequest, NotFoundError } from '../types';
import { Article, Category, Source, ArticleCategory, AuditLog } from '../models';
import { logger } from '../utils/logger';
import { ArticleFilters } from '../../../shared/src';

class ArticleController {
  // GET /api/articles - Get paginated articles with filters
  async getArticles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        categories,
        regions,
        sources,
        min_relevance = 30,
        priority,
        time_range = '24h',
        search,
        sort = 'date',
        order = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const offset = (pageNum - 1) * limitNum;

      // CRITICAL: ENFORCE 24-HOUR CONSTRAINT
      // Articles MUST NOT be older than 24 hours as per user requirement
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Build WHERE clause
      const where: any = {
        // MANDATORY: Only show articles from last 24 hours
        published_at: {
          [Op.gte]: twentyFourHoursAgo,
        },
        relevance_score: {
          [Op.gte]: parseInt(min_relevance as string, 10),
        },
        duplicate_of: null, // Exclude duplicates
      };

      // Priority filter
      if (priority) {
        where.priority = priority;
      }

      // Region filter
      if (regions) {
        const regionArray = (regions as string).split(',');
        where[Op.or] = [
          { primary_region: { [Op.in]: regionArray } },
          {
            secondary_regions: {
              [Op.overlap]: regionArray,
            },
          },
        ];
      }

      // Source filter
      if (sources) {
        const sourceArray = (sources as string).split(',');
        where.source_id = { [Op.in]: sourceArray };
      }

      // Search filter
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
          { summary: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Category filter (requires join)
      let categoryFilter = {};
      if (categories) {
        const categoryArray = (categories as string).split(',');
        categoryFilter = {
          model: Category,
          as: 'categories',
          where: { id: { [Op.in]: categoryArray } },
          through: { attributes: [] },
        };
      }

      // Sorting
      let orderClause: any = [];
      if (sort === 'relevance') {
        orderClause = [['relevance_score', order.toUpperCase()]];
      } else if (sort === 'priority') {
        // Custom priority order: critical > high > medium > low
        orderClause = [
          [
            Sequelize.literal(`CASE priority
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
            END`),
            order.toUpperCase(),
          ],
        ];
      } else {
        orderClause = [['published_at', order.toUpperCase()]];
      }

      // Query articles
      const { rows: articles, count: total } = await Article.findAndCountAll({
        where,
        include: [
          categoryFilter.model
            ? categoryFilter
            : {
                model: Category,
                as: 'categories',
                through: { attributes: [] },
              },
          {
            model: Source,
            as: 'source',
            attributes: ['id', 'name', 'credibility_score', 'source_type'],
          },
        ],
        limit: limitNum,
        offset,
        order: orderClause,
        distinct: true,
      });

      // Check if current user has read each article
      const articlesWithReadStatus = articles.map((article) => {
        const articleData = article.toJSON() as any;
        return {
          ...articleData,
          is_read: req.user?.id ? articleData.is_read_by?.includes(req.user.id) : false,
          is_flagged: req.user?.id ? articleData.flagged_by?.includes(req.user.id) : false,
          // Remove internal arrays from response
          is_read_by: undefined,
          flagged_by: undefined,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          articles: articlesWithReadStatus,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      logger.error('Get articles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch articles',
      });
    }
  }

  // GET /api/articles/:id - Get single article
  async getArticle(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const article = await Article.findOne({
        where: { id },
        include: [
          {
            model: Category,
            as: 'categories',
            through: { attributes: ['match_score'] },
          },
          {
            model: Source,
            as: 'source',
          },
        ],
      });

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      // Mark as read by current user
      if (req.user?.id) {
        const isReadBy = article.is_read_by || [];
        if (!isReadBy.includes(req.user.id)) {
          isReadBy.push(req.user.id);
          article.is_read_by = isReadBy;
          await article.save();
        }

        await AuditLog.create({
          user_id: req.user.id,
          action: 'article_viewed',
          resource_type: 'article',
          resource_id: article.id,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          status: 'success',
        });
      }

      // Get related articles (same categories, similar relevance)
      const relatedArticles = await Article.findAll({
        include: [
          {
            model: Category,
            as: 'categories',
            where: {
              id: {
                [Op.in]: article.categories?.map((c: any) => c.id) || [],
              },
            },
            through: { attributes: [] },
          },
          {
            model: Source,
            as: 'source',
            attributes: ['id', 'name', 'credibility_score'],
          },
        ],
        where: {
          id: { [Op.ne]: article.id },
          // ENFORCE 24-HOUR CONSTRAINT on related articles too
          published_at: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          relevance_score: {
            [Op.gte]: article.relevance_score - 20,
            [Op.lte]: article.relevance_score + 20,
          },
        },
        limit: 5,
        order: [['relevance_score', 'DESC']],
      });

      const articleData = article.toJSON() as any;
      const response = {
        ...articleData,
        is_read: req.user?.id ? articleData.is_read_by?.includes(req.user.id) : false,
        is_flagged: req.user?.id ? articleData.flagged_by?.includes(req.user.id) : false,
        is_read_by: undefined,
        flagged_by: undefined,
        related_articles: relatedArticles.map((ra) => {
          const raData = ra.toJSON() as any;
          return {
            id: raData.id,
            title: raData.title,
            summary: raData.summary,
            published_at: raData.published_at,
            relevance_score: raData.relevance_score,
            priority: raData.priority,
            categories: raData.categories,
            source: raData.source,
          };
        }),
      };

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Get article error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch article',
        });
      }
    }
  }

  // POST /api/articles/:id/flag - Flag article for review
  async flagArticle(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;

      const article = await Article.findByPk(id);

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      const flaggedBy = article.flagged_by || [];
      if (!flaggedBy.includes(req.user.id)) {
        flaggedBy.push(req.user.id);
        article.flagged_by = flaggedBy;
        await article.save();
      }

      await AuditLog.create({
        user_id: req.user.id,
        action: 'article_flagged',
        resource_type: 'article',
        resource_id: article.id,
        details: { reason },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(200).json({
        success: true,
        data: { flagged: true },
      });
    } catch (error) {
      logger.error('Flag article error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to flag article',
      });
    }
  }

  // DELETE /api/articles/:id/flag - Unflag article
  async unflagArticle(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const article = await Article.findByPk(id);

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      const flaggedBy = article.flagged_by || [];
      const index = flaggedBy.indexOf(req.user.id);
      if (index > -1) {
        flaggedBy.splice(index, 1);
        article.flagged_by = flaggedBy;
        await article.save();
      }

      await AuditLog.create({
        user_id: req.user.id,
        action: 'article_unflagged',
        resource_type: 'article',
        resource_id: article.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(200).json({
        success: true,
        data: { flagged: false },
      });
    } catch (error) {
      logger.error('Unflag article error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unflag article',
      });
    }
  }
}

export default new ArticleController();
