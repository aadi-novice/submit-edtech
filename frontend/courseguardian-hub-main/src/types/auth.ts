export interface User {
  id: number;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'student';
  createdAt: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  googleLogin: (credential: string) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
    role?: 'admin' | 'student';
  }) => Promise<{ success: boolean; errors?: Record<string, string[]> }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
  pdfCount?: number;
  lesson_count?: number;
  completed_lessons?: number;
  progress_percentage?: number;
}

export interface Lesson {
  id: number;
  course: Course;
  title: string;
  created_at: string;
}

export interface LessonPDF {
  id: number;
  lesson: number;
  title: string;
  pdf_path: string;
  uploaded_at: string;
}