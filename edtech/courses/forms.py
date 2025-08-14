from django import forms
from .models import Lesson, Course
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
