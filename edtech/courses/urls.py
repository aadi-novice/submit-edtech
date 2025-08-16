from django.urls import path, include
from . import views
from .debug_views import debug_token_view
from .simple_test_view import simple_test_view
from rest_framework import routers
from .api import CourseViewSet, LessonViewSet, LessonPDFViewSet

# Simple test function to verify URL routing
def test_proxy_view(request, pdf_id):
    from django.http import HttpResponse
    return HttpResponse(f"Proxy view called with PDF ID: {pdf_id}")

router = routers.DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'lessonpdfs', LessonPDFViewSet)

urlpatterns = [
    path("", views.home, name="home"),
    path("test/", simple_test_view, name="simple_test"),
    path("test-proxy/<int:pdf_id>", test_proxy_view, name="test_proxy"),
    path("secure-pdf/<str:path>", views.secure_pdf_view, name="secure_pdf_view"),
    path("proxy-pdf/<int:pdf_id>", views.proxy_pdf_view, name="proxy_pdf_view"),
    path("debug-pdf/", views.debug_pdf_access, name="debug_pdf_access"),
    path("debug-token/", debug_token_view, name="debug_token_view"),
    path("", include(router.urls)),
]
