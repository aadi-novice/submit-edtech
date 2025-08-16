from django.db import models
from django.conf import settings
from django.contrib.auth.models import User

class LessonProgress(models.Model):
    """Track individual lesson/PDF completion by users"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson_pdf = models.ForeignKey('LessonPDF', on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'lesson_pdf')
        verbose_name = "Lesson Progress"
        verbose_name_plural = "Lesson Progress"

    def __str__(self):
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.user} - {self.lesson_pdf} ({status})"

class CourseProgress(models.Model):
    """Track overall course progress by users"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey('Course', on_delete=models.CASCADE)
    progress_percentage = models.FloatField(default=0.0)
    last_accessed = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'course')
        verbose_name = "Course Progress"
        verbose_name_plural = "Course Progress"

    def calculate_progress(self):
        """Calculate progress based on completed lesson PDFs"""
        from .models import LessonPDF
        
        # Get all PDFs in this course
        course_pdfs = LessonPDF.objects.filter(lesson__course=self.course)
        total_pdfs = course_pdfs.count()
        
        if total_pdfs == 0:
            self.progress_percentage = 0.0
        else:
            # Count completed PDFs for this user
            completed_pdfs = LessonProgress.objects.filter(
                user=self.user,
                lesson_pdf__in=course_pdfs,
                is_completed=True
            ).count()
            
            self.progress_percentage = (completed_pdfs / total_pdfs) * 100
        
        self.save()
        return self.progress_percentage

    def __str__(self):
        return f"{self.user} - {self.course} ({self.progress_percentage:.1f}%)"
