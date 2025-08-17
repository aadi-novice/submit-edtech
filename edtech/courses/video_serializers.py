from rest_framework import serializers
from .models import LessonVideo, LessonProgress, Course, Lesson


class LessonVideoSerializer(serializers.ModelSerializer):
    """Serializer for LessonVideo model"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    course_title = serializers.CharField(source='lesson.course.title', read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = LessonVideo
        fields = [
            'id', 'title', 'lesson', 'lesson_title', 'course_title',
            'video_file', 'video_path', 'thumbnail_path',
            'duration', 'duration_formatted', 'file_size', 'file_size_formatted',
            'video_format', 'uploaded_at'
        ]
        read_only_fields = ['video_path', 'file_size', 'video_format', 'uploaded_at']
    
    def get_duration_formatted(self, obj):
        """Format duration as HH:MM:SS"""
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            if hours > 0:
                return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
            else:
                return f"{minutes:02d}:{seconds:02d}"
        return None
    
    def get_file_size_formatted(self, obj):
        """Format file size in human readable format"""
        if obj.file_size:
            if obj.file_size < 1024:
                return f"{obj.file_size} B"
            elif obj.file_size < 1024 * 1024:
                return f"{obj.file_size / 1024:.1f} KB"
            elif obj.file_size < 1024 * 1024 * 1024:
                return f"{obj.file_size / (1024 * 1024):.1f} MB"
            else:
                return f"{obj.file_size / (1024 * 1024 * 1024):.1f} GB"
        return None


class VideoProgressSerializer(serializers.ModelSerializer):
    """Serializer for video progress tracking"""
    video_title = serializers.CharField(source='lesson_video.title', read_only=True)
    video_duration = serializers.DurationField(source='lesson_video.duration', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = LessonProgress
        fields = [
            'id', 'user', 'lesson_video', 'video_title', 'video_duration',
            'is_completed', 'video_progress_seconds', 'progress_percentage',
            'completed_at', 'last_accessed'
        ]
        read_only_fields = ['user', 'completed_at', 'last_accessed']
    
    def get_progress_percentage(self, obj):
        """Calculate video watch percentage"""
        if obj.lesson_video and obj.lesson_video.duration and obj.video_progress_seconds:
            total_seconds = obj.lesson_video.duration.total_seconds()
            if total_seconds > 0:
                return min(100, (obj.video_progress_seconds / total_seconds) * 100)
        return 0


class LessonVideoUploadSerializer(serializers.ModelSerializer):
    """Serializer for video upload with validation"""
    
    class Meta:
        model = LessonVideo
        fields = ['lesson', 'title', 'video_file']
    
    def validate_video_file(self, value):
        """Validate video file format and size"""
        if value:
            # Check file extension
            valid_extensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv']
            file_extension = value.name.lower().split('.')[-1]
            if f'.{file_extension}' not in valid_extensions:
                raise serializers.ValidationError(
                    f"Unsupported video format. Supported formats: {', '.join(valid_extensions)}"
                )
            
            # Check file size (limit to 500MB)
            max_size = 500 * 1024 * 1024  # 500MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"Video file too large. Maximum size is 500MB, got {value.size / (1024*1024):.1f}MB"
                )
        
        return value
    
    def create(self, validated_data):
        """Create video and trigger Supabase upload via signal"""
        return super().create(validated_data)


class LessonWithVideosSerializer(serializers.ModelSerializer):
    """Serializer for lessons including their videos"""
    videos = LessonVideoSerializer(many=True, read_only=True)
    video_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'created_at', 'videos', 'video_count']
    
    def get_video_count(self, obj):
        return obj.videos.count()


class CourseWithVideosSerializer(serializers.ModelSerializer):
    """Serializer for courses with video information"""
    lessons = LessonWithVideosSerializer(many=True, read_only=True)
    total_videos = serializers.SerializerMethodField()
    total_video_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'created_at', 'lessons', 'total_videos', 'total_video_duration']
    
    def get_total_videos(self, obj):
        total = 0
        for lesson in obj.lessons.all():
            total += lesson.videos.count()
        return total
    
    def get_total_video_duration(self, obj):
        """Calculate total duration of all videos in the course"""
        from datetime import timedelta
        total_duration = timedelta()
        
        for lesson in obj.lessons.all():
            for video in lesson.videos.all():
                if video.duration:
                    total_duration += video.duration
        
        if total_duration.total_seconds() > 0:
            total_seconds = int(total_duration.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            if hours > 0:
                return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
            else:
                return f"{minutes:02d}:{seconds:02d}"
        
        return "00:00"
