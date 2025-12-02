import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import { getSession } from "next-auth/react";

// Types for API responses matching backend format
export interface ErrorResponse {
	message?: string;
	code?: string;
	[key: string]: unknown;
}

interface ApiResponse<T = unknown> {
	status: 'success' | 'error' | 'fail';
	data?: T;
	message?: string;
	error?: string;
	errors?: Record<string, unknown> | string[] | Array<Record<string, unknown>>;
	code?: string;
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

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// Error types
class ApiError extends Error {
	constructor(message: string, public status: number, public code?: string, public data?: unknown) {
		super(message);
		this.name = "ApiError";
	}
}

// Payment data interfaces
interface PaymentSuccessData {
	razorpay_payment_id: string;
	razorpay_order_id: string;
	razorpay_signature: string;
	[key: string]: unknown;
}

interface PaymentErrorDetails {
	error: string;
	code?: string;
	description?: string;
	[key: string]: unknown;
}

// Extended user type for session
interface SessionUser {
	id: string;
	userType: string;
	accessToken?: string;
	[key: string]: unknown;
}

// Session type from next-auth
interface AuthSession {
	user?: SessionUser;
	expires?: string;
	[key: string]: unknown;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const createApiInstance = (): AxiosInstance => {
	const instance = axios.create({
		baseURL: API_BASE_URL,
		timeout: 30000,
		headers: {
			"Content-Type": "application/json",
		},
		withCredentials: true, // Important for cookies/sessions
	});

	// Request interceptor to add auth token
	instance.interceptors.request.use(
		async (config) => {
			try {
				// Try to get session with timeout, but don't fail the request if it times out
				const sessionPromise = getSession();
				const timeoutPromise = new Promise<null>((resolve) => 
					setTimeout(() => resolve(null), 1000)
				);
				
				const session = await Promise.race([sessionPromise, timeoutPromise]).catch((err) => {
					console.warn('getSession error:', err);
					return null;
				}) as AuthSession | null;
				
				if (session?.user) {
					// Add session info to headers
					config.headers["X-User-ID"] = session.user.id;
					config.headers["X-User-Type"] = session.user.userType;
					
					const accessToken = session.user.accessToken;
					if (accessToken) {
						config.headers.Authorization = `Bearer ${accessToken}`;
					} 
				}

				if (!config.headers.Authorization && typeof window !== "undefined") {
					const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
					if (token) {
						config.headers.Authorization = `Bearer ${token}`;
					}
				}
			} catch (error) {
				console.warn("Failed to add auth headers:", error);
			}

			return config;
		},
		(error) => {
			return Promise.reject(error);
		}
	);

	// Response interceptor for error handling and token refresh
	instance.interceptors.response.use(
		(response: AxiosResponse) => {
			// Transform successful responses
			return response;
		},
		async (error: AxiosError) => {
			// Remove unused variable since we're not using originalRequest
			// const originalRequest = error.config;

			// Handle different error scenarios
			if (error.response) {
				const { status, data } = error.response;

				switch (status) {
					case 401:
						// Unauthorized - clear tokens and redirect to login
						if (typeof window !== "undefined") {
							localStorage.removeItem("auth_token");
							sessionStorage.removeItem("auth_token");

							// Only redirect if not already on login page
							if (!window.location.pathname.includes("/login")) {
								window.location.href = "/login?error=session_expired";
							}
						}
						break;

					case 403:
						// Forbidden - user doesn't have permission
						console.error("Access forbidden:", data);
						break;

					case 429:
						// Rate limited
						console.warn("Rate limit exceeded");
						break;

					case 500:
						// Server error
						console.error("Server error:", data);
						break;
				}

				// Create structured error
				const errorData = data as ErrorResponse;
				const apiError = new ApiError(
					errorData?.message || error.message || "An error occurred",
					status,
					errorData?.code,
					data
				);

				return Promise.reject(apiError);
			} else if (error.request) {
				// Network error
				const networkError = new ApiError(
					"Network error - please check your connection",
					0,
					"NETWORK_ERROR"
				);
				return Promise.reject(networkError);
			} else {
				// Other error
				return Promise.reject(new ApiError(error.message, 0, "UNKNOWN_ERROR"));
			}
		}
	);

	return instance;
};

// Create the API instance
const api = createApiInstance();

// API Endpoints with proper typing
export const API_ENDPOINTS = {
	// Health check
	HEALTH: "/test",

	// Auth endpoints
	AUTH: {
		LOGIN: "/auth/login",
		REGISTER: "/auth/register",
		LOGOUT: "/auth/logout",
		REFRESH: "/auth/refresh",
		FORGOT_PASSWORD: "/auth/forgot-password",
		RESET_PASSWORD: "/auth/reset-password",
		VERIFY_OTP: "/auth/verify-otp",
		CHANGE_PASSWORD: "/auth/change-password",
	},

	// Courses
	COURSES: "/courses",
	COURSE_BY_ID: (id: string) => `/courses/${id}`,

	// Payments
	PAYMENTS: {
		CONFIG: "/payments/config",
		CREATE_ORDER: "/payments/create-order",
		VERIFY: "/payments/verify",
		PROCESS_SUCCESS: "/payments/process-success",
		HANDLE_FAILURE: "/payments/handle-failure",
		STATUS: (paymentId: string) => `/payments/${paymentId}/status`,
	},

	// User Purchases
	PURCHASES: "/purchases",
	USER_PURCHASES: (userId: string) => `/purchases/user/${userId}`,

	// User management
	USERS: {
		PROFILE: "/users/profile",
		UPDATE_PROFILE: "/users/profile",
		DELETE_ACCOUNT: "/users/account",
	},
} as const;

// Generic API helper functions with proper typing
export const apiHelpers = {
	// GET request with type safety
	get: async <T = unknown>(
		endpoint: string,
		params?: Record<string, string | number | boolean>
	): Promise<T> => {
		try {
			console.log(`[API] GET ${endpoint}`, params ? { params } : '');
			const response = await api.get<T>(endpoint, { params });
			console.log(`[API] GET ${endpoint} - SUCCESS`, { 
				status: response.status,
				dataKeys: response.data ? Object.keys(response.data as object) : [] 
			});
			return response.data;
		} catch (error) {
			console.error(`[API] GET ${endpoint} - FAILED:`, error);
			console.error('Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				name: error instanceof Error ? error.name : 'Unknown',
				stack: error instanceof Error ? error.stack : undefined,
				response: (error as any)?.response,
				request: (error as any)?.request,
				code: (error as any)?.code
			});
			throw error;
		}
	},

