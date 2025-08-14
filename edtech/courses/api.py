
from django.db import models
from rest_framework import viewsets, permissions, exceptions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Course, Lesson, LessonPDF
from .serializers import CourseSerializer, LessonSerializer
from .pdf_serializers import LessonPDFSerializer
from .enrollment import Enrollment
from .upload_serializers import PDFUploadSerializer
from .storage import upload_bytes, signed_url
from rest_framework.decorators import action
class LessonPDFViewSet(viewsets.ModelViewSet):
    queryset = LessonPDF.objects.all()
    serializer_class = LessonPDFSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

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
        
        # Generate secure URL with user-specific validation
        from .storage import generate_secure_pdf_url
        url = generate_secure_pdf_url(pdf.pdf_path, user.id, expires_sec=300)  # 5 minutes for better UX
        watermark = f"{user.username or user.email} • {timezone.now().strftime('%Y-%m-%d %H:%M')}"
        
        return Response({
            'signed_url': url,
            'watermark': watermark,
            'user_id': user.id,
            'course_id': pdf.lesson.course.id,
            'lesson_id': pdf.lesson.id,
            'access_token': user.auth_token if hasattr(user, 'auth_token') else None
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
        user = request.user
        enrollments = Enrollment.objects.filter(user=user)
        courses = [enrollment.course for enrollment in enrollments]
        serializer = self.get_serializer(courses, many=True, context={'request': request})
        return Response(serializer.data)

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

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
