from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from courses.profile import Profile

class Command(BaseCommand):
    help = 'Update user email and create profile'

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username='meowmeow')
            user.email = 'meow@gmail.com'
            user.save()
            
            # Create or update profile
            profile, created = Profile.objects.get_or_create(user=user)
            profile.role = 'admin'  # Set as admin since it's a superuser
            profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated user {user.username} with email {user.email} and role {profile.role}')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('User meowmeow does not exist')
            )
