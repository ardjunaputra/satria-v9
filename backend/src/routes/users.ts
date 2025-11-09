import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', requireAdmin, userController.getUsers);

// Get user profile (own or admin)
router.get('/:id', userController.getUser);

// Update user (own basic info or admin)
router.put('/:id', userController.updateUser);

// Delete user (admin only)
router.delete('/:id', requireAdmin, userController.deleteUser);

// Change password (own only)
router.put('/:id/password', userController.changePassword);

export default router;
