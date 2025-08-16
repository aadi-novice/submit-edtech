#!/usr/bin/env python3

import sys
import os
import django

# Add the Django project directory to Python path
sys.path.append('d:/submission-edtech-main 2/submission-edtech-main/edtech')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edtech.settings')
django.setup()

from courses.models import LessonPDF
from courses.enrollment import Enrollment
from django.contrib.auth.models import User

# Find which course the PDF belongs to
pdf = LessonPDF.objects.get(id=1)
print(f'PDF "{pdf.title}" belongs to course: {pdf.lesson.course.title} (ID: {pdf.lesson.course.id})')

# Enroll the student user in that course
student = User.objects.get(username='student')
enrollment, created = Enrollment.objects.get_or_create(user=student, course=pdf.lesson.course)
print(f'Student enrolled: {created}' if created else 'Student was already enrolled')

print(f'Student now enrolled in: {Enrollment.objects.filter(user=student).values_list("course__title", flat=True)}')
