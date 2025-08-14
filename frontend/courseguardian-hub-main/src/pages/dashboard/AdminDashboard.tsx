import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AdminSidebar } from '@/components/dashboard/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Upload,
  BarChart3,
  Plus,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { authAPI } from '@/services/api';

interface Course {
  id: number;
  title: string;
  lesson_count?: number;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesData, usersData] = await Promise.all([
          authAPI.getCourses(),
          // For demo, we'll use mock user data since there's no users endpoint
          Promise.resolve([
            { id: 1, email: 'admin@demo.com', first_name: 'Admin', last_name: 'User' },
            { id: 2, email: 'student@demo.com', first_name: 'John', last_name: 'Student' }
          ])
        ]);
        
        setCourses(coursesData);
        setUsers(usersData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: 'Total Courses',
      value: courses.length.toString(),
      description: 'Active courses',
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Students',
      value: users.length.toString(),
      description: 'Registered users',
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'PDF Files',
      value: '0',
      description: 'Uploaded materials',
      icon: Upload,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Views',
      value: '0',
      description: 'This month',
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  const quickActions = [
    {
      title: 'Upload Course',
      description: 'Create a new course and upload materials',
      action: () => navigate('/admin/upload'),
      icon: Plus,
    },
    {
      title: 'Manage Courses',
      description: 'View and edit existing courses',
      action: () => navigate('/admin/courses'),
      icon: BookOpen,
    },
    {
      title: 'View Students',
      description: 'Manage student accounts and enrollment',
      action: () => navigate('/admin/students'),
      icon: Users,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your learning platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${stat.bgColor} mr-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to manage your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickActions.map((action) => (
                <div
                  key={action.title}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={action.action}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Courses</CardTitle>
              <CardDescription>
                Latest courses created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-muted-foreground">{course.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">ID: {course.id}</span>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No courses created yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              Latest registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-muted-foreground">
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No users registered yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;