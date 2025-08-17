from django.urls import path, include
from . import views
from .debug_views import debug_token_view
from .simple_test_view import simple_test_view
from .google_auth import google_oauth_login, google_oauth_status
from rest_framework import routers
from .api import CourseViewSet, LessonViewSet, LessonPDFViewSet, LessonVideoViewSet

# Simple test function to verify URL routing
def test_proxy_view(request, pdf_id):
    from django.http import HttpResponse
    return HttpResponse(f"Proxy view called with PDF ID: {pdf_id}")

router = routers.DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'lessonpdfs', LessonPDFViewSet)
router.register(r'lessonvideos', LessonVideoViewSet)

urlpatterns = [
    path("", views.home, name="home"),
    path("test/", simple_test_view, name="simple_test"),
    path("test-proxy/<int:pdf_id>", test_proxy_view, name="test_proxy"),
    
    # PDF endpoints
    path("secure-pdf/<str:path>", views.secure_pdf_view, name="secure_pdf_view"),
    path("proxy-pdf/<int:pdf_id>", views.proxy_pdf_view, name="proxy_pdf_view"),
    path("debug-pdf/", views.debug_pdf_access, name="debug_pdf_access"),
    
    # Video endpoints
    path("proxy-video/<int:video_id>/", views.proxy_video_view, name="proxy_video_view"),
    path("video-progress/<int:video_id>/", views.update_video_progress, name="update_video_progress"),
    path("video-progress/<int:video_id>/get/", views.get_video_progress, name="get_video_progress"),
    
    # Authentication
    path("debug-token/", debug_token_view, name="debug_token_view"),
    path("auth/google/", google_oauth_login, name="google_oauth_login"),
    path("auth/google/status/", google_oauth_status, name="google_oauth_status"),
    
    # API routes
    path("", include(router.urls)),
]