	// POST request with type safety
	post: async <T = unknown, D = Record<string, unknown>>(
		endpoint: string,
		data?: D
	): Promise<T> => {
		try {
			const response = await api.post<T>(endpoint, data);
			return response.data;
		} catch (error) {
			console.error(`POST ${endpoint} failed:`, error);
			throw error;
		}
	},

	// PUT request with type safety
	put: async <T = unknown, D = Record<string, unknown>>(endpoint: string, data?: D): Promise<T> => {
		try {
			const response = await api.put<T>(endpoint, data);
			return response.data;
		} catch (error) {
			console.error(`PUT ${endpoint} failed:`, error);
			throw error;
		}
	},

	// DELETE request with type safety
	delete: async <T = unknown>(
		endpoint: string,
		params?: Record<string, string | number | boolean>
	): Promise<T> => {
		try {
			const response = await api.delete<T>(endpoint, { params });
			return response.data;
		} catch (error) {
			console.error(`DELETE ${endpoint} failed:`, error);
			throw error;
		}
	},

	// File upload with progress tracking
	upload: async <T = unknown>(
		endpoint: string,
		formData: FormData,
		onProgress?: (progress: number) => void
	): Promise<T> => {
		try {
			const response = await api.post<T>(endpoint, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
				onUploadProgress: (progressEvent) => {
					if (onProgress && progressEvent.total) {
						const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
						onProgress(progress);
					}
				},
			});
			return response.data;
		} catch (error) {
			console.error(`UPLOAD ${endpoint} failed:`, error);
			throw error;
		}
	},
};

// Health check function
export const healthCheck = {
	test: async (): Promise<ApiResponse> => {
		return apiHelpers.get(API_ENDPOINTS.HEALTH);
	},
};

// Authentication API functions
export const authAPI = {
	login: async (credentials: { email: string; password: string; userType: string }) => {
		return apiHelpers.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
	},

	register: async (userData: {
		fullName: string;
		email: string;
		password: string;
		userType: string;
	}) => {
		return apiHelpers.post(API_ENDPOINTS.AUTH.REGISTER, userData);
	},

	logout: async () => {
		return apiHelpers.post(API_ENDPOINTS.AUTH.LOGOUT);
	},

	forgotPassword: async (email: string) => {
		return apiHelpers.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
	},

	resetPassword: async (token: string, password: string) => {
		return apiHelpers.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
	},

	verifyOTP: async (email: string, otp: string) => {
		return apiHelpers.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
	},

	changePassword: async (currentPassword: string, newPassword: string) => {
		return apiHelpers.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
			currentPassword,
			newPassword,
		});
	},
};

// Course API Functions with proper typing
export interface Course {
	id: string;
	courseName: string;
	description: string;
	price: number;
	category: string;
	difficulty: string;
	token: number;
	imageUrl: string;
	durationHours: number;
	language: string;
	isFeatured: boolean;
	mentorId: string;
	ratingAverage: number;
	reviewCount: number;
	_count?: {
		enrollments: number;
		reviews: number;
	}
	createdAt: string;
	updatedAt: string;
}

