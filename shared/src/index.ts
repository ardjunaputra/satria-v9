// User Role Types
export type UserRole = 'admin' | 'senior_analyst' | 'analyst' | 'viewer';

// Article Priority Types
export type ArticlePriority = 'critical' | 'high' | 'medium' | 'low';

// Sentiment Types
export type Sentiment = 'positive' | 'neutral' | 'negative';

// Source Types
export type SourceType = 'news_api' | 'rss' | 'twitter' | 'telegram' | 'reddit' | 'osint';

// Source Status
export type SourceStatus = 'online' | 'offline' | 'error';

// User Interface
export interface IUser {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  mfa_enabled: boolean;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Category Interface
export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: Date;
}

// Article Interface
export interface IArticle {
  id: string;
  source_id: string;
  title: string;
  content?: string;
  summary?: string;
  url?: string;
  image_url?: string;
  published_at: Date;
  collected_at: Date;
  content_hash: string;
  duplicate_of?: string;
  relevance_score: number;
  priority: ArticlePriority;
  primary_region?: string;
  secondary_regions?: string[];
  sentiment?: Sentiment;
  is_read_by?: string[];
  flagged_by?: string[];
  created_at: Date;
  categories?: ICategory[];
  source?: ISource;
}

// Source Interface
export interface ISource {
  id: string;
  name: string;
  source_type: SourceType;
  url?: string;
  is_active: boolean;
  credibility_score: number;
  last_fetch_at?: Date;
  last_success_at?: Date;
  status: SourceStatus;
  error_count: number;
  created_at: Date;
}

// Keyword Interface
export interface IKeyword {
  id: string;
  category_id: string;
  keyword: string;
  keyword_type: 'default' | 'user_defined';
  is_active: boolean;
  created_by?: string;
  created_at: Date;
}

// Saved Search Interface
export interface ISavedSearch {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  is_shared: boolean;
  created_at: Date;
  updated_at: Date;
}

// Alert Rule Interface
export interface IAlertRule {
  id: string;
  user_id: string;
  name: string;
  conditions: Record<string, any>;
  notification_methods: {
    toast: boolean;
    banner: boolean;
    sound: boolean;
    sound_type?: 'default' | 'urgent' | 'silent';
  };
  is_active: boolean;
  triggered_count: number;
  last_triggered_at?: Date;
  created_at: Date;
}

// Audit Log Interface
export interface IAuditLog {
  id: number;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure';
  created_at: Date;
}

// System Status Interface
export interface ISystemStatus {
  id: number;
  last_refresh_time?: Date;
  next_refresh_time?: Date;
  articles_collected_today: number;
  aggregation_running: boolean;
  system_version: string;
  updated_at: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Filter Types
export interface ArticleFilters {
  page?: number;
  limit?: number;
  categories?: string[];
  regions?: string[];
  sources?: string[];
  min_relevance?: number;
  priority?: ArticlePriority;
  time_range?: '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';
  start_date?: string;
  end_date?: string;
  search?: string;
  sort?: 'relevance' | 'date' | 'priority';
  order?: 'asc' | 'desc';
}

// WebSocket Event Types
export interface WebSocketEvents {
  'new-article': IArticle;
  'aggregation-status': {
    progress: number;
    articles_collected: number;
    status: string;
  };
  'source-error': {
    source_name: string;
    error_message: string;
  };
  'system-alert': {
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  requires_mfa: boolean;
  session_id?: string;
  user?: IUser;
}

export interface MFAVerifyRequest {
  session_id: string;
  code: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
}

export interface PasswordResetRequest {
  token: string;
  new_password: string;
}

// Constants
export const INTELLIGENCE_CATEGORIES = [
  'Regional Security',
  'Terrorism & Extremism',
  'Military & Defense',
  'Cyber Security',
  'Political Instability',
  'Maritime Security',
  'Critical Infrastructure',
  'Weapons & Proliferation'
] as const;

export const CATEGORY_COLORS = {
  'regional-security': '#3b82f6',
  'terrorism': '#ef4444',
  'military-defense': '#059669',
  'cyber-security': '#8b5cf6',
  'political-instability': '#f97316',
  'maritime-security': '#0891b2',
  'critical-infrastructure': '#eab308',
  'weapons-proliferation': '#dc2626'
} as const;

export const GEOGRAPHIC_REGIONS = [
  'Malaysia',
  'Southeast Asia',
  'South China Sea',
  'Singapore',
  'Indonesia',
  'Thailand',
  'Philippines',
  'Vietnam',
  'Myanmar',
  'Cambodia',
  'Laos',
  'Brunei',
  'East Asia',
  'South Asia',
  'Middle East',
  'Central Asia',
  'Indo-Pacific',
  'Global'
] as const;
