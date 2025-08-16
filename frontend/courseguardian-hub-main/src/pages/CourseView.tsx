import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StudentSidebar } from '@/components/dashboard/StudentSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import Cookies from 'js-cookie';
import { BookOpen, FileText, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { SecurePDFViewer } from '@/components/SecurePDFViewer';
import { ReactPDFViewer } from '@/components/ReactPDFViewer';
import { SimplePDFViewer } from '@/components/SimplePDFViewer';
import { BasicPDFViewer } from '@/components/BasicPDFViewer';
import { BlobPDFViewer } from '@/components/BlobPDFViewer';

interface Lesson {
  id: number;
  title: string;
  created_at: string;
  pdf_path?: string;
}

interface Course {
  id: number;
  title: string;
  lessons: Lesson[];
}

const CourseView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [watermark, setWatermark] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('No course ID provided');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Fetching course data for ID:', courseId);
        
        // First, try to get enrolled courses to check if user has access
        let courseData = null;
        try {
          const enrolledCourses = await authAPI.getMyCourses();
          console.log('📚 Enrolled courses:', enrolledCourses);
          courseData = enrolledCourses.find(c => c.id === parseInt(courseId));
        } catch (enrolledErr) {
          console.warn('⚠️ Could not fetch enrolled courses, trying all courses:', enrolledErr);
          // Fallback to all courses if enrolled courses fails
          const allCourses = await authAPI.getCourses();
          console.log('📖 All courses:', allCourses);
          courseData = allCourses.find(c => c.id === parseInt(courseId));
        }
        
        if (!courseData) {
          setError('Course not found or you are not enrolled in this course');
          console.error('❌ Course not found with ID:', courseId);
          return;
        }

        console.log('✅ Course found:', courseData);

        // Fetch lessons for this course
        console.log('🔄 Fetching lessons for course:', courseId);
        const lessonsData = await authAPI.getLessons(parseInt(courseId));
        console.log('📝 Lessons found:', lessonsData);
        
        setCourse({
          ...courseData,
          lessons: lessonsData || []
        });
        console.log('✅ Course data set successfully');
        
      } catch (err) {
        console.error('❌ Error fetching course:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load course';
        setError(`Failed to load course: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleLessonSelect = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setPdfLoading(true);
    
    try {
      console.log('🔄 Loading PDFs for lesson:', lesson.id);
      console.log('📍 Current user:', user);
      console.log('🔗 API base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
      
      // First, get all PDFs for this lesson
      const pdfs = await authAPI.getLessonPDFs(lesson.id);
      console.log('📄 PDFs found:', pdfs);
      
      if (pdfs && pdfs.length > 0) {
        const firstPdf = pdfs[0];
        console.log('🎯 Using PDF:', firstPdf);
        
        // Use proxy endpoint for iframe embedding with cookie authentication
        const proxyUrl = `http://localhost:8000/api/proxy-pdf/${firstPdf.id}`;
        console.log('🎯 Proxy URL for iframe (using cookies):', proxyUrl);
        
        setPdfUrl(proxyUrl);
        setWatermark(`${user?.username || user?.email} • ${new Date().toLocaleDateString()}`);
        
        // Mark lesson as accessed for progress tracking
        try {
          await authAPI.markLessonCompleted(firstPdf.id);
          console.log('✅ Lesson marked as accessed');
        } catch (progressErr) {
          console.warn('⚠️ Failed to track lesson progress:', progressErr);
        }
      } else {
        console.log('❌ No PDFs found for this lesson');
        setPdfUrl(null);
        setWatermark(null);
        setError('No PDF materials found for this lesson.');
      }
    } catch (err) {
      console.error('❌ Error loading lesson PDFs:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status,
        statusText: (err as any)?.response?.statusText
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load lesson content: ${errorMessage}. Please check the browser console for more details.`);
      setPdfUrl(null);
      setWatermark(null);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const preventDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    alert('Direct download is not allowed. Please view the PDF in the secure viewer only.');
  };

  if (loading) {
    return (
      <DashboardLayout sidebar={<StudentSidebar />}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading course...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !course) {
    return (
      <DashboardLayout sidebar={<StudentSidebar />}>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error || 'Course not found'}</p>
          <Button onClick={handleBack} className="ml-4">Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<StudentSidebar />}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
          <p className="text-muted-foreground">
            {course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Lessons
                </CardTitle>
                <CardDescription>
                  Click on a lesson to view materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {course.lessons.map((lesson) => (
                    <Button
                      key={lesson.id}
                      variant={selectedLesson?.id === lesson.id ? "default" : "ghost"}
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => handleLessonSelect(lesson)}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{lesson.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(lesson.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lesson Content / PDF Viewer */}
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedLesson.title}
                  </CardTitle>
                  <CardDescription>
                    Secure PDF viewer with download protection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pdfLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading PDF...</span>
                    </div>
                  ) : pdfUrl ? (
                    <BlobPDFViewer
                      pdfUrl={pdfUrl}
                      title={selectedLesson.title}
                      className="h-96"
                    />
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No PDF Available</h3>
                      <p className="text-muted-foreground">
                        This lesson doesn't have a PDF file associated with it yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Select a Lesson</h3>
                    <p className="text-muted-foreground">
                      Choose a lesson from the list to view its content and materials.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseView;