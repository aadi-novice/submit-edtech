from rest_framework import serializers
from .models import Lesson

class PDFUploadSerializer(serializers.Serializer):
    lesson_id = serializers.IntegerField()
    pdf_file = serializers.FileField()
