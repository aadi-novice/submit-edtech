from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.serializers import ModelSerializer, CharField, EmailField, SerializerMethodField
from .profile import Profile
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from .models import Lesson, LessonVideo, LessonProgress
from .storage import signed_url, verify_pdf_access
from django.http import HttpResponse, Http404, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import os
import mimetypes
from django.http import StreamingHttpResponse
import re
from django.db import transaction



# --- JWT Auth Views ---
# class RegisterSerializer(ModelSerializer):
#     email = EmailField(required=True)
#     password = CharField(write_only=True)
#     first_name = CharField(required=False)
#     last_name = CharField(required=False)
#     role = CharField(required=True)

#     class Meta:
#         model = User
#         fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role')

#     def create(self, validated_data):
#         role = validated_data.pop('role', 'student')
#         user = User.objects.create_user(
#             username=validated_data['username'],
#             email=validated_data['email'],
#             password=validated_data['password'],
#             first_name=validated_data.get('first_name', ''),
#             last_name=validated_data.get('last_name', ''),
#         )
#         user.profile.role = role
#         user.profile.save()
#         return user

class RegisterSerializer(ModelSerializer):
    email = EmailField(required=True)
    password = CharField(write_only=True)
    first_name = CharField(required=False)
    last_name = CharField(required=False)
    role = CharField(required=False, default='student')

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role')

    def create(self, validated_data):
        print(f"Serializer create method called with data: {validated_data}")
        role = validated_data.pop('role', 'student')
        print(f"Role extracted: {role}")
        print(f"Remaining data: {validated_data}")
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        print(f"User created: {user}")

        # Update the profile created by the signal with the correct role
        # The signal already creates a profile, so we just need to update it
        Profile.objects.filter(user=user).update(role=role)
        print(f"Profile updated with role: {role}")
        return user

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        print(f"Registration request data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        is_valid = serializer.is_valid()
        print(f"Serializer errors: {serializer.errors}")
        if not is_valid:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response({'message': 'User registered successfully.'}, status=status.HTTP_201_CREATED)

class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = getattr(user.profile, 'role', 'student')
        return Response({
            'id': user.id,
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'username': user.username,
            'role': role,
        })

# User Profile Views
class UserSerializer(ModelSerializer):
    firstName = CharField(source='first_name', read_only=True)
    lastName = CharField(source='last_name', read_only=True)
    role = SerializerMethodField()
    createdAt = CharField(source='date_joined', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'firstName', 'lastName', 'role', 'createdAt')
    
    def get_role(self, obj):
        """Get user role from profile, default to 'student' if no profile exists"""
        try:
            return obj.profile.role
        except:
            return 'student'

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

def home(request):
    return HttpResponse("Hello from Courses App!")

@csrf_exempt
def debug_pdf_access(request):
    """Debug endpoint to test PDF file access"""
    from django.conf import settings
    from .storage import generate_secure_pdf_url
    import os
    
    path = 'lesson_pdfs/_Personalized_Weekly_Gym_Plan_with_Weight_Targets.pdf'
    
    # Check different possible paths
    paths_to_check = [
        os.path.join(settings.BASE_DIR, path),
        os.path.join(getattr(settings, 'MEDIA_ROOT', ''), path),
        os.path.join(settings.BASE_DIR, 'media', path),
    ]
    
    result = []
    result.append(f"BASE_DIR: {settings.BASE_DIR}")
    result.append(f"MEDIA_ROOT: {getattr(settings, 'MEDIA_ROOT', 'Not set')}")
    result.append(f"Looking for: {path}")
    result.append("")
    
    for i, check_path in enumerate(paths_to_check):
        exists = os.path.exists(check_path)
        result.append(f"Path {i+1}: {check_path}")
        result.append(f"Exists: {exists}")
        if exists:
            result.append(f"Size: {os.path.getsize(check_path)} bytes")
        result.append("")
    
    # Test URL generation
    try:
        test_url = generate_secure_pdf_url(path, 1, 300)
        result.append(f"Generated URL: {test_url}")
        result.append("")
        
        # Test if the URL path exists
        from django.urls import reverse
        try:
            reverse_url = reverse('secure_pdf_view', kwargs={'path': path.replace('/', '---')})
            result.append(f"Django reverse URL: {reverse_url}")
        except Exception as e:
            result.append(f"Django reverse error: {e}")
    except Exception as e:
        result.append(f"URL generation error: {e}")
    
    return HttpResponse("\n".join(result), content_type="text/plain")

@csrf_exempt
def secure_pdf_view(request, path):
    """Secure PDF viewer endpoint with access control"""
    # Get parameters
    user_id = request.GET.get('user_id')
    expires = request.GET.get('expires')
    signature = request.GET.get('signature')
    
    if not all([user_id, expires, signature]):
        raise Http404("Invalid access parameters")
    
    try:
        user_id = int(user_id)
        expires = int(expires)
    except ValueError:
        raise Http404("Invalid parameter format")
    
    # Convert path back from URL-safe format
    # Use the new separator we implemented
    actual_path = path.replace('---', '/')
    
    # Verify access
    if not verify_pdf_access(actual_path, user_id, expires, signature):
        raise Http404("Access denied or expired")
    
    # Check if user exists and is authenticated
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise Http404("Invalid user")
    
    # Build file path
    from django.conf import settings
    media_root = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'media'))
    file_path = os.path.join(media_root, actual_path)
    
    # Check if file exists
    if not os.path.exists(file_path):
        # Try in the base directory (for lesson_pdfs)
        file_path = os.path.join(settings.BASE_DIR, actual_path)
        if not os.path.exists(file_path):
            raise Http404("File not found")
    
    # Security headers to prevent download
    response = FileResponse(
        open(file_path, 'rb'),
        content_type='application/pdf'
    )
    
    # Add security headers
    response['Content-Disposition'] = 'inline; filename="secure_view.pdf"'
    response['X-Frame-Options'] = 'SAMEORIGIN'
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    # Add watermark headers (client can use these)
    response['X-User-ID'] = str(user_id)
    response['X-User-Name'] = user.username or user.email
    response['X-Access-Time'] = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return response


