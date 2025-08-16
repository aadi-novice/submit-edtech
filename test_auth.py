#!/usr/bin/env python3

import requests

# Test the my_courses endpoint with a valid JWT token
url = "http://localhost:8000/api/courses/my_courses/"

# Generate a fresh token for the first user
import sys
import os
import django

# Add the Django project directory to Python path
sys.path.append('d:/submission-edtech-main 2/submission-edtech-main/edtech')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edtech.settings')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User

# Get first user and generate token
user = User.objects.first()
token = RefreshToken.for_user(user)
access_token = str(token.access_token)

print(f"Testing with user: {user.username}")
print(f"Token (first 50 chars): {access_token[:50]}...")

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
