import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StudentSidebar } from '@/components/dashboard/StudentSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import { 
  BookOpen, 
  Search, 
  Users, 
  Clock, 
  FileText,
  Loader2,
  CheckCircle,
  Plus
} from 'lucide-react';
import { Course } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

interface CourseWithEnrollment extends Course {
  is_enrolled?: boolean;
  enrollment_count?: number;
}

const CourseCatalog: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
    loadEnrolledCourses();
  }, []);

  const loadCourses = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading all courses...');
      const coursesData = await authAPI.getCourses(search);
      console.log('✅ All courses loaded:', coursesData);
      setCourses(coursesData || []);
    } catch (err) {
      setError('Failed to load courses. Please try again later.');
      console.error('❌ Error loading courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      console.log('🔄 Loading enrolled courses...');
      const enrolledCourses = await authAPI.getMyCourses();
      console.log('✅ Enrolled courses loaded:', enrolledCourses);
      const enrolledIds = new Set(enrolledCourses.map(course => course.id));
      setEnrolledCourseIds(enrolledIds);
    } catch (err) {
      console.error('❌ Error loading enrolled courses:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCourses(searchQuery);
  };

  const handleEnroll = async (courseId: number, courseTitle: string) => {
    try {
      setEnrollingCourseId(courseId);
      console.log(`🔄 Enrolling in course ${courseId}...`);
      
      await authAPI.enrollInCourse(courseId);
      
      // Update local state
      setEnrolledCourseIds(prev => new Set([...prev, courseId]));
      
      toast({
        title: "Enrollment Successful!",
        description: `You have been enrolled in "${courseTitle}"`,
        variant: "default",
      });
      
      console.log(`✅ Successfully enrolled in ${courseTitle}`);
    } catch (err) {
      console.error('❌ Enrollment failed:', err);
      toast({
        title: "Enrollment Failed",
        description: err instanceof Error ? err.message : "Failed to enroll in course",
        variant: "destructive",
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && courses.length === 0) {
    return (
      <DashboardLayout sidebar={<StudentSidebar />}>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading course catalog...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<StudentSidebar />}>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
            <p className="text-muted-foreground text-lg">
              Discover and enroll in courses to start your learning journey
            </p>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search courses by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="p-3 rounded-full bg-red-50 mb-4">
                  <BookOpen className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-red-600 font-medium mb-2">Unable to load courses</p>
                <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
                <Button 
                  onClick={() => loadCourses()} 
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Courses Grid */}
          {!error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        {searchQuery 
                          ? `No courses match "${searchQuery}". Try adjusting your search.`
                          : 'No courses are available at the moment. Check back later.'
                        }
                      </p>
                      {searchQuery && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchQuery('');
                            loadCourses();
                          }}
                        >
                          Clear Search
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredCourses.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id);
                  const isEnrolling = enrollingCourseId === course.id;
                  
                  return (
                    <Card key={course.id} className="group hover:shadow-lg transition-all duration-200">
                      <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            {isEnrolled && (
                              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Enrolled
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {course.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 mt-2">
                            {course.description || 'No description available'}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Course Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{course.pdfCount || 0} materials</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Self-paced</span>
                          </div>
                        </div>

                        {/* Enrollment Button */}
                        <div className="pt-2">
                          {isEnrolled ? (
                            <Button 
                              variant="outline" 
                              className="w-full" 
                              disabled
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Already Enrolled
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleEnroll(course.id, course.title)}
                              disabled={isEnrolling}
                              className="w-full"
                            >
                              {isEnrolling ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseCatalog;
