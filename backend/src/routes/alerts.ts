import { Router } from 'express';
import alertController from '../controllers/alertController';
import { authenticate } from '../middleware/auth';
import { requireAnalyst } from '../middleware/rbac';
import { validate, alertRuleSchema } from '../middleware/validation';

const router = Router();

// All routes require authentication and at least Analyst role
router.use(authenticate, requireAnalyst);

// CRUD operations for alert rules
router.post('/', validate(alertRuleSchema), alertController.createAlert);
router.get('/', alertController.getAlerts);
router.get('/history', alertController.getAlertHistory);
router.get('/:id', alertController.getAlert);
router.put('/:id', validate(alertRuleSchema), alertController.updateAlert);
router.delete('/:id', alertController.deleteAlert);

export default router;
