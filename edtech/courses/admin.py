
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import PDFDocument, Course, Lesson, LessonPDF, LessonVideo, LessonProgress, CourseProgress
from .enrollment import Enrollment
from .profile import Profile

# Custom User Profile Inline
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('role',)

# Enhanced User Admin
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    list_display = BaseUserAdmin.list_display + ('get_role',)
    list_filter = BaseUserAdmin.list_filter + ('profile__role',)
    
    def get_role(self, obj):
        return obj.profile.role if hasattr(obj, 'profile') else 'No Profile'
    get_role.short_description = 'Role'

# Enhanced Course Admin
class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ('title', 'created_at')
    readonly_fields = ('created_at',)

class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson_count', 'enrollment_count')
    search_fields = ('title',)
    inlines = [LessonInline]
    
    def lesson_count(self, obj):
        return obj.lessons.count()
    lesson_count.short_description = 'Lessons'
    
    def enrollment_count(self, obj):
        return Enrollment.objects.filter(course=obj).count()
    enrollment_count.short_description = 'Enrollments'

# Enhanced Lesson Admin with PDF and Video management
class LessonPDFInline(admin.TabularInline):
    model = LessonPDF
    extra = 1
    fields = ('title', 'pdf_file', 'uploaded_at')
    readonly_fields = ('uploaded_at',)

class LessonVideoInline(admin.TabularInline):
    model = LessonVideo
    extra = 1
    fields = ('title', 'video_file', 'duration', 'file_size', 'uploaded_at')
    readonly_fields = ('uploaded_at', 'file_size', 'duration')

class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'pdf_count', 'video_count', 'created_at')
    list_filter = ('course', 'created_at')
    search_fields = ('title', 'course__title')
    inlines = [LessonPDFInline, LessonVideoInline]
    
    def pdf_count(self, obj):
        return obj.pdfs.count()
    pdf_count.short_description = 'PDFs'
    
    def video_count(self, obj):
        return obj.videos.count()
    video_count.short_description = 'Videos'

# Enhanced LessonPDF Admin
class LessonPDFAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'get_course', 'uploaded_at')
    list_filter = ('lesson__course', 'uploaded_at')
    search_fields = ('title', 'lesson__title', 'lesson__course__title')
    
    def get_course(self, obj):
        return obj.lesson.course.title
    get_course.short_description = 'Course'

# Enhanced LessonVideo Admin
class LessonVideoAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'get_course', 'duration', 'get_file_size', 'uploaded_at')
    list_filter = ('lesson__course', 'uploaded_at', 'video_format')
    search_fields = ('title', 'lesson__title', 'lesson__course__title')
    readonly_fields = ('file_size', 'duration', 'video_format')
    
    def get_course(self, obj):
        return obj.lesson.course.title
    get_course.short_description = 'Course'
    
    def get_file_size(self, obj):
        if obj.file_size:
            # Convert bytes to MB
            return f"{obj.file_size / (1024*1024):.1f} MB"
        return "Unknown"
    get_file_size.short_description = 'File Size'

# Enhanced Enrollment Admin
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'enrolled_at')
    list_filter = ('course', 'enrolled_at')
    search_fields = ('user__username', 'user__email', 'course__title')
    date_hierarchy = 'enrolled_at'

# Progress Tracking Admin
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_content_title', 'get_content_type', 'get_course', 'is_completed', 'video_watched_percentage', 'completed_at', 'last_accessed')
    list_filter = ('is_completed', 'completed_at')
    search_fields = ('user__username', 'user__email', 'lesson_pdf__title', 'lesson_video__title')
    date_hierarchy = 'completed_at'
    
    def get_content_title(self, obj):
        if obj.lesson_pdf:
            return obj.lesson_pdf.title
        elif obj.lesson_video:
            return obj.lesson_video.title
        return "No Content"
    get_content_title.short_description = 'Content'
    
    def get_content_type(self, obj):
        if obj.lesson_pdf:
            return "PDF"
        elif obj.lesson_video:
            return "Video"
        return "Unknown"
    get_content_type.short_description = 'Type'
    
    def get_course(self, obj):
        if obj.lesson_pdf:
            return obj.lesson_pdf.lesson.course.title
        elif obj.lesson_video:
            return obj.lesson_video.lesson.course.title
        return "No Course"
    get_course.short_description = 'Course'

class CourseProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'progress_percentage', 'last_accessed', 'created_at')
    list_filter = ('course', 'last_accessed')
    search_fields = ('user__username', 'user__email', 'course__title')
    date_hierarchy = 'last_accessed'
    
    actions = ['recalculate_progress']
    
    def recalculate_progress(self, request, queryset):
        for course_progress in queryset:
            course_progress.calculate_progress()
        self.message_user(request, f"Recalculated progress for {queryset.count()} course(s).")
    recalculate_progress.short_description = "Recalculate progress"

# Progress tracking admins
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson_pdf', 'is_completed', 'completed_at', 'last_accessed')
    list_filter = ('is_completed', 'lesson_pdf__lesson__course', 'completed_at', 'last_accessed')
    search_fields = ('user__username', 'user__email', 'lesson_pdf__title', 'lesson_pdf__lesson__title')
    date_hierarchy = 'completed_at'
    readonly_fields = ('last_accessed', 'created_at')

class CourseProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'progress_percentage', 'last_accessed')
    list_filter = ('course', 'last_accessed')
    search_fields = ('user__username', 'user__email', 'course__title')
    readonly_fields = ('last_accessed', 'created_at')
    
    actions = ['recalculate_progress']
    
    def recalculate_progress(self, request, queryset):
        for progress in queryset:
            progress.calculate_progress()
        self.message_user(request, f"Recalculated progress for {queryset.count()} records.")
    recalculate_progress.short_description = "Recalculate progress for selected records"

# Enhanced PDFDocument Admin
class PDFDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('title',)

# Re-register User with enhanced admin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Register all models with enhanced admin
admin.site.register(Profile)
admin.site.register(PDFDocument, PDFDocumentAdmin)
admin.site.register(Course, CourseAdmin)
admin.site.register(Lesson, LessonAdmin)
admin.site.register(LessonPDF, LessonPDFAdmin)
admin.site.register(LessonVideo, LessonVideoAdmin)
admin.site.register(Enrollment, EnrollmentAdmin)
admin.site.register(LessonProgress, LessonProgressAdmin)
admin.site.register(CourseProgress, CourseProgressAdmin)

# Customize admin site headers
admin.site.site_header = "CourseGuardian Admin Panel"
admin.site.site_title = "CourseGuardian Admin"
admin.site.index_title = "Welcome to CourseGuardian Administration"