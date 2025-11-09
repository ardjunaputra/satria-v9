import { Response } from 'express';
import { AuthRequest, NotFoundError, AuthorizationError } from '../types';
import { SavedSearch, AuditLog } from '../models';
import { logger } from '../utils/logger';

class SearchController {
  // POST /api/searches - Create saved search
  async createSearch(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { name, description, filters, is_shared } = req.body;

      // Only Admin and Senior Analyst can create shared searches
      const canShare = ['admin', 'senior_analyst'].includes(req.user.role);
      const finalIsShared = canShare && is_shared;

      const savedSearch = await SavedSearch.create({
        user_id: req.user.id,
        name,
        description,
        filters,
        is_shared: finalIsShared,
      });

      await AuditLog.create({
        user_id: req.user.id,
        action: 'saved_search_created',
        resource_type: 'saved_search',
        resource_id: savedSearch.id,
        details: { name, is_shared: finalIsShared },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(201).json({
        success: true,
        data: savedSearch,
      });
    } catch (error: any) {
      logger.error('Create search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create saved search',
      });
    }
  }

  // GET /api/searches - Get user's saved searches
  async getSearches(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      // Get personal searches
      const personalSearches = await SavedSearch.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
      });

      // Get shared searches from others
      const sharedSearches = await SavedSearch.findAll({
        where: {
          is_shared: true,
          user_id: { $ne: req.user.id },
        },
        order: [['created_at', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data: {
          personal: personalSearches,
          shared: sharedSearches,
        },
      });
    } catch (error: any) {
      logger.error('Get searches error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch saved searches',
      });
    }
  }

  // GET /api/searches/:id - Get specific saved search
  async getSearch(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const savedSearch = await SavedSearch.findByPk(id);

      if (!savedSearch) {
        throw new NotFoundError('Saved search not found');
      }

      // Check permission: owner or shared
      if (savedSearch.user_id !== req.user.id && !savedSearch.is_shared) {
        throw new AuthorizationError('Access denied');
      }

      res.status(200).json({
        success: true,
        data: savedSearch,
      });
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Get search error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch saved search',
        });
      }
    }
  }

  // PUT /api/searches/:id - Update saved search
  async updateSearch(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { name, description, filters, is_shared } = req.body;

      const savedSearch = await SavedSearch.findByPk(id);

      if (!savedSearch) {
        throw new NotFoundError('Saved search not found');
      }

      // Only owner can update
      if (savedSearch.user_id !== req.user.id) {
        throw new AuthorizationError('Only owner can update this search');
      }

      // Check permission for sharing
      const canShare = ['admin', 'senior_analyst'].includes(req.user.role);

      savedSearch.name = name || savedSearch.name;
      savedSearch.description = description !== undefined ? description : savedSearch.description;
      savedSearch.filters = filters || savedSearch.filters;

      if (is_shared !== undefined && canShare) {
        savedSearch.is_shared = is_shared;
      }

      await savedSearch.save();

      await AuditLog.create({
        user_id: req.user.id,
        action: 'saved_search_updated',
        resource_type: 'saved_search',
        resource_id: savedSearch.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success',
      });

      res.status(200).json({
        success: true,
        data: savedSearch,
      });
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        logger.error('Update search error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update saved search',
        });
      }
    }
  }

  // DELETE /api/searches/:id - Delete saved search
  async deleteSearch(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const savedSearch = await SavedSearch.findByPk(id);

      if (!savedSearch) {
        throw new NotFoundError('Saved search not found');
      }

      // Only owner or admin can delete
      if (savedSearch.user_id !== req.user.id && req.user.role !== 'admin') {
        throw new AuthorizationError('Access denied');
      }

      await savedSearch.destroy();

      await AuditLog.create({
        user_id: req.user.id,
        action: 'saved_search_deleted',
        resource_type: 'saved_search',
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
        logger.error('Delete search error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete saved search',
        });
      }
    }
  }
}

export default new SearchController();
