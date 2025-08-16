from rest_framework import serializers
from .models import Course, Lesson
from .enrollment import Enrollment

class CourseSerializer(serializers.ModelSerializer):
    is_enrolled = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()
    pdfCount = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'created_at', 'is_enrolled', 'lesson_count', 'pdfCount']
    
    def get_is_enrolled(self, obj):
        """Check if the current user is enrolled in this course"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(user=request.user, course=obj).exists()
        return False
    
    def get_lesson_count(self, obj):
        """Get the number of lessons in this course"""
        return obj.lessons.count()
    
    def get_pdfCount(self, obj):
        """Get the number of PDFs in this course"""
        from .models import LessonPDF
        return LessonPDF.objects.filter(lesson__course=obj).count()

class LessonSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    pdfs = serializers.SerializerMethodField()
    pdf_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = ['id', 'course', 'title', 'pdfs', 'pdf_count', 'created_at']
    
    def get_pdfs(self, obj):
        """Get PDFs for this lesson"""
        try:
            from .pdf_serializers import LessonPDFSerializer
            pdfs = obj.pdfs.all()
            # Use a simpler serializer to avoid circular dependencies
            return [{
                'id': pdf.id,
                'title': pdf.title,
                'pdf_path': pdf.pdf_path,
                'uploaded_at': pdf.uploaded_at.isoformat() if pdf.uploaded_at else None
            } for pdf in pdfs]
        except Exception as e:
            print(f"❌ Error getting PDFs for lesson {obj.id}: {str(e)}")
            return []
    
    def get_pdf_count(self, obj):
        """Get the number of PDFs in this lesson"""
        try:
            return obj.pdfs.count()
        except Exception:
            return 0
