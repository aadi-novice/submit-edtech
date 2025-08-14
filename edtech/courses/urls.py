from django.urls import path, include
from . import views
from rest_framework import routers
from .api import CourseViewSet, LessonViewSet, LessonPDFViewSet

router = routers.DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'lessonpdfs', LessonPDFViewSet)

urlpatterns = [
    path("", views.home, name="home"),
    path("", include(router.urls)),
]
