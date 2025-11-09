import { Request } from 'express';
import { IUser } from '../../../shared/src';

// Extend Express Request with authenticated user
export interface AuthRequest extends Request {
  user?: IUser;
}

// Auth Types
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface MFASetupResponse {
  qr_code: string;
  secret: string;
  backup_codes: string[];
}

// Aggregation Types
export interface AggregationResult {
  articles_collected: number;
  duplicates_removed: number;
  processing_time: number;
  errors: string[];
}

export interface SourceFetchResult {
  source_name: string;
  articles: RawArticle[];
  success: boolean;
  error?: string;
}

export interface RawArticle {
  title: string;
  content?: string;
  url?: string;
  image_url?: string;
  published_at: Date;
  source_name: string;
  source_type: string;
}

// Processing Types
export interface ClassificationResult {
  category_ids: string[];
  match_scores: { [category_id: string]: number };
}

export interface RelevanceScore {
  score: number;
  matched_keywords: string[];
  keyword_density: number;
}

export interface GeographicTag {
  primary_region?: string;
  secondary_regions: string[];
}

// Notification Types
export interface NotificationPayload {
  user_id: string;
  article_id: string;
  alert_rule_id: string;
  notification_methods: {
    toast: boolean;
    banner: boolean;
    sound: boolean;
  };
}

// Job Types
export interface AggregationJobData {
  triggered_by: 'schedule' | 'manual';
  triggered_by_user?: string;
}

export interface CleanupJobData {
  retention_days: number;
}

// Error Types
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}