export const courseAPI = {
	getAll: async (params?: {
		category?: string;
		difficulty?: string;
		featured?: boolean;
		search?: string;
		page?: number;
		limit?: number;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
	}): Promise<PaginatedResponse<Course>> => {
		return apiHelpers.get(API_ENDPOINTS.COURSES, params);
	},

	getById: async (id: string): Promise<ApiResponse<Course>> => {
		return apiHelpers.get(API_ENDPOINTS.COURSE_BY_ID(id));
	},

	create: async (courseData: Partial<Course>): Promise<ApiResponse<Course>> => {
		return apiHelpers.post(API_ENDPOINTS.COURSES, courseData);
	},

	update: async (id: string, courseData: Partial<Course>): Promise<ApiResponse<Course>> => {
		return apiHelpers.put(API_ENDPOINTS.COURSE_BY_ID(id), courseData);
	},

	delete: async (id: string): Promise<ApiResponse> => {
		return apiHelpers.delete(API_ENDPOINTS.COURSE_BY_ID(id));
	},
};

// Payment API Functions with Razorpay integration
export const paymentAPI = {
	getConfig: async (): Promise<ApiResponse<{ razorpayKey: string; currency: string }>> => {
		return apiHelpers.get(API_ENDPOINTS.PAYMENTS.CONFIG);
	},

	createOrder: async (
		amount: number,
		courseId: string
	): Promise<ApiResponse<{ id: string; amount: number; currency: string; status: string }>> => {
		return apiHelpers.post(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, {
			amount,
			courseId,
		});
	},

	verifyPayment: async (paymentData: {
		razorpayPaymentId: string;
		razorpayOrderId: string;
		razorpaySignature: string;
		courseId: string;
	}): Promise<ApiResponse> => {
		return apiHelpers.post(API_ENDPOINTS.PAYMENTS.VERIFY, paymentData);
	},

	processSuccess: async (courseId: string, paymentData: PaymentSuccessData): Promise<ApiResponse> => {
		return apiHelpers.post(API_ENDPOINTS.PAYMENTS.PROCESS_SUCCESS, {
			courseId,
			paymentData,
		});
	},

	handleFailure: async (courseId: string, errorDetails: PaymentErrorDetails): Promise<ApiResponse> => {
		return apiHelpers.post(API_ENDPOINTS.PAYMENTS.HANDLE_FAILURE, {
			courseId,
			errorDetails,
		});
	},

	getStatus: async (paymentId: string): Promise<ApiResponse<{ status: string }>> => {
		return apiHelpers.get(API_ENDPOINTS.PAYMENTS.STATUS(paymentId));
	},
};

// User Purchase API Functions
export interface Purchase {
	id: string;
	userId: string;
	courseId: string;
	amount: number;
	status: string;
	paymentId?: string;
	createdAt: string;
	course?: Course;
}

export const purchaseAPI = {
	getUserPurchases: async (userId: string): Promise<ApiResponse<Purchase[]>> => {
		return apiHelpers.get(API_ENDPOINTS.USER_PURCHASES(userId));
	},

	create: async (purchaseData: {
		courseId: string;
		amount: number;
		paymentId?: string;
	}): Promise<ApiResponse<Purchase>> => {
		return apiHelpers.post(API_ENDPOINTS.PURCHASES, purchaseData);
	},

	enrollFree: async (courseId: string): Promise<ApiResponse> => {
		return apiHelpers.post(`${API_ENDPOINTS.PURCHASES}/enroll-free`, { courseId });
	},
};

// Enrollment API Functions
export const enrollmentAPI = {
	getMyEnrollments: async (): Promise<ApiResponse> => {
		return apiHelpers.get('/enrollments/my-enrollments');
	},
};

// User API Functions
export const userAPI = {
	getProfile: async (): Promise<ApiResponse> => {
		return apiHelpers.get(API_ENDPOINTS.USERS.PROFILE);
	},

	updateProfile: async (userData: {
		fullName?: string;
		email?: string;
		image?: string;
	}): Promise<ApiResponse> => {
		return apiHelpers.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, userData);
	},

	deleteAccount: async (): Promise<ApiResponse> => {
		return apiHelpers.delete(API_ENDPOINTS.USERS.DELETE_ACCOUNT);
	},
};

// Export the main API instance for custom requests
export { api as default, ApiError };

// Utility function to handle API errors in components
export const handleApiError = (error: unknown): string => {
	if (error instanceof ApiError) {
		return error.message || "An API error occurred";
	}
	if (error instanceof Error) {
		return error.message || "An unknown error occurred";
	}
	if (typeof error === "string") {
		return error;
	}
	return "An unknown error occurred";
};

// Payment utility functions
export const formatIndianCurrency = (amount: number): string => {
	return `₹${amount.toLocaleString("en-IN")}`;
};

export const loadRazorpayScript = (): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		if (typeof window !== "undefined" && window.Razorpay) {
			resolve(true);
			return;
		}

		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.onload = () => resolve(true);
		script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
		document.body.appendChild(script);
	});
};
