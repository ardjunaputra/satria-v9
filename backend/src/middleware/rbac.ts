import { Response, NextFunction } from 'express';
import { AuthRequest, AuthorizationError } from '../types';
import { UserRole } from '../../../shared/src';

// Role hierarchy: admin > senior_analyst > analyst > viewer
const roleHierarchy: Record<UserRole, number> = {
  admin: 4,
  senior_analyst: 3,
  analyst: 2,
  viewer: 1,
};

// Check if user has required role or higher
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userRoleLevel = roleHierarchy[req.user.role];
    const hasPermission = allowedRoles.some(
      (role) => userRoleLevel >= roleHierarchy[role]
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

// Specific role checks for clarity
export const requireAdmin = requireRole('admin');
export const requireSeniorAnalyst = requireRole('senior_analyst');
export const requireAnalyst = requireRole('analyst');
export const requireViewer = requireRole('viewer');

// Check if user can perform specific actions
export const canCreateSharedSearch = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const allowedRoles: UserRole[] = ['admin', 'senior_analyst'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Only Admin and Senior Analyst can create shared searches',
    });
    return;
  }

  next();
};

export const canExportData = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const allowedRoles: UserRole[] = ['admin', 'senior_analyst'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Only Admin and Senior Analyst can export data',
    });
    return;
  }

  next();
};

export const canManageKeywords = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const allowedRoles: UserRole[] = ['admin', 'senior_analyst'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Only Admin and Senior Analyst can manage keywords',
    });
    return;
  }

  next();
};

export const canFlagArticles = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const allowedRoles: UserRole[] = ['admin', 'senior_analyst', 'analyst'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Viewer role cannot flag articles',
    });
    return;
  }

  next();
};

export const canGenerateReports = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const allowedRoles: UserRole[] = ['admin', 'senior_analyst', 'analyst'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Viewer role cannot generate reports',
    });
    return;
  }

  next();
};

// Check resource ownership
export const isOwnerOrAdmin = (resourceUserIdField: string = 'user_id') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.body[resourceUserIdField] || req.params.userId;
    if (resourceUserId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources.',
      });
      return;
    }

    next();
  };
};
