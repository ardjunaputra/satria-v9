import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validate, loginSchema, registerSchema, mfaVerifySchema, passwordResetSchema } from '../middleware/validation';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/verify-mfa', authLimiter, validate(mfaVerifySchema), authController.verifyMFA);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', validate(passwordResetSchema), authController.resetPassword);

// Protected routes
router.post('/register', authenticate, requireAdmin, validate(registerSchema), authController.register);
router.post('/setup-mfa', authenticate, authController.setupMFA);
router.post('/confirm-mfa', authenticate, authController.confirmMFA);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refreshToken);

export default router;
