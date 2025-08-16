from django.db import models
from django.conf import settings
from django.contrib.auth.models import User

class PDFDocument(models.Model):
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='pdfs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, help_text="Brief description of the course")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): 
        return self.title

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Course"
        verbose_name_plural = "Courses"



class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course} — {self.title}"


class LessonPDF(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="pdfs")
    title = models.CharField(max_length=200)
    pdf_file = models.FileField(upload_to='lesson_pdfs/', blank=True, null=True)
    pdf_path = models.CharField(max_length=500, blank=True)  # Supabase path, auto-filled
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lesson} — {self.title}"


class LessonProgress(models.Model):
    """Track individual lesson/PDF completion by users"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson_pdf = models.ForeignKey(LessonPDF, on_delete=models.CASCADE)
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
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    progress_percentage = models.FloatField(default=0.0)
    last_accessed = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'course')
        verbose_name = "Course Progress"
        verbose_name_plural = "Course Progress"

    def calculate_progress(self):
        """Calculate progress based on completed lesson PDFs"""
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