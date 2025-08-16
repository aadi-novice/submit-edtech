from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from google.auth.transport import requests
from google.oauth2 import id_token
import os
from .profile import Profile


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_login(request):
    """
    Handle Google OAuth login
    Expects: { "credential": "google_jwt_token" }
    Returns: { "access": "jwt_token", "refresh": "refresh_token", "user": {...} }
    """
    try:
        # Get the Google JWT token from request
        google_token = request.data.get('credential')
        if not google_token:
            return Response(
                {'error': 'Google credential token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the Google token
        google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        if not google_client_id:
            return Response(
                {'error': 'Google OAuth not configured'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            google_token, 
            requests.Request(), 
            google_client_id
        )

        # Extract user information
        email = idinfo.get('email')
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        google_id = idinfo.get('sub')

        if not email:
            return Response(
                {'error': 'Email not provided by Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': first_name,
                'last_name': last_name,
            }
        )

        # Create or get profile
        profile, profile_created = Profile.objects.get_or_create(
            user=user,
            defaults={'role': 'student'}  # Default role for Google users
        )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        # Prepare user data
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'role': profile.role,
        }

        return Response({
            'access': str(access_token),
            'refresh': str(refresh),
            'user': user_data,
            'created': created,  # True if new user was created
        })

    except ValueError as e:
        # Invalid token
        return Response(
            {'error': 'Invalid Google token'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Authentication failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def google_oauth_status(request):
    """
    Check Google OAuth configuration status
    """
    google_client_id = os.getenv('GOOGLE_CLIENT_ID')
    google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    
    return Response({
        'google_oauth_configured': bool(google_client_id and google_client_id != 'your_google_client_id_here'),
        'client_id_set': bool(google_client_id),
        'client_secret_set': bool(google_client_secret),
        'client_id_placeholder': google_client_id == 'your_google_client_id_here',
    })
