export interface User {
  id: number;
  email: string;
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
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'admin' | 'student';
  }) => Promise<boolean>;
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