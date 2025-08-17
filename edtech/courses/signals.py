from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .profile import Profile, create_user_profile
from .models import LessonVideo, LessonPDF
from .storage import upload_bytes
import os

# The profile creation is already handled in profile.py
# This file is kept for future signal implementations if needed

@receiver(post_save, sender=LessonPDF)
def upload_pdf_to_supabase(sender, instance, created, **kwargs):
    """
    Signal to automatically upload PDF to Supabase when a LessonPDF is saved
    """
    if instance.pdf_file and not instance.pdf_path:
        try:
            # Read PDF file content
            instance.pdf_file.open()
            pdf_data = instance.pdf_file.read()
            instance.pdf_file.close()
            
            # Generate Supabase path
            file_extension = os.path.splitext(instance.pdf_file.name)[1]
            supabase_path = f"lesson_pdfs/{instance.lesson.course.id}/{instance.id}_{instance.title.replace(' ', '_')}{file_extension}"
            
            # Upload to Supabase
            print(f"🔄 Uploading PDF to Supabase: {supabase_path}")
            upload_bytes(supabase_path, pdf_data)
            
            # Update the instance with Supabase path
            instance.pdf_path = supabase_path
            
            # Save without triggering signal again
            LessonPDF.objects.filter(id=instance.id).update(
                pdf_path=instance.pdf_path
            )
            
            print(f"✅ PDF uploaded successfully to Supabase: {supabase_path}")
            
        except Exception as e:
            print(f"❌ Failed to upload PDF to Supabase: {e}")
            # Still allow the model to save even if Supabase upload fails

@receiver(post_save, sender=LessonVideo)
def upload_video_to_supabase(sender, instance, created, **kwargs):
    """
    Signal to automatically upload video to Supabase when a LessonVideo is saved
    """
    if instance.video_file and not instance.video_path:
        try:
            # Read video file content
            instance.video_file.open()
            video_data = instance.video_file.read()
            instance.video_file.close()
            
            # Generate Supabase path
            file_extension = os.path.splitext(instance.video_file.name)[1]
            supabase_path = f"lesson_videos/{instance.lesson.course.id}/{instance.id}_{instance.title.replace(' ', '_')}{file_extension}"
            
            # Upload to Supabase
            print(f"🔄 Uploading video to Supabase: {supabase_path}")
            upload_bytes(supabase_path, video_data)
            
            # Update the instance with Supabase path
            instance.video_path = supabase_path
            instance.file_size = len(video_data)
            
            # Get video format from file extension
            if file_extension.lower() in ['.mp4', '.webm', '.ogg', '.avi', '.mov']:
                instance.video_format = file_extension[1:].lower()
            
            # Save without triggering signal again
            LessonVideo.objects.filter(id=instance.id).update(
                video_path=instance.video_path,
                file_size=instance.file_size,
                video_format=instance.video_format
            )
            
            print(f"✅ Video uploaded successfully to Supabase: {supabase_path}")
            
        except Exception as e:
            print(f"❌ Failed to upload video to Supabase: {e}")
            # Still allow the model to save even if Supabase upload fails
