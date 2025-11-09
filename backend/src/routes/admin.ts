import { Router } from 'express';
import adminController from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// System management
router.get('/system-status', adminController.getSystemStatus);
router.post('/trigger-aggregation', adminController.triggerAggregation);
router.post('/cleanup', adminController.triggerCleanup);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// Categories management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);

// Sources management
router.put('/sources/:id', adminController.updateSource);

// Job queue
router.get('/job-queue', adminController.getJobQueue);

export default router;
