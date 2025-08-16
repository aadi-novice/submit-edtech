from rest_framework import serializers
from .models import LessonPDF

class LessonPDFSerializer(serializers.ModelSerializer):
    signed_url = serializers.SerializerMethodField()
    
    class Meta:
        model = LessonPDF
        fields = ['id', 'title', 'pdf_path', 'signed_url', 'uploaded_at']
    
    def get_signed_url(self, obj):
        """Generate signed URL for PDF access - only for direct PDF access"""
        try:
            if obj.pdf_path:
                from .storage import signed_url
                return signed_url(obj.pdf_path, expires_sec=60)
        except Exception as e:
            print(f"❌ Error generating signed URL for PDF {obj.id}: {str(e)}")
        return None
