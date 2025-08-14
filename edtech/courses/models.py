from django.db import models

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