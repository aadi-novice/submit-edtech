from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .profile import Profile, create_user_profile

# The profile creation is already handled in profile.py
# This file is kept for future signal implementations if needed