@csrf_exempt
def proxy_pdf_view(request, pdf_id):
    """Proxy PDF content from Supabase through Django to avoid CORS issues"""
    print(f"🔍 proxy_pdf_view called with pdf_id={pdf_id}")
    print(f"🔍 Request method: {request.method}")
    print(f"🔍 Request path: {request.path}")
    
    if request.method != 'GET':
        print(f"❌ Invalid method: {request.method}")
        raise Http404("Method not allowed")
    
    # Get user from JWT token in header, query parameter, or cookies
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    token_param = request.GET.get('token')
    cookie_token = request.COOKIES.get('access_token')
    
    print(f"🔍 Auth header: {auth_header}")
    print(f"🔍 Token param: {token_param}")
    print(f"🔍 Cookie token: {cookie_token}")
    
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    elif token_param:
        token = token_param
    elif cookie_token:
        token = cookie_token
    
    if not token:
        print("❌ No token found")
        raise Http404("Authentication required")
    
    try:
        # Import JWT verification
        from rest_framework_simplejwt.tokens import AccessToken
        from django.contrib.auth.models import User
        
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        user = User.objects.get(id=user_id)
        print(f"✅ User authenticated: {user.username}")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        raise Http404("Invalid authentication")
    
    # Get PDF object and verify access
    try:
        from .models import LessonPDF
        from .enrollment import Enrollment
        
        pdf = LessonPDF.objects.get(id=pdf_id)
        
        # Check enrollment
        if not Enrollment.objects.filter(user=user, course=pdf.lesson.course).exists():
            raise Http404("Access denied")
            
    except LessonPDF.DoesNotExist:
        raise Http404("PDF not found")
    
    # Get signed URL from Supabase
    try:
        from .storage import _client
        from django.conf import settings
        
        if _client and pdf.pdf_path:
            signed_url_result = _client.storage.from_(settings.SUPABASE_BUCKET).create_signed_url(
                pdf.pdf_path, 1800  # 30 minutes
            )
            signed_url = signed_url_result.get('signedURL') or signed_url_result.get('signedUrl')
            
            if not signed_url:
                raise Exception("No signed URL generated")
                
        else:
            raise Exception("Supabase not available")
            
    except Exception as e:
        print(f"❌ Supabase failed: {e}")
        # Fallback to local file using pdf_file field
        if pdf.pdf_file:
            try:
                # Use the local file path
                local_path = pdf.pdf_file.path
                print(f"🔄 Trying local file: {local_path}")
                
                if os.path.exists(local_path):
                    response = FileResponse(
                        open(local_path, 'rb'),
                        content_type='application/pdf'
                    )
                    print(f"✅ Serving local file: {local_path}")
                else:
                    print(f"❌ Local file not found: {local_path}")
                    raise Http404("PDF file not found locally")
            except Exception as local_err:
                print(f"❌ Local file error: {local_err}")
                raise Http404("PDF file not accessible")
        else:
            print("❌ No local file available")
            raise Http404("PDF file not found")
    else:
        # Fetch PDF from Supabase and stream it
        try:
            import urllib.request
            
            # Stream the PDF from Supabase
            def stream_pdf():
                with urllib.request.urlopen(signed_url) as pdf_response:
                    while True:
                        chunk = pdf_response.read(8192)  # 8KB chunks
                        if not chunk:
                            break
                        yield chunk
            
            response = StreamingHttpResponse(
                stream_pdf(),
                content_type='application/pdf'
            )
        except Exception as e:
            raise Http404(f"Error fetching PDF: {str(e)}")
    
    # Add security headers
    response['Content-Disposition'] = 'inline; filename="secure_view.pdf"'
    # CRITICAL: Remove X-Frame-Options to allow iframe embedding
    # response['X-Frame-Options'] = 'SAMEORIGIN'
    response['X-Content-Type-Options'] = 'nosniff'
    
    # Remove strict cache control that might interfere with iframe loading
    # response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    # response['Pragma'] = 'no-cache'
    # response['Expires'] = '0'
    
    # Add CORS headers for your frontend - support multiple development ports
    origin = request.META.get('HTTP_ORIGIN')
    allowed_origins = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:5173'
    ]
    if origin in allowed_origins:
        response['Access-Control-Allow-Origin'] = origin
    else:
        response['Access-Control-Allow-Origin'] = '*'  # Allow all for iframe testing
    response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
    response['Access-Control-Allow-Methods'] = 'GET'
    
    # Add watermark headers
    response['X-User-ID'] = str(user.id)
    response['X-User-Name'] = user.username or user.email
    response['X-Access-Time'] = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return response




