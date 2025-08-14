from rest_framework import serializers
from .models import Course, Lesson
from .enrollment import Enrollment

class CourseSerializer(serializers.ModelSerializer):
    is_enrolled = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'is_enrolled']
    
    def get_is_enrolled(self, obj):
        """Check if the current user is enrolled in this course"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(user=request.user, course=obj).exists()
        return False

class LessonSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    pdfs = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = ['id', 'course', 'title', 'pdfs', 'created_at']
    
    def get_pdfs(self, obj):
        """Get PDFs for this lesson"""
        from .pdf_serializers import LessonPDFSerializer
        pdfs = obj.pdfs.all()
        serializer = LessonPDFSerializer(pdfs, many=True)
        return serializer.data
