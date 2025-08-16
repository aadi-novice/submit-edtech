import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster as HotToaster } from 'react-hot-toast';
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import AdminRedirect from "@/components/common/AdminRedirect";
import { DebugAuth } from "@/components/DebugAuth";
import { PDFDebugger } from "@/components/PDFDebugger";
import { LoginTester } from "@/components/LoginTester";
import NetworkTester from "@/components/NetworkTester";
import DirectAPITester from "@/components/DirectAPITester";
import CookieManager from "@/components/CookieManager";
import RequestTracker from "@/components/RequestTracker";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import CourseCatalog from "./pages/dashboard/CourseCatalog";
import CourseView from "./pages/CourseView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HotToaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Debug Routes */}
            <Route path="/debug-auth" element={<DebugAuth />} />
            <Route path="/debug-pdf" element={<PDFDebugger />} />
            <Route path="/debug-login" element={<LoginTester />} />
            <Route path="/debug-network" element={<NetworkTester />} />
            <Route path="/debug-api" element={<DirectAPITester />} />
            <Route path="/debug-cookies" element={<CookieManager />} />
            <Route path="/debug-requests" element={<RequestTracker />} />
            
            {/* Dashboard Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  {/* Redirect admin users to Django admin panel */}
                  <AdminRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminRedirect />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/courses"
              element={
                <ProtectedRoute>
                  <CourseCatalog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/course/:courseId"
              element={
                <ProtectedRoute>
                  <CourseView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
