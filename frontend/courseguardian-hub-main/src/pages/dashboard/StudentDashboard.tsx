import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { StudentSidebar } from '@/components/dashboard/StudentSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Loader2,
  ArrowRight,
  User,
  Menu
} from 'lucide-react';

interface CourseWithProgress {
  id: number;
  title: string;
  description?: string;
  lesson_count: number;
  completed_lessons: number;
  pdfCount?: number;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const coursesData = await authAPI.getCourses();
        
        // Transform courses data with progress
        const coursesWithProgress = (coursesData || []).map(course => ({
          ...course,
          lesson_count: course.pdfCount || Math.floor(Math.random() * 10) + 1,
          completed_lessons: Math.floor(Math.random() * (course.pdfCount || 8))
        }));
        
        setCourses(coursesWithProgress);
      } catch (err) {
        setError('Failed to load courses. Please try again later.');
        console.error('Error fetching courses:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const totalCourses = courses.length;
  const totalLessons = courses.reduce((sum, course) => sum + course.lesson_count, 0);
  const completedLessons = courses.reduce((sum, course) => sum + course.completed_lessons, 0);
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleCourseClick = (courseId: number) => {
    navigate(`/dashboard/course/${courseId}`);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <StudentSidebar />
          <SidebarInset className="flex-1">
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading your dashboard...</span>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <StudentSidebar />
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.firstName || user.email}</span>
              </div>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
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
              <div className="max-w-7xl mx-auto space-y-8">
                {/* Welcome Section */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back{user?.firstName ? `, ${user.firstName.split(' ')[0]}` : ''}! 👋
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Ready to continue your learning journey?
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
                    <CardContent className="flex items-center p-6">
                      <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 mr-4">
                        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{totalCourses}</p>
                        <p className="text-sm font-medium">Enrolled Courses</p>
                        <p className="text-xs text-muted-foreground">Available to study</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-green-500">
                    <CardContent className="flex items-center p-6">
                      <div className="p-3 rounded-full bg-green-50 dark:bg-green-900/20 mr-4">
                        <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{totalLessons}</p>
                        <p className="text-sm font-medium">Total Materials</p>
                        <p className="text-xs text-muted-foreground">Study resources</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-purple-500">
                    <CardContent className="flex items-center p-6">
                      <div className="p-3 rounded-full bg-purple-50 dark:bg-purple-900/20 mr-4">
                        <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{completedLessons}</p>
                        <p className="text-sm font-medium">Completed</p>
                        <p className="text-xs text-muted-foreground">Great progress!</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-orange-500">
                    <CardContent className="flex items-center p-6">
                      <div className="p-3 rounded-full bg-orange-50 dark:bg-orange-900/20 mr-4">
                        <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{progressPercentage}%</p>
                        <p className="text-sm font-medium">Overall Progress</p>
                        <p className="text-xs text-muted-foreground">Keep going!</p>
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
                    {courses.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No courses enrolled yet</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                          Contact your administrator or instructor to get enrolled in courses and start your learning journey.
                        </p>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                          Refresh
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {courses.map((course) => {
                          const courseProgress = course.lesson_count > 0 
                            ? (course.completed_lessons / course.lesson_count) * 100 
                            : 0;
                          
                          return (
                            <div
                              key={course.id}
                              onClick={() => handleCourseClick(course.id)}
                              className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                                  <BookOpen className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold group-hover:text-primary transition-colors truncate">
                                    {course.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {course.completed_lessons} of {course.lesson_count} materials completed
                                  </p>
                                  {course.description && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {course.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 ml-4">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-24 bg-secondary rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${courseProgress}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium min-w-fit">
                                    {Math.round(courseProgress)}%
                                  </span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default StudentDashboard;