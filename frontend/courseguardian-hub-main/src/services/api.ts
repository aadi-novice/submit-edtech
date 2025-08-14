import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { User, LoginResponse, Course, Lesson, LessonPDF } from '@/types/auth';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class APIService {
  private api: AxiosInstance;
  private isRefreshing = false;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = Cookies.get('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry && !this.isRefreshing) {
          originalRequest._retry = true;
          
          const refreshToken = Cookies.get('refresh_token');
          if (refreshToken) {
            this.isRefreshing = true;
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                refresh: refreshToken,
              });
              
              const newAccessToken = response.data.access;
              Cookies.set('access_token', newAccessToken, {
                expires: 1,
                secure: import.meta.env.PROD,
                sameSite: 'strict'
              });
              
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.api(originalRequest);
            } catch (refreshError) {
              // Refresh failed, redirect to login
              Cookies.remove('access_token');
              Cookies.remove('refresh_token');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  private async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url);
    return response.data;
  }

  private async post<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data);
    return response.data;
  }

  private async put<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data);
    return response.data;
  }

  private async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url);
    return response.data;
  }

  // Upload with progress
  private async upload<T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login with:', { username, password: '***' });
      
      // First, get the JWT tokens
      const tokenResponse = await this.post<{ access: string; refresh: string }>('/auth/login/', { username, password });
      console.log('✅ JWT tokens received:', { access: tokenResponse.access.substring(0, 20) + '...', refresh: tokenResponse.refresh.substring(0, 20) + '...' });
      
      // Store the tokens temporarily to fetch user data
      const tempToken = tokenResponse.access;
      
      // Get user data with the token
      console.log('👤 Fetching user data...');
      const userResponse = await this.api.get<User>('/auth/me/', {
        headers: {
          Authorization: `Bearer ${tempToken}`
        }
      });
      console.log('✅ User data received:', userResponse.data);
      
      const result = {
        access: tokenResponse.access,
        refresh: tokenResponse.refresh,
        user: userResponse.data
      };
      console.log('🎉 Login successful, returning:', { ...result, access: result.access.substring(0, 20) + '...', refresh: result.refresh.substring(0, 20) + '...' });
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as { detail?: string; message?: string };
      const errorMessage = errorData?.detail ||
                          errorData?.message ||
                          axiosError.message ||
                          'Login failed';
      console.error('❌ Error message:', errorMessage);
      throw new Error(errorMessage);
    }
  }


  async register(userData: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<{ message: string }> {
    try {
      return await this.post<{ message: string }>('/auth/register/', userData);
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as { detail?: string; message?: string };
      const errorMessage = errorData?.detail ||
                          errorData?.message ||
                          axiosError.message ||
                          'Registration failed';
      throw new Error(errorMessage);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      return await this.get<User>('/auth/me/');
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as { detail?: string; message?: string };
      const errorMessage = errorData?.detail ||
                          errorData?.message ||
                          axiosError.message ||
                          'Failed to get user info';
      throw new Error(errorMessage);
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      return await this.post<{ message: string }>('/auth/forgot-password/', { email });
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as { detail?: string; message?: string };
      const errorMessage = errorData?.detail ||
                          errorData?.message ||
                          axiosError.message ||
                          'Failed to send reset email';
      throw new Error(errorMessage);
    }
  }

  // Course endpoints
  // Django backend endpoints
  async getCourses(searchQuery?: string): Promise<Course[]> {
    // Add search parameter to URL if provided
    const url = searchQuery ? `/courses/?search=${encodeURIComponent(searchQuery)}` : '/courses/';
    return this.get<Course[]>(url);
  }

  async getLessons(courseId: number): Promise<Lesson[]> {
    return this.get<Lesson[]>(`/lessons/?course=${courseId}`);
  }

  async getLessonPDFs(lessonId: number): Promise<LessonPDF[]> {
    return this.get<LessonPDF[]>(`/lessonpdfs/?lesson=${lessonId}`);
  }

  async getPDFSignedUrl(pdfId: number): Promise<{ signed_url: string; watermark?: string; user_id?: number; course_id?: number; lesson_id?: number }> {
    return this.get<{ signed_url: string; watermark?: string; user_id?: number; course_id?: number; lesson_id?: number }>(`/lessonpdfs/${pdfId}/view_pdf/`);
  }

  // Upload methods
  async uploadPDF(formData: FormData, onProgress?: (progress: number) => void): Promise<{ id: number; file: string; name: string }> {
    return this.upload('/lessonpdfs/upload/', formData, onProgress);
  }

  // Enhanced download protection methods
  async getProtectedPDFUrl(pdfId: number, userId?: number): Promise<{ protected_url: string, watermark: string }> {
    // Generate a protected URL with user-specific watermarking
    const signedUrlData = await this.getPDFSignedUrl(pdfId);
    const watermark = userId ? `User-${userId}-${Date.now()}` : 'Protected';
    
    return {
      protected_url: signedUrlData.signed_url,
      watermark: watermark
    };
  }

  // Verify user enrollment for a course
  async verifyEnrollment(userId: number, courseId: number): Promise<boolean> {
    try {
      // This would typically make a call to an enrollment verification endpoint
      // For now, we'll assume enrollment is valid if the user is authenticated
      return true;
    } catch (error) {
      console.error('Enrollment verification failed:', error);
      return false;
    }
  }
}

export const authAPI = new APIService();
export default APIService;