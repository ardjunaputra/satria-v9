import { Router } from 'express';
import searchController from '../controllers/searchController';
import { authenticate } from '../middleware/auth';
import { requireAnalyst } from '../middleware/rbac';
import { validate, savedSearchSchema } from '../middleware/validation';

const router = Router();

// All routes require authentication and at least Analyst role
router.use(authenticate, requireAnalyst);

// CRUD operations for saved searches
router.post('/', validate(savedSearchSchema), searchController.createSearch);
router.get('/', searchController.getSearches);
router.get('/:id', searchController.getSearch);
router.put('/:id', validate(savedSearchSchema), searchController.updateSearch);
router.delete('/:id', searchController.deleteSearch);

export default router;
