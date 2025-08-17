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


class LessonVideo(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="videos")
    title = models.CharField(max_length=200)
    video_file = models.FileField(upload_to='lesson_videos/', blank=True, null=True)
    video_path = models.CharField(max_length=500, blank=True)  # Supabase path, auto-filled
    thumbnail_path = models.CharField(max_length=500, blank=True)  # Supabase thumbnail path
    duration = models.DurationField(blank=True, null=True)  # Video duration
    file_size = models.BigIntegerField(default=0)  # File size in bytes
    video_format = models.CharField(max_length=10, default='mp4')  # Video format
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lesson} — {self.title}"

    class Meta:
        verbose_name = "Lesson Video"
        verbose_name_plural = "Lesson Videos"


class LessonProgress(models.Model):
    """Track individual lesson/PDF/Video completion by users"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson_pdf = models.ForeignKey(LessonPDF, on_delete=models.CASCADE, null=True, blank=True)
    lesson_video = models.ForeignKey(LessonVideo, on_delete=models.CASCADE, null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Video-specific progress tracking
    video_progress_seconds = models.IntegerField(default=0)  # Current position in seconds
    video_watched_percentage = models.FloatField(default=0.0)  # Percentage watched

    class Meta:
        unique_together = [
            ('user', 'lesson_pdf'),
            ('user', 'lesson_video')
        ]
        verbose_name = "Lesson Progress"
        verbose_name_plural = "Lesson Progress"

    def __str__(self):
        content_type = "PDF" if self.lesson_pdf else "Video"
        content_name = self.lesson_pdf or self.lesson_video
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.user} - {content_name} ({content_type} - {status})"

    def save(self, *args, **kwargs):
        # Ensure only one of lesson_pdf or lesson_video is set
        if self.lesson_pdf and self.lesson_video:
            raise ValueError("Cannot track both PDF and Video in the same progress record")
        if not self.lesson_pdf and not self.lesson_video:
            raise ValueError("Must specify either lesson_pdf or lesson_video")
        super().save(*args, **kwargs)


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
        """Calculate progress based on completed lesson PDFs and Videos"""
        # Get all PDFs and Videos in this course
        course_pdfs = LessonPDF.objects.filter(lesson__course=self.course)
        course_videos = LessonVideo.objects.filter(lesson__course=self.course)
        
        total_content = course_pdfs.count() + course_videos.count()
        
        if total_content == 0:
            self.progress_percentage = 0.0
        else:
            # Count completed PDFs for this user
            completed_pdfs = LessonProgress.objects.filter(
                user=self.user,
                lesson_pdf__in=course_pdfs,
                is_completed=True
            ).count()
            
            # Count completed Videos for this user
            completed_videos = LessonProgress.objects.filter(
                user=self.user,
                lesson_video__in=course_videos,
                is_completed=True
            ).count()
            
            total_completed = completed_pdfs + completed_videos
            self.progress_percentage = (total_completed / total_content) * 100
        
        self.save()
        return self.progress_percentage

    def __str__(self):
        return f"{self.user} - {self.course} ({self.progress_percentage:.1f}%)"