import { Router } from 'express';
import articleController from '../controllers/articleController';
import { authenticate } from '../middleware/auth';
import { canFlagArticles } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get articles with filters (all authenticated users)
router.get('/', articleController.getArticles);

// Get single article (all authenticated users)
router.get('/:id', articleController.getArticle);

// Flag/unflag articles (Analyst, Senior Analyst, Admin only)
router.post('/:id/flag', canFlagArticles, articleController.flagArticle);
router.delete('/:id/flag', canFlagArticles, articleController.unflagArticle);

export default router;
