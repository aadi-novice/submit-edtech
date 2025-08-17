import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StudentSidebar } from '@/components/dashboard/StudentSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import Cookies from 'js-cookie';
import { BookOpen, FileText, Clock, ArrowLeft, Loader2, Play, Video } from 'lucide-react';
import { SecurePDFViewer } from '@/components/SecurePDFViewer';
import { ReactPDFViewer } from '@/components/ReactPDFViewer';
import { SimplePDFViewer } from '@/components/SimplePDFViewer';
import { BasicPDFViewer } from '@/components/BasicPDFViewer';
import { BlobPDFViewer } from '@/components/BlobPDFViewer';
import VideoPlayer from '@/components/VideoPlayer';

interface PDF {
  id: number;
  title: string;
  pdf_path: string;
  uploaded_at: string;
}

interface Video {
  id: number;
  title: string;
  video_path: string;
  thumbnail_path?: string;
  duration?: string;
  file_size: number;
  video_format: string;
  uploaded_at: string;
}

interface Lesson {
  id: number;
  title: string;
  created_at: string;
  pdfs: PDF[];
  videos: Video[];
  pdf_count: number;
  video_count: number;
}

interface Course {
  id: number;
  title: string;
  lessons: Lesson[];
}

const CourseView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
    const { user, getToken } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedContent, setSelectedContent] = useState<{type: 'pdf' | 'video', item: PDF | Video} | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [watermark, setWatermark] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

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

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedContent(null);
    setPdfUrl(null);
    setVideoUrl(null);
  };

  const handleContentSelect = async (type: 'pdf' | 'video', item: PDF | Video) => {
    setContentLoading(true);
    setSelectedContent({ type, item });
    
    try {
      if (type === 'pdf') {
        console.log('🔄 Loading PDF:', item.id);
        
        // Use proxy endpoint for secure PDF viewing
        const proxyUrl = `http://localhost:8000/api/proxy-pdf/${item.id}`;
        console.log('🎯 PDF Proxy URL:', proxyUrl);
        
        setPdfUrl(proxyUrl);
        setVideoUrl(null);
        setWatermark(`${user?.username || user?.email} • ${new Date().toLocaleDateString()}`);
        
        // Mark PDF as accessed
        try {
          await authAPI.markLessonCompleted(item.id);
          console.log('✅ PDF marked as accessed');
        } catch (progressErr) {
          console.warn('⚠️ Failed to track PDF progress:', progressErr);
        }
      } else if (type === 'video') {
        console.log('🔄 Loading Video:', item.id);
        
        // Get authentication token
        const token = getToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Use proxy endpoint for secure video streaming with token
        const videoProxyUrl = `http://localhost:8000/api/proxy-video/${item.id}/?token=${token}`;
        console.log('🎯 Video Proxy URL:', videoProxyUrl);
        
        setVideoUrl(videoProxyUrl);
        setPdfUrl(null);
        setWatermark(`${user?.username || user?.email} • ${new Date().toLocaleDateString()}`);
        
        // Video progress will be tracked by the VideoPlayer component
      }
    } catch (err) {
      console.error('❌ Error loading content:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load content: ${errorMessage}`);
      setPdfUrl(null);
      setVideoUrl(null);
    } finally {
      setContentLoading(false);
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
                    <div key={lesson.id} className="space-y-2">
                      <Button
                        variant={selectedLesson?.id === lesson.id ? "default" : "ghost"}
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleLessonSelect(lesson)}
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium">{lesson.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {lesson.pdf_count} PDF{lesson.pdf_count !== 1 ? 's' : ''} • {lesson.video_count} Video{lesson.video_count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </Button>
                      
                      {/* Show lesson content when selected */}
                      {selectedLesson?.id === lesson.id && (
                        <div className="ml-4 space-y-1">
                          {/* PDFs */}
                          {lesson.pdfs.map((pdf) => (
                            <Button
                              key={`pdf-${pdf.id}`}
                              variant={selectedContent?.type === 'pdf' && selectedContent?.item.id === pdf.id ? "secondary" : "ghost"}
                              className="w-full justify-start text-left h-auto p-2 text-sm"
                              onClick={() => handleContentSelect('pdf', pdf)}
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                <span className="truncate">{pdf.title}</span>
                              </div>
                            </Button>
                          ))}
                          
                          {/* Videos */}
                          {lesson.videos.map((video) => (
                            <Button
                              key={`video-${video.id}`}
                              variant={selectedContent?.type === 'video' && selectedContent?.item.id === video.id ? "secondary" : "ghost"}
                              className="w-full justify-start text-left h-auto p-2 text-sm"
                              onClick={() => handleContentSelect('video', video)}
                            >
                              <div className="flex items-center gap-2">
                                <Play className="h-3 w-3" />
                                <span className="truncate">{video.title}</span>
                                {video.duration && (
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {video.duration}
                                  </span>
                                )}
                              </div>
                            </Button>
                          ))}
                          
                          {/* No content message */}
                          {lesson.pdfs.length === 0 && lesson.videos.length === 0 && (
                            <div className="text-xs text-muted-foreground text-center py-2">
                              No materials available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Viewer */}
          <div className="lg:col-span-2">
            {selectedContent ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedContent.type === 'pdf' ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                    {selectedContent.item.title}
                  </CardTitle>
                  <CardDescription>
                    {selectedContent.type === 'pdf' 
                      ? 'Secure PDF viewer with download protection'
                      : 'Secure video player with progress tracking'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contentLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">
                        Loading {selectedContent.type === 'pdf' ? 'PDF' : 'video'}...
                      </span>
                    </div>
                  ) : selectedContent.type === 'pdf' && pdfUrl ? (
                    <BlobPDFViewer
                      pdfUrl={pdfUrl}
                      title={selectedContent.item.title}
                      className="h-96"
                    />
                  ) : selectedContent.type === 'video' && videoUrl ? (
                    <VideoPlayer
                      videoId={selectedContent.item.id}
                      videoUrl={videoUrl}
                      title={selectedContent.item.title}
                      className="w-full"
                      onProgress={(currentTime, duration) => {
                        console.log(`Video progress: ${currentTime}/${duration}`);
                      }}
                      onComplete={() => {
                        console.log('Video completed');
                      }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-red-500 mb-4">Failed to load content</div>
                      <p className="text-muted-foreground">
                        There was an error loading this {selectedContent.type}. Please try again.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : selectedLesson ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Select Content</h3>
                    <p className="text-muted-foreground">
                      Choose a PDF or video from the lesson materials to view it.
                    </p>
                  </div>
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