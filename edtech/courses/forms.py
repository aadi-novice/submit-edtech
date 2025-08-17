from django import forms
from .models import Lesson, Course, LessonVideo
from .storage import upload_bytes

class SupabasePDFUploadForm(forms.Form):
    course = forms.ModelChoiceField(queryset=Course.objects.all())
    title = forms.CharField(max_length=200)
    pdf_file = forms.FileField()

    def save(self):
        course = self.cleaned_data['course']
        title = self.cleaned_data['title']
        pdf_file = self.cleaned_data['pdf_file']
        # Upload to Supabase Storage
        path_in_bucket = f"{course.id}/{title.replace(' ', '_')}.pdf"
        upload_bytes(path_in_bucket, pdf_file.read())
        # Save lesson with Supabase path
        lesson = Lesson.objects.create(
            course=course,
            title=title,
            pdf_path=path_in_bucket
        )
        return lesson


class SupabaseVideoUploadForm(forms.Form):
    lesson = forms.ModelChoiceField(queryset=Lesson.objects.all())
    title = forms.CharField(max_length=200)
    video_file = forms.FileField(
        help_text="Supported formats: MP4, WebM, OGG, AVI, MOV"
    )

    def save(self):
        lesson = self.cleaned_data['lesson']
        title = self.cleaned_data['title']
        video_file = self.cleaned_data['video_file']
        
        # Create LessonVideo instance
        # The signal will automatically handle Supabase upload
        lesson_video = LessonVideo.objects.create(
            lesson=lesson,
            title=title,
            video_file=video_file
        )
        return lesson_video
