import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Settings, Users, BookOpen, Upload } from 'lucide-react';

const AdminRedirect: React.FC = () => {
  const { user } = useAuth();

  // Redirect to Django admin if user is admin
  const handleDjangoAdminRedirect = () => {
    // Use dedicated Django admin URL environment variable
    const adminUrl = import.meta.env.VITE_DJANGO_ADMIN_URL || 'http://localhost:8000/admin';
    window.open(adminUrl, '_blank');
  };

  const adminFeatures = [
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Create, edit, and organize courses with lessons',
    },
    {
      icon: Upload,
      title: 'PDF Upload',
      description: 'Upload and manage learning materials and PDFs',
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Manage student accounts, roles, and enrollments',
    },
    {
      icon: Settings,
      title: 'System Settings',
      description: 'Configure platform settings and preferences',
    },
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground text-center">
              You need admin privileges to access this area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Admin Control Panel
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Use the Django Admin Panel for complete course and user management
          </p>
          
          <Button 
            onClick={handleDjangoAdminRedirect} 
            size="lg"
            className="min-w-[200px]"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Open Django Admin Panel
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Information Card */}
        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-center">Why Django Admin?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">✅ Complete Functionality</h4>
                <p className="text-muted-foreground">
                  Full CRUD operations for all models with built-in validation and relationships.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⚡ Development Speed</h4>
                <p className="text-muted-foreground">
                  Instant admin interface without custom development time.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔒 Built-in Security</h4>
                <p className="text-muted-foreground">
                  Django's robust permission system and CSRF protection.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📊 Rich Interface</h4>
                <p className="text-muted-foreground">
                  Advanced filtering, search, bulk operations, and inline editing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Quick actions available in Django Admin:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Create Courses
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Upload PDFs
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Manage Users
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
              View Enrollments
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
              Bulk Operations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRedirect;
