import apiClient from './axios';
import { IUser, IArticle, ICategory, IAlert, ISavedSearch, UserRole, ArticlePriority } from '@shared';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<ApiResponse<{ user: IUser; token: string; requiresMFA: boolean }>>('/auth/login', { email, password });
    return data;
  },

  verifyMFA: async (email: string, token: string) => {
    const { data } = await apiClient.post<ApiResponse<{ user: IUser; token: string }>>('/auth/verify-mfa', { email, token });
    return data;
  },

  logout: async () => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return data;
  },

  setupMFA: async () => {
    const { data } = await apiClient.post<ApiResponse<{ qrCode: string; secret: string; backupCodes: string[] }>>('/auth/setup-mfa');
    return data;
  },

  enableMFA: async (token: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/enable-mfa', { token });
    return data;
  },

  disableMFA: async (password: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/disable-mfa', { password });
    return data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get<ApiResponse<IUser>>('/auth/me');
    return data;
  },
};

// Articles API
export interface ArticleFilters {
  category_id?: string;
  source_id?: string;
  priority?: ArticlePriority;
  keyword?: string;
  start_date?: string;
  end_date?: string;
  region?: string;
  time_range?: number;
  sort_by?: 'relevance' | 'date' | 'priority';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const articlesApi = {
  getArticles: async (filters: ArticleFilters = {}) => {
    const { data } = await apiClient.get<PaginatedResponse<IArticle>>('/articles', { params: filters });
    return data;
  },

  getArticleById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<IArticle>>(`/articles/${id}`);
    return data;
  },

  getRelatedArticles: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<IArticle[]>>(`/articles/${id}/related`);
    return data;
  },

  markAsRead: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>(`/articles/${id}/read`);
    return data;
  },

  flagArticle: async (id: string, reason: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>(`/articles/${id}/flag`, { reason });
    return data;
  },

  exportArticles: async (filters: ArticleFilters, format: 'json' | 'csv' | 'pdf') => {
    const { data } = await apiClient.post<Blob>('/articles/export', { filters, format }, { responseType: 'blob' });
    return data;
  },
};

// Categories API
export const categoriesApi = {
  getCategories: async () => {
    const { data } = await apiClient.get<ApiResponse<ICategory[]>>('/admin/categories');
    return data;
  },
};

// Alerts API
export const alertsApi = {
  getAlerts: async () => {
    const { data } = await apiClient.get<ApiResponse<IAlert[]>>('/alerts');
    return data;
  },

  createAlert: async (alert: Partial<IAlert>) => {
    const { data } = await apiClient.post<ApiResponse<IAlert>>('/alerts', alert);
    return data;
  },

  updateAlert: async (id: string, alert: Partial<IAlert>) => {
    const { data } = await apiClient.put<ApiResponse<IAlert>>(`/alerts/${id}`, alert);
    return data;
  },

  deleteAlert: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/alerts/${id}`);
    return data;
  },

  testAlert: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>(`/alerts/${id}/test`);
    return data;
  },
};

// Saved Searches API
export const savedSearchesApi = {
  getSavedSearches: async () => {
    const { data } = await apiClient.get<ApiResponse<ISavedSearch[]>>('/searches');
    return data;
  },

  createSavedSearch: async (search: Partial<ISavedSearch>) => {
    const { data } = await apiClient.post<ApiResponse<ISavedSearch>>('/searches', search);
    return data;
  },

  deleteSavedSearch: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/searches/${id}`);
    return data;
  },
};

// Admin API
export const adminApi = {
  getSystemStatus: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/admin/system/status');
    return data;
  },

  triggerAggregation: async () => {
    const { data } = await apiClient.post<ApiResponse<null>>('/admin/system/aggregate');
    return data;
  },

  getUsers: async () => {
    const { data } = await apiClient.get<ApiResponse<IUser[]>>('/users');
    return data;
  },

  createUser: async (user: Partial<IUser>) => {
    const { data } = await apiClient.post<ApiResponse<IUser>>('/users', user);
    return data;
  },

  updateUser: async (id: string, user: Partial<IUser>) => {
    const { data } = await apiClient.put<ApiResponse<IUser>>(`/users/${id}`, user);
    return data;
  },

  deleteUser: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
    return data;
  },

  getSources: async () => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/admin/sources');
    return data;
  },

  updateSource: async (id: string, source: any) => {
    const { data } = await apiClient.put<ApiResponse<any>>(`/admin/sources/${id}`, source);
    return data;
  },
};
