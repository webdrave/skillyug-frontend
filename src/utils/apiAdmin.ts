import axios, { AxiosInstance, AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types for admin API responses matching backend structure
export interface AdminApiResponse<T = unknown> {
  status: 'success' | 'error' | 'fail';
  message?: string;
  data?: T;
  errors?: Record<string, string | string[]>;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PaginatedAdminResponse<T> extends AdminApiResponse<T[]> {
  meta: {
    timestamp: string;
    requestId?: string;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Error handling for admin operations
export class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

// Create admin-specific axios instance
const createAdminApiInstance = async (): Promise<AxiosInstance> => {
  const session = await getSession();
  
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token from session if available
  if (session?.user?.accessToken) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${session.user.accessToken}`;
  }

  // Request interceptor for admin-specific headers
  instance.interceptors.request.use(
    (config) => {
      console.log(`[Admin API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('[Admin API] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for admin error handling
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status || 500;
      const data = error.response?.data as Record<string, unknown>;
      
      console.error('[Admin API] Response error:', {
        status,
        message: data?.message || error.message,
        url: error.config?.url,
      });

      // Handle admin-specific errors
      if (status === 403) {
        throw new AdminApiError('Admin access required', status, 'ADMIN_ACCESS_REQUIRED', data);
      }
      
      if (status === 401) {
        throw new AdminApiError('Authentication required', status, 'AUTH_REQUIRED', data);
      }

      throw new AdminApiError(
        (data?.message as string) || error.message || 'Admin API request failed',
        status,
        (data?.code as string),
        data
      );
    }
  );

  return instance;
};

// Admin API helper functions
export const adminApiHelpers = {
  // GET request with admin auth
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    const api = await createAdminApiInstance();
    const response = await api.get(url, { params });
    return response.data;
  },

  // POST request with admin auth
  post: async <T>(url: string, data?: unknown): Promise<T> => {
    const api = await createAdminApiInstance();
    const response = await api.post(url, data);
    return response.data;
  },

  // PUT request with admin auth
  put: async <T>(url: string, data?: unknown): Promise<T> => {
    const api = await createAdminApiInstance();
    const response = await api.put(url, data);
    return response.data;
  },

  // PATCH request with admin auth
  patch: async <T>(url: string, data?: unknown): Promise<T> => {
    const api = await createAdminApiInstance();
    const response = await api.patch(url, data);
    return response.data;
  },

  // DELETE request with admin auth
  delete: async <T>(url: string): Promise<T> => {
    const api = await createAdminApiInstance();
    const response = await api.delete(url);
    return response.data;
  },
};

// Admin-specific API endpoints
export const ADMIN_API_ENDPOINTS = {
  COURSES: {
    LIST: '/courses',
    CREATE: '/courses',
    GET_BY_ID: (id: string) => `/courses/${id}`,
    UPDATE: (id: string) => `/courses/${id}`,
    DELETE: (id: string) => `/courses/${id}`,
    TOGGLE_FEATURED: (id: string) => `/courses/${id}/featured`,
    ANALYTICS: (id: string) => `/courses/${id}/analytics`,
    CATEGORIES: '/courses/categories',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    GET_BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
} as const;

// Course-related types for admin
export interface AdminCourse {
  id: string;
  courseName: string;
  description?: string;
  imageUrl: string;
  price: number;
  token?: number;
  category: string;
  difficulty: string;
  durationHours?: number;
  language: string;
  isActive: boolean;
  isFeatured: boolean;
  learningPathId?: string;
  mentorId: string;
  mentor?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  ratingAverage: number;
  reviewCount: number;
  enrollmentCount?: number;
  completionRate?: number;
}

export interface CreateCourseInput {
  courseName: string;
  description?: string;
  imageUrl: string;
  price: number;
  token?: number;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationHours?: number;
  language?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  learningPathId?: string;
  instructor: string;
}

export interface UpdateCourseInput {
  courseName?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  tokenPrice?: number;
  category?: string;
  difficulty?: string;
  durationHours?: number;
  language?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  learningPathId?: string;
  mentorId?: string;
}

export interface CourseAnalytics {
  enrollmentCount: number;
  completionRate: number;
  revenue: number;
  lastEnrollment?: string;
  popularityRank?: number;
}

// Admin Course API functions
export const adminCourseAPI = {
  // Get all courses with admin privileges
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    featured?: boolean;
    search?: string;
  }): Promise<PaginatedAdminResponse<AdminCourse>> => {
    return adminApiHelpers.get(ADMIN_API_ENDPOINTS.COURSES.LIST, params);
  },

  // Get course by ID
  getById: async (id: string): Promise<AdminApiResponse<AdminCourse>> => {
    return adminApiHelpers.get(ADMIN_API_ENDPOINTS.COURSES.GET_BY_ID(id));
  },

  // Create new course
  create: async (courseData: CreateCourseInput): Promise<AdminApiResponse<AdminCourse>> => {
    return adminApiHelpers.post(ADMIN_API_ENDPOINTS.COURSES.CREATE, courseData);
  },

  // Update course
  update: async (id: string, courseData: UpdateCourseInput): Promise<AdminApiResponse<AdminCourse>> => {
    return adminApiHelpers.patch(ADMIN_API_ENDPOINTS.COURSES.UPDATE(id), courseData);
  },

  // Delete course
  delete: async (id: string): Promise<AdminApiResponse<{ message: string }>> => {
    return adminApiHelpers.delete(ADMIN_API_ENDPOINTS.COURSES.DELETE(id));
  },

  // Toggle featured status
  toggleFeatured: async (id: string): Promise<AdminApiResponse<AdminCourse>> => {
    return adminApiHelpers.patch(ADMIN_API_ENDPOINTS.COURSES.TOGGLE_FEATURED(id));
  },

  // Get course analytics
  getAnalytics: async (id: string): Promise<AdminApiResponse<CourseAnalytics>> => {
    return adminApiHelpers.get(ADMIN_API_ENDPOINTS.COURSES.ANALYTICS(id));
  },

  // Get categories
  getCategories: async (): Promise<AdminApiResponse<{ category: string; count: number }[]>> => {
    return adminApiHelpers.get(ADMIN_API_ENDPOINTS.COURSES.CATEGORIES);
  },
};

// Admin User Interfaces
export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: 'user' | 'admin';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  courses?: number; // Number of courses purchased
  totalSpent?: number; // Total amount spent
}

export interface CreateUserInput {
  name: string;
  email: string;
  role?: 'user' | 'admin';
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  verified?: boolean;
}

// Admin User API functions
export const adminUserAPI = {
  // Get all users with admin privileges
  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: 'user' | 'admin';
    verified?: boolean;
    search?: string;
  }): Promise<PaginatedAdminResponse<AdminUser>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.verified !== undefined) queryParams.append('verified', params.verified.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `${ADMIN_API_ENDPOINTS.USERS.LIST}${queryParams.toString() ? `?${queryParams}` : ''}`;
    return adminApiHelpers.get(url);
  },

  // Get user by ID
  getById: async (id: string): Promise<AdminApiResponse<AdminUser>> => {
    return adminApiHelpers.get(ADMIN_API_ENDPOINTS.USERS.GET_BY_ID(id));
  },

  // Create new user
  create: async (userData: CreateUserInput): Promise<AdminApiResponse<AdminUser>> => {
    return adminApiHelpers.post(ADMIN_API_ENDPOINTS.USERS.CREATE, userData);
  },

  // Update user
  update: async (id: string, userData: UpdateUserInput): Promise<AdminApiResponse<AdminUser>> => {
    return adminApiHelpers.put(ADMIN_API_ENDPOINTS.USERS.UPDATE(id), userData);
  },

  // Delete user
  delete: async (id: string): Promise<AdminApiResponse<void>> => {
    return adminApiHelpers.delete(ADMIN_API_ENDPOINTS.USERS.DELETE(id));
  },

  // Toggle user verification
  toggleVerification: async (id: string): Promise<AdminApiResponse<AdminUser>> => {
    return adminApiHelpers.patch(`${ADMIN_API_ENDPOINTS.USERS.UPDATE(id)}/verify`);
  },

  // Change user role
  changeRole: async (id: string, role: 'user' | 'admin'): Promise<AdminApiResponse<AdminUser>> => {
    return adminApiHelpers.patch(`${ADMIN_API_ENDPOINTS.USERS.UPDATE(id)}/role`, { role });
  },
};