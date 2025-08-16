import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StudentSidebar } from '@/components/dashboard/StudentSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Course } from '@/types/auth';

interface DashboardStats {
  total_courses: number;
  total_materials: number;
  completed_materials: number;
  overall_progress: number;
  courses: Course[];
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Fetching dashboard stats...');
        
        // Add a small delay to ensure tokens are properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const stats = await authAPI.getDashboardStats();
        console.log('✅ Dashboard stats received:', stats);
        setDashboardStats(stats);
      } catch (err: any) {
        console.error('❌ Error fetching dashboard stats:', err);
        
        // More specific error handling
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          setError('Authentication failed. Please try logging in again.');
        } else if (err.message?.includes('Network Error') || err.message?.includes('fetch')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
        }
        setDashboardStats(null);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is authenticated
    if (user) {
      fetchDashboardStats();
    }
  }, [user]); // Add user dependency

  const handleCourseClick = (courseId: number) => {
    navigate(`/dashboard/course/${courseId}`);
  };

  if (loading) {
    return (
      <DashboardLayout sidebar={<StudentSidebar />}>
        <div className="flex items-center justify-center min-h-screen ml-0 md:ml-64 lg:ml-72">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading your dashboard...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<StudentSidebar />}>
      <div className="min-h-screen ml-0 md:ml-64 lg:ml-72 transition-all duration-300">
        <div className="p-4 md:p-6">
          {error ? (
            <div className="flex items-center justify-center h-64">
              <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="p-3 rounded-full bg-red-50 mb-4">
                    <BookOpen className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-red-600 font-medium mb-2">Unable to load courses</p>
                  <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              {/* Welcome Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Welcome back{user?.firstName ? `, ${user.firstName.split(' ')[0]}` : ''}! 👋
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg">
                    Ready to continue your learning journey?
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button 
                    onClick={() => navigate('/dashboard/courses')}
                    variant="outline"
                    className="gap-2 w-full md:w-auto"
                  >
                    <BookOpen className="h-4 w-4" />
                    Browse Courses
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
                  <CardContent className="flex items-center p-4 md:p-6">
                    <div className="p-2 md:p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 mr-3 md:mr-4">
                      <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xl md:text-2xl font-bold">{dashboardStats?.total_courses || 0}</p>
                      <p className="text-xs md:text-sm font-medium truncate">Enrolled Courses</p>
                      <p className="text-xs text-muted-foreground truncate">Available to study</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-green-500">
                  <CardContent className="flex items-center p-4 md:p-6">
                    <div className="p-2 md:p-3 rounded-full bg-green-50 dark:bg-green-900/20 mr-3 md:mr-4">
                      <Clock className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xl md:text-2xl font-bold">{dashboardStats?.total_materials || 0}</p>
                      <p className="text-xs md:text-sm font-medium truncate">Total Materials</p>
                      <p className="text-xs text-muted-foreground truncate">Study resources</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-purple-500">
                  <CardContent className="flex items-center p-4 md:p-6">
                    <div className="p-2 md:p-3 rounded-full bg-purple-50 dark:bg-purple-900/20 mr-3 md:mr-4">
                      <Award className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xl md:text-2xl font-bold">{dashboardStats?.completed_materials || 0}</p>
                      <p className="text-xs md:text-sm font-medium truncate">Completed</p>
                      <p className="text-xs text-muted-foreground truncate">Great progress!</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-orange-500">
                  <CardContent className="flex items-center p-4 md:p-6">
                    <div className="p-2 md:p-3 rounded-full bg-orange-50 dark:bg-orange-900/20 mr-3 md:mr-4">
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xl md:text-2xl font-bold">{dashboardStats?.overall_progress || 0}%</p>
                      <p className="text-xs md:text-sm font-medium truncate">Overall Progress</p>
                      <p className="text-xs text-muted-foreground truncate">Keep going!</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Courses Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Your Courses
                  </CardTitle>
                  <CardDescription>
                    Click on any course to access study materials and lessons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!dashboardStats?.courses || dashboardStats.courses.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                        <BookOpen className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No courses enrolled yet</h3>
                      <p className="text-muted-foreground mb-4 max-w-sm mx-auto text-sm md:text-base">
                        Browse our course catalog to discover and enroll in courses that interest you.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button 
                          onClick={() => navigate('/dashboard/courses')}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Browse Courses
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                          Refresh
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {dashboardStats.courses.map((course) => {
                        const courseProgress = course.progress_percentage || 0;
                        
                        return (
                          <div
                            key={course.id}
                            onClick={() => handleCourseClick(course.id)}
                            className="group flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-accent/50 hover:shadow-sm transition-all duration-200 cursor-pointer gap-3 md:gap-4"
                          >
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                              <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors flex-shrink-0">
                                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold group-hover:text-primary transition-colors truncate text-sm md:text-base">
                                  {course.title}
                                </h4>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                  {course.completed_lessons || 0} of {course.lesson_count || course.pdfCount || 0} materials completed
                                </p>
                                {course.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 md:truncate">
                                    {course.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 md:gap-4 md:ml-4">
                              <div className="flex items-center gap-2 flex-1 md:min-w-0">
                                <div className="w-20 md:w-24 bg-secondary rounded-full h-2 flex-1 md:flex-initial">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${courseProgress}%` }}
                                  />
                                </div>
                                <span className="text-xs md:text-sm font-medium min-w-fit">
                                  {Math.round(courseProgress)}%
                                </span>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;