from rest_framework import serializers
from .models import LessonPDF
from .storage import signed_url

class LessonPDFSerializer(serializers.ModelSerializer):
    signed_url = serializers.SerializerMethodField()
    
    class Meta:
        model = LessonPDF
        fields = ['id', 'title', 'pdf_path', 'signed_url', 'uploaded_at']
    
    def get_signed_url(self, obj):
        """Generate signed URL for PDF access"""
        if obj.pdf_path:
            return signed_url(obj.pdf_path, expires_sec=60)
        return None
