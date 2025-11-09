import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};

// Common validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  full_name: Joi.string().min(2).max(255).required(),
  phone_number: Joi.string().optional(),
  role: Joi.string().valid('admin', 'senior_analyst', 'analyst', 'viewer').required(),
});

export const mfaVerifySchema = Joi.object({
  session_id: Joi.string().required(),
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
});

export const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  new_password: Joi.string()
    .min(12)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
      'string.min': 'Password must be at least 12 characters',
    }),
});

export const savedSearchSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional().allow(''),
  filters: Joi.object().required(),
  is_shared: Joi.boolean().optional(),
});

export const alertRuleSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  conditions: Joi.object({
    categories: Joi.array().items(Joi.string().uuid()).optional(),
    regions: Joi.array().items(Joi.string()).optional(),
    min_relevance: Joi.number().min(0).max(100).optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
    priority: Joi.array().items(Joi.string().valid('critical', 'high', 'medium', 'low')).optional(),
  }).required(),
  notification_methods: Joi.object({
    toast: Joi.boolean().required(),
    banner: Joi.boolean().required(),
    sound: Joi.boolean().required(),
    sound_type: Joi.string().valid('default', 'urgent', 'silent').optional(),
  }).required(),
  is_active: Joi.boolean().optional(),
});

export const articleFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  categories: Joi.string().optional(), // comma-separated
  regions: Joi.string().optional(),
  sources: Joi.string().optional(),
  min_relevance: Joi.number().min(0).max(100).optional(),
  priority: Joi.string().valid('critical', 'high', 'medium', 'low').optional(),
  // CRITICAL: Time range limited to 24 hours maximum as per user requirement
  time_range: Joi.string().valid('1h', '6h', '12h', '24h').optional().default('24h'),
  search: Joi.string().optional(),
  sort: Joi.string().valid('relevance', 'date', 'priority').optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
});
