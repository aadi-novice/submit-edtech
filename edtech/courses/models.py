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


class MCQQuestion(models.Model):
    """Multiple Choice Questions for lessons"""
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="mcq_questions")
    question_text = models.TextField(help_text="The question text")
    order = models.IntegerField(default=0, help_text="Order of the question in the lesson")
    points = models.IntegerField(default=1, help_text="Points awarded for correct answer")
    explanation = models.TextField(blank=True, help_text="Explanation shown after answering")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['lesson', 'order']
        verbose_name = "MCQ Question"
        verbose_name_plural = "MCQ Questions"

    def __str__(self):
        return f"{self.lesson.title} - Q{self.order}: {self.question_text[:50]}..."

    @property
    def correct_answer(self):
        """Get the correct answer option"""
        return self.options.filter(is_correct=True).first()

    @property
    def total_attempts(self):
        """Get total number of attempts for this question"""
        return MCQAttempt.objects.filter(question=self).count()

    @property
    def correct_attempts(self):
        """Get number of correct attempts for this question"""
        return MCQAttempt.objects.filter(question=self, is_correct=True).count()

    @property
    def success_rate(self):
        """Calculate success rate percentage"""
        if self.total_attempts == 0:
            return 0
        return (self.correct_attempts / self.total_attempts) * 100


class MCQOption(models.Model):
    """Answer options for MCQ questions"""
    question = models.ForeignKey(MCQQuestion, on_delete=models.CASCADE, related_name="options")
    option_text = models.CharField(max_length=500, help_text="The answer option text")
    is_correct = models.BooleanField(default=False, help_text="Is this the correct answer?")
    order = models.IntegerField(default=0, help_text="Order of the option")

    class Meta:
        ordering = ['question', 'order']
        verbose_name = "MCQ Option"
        verbose_name_plural = "MCQ Options"

    def __str__(self):
        correct_indicator = "✓" if self.is_correct else "✗"
        return f"{self.question.question_text[:30]}... - {correct_indicator} {self.option_text[:30]}..."


class MCQAttempt(models.Model):
    """Track user attempts at MCQ questions"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    question = models.ForeignKey(MCQQuestion, on_delete=models.CASCADE, related_name="attempts")
    selected_option = models.ForeignKey(MCQOption, on_delete=models.CASCADE, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    points_earned = models.IntegerField(default=0)
    attempt_number = models.IntegerField(default=1, help_text="Which attempt this is for the user")
    time_taken_seconds = models.IntegerField(null=True, blank=True, help_text="Time taken to answer in seconds")
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-attempted_at']
        verbose_name = "MCQ Attempt"
        verbose_name_plural = "MCQ Attempts"
        unique_together = ['user', 'question', 'attempt_number']

    def __str__(self):
        status = "✓ Correct" if self.is_correct else "✗ Incorrect"
        return f"{self.user.username} - {self.question.question_text[:30]}... - {status}"

    def save(self, *args, **kwargs):
        # Automatically set is_correct and points_earned based on selected_option
        if self.selected_option:
            self.is_correct = self.selected_option.is_correct
            self.points_earned = self.question.points if self.is_correct else 0
        super().save(*args, **kwargs)


class MCQProgress(models.Model):
    """Track overall MCQ progress for a lesson"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="mcq_progress")
    total_questions = models.IntegerField(default=0)
    questions_attempted = models.IntegerField(default=0)
    questions_correct = models.IntegerField(default=0)
    total_points_possible = models.IntegerField(default=0)
    total_points_earned = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False, help_text="All questions attempted")
    completion_percentage = models.FloatField(default=0.0)
    score_percentage = models.FloatField(default=0.0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_updated']
        verbose_name = "MCQ Progress"
        verbose_name_plural = "MCQ Progress Records"
        unique_together = ['user', 'lesson']

    def __str__(self):
        return f"{self.user.username} - {self.lesson.title} MCQ ({self.score_percentage:.1f}%)"

    def calculate_progress(self):
        """Recalculate progress based on current attempts"""
        from django.db.models import Count, Sum
        
        # Get lesson's MCQ questions
        lesson_questions = self.lesson.mcq_questions.all()
        self.total_questions = lesson_questions.count()
        
        if self.total_questions == 0:
            self.completion_percentage = 100.0
            self.score_percentage = 100.0
            self.is_completed = True
            self.save()
            return

        # Calculate total possible points
        self.total_points_possible = sum(q.points for q in lesson_questions)

        # Get user's best attempts for each question
        attempted_questions = set()
        total_points_earned = 0
        questions_correct = 0

        for question in lesson_questions:
            best_attempt = MCQAttempt.objects.filter(
                user=self.user,
                question=question
            ).order_by('-points_earned', 'attempted_at').first()

            if best_attempt:
                attempted_questions.add(question.id)
                total_points_earned += best_attempt.points_earned
                if best_attempt.is_correct:
                    questions_correct += 1

        self.questions_attempted = len(attempted_questions)
        self.questions_correct = questions_correct
        self.total_points_earned = total_points_earned

        # Calculate percentages
        self.completion_percentage = (self.questions_attempted / self.total_questions) * 100
        self.score_percentage = (total_points_earned / self.total_points_possible) * 100 if self.total_points_possible > 0 else 0

        # Mark as completed if all questions attempted
        if self.questions_attempted >= self.total_questions:
            self.is_completed = True
            if not self.completed_at:
                from django.utils import timezone
                self.completed_at = timezone.now()

        self.save()
        return self.score_percentage