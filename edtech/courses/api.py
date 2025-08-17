
from django.db import models
from rest_framework import viewsets, permissions, exceptions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Avg
from .models import Course, Lesson, LessonPDF, LessonVideo, LessonProgress, CourseProgress
from .serializers import CourseSerializer, LessonSerializer
from .pdf_serializers import LessonPDFSerializer
from .video_serializers import LessonVideoSerializer, VideoProgressSerializer
from .enrollment import Enrollment
from .upload_serializers import PDFUploadSerializer
from .storage import upload_bytes, signed_url
from rest_framework.decorators import action
class LessonPDFViewSet(viewsets.ModelViewSet):
    queryset = LessonPDF.objects.all()
    serializer_class = LessonPDFSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Filter PDFs by lesson if lesson parameter is provided"""
        queryset = super().get_queryset()
        lesson_id = self.request.query_params.get('lesson', None)
        
        if lesson_id:
            try:
                lesson_id = int(lesson_id)
                queryset = queryset.filter(lesson_id=lesson_id)
            except ValueError:
                pass  # Invalid lesson ID, return empty queryset
        
        return queryset

    @action(detail=True, methods=['get'])
    def view_pdf(self, request, pk=None):
        pdf = self.get_object()
        user = request.user
        
        # Verify user is authenticated and enrolled in the course
        if not user.is_authenticated:
            raise exceptions.PermissionDenied("Authentication required.")
        
        # Check if user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=pdf.lesson.course).exists():
            raise exceptions.PermissionDenied("You are not enrolled in this course.")
        
        # Track lesson access (mark as accessed, not necessarily completed)
        lesson_progress, created = LessonProgress.objects.get_or_create(
            user=user,
            lesson_pdf=pdf,
            defaults={'is_completed': False}
        )
        lesson_progress.save()  # Update last_accessed
        
        # Generate secure URL with enhanced protection
        if not pdf.pdf_path:
            raise exceptions.ValidationError("PDF file not found for this lesson.")
        
        try:
            # Generate proxy URL instead of direct Supabase URL to avoid CORS issues
            from django.urls import reverse
            proxy_url = f"http://localhost:8000{reverse('proxy_pdf_view', kwargs={'pdf_id': pdf.id})}"
            watermark = f"{user.username or user.email} • {timezone.now().strftime('%Y-%m-%d %H:%M')} • PROTECTED"
            
            return Response({
                'signed_url': proxy_url,
                'watermark': watermark,
                'user_id': user.id,
                'course_id': pdf.lesson.course.id,
                'lesson_id': pdf.lesson.id,
                'pdf_title': pdf.title,
                'lesson_title': pdf.lesson.title,
                'expires_in': 1800,  # 30 minutes
                'protection_level': 'maximum'
            })
        except Exception as e:
            raise exceptions.APIException(f"Failed to generate secure PDF URL: {str(e)}")

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_completed(self, request, pk=None):
        """Mark a lesson PDF as completed"""
        pdf = self.get_object()
        user = request.user
        
        # Verify user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=pdf.lesson.course).exists():
            raise exceptions.PermissionDenied("You are not enrolled in this course.")
        
        # Mark lesson as completed
        lesson_progress, created = LessonProgress.objects.get_or_create(
            user=user,
            lesson_pdf=pdf,
            defaults={'is_completed': True, 'completed_at': timezone.now()}
        )
        
        if not lesson_progress.is_completed:
            lesson_progress.is_completed = True
            lesson_progress.completed_at = timezone.now()
            lesson_progress.save()
        
        # Update course progress
        course_progress, created = CourseProgress.objects.get_or_create(
            user=user,
            course=pdf.lesson.course
        )
        course_progress.calculate_progress()
        
        return Response({
            'message': 'Lesson marked as completed',
            'lesson_title': pdf.title,
            'course_progress': course_progress.progress_percentage
        })

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter courses based on search query parameter"""
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        return queryset

    def get_serializer_context(self):
        """Add request context to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        """Enroll the current user in this course"""
        course = self.get_object()
        user = request.user
        
        # Check if already enrolled
        if Enrollment.objects.filter(user=user, course=course).exists():
            return Response({'message': 'Already enrolled in this course'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create enrollment
        Enrollment.objects.create(user=user, course=course)
        return Response({'message': f'Successfully enrolled in {course.title}'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unenroll(self, request, pk=None):
        """Unenroll the current user from this course"""
        course = self.get_object()
        user = request.user
        
        try:
            enrollment = Enrollment.objects.get(user=user, course=course)
            enrollment.delete()
            return Response({'message': f'Successfully unenrolled from {course.title}'}, status=status.HTTP_200_OK)
        except Enrollment.DoesNotExist:
            return Response({'message': 'Not enrolled in this course'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_courses(self, request):
        """Get all courses that the current user is enrolled in"""
        try:
            user = request.user
            enrollments = Enrollment.objects.filter(user=user)
            courses = [enrollment.course for enrollment in enrollments]
            serializer = self.get_serializer(courses, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch enrolled courses: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard_stats(self, request):
        """Get dashboard statistics for the current user"""
        user = request.user
        
        # Get enrolled courses
        enrolled_courses = Course.objects.filter(
            id__in=Enrollment.objects.filter(user=user).values_list('course_id', flat=True)
        )
        
        total_courses = enrolled_courses.count()
        
        # Calculate total materials (PDFs) across all enrolled courses
        total_materials = LessonPDF.objects.filter(
            lesson__course__in=enrolled_courses
        ).count()
        
        # Calculate completed materials
        completed_materials = LessonProgress.objects.filter(
            user=user,
            lesson_pdf__lesson__course__in=enrolled_courses,
            is_completed=True
        ).count()
        
        # Calculate overall progress percentage
        overall_progress = 0
        if total_materials > 0:
            overall_progress = round((completed_materials / total_materials) * 100)
        
        # Get courses with detailed progress
        courses_with_progress = []
        for course in enrolled_courses:
            # Get course PDFs
            course_pdfs = LessonPDF.objects.filter(lesson__course=course)
            course_total = course_pdfs.count()
            
            # Get completed PDFs for this course
            course_completed = LessonProgress.objects.filter(
                user=user,
                lesson_pdf__in=course_pdfs,
                is_completed=True
            ).count()
            
            # Calculate course progress
            course_progress = 0
            if course_total > 0:
                course_progress = round((course_completed / course_total) * 100)
            
            # Update or create course progress record
            course_progress_obj, created = CourseProgress.objects.get_or_create(
                user=user,
                course=course,
                defaults={'progress_percentage': course_progress}
            )
            if not created:
                course_progress_obj.progress_percentage = course_progress
                course_progress_obj.save()
            
            courses_with_progress.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'lesson_count': course_total,
                'completed_lessons': course_completed,
                'progress_percentage': course_progress,
                'pdfCount': course_total
            })
        
        return Response({
            'total_courses': total_courses,
            'total_materials': total_materials,
            'completed_materials': completed_materials,
            'overall_progress': overall_progress,
            'courses': courses_with_progress
        })

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Filter lessons by course if course parameter is provided"""
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course', None)
        
        if course_id:
            try:
                course_id = int(course_id)
                queryset = queryset.filter(course_id=course_id)
            except ValueError:
                pass  # Invalid course ID, return empty queryset
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Override list to add enrollment check"""
        try:
            user = request.user
            course_id = request.query_params.get('course', None)
            
            if course_id and user.is_authenticated:
                # Check if user is enrolled in the course
                try:
                    course_id_int = int(course_id)
                    is_enrolled = Enrollment.objects.filter(user=user, course_id=course_id_int).exists()
                    
                    if not is_enrolled:
                        return Response(
                            {'error': 'You are not enrolled in this course'}, 
                            status=status.HTTP_403_FORBIDDEN
                        )
                except ValueError:
                    return Response(
                        {'error': 'Invalid course ID'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch lessons: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        lesson = self.get_object()
        user = request.user
        if not user.is_authenticated:
            raise exceptions.PermissionDenied("Authentication required.")
        # Only allow access if user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=lesson.course).exists():
            raise exceptions.PermissionDenied("You are not enrolled in this course.")
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def upload_pdf(self, request, pk=None):
        lesson = self.get_object()
        serializer = PDFUploadSerializer(data=request.data)
        if serializer.is_valid():
            pdf_file = serializer.validated_data['pdf_file']
            path_in_bucket = f"{lesson.course.id}/{lesson.title.replace(' ', '_')}.pdf"
            upload_bytes(path_in_bucket, pdf_file.read())
            lesson.pdf_path = path_in_bucket
            lesson.save()
            return Response({'status': 'PDF uploaded', 'pdf_path': path_in_bucket})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LessonVideoViewSet(viewsets.ModelViewSet):
    queryset = LessonVideo.objects.all()
    serializer_class = LessonVideoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Filter videos by lesson if lesson parameter is provided"""
        queryset = super().get_queryset()
        lesson_id = self.request.query_params.get('lesson', None)
        
        if lesson_id:
            try:
                lesson_id = int(lesson_id)
                queryset = queryset.filter(lesson_id=lesson_id)
            except ValueError:
                pass  # Invalid lesson ID, return empty queryset
        
        return queryset

    def get_serializer_context(self):
        """Add request context to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'])
    def stream_video(self, request, pk=None):
        """Get secure video streaming URL"""
        video = self.get_object()
        user = request.user
        
        # Verify user is authenticated and enrolled in the course
        if not user.is_authenticated:
            raise exceptions.PermissionDenied("Authentication required.")
        
        # Check if user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=video.lesson.course).exists():
            raise exceptions.PermissionDenied("You are not enrolled in this course.")
        
        # Track video access (mark as accessed, not necessarily completed)
        lesson_progress, created = LessonProgress.objects.get_or_create(
            user=user,
            lesson_video=video,
            defaults={'is_completed': False, 'video_progress_seconds': 0, 'video_watched_percentage': 0.0}
        )
        lesson_progress.save()  # Update last_accessed
        
        # Generate secure streaming URL
        try:
            # Generate proxy URL for secure video streaming
            from django.urls import reverse
            proxy_url = f"http://localhost:8000{reverse('proxy_video_view', kwargs={'video_id': video.id})}"
            
            return Response({
                'stream_url': proxy_url,
                'video_title': video.title,
                'lesson_title': video.lesson.title,
                'course_title': video.lesson.course.title,
                'duration': str(video.duration) if video.duration else None,
                'file_size': video.file_size,
                'video_format': video.video_format,
                'thumbnail_path': video.thumbnail_path,
                'user_id': user.id,
                'watermark': f"{user.username or user.email} • {timezone.now().strftime('%Y-%m-%d %H:%M')} • PROTECTED",
                'expires_in': 3600,  # 1 hour
                'protection_level': 'maximum'
            })
        except Exception as e:
            raise exceptions.APIException(f"Failed to generate secure video URL: {str(e)}")

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_progress(self, request, pk=None):
        """Update video watching progress"""
        video = self.get_object()
        user = request.user
        
        # Verify user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=video.lesson.course).exists():
            raise exceptions.PermissionDenied("You are not enrolled in this course.")
        
        # Get progress data from request
        current_time = request.data.get('current_time', 0)
        duration = request.data.get('duration', 0)
        force_completed = request.data.get('completed', False)
        
        # Calculate percentage watched
        watched_percentage = (current_time / duration * 100) if duration > 0 else 0
        
        # Determine if video is completed (90% threshold or force_completed)
        is_completed = force_completed or watched_percentage >= 90
        
        # Update or create progress record
        lesson_progress, created = LessonProgress.objects.get_or_create(
            user=user,
            lesson_video=video,
            defaults={
                'video_progress_seconds': int(current_time),
                'video_watched_percentage': watched_percentage,
                'is_completed': is_completed,
                'completed_at': timezone.now() if is_completed else None
            }
        )
        
        if not created:
            # Update existing progress
            lesson_progress.video_progress_seconds = int(current_time)
            lesson_progress.video_watched_percentage = watched_percentage
            
            # Only mark as completed if not already completed
            if not lesson_progress.is_completed and is_completed:
                lesson_progress.is_completed = True
                lesson_progress.completed_at = timezone.now()
            
            lesson_progress.save()
        
        # Update course progress if video was completed
        if is_completed:
            course_progress, created = CourseProgress.objects.get_or_create(
                user=user,
                course=video.lesson.course
            )
            course_progress.calculate_progress()
        
        return Response({
            'message': 'Progress updated successfully',
            'current_time': lesson_progress.video_progress_seconds,
            'watched_percentage': lesson_progress.video_watched_percentage,
            'is_completed': lesson_progress.is_completed,
            'completed_at': lesson_progress.completed_at.isoformat() if lesson_progress.completed_at else None
        })

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_progress(self, request, pk=None):
        """Get current user's progress for this video"""
        video = self.get_object()
        user = request.user
        
        # Verify user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=video.lesson.course).exists():
            raise exceptions.PermissionDenied("You are not enrolled in this course.")
        
        try:
            progress = LessonProgress.objects.get(user=user, lesson_video=video)
            return Response({
                'current_time': progress.video_progress_seconds,
                'watched_percentage': progress.video_watched_percentage,
                'is_completed': progress.is_completed,
                'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
                'last_accessed': progress.last_accessed.isoformat() if progress.last_accessed else None
            })
        except LessonProgress.DoesNotExist:
            return Response({
                'current_time': 0,
                'watched_percentage': 0.0,
                'is_completed': False,
                'completed_at': None,
                'last_accessed': None
            })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_completed(self, request, pk=None):
        """Mark a video as completed"""
        video = self.get_object()
        user = request.user
        
        # Verify user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=video.lesson.course).exists():
            raise exceptions.PermissionDenied("You are not enrolled in this course.")
        
        # Mark video as completed
        lesson_progress, created = LessonProgress.objects.get_or_create(
            user=user,
            lesson_video=video,
            defaults={
                'is_completed': True, 
                'completed_at': timezone.now(),
                'video_watched_percentage': 100.0
            }
        )
        
        if not lesson_progress.is_completed:
            lesson_progress.is_completed = True
            lesson_progress.completed_at = timezone.now()
            lesson_progress.video_watched_percentage = 100.0
            lesson_progress.save()
        
        # Update course progress
        course_progress, created = CourseProgress.objects.get_or_create(
            user=user,
            course=video.lesson.course
        )
        course_progress.calculate_progress()
        
        return Response({
            'message': 'Video marked as completed',
            'video_title': video.title,
            'course_progress': course_progress.progress_percentage
        })