@login_required
def lesson_view(request, lesson_id):
    lesson = get_object_or_404(Lesson, id=lesson_id)
    # TODO: check enrollment/permissions here

    pdf_signed = signed_url(lesson.pdf_path, expires_sec=60) if lesson.pdf_path else None
    wm_text = f"{request.user.username or request.user.email} • {timezone.now().strftime('%Y-%m-%d %H:%M')}"
    return render(request, "courses/lesson_view.html", {"lesson": lesson, "pdf_url": pdf_signed, "wm_text": wm_text})


# ================== VIDEO VIEWS ==================

@csrf_exempt
def proxy_video_view(request, video_id):
    """
    Secure video proxy similar to PDF proxy
    Serves videos with authentication and watermarking
    """
    print(f"🔍 proxy_video_view called with video_id={video_id}")
    print(f"🔍 Request method: {request.method}")
    print(f"🔍 Request path: {request.path}")
    
    if request.method != 'GET':
        print(f"❌ Invalid method: {request.method}")
        raise Http404("Method not allowed")
    
    # Get user from JWT token in header, query parameter, or cookies
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    token = None
    user = None
    
    print(f"🔍 Auth header: {auth_header}")
    print(f"🔍 Cookies: {request.COOKIES}")
    
    # Try to get token from Authorization header
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        print(f"🔍 Token from header: {token[:20]}...")
    
    # Try to get token from query parameter
    if not token:
        token = request.GET.get('token')
        if token:
            print(f"🔍 Token from query: {token[:20]}...")
    
    # Try to get token from cookies
    if not token:
        token = request.COOKIES.get('access_token') or request.COOKIES.get('accessToken')
        if token:
            print(f"🔍 Token from cookies: {token[:20]}...")
    
    if not token:
        print("❌ No token found in header, query, or cookies")
        return HttpResponse('Unauthorized', status=401)
    
    # Verify JWT token and get user
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        from django.contrib.auth.models import User
        
        access_token = AccessToken(token)
        user_id = access_token.payload['user_id']
        user = User.objects.get(id=user_id)
        print(f"✅ Authenticated user: {user.username or user.email}")
        
    except Exception as e:
        print(f"❌ Token verification failed: {str(e)}")
        return HttpResponse('Unauthorized', status=401)
    
    try:
        # Get the video object
        video = get_object_or_404(LessonVideo, id=video_id)
        
        # Check if user has access to this video's course
        from .enrollment import Enrollment
        has_access = Enrollment.objects.filter(
            user=user, 
            course=video.lesson.course
        ).exists()
        
        if not has_access and not user.is_staff:
            raise Http404("Video not found or access denied")
        
        # Check if video exists in Supabase or local storage
        if video.video_path:
            # Try Supabase first
            try:
                video_url = signed_url(video.video_path, expires_sec=300)  # 5 minutes
                if not video_url:
                    raise Exception("Failed to generate signed URL")
                
                def stream_video():
                    import requests
                    response = requests.get(video_url, stream=True)
                    response.raise_for_status()
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            yield chunk
                
                # Determine content type
                content_type = f"video/{video.video_format}" if video.video_format else "video/mp4"
                
                response = StreamingHttpResponse(
                    stream_video(),
                    content_type=content_type
                )
                
                # Handle range requests for video seeking
                range_header = request.META.get('HTTP_RANGE')
                if range_header:
                    response['Accept-Ranges'] = 'bytes'
                
            except Exception as e:
                print(f"❌ Supabase video access failed: {str(e)}")
                raise Http404("Video not accessible from Supabase")
        
        elif video.video_file:
            # Fallback to local file
            video_path = video.video_file.path
            if not os.path.exists(video_path):
                raise Http404("Video file not found")
            
            # Handle range requests for video seeking
            range_header = request.META.get('HTTP_RANGE')
            file_size = os.path.getsize(video_path)
            
            if range_header:
                # Parse range header
                range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
                if range_match:
                    start = int(range_match.group(1))
                    end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
                    
                    # Create file iterator that properly handles file opening/closing
                    def file_iterator():
                        with open(video_path, 'rb') as video_file:
                            video_file.seek(start)
                            remaining = end - start + 1
                            chunk_size = 8192
                            
                            while remaining > 0:
                                chunk = video_file.read(min(chunk_size, remaining))
                                if not chunk:
                                    break
                                remaining -= len(chunk)
                                yield chunk
                        
                    response = StreamingHttpResponse(
                        file_iterator(),
                        status=206,  # Partial Content
                        content_type=mimetypes.guess_type(video_path)[0] or 'video/mp4'
                    )
                    response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
                    response['Content-Length'] = str(end - start + 1)
                    response['Accept-Ranges'] = 'bytes'
                else:
                    # Invalid range header
                    response = HttpResponse(status=416)  # Range Not Satisfiable
            else:
                # No range header, serve entire file
                response = FileResponse(
                    open(video_path, 'rb'),
                    content_type=mimetypes.guess_type(video_path)[0] or 'video/mp4'
                )
                response['Content-Length'] = str(file_size)
                response['Accept-Ranges'] = 'bytes'
        else:
            raise Http404("No video file found")
        
    except LessonVideo.DoesNotExist:
        raise Http404("Video not found")
    except Exception as e:
        print(f"❌ Video proxy error: {str(e)}")
        raise Http404(f"Error serving video: {str(e)}")
    
    # Add security headers
    response['X-Content-Type-Options'] = 'nosniff'
    
    # Add CORS headers for frontend
    origin = request.META.get('HTTP_ORIGIN')
    allowed_origins = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:5173'
    ]
    if origin in allowed_origins:
        response['Access-Control-Allow-Origin'] = origin
    else:
        response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Range'
    response['Access-Control-Allow-Methods'] = 'GET'
    
    # Add user tracking headers
    response['X-User-ID'] = str(user.id)
    response['X-User-Name'] = user.username or user.email
    response['X-Access-Time'] = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_video_progress(request, video_id):
    """
    Update user's video watching progress
    Expected payload: {
        "current_time": 120,  // seconds
        "duration": 300,      // total duration in seconds
        "completed": false    // optional
    }
    """
    user = request.user
    
    try:
        video = get_object_or_404(LessonVideo, id=video_id)
        
        # Check access permissions
        from .enrollment import Enrollment
        has_access = Enrollment.objects.filter(
            user=user, 
            course=video.lesson.course
        ).exists()
        
        if not has_access and not user.is_staff:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get progress data
        current_time = request.data.get('current_time', 0)
        duration = request.data.get('duration', 0)
        force_completed = request.data.get('completed', False)
        
        # Calculate percentage watched
        watched_percentage = (current_time / duration * 100) if duration > 0 else 0
        
        # Determine if video is completed (90% threshold or force_completed)
        is_completed = force_completed or watched_percentage >= 90
        
        # Update or create progress record
        with transaction.atomic():
            progress, created = LessonProgress.objects.get_or_create(
                user=user,
                lesson_video=video,
                defaults={
                    'video_progress_seconds': int(current_time),
                    'video_watched_percentage': watched_percentage,
                    'is_completed': is_completed,
                    'completed_at': timezone.now() if is_completed else None
                }
            )
            
            if not created:
                # Update existing progress
                progress.video_progress_seconds = int(current_time)
                progress.video_watched_percentage = watched_percentage
                
                # Only mark as completed if not already completed
                if not progress.is_completed and is_completed:
                    progress.is_completed = True
                    progress.completed_at = timezone.now()
                
                progress.save()
        
        return Response({
            'success': True,
            'progress': {
                'current_time': progress.video_progress_seconds,
                'watched_percentage': progress.video_watched_percentage,
                'is_completed': progress.is_completed,
                'completed_at': progress.completed_at.isoformat() if progress.completed_at else None
            }
        })
        
    except LessonVideo.DoesNotExist:
        return Response({'error': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"❌ Error updating video progress: {str(e)}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_video_progress(request, video_id):
    """
    Get user's current progress for a video
    """
    user = request.user
    
    try:
        video = get_object_or_404(LessonVideo, id=video_id)
        
        # Check access permissions
        from .enrollment import Enrollment
        has_access = Enrollment.objects.filter(
            user=user, 
            course=video.lesson.course
        ).exists()
        
        if not has_access and not user.is_staff:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            progress = LessonProgress.objects.get(user=user, lesson_video=video)
            return Response({
                'current_time': progress.video_progress_seconds,
                'watched_percentage': progress.video_watched_percentage,
                'is_completed': progress.is_completed,
                'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
                'last_accessed': progress.last_accessed.isoformat() if progress.last_accessed else None
            })
        except LessonProgress.DoesNotExist:
            return Response({
                'current_time': 0,
                'watched_percentage': 0.0,
                'is_completed': False,
                'completed_at': None,
                'last_accessed': None
            })
            
    except LessonVideo.DoesNotExist:
        return Response({'error': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"❌ Error getting video progress: {str(e)}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
