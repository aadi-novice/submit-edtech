import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import Cookies from 'js-cookie';
import { User, AuthContextType } from '@/types/auth';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const initializeAuth = useCallback(async () => {
    const token = Cookies.get('access_token');
    if (token) {
      // Try to get real user data from API
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to get current user:', error);
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Try real API login
    try {
      // Django expects username, not email, for login
      const response = await authAPI.login(username, password);

      // Tokens are already stored by the API service, just set user data
      setUser(response.user);
      toast.success(`Welcome ${response.user.firstName}!`);
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
      const errorMessage = axiosError.response?.data?.detail ||
                          axiosError.response?.data?.message ||
                          axiosError.message ||
                          'Invalid username or password';
      toast.error(errorMessage);
      return false;
    }
  };

  // const register = async (userData: {
  //   email: string;
  //   password: string;
  //   firstName: string;
  //   lastName: string;
  //   role: 'admin' | 'student';
  // }): Promise<boolean> => {
  //   try {
  //     // Map frontend fields to Django backend fields
  //     const payload = {
  //       username: userData.email,
  //       email: userData.email,
  //       password: userData.password,
  //       first_name: userData.firstName,
  //       last_name: userData.lastName,
  //       role: userData.role,
  //     };
  //     await authAPI.register(payload);
  //     toast.success('Registration successful! Please login.');
  //     return true;
  //   } catch (error: any) {
  //     toast.error(error.response?.data?.message || 'Registration failed');
  //     return false;
  //   }
  // };

  

  const register = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  role?: 'admin' | 'student';
}): Promise<{ success: boolean; errors?: Record<string, string[]> }> => {
  try {
    // Map frontend fields to Django backend fields
    const payload = {
      username: userData.username, // Use the provided username instead of email
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role || 'student',
    };
    await authAPI.register(payload);
    toast.success('Registration successful! Please login.');
    return { success: true };
  } catch (error: unknown) {
    const axiosError = error as { 
      response?: { 
        data?: { 
          detail?: string; 
          message?: string;
          username?: string[];
          email?: string[];
          password?: string[];
          [key: string]: any;
        } 
      } 
    };
    
    const errorData = axiosError.response?.data;
    
    // Extract field-specific errors
    const fieldErrors: Record<string, string[]> = {};
    if (errorData) {
      Object.keys(errorData).forEach(key => {
        if (Array.isArray(errorData[key])) {
          fieldErrors[key] = errorData[key];
        } else if (typeof errorData[key] === 'string') {
          fieldErrors[key] = [errorData[key]];
        }
      });
    }
    
    // Show general error toast
    const generalError = errorData?.message || errorData?.detail || 'Registration failed';
    toast.error(generalError);
    
    return { success: false, errors: fieldErrors };
  }
};

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const googleLogin = async (credential: string): Promise<boolean> => {
    try {
      const response = await authAPI.googleLogin(credential);
      setUser(response.user);
      toast.success(`Welcome ${response.user.firstName}!`);
      return true;
    } catch (error: unknown) {
      const axiosError = error as { message?: string };
      const errorMessage = axiosError.message || 'Google login failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      await authAPI.forgotPassword(email);
      toast.success('Password reset email sent!');
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to send reset email');
      return false;
    }
  };

  const getToken = (): string | undefined => {
    return Cookies.get('access_token');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    googleLogin,
    register,
    logout,
    forgotPassword,
    getToken,
    isAuthenticated: !!user && !loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
    );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};