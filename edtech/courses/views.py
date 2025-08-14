from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.serializers import ModelSerializer, CharField, EmailField
from .profile import Profile
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes

from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from .models import Lesson
from .storage import signed_url
from django.http import HttpResponse



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
    role = CharField(read_only=True)
    createdAt = CharField(source='date_joined', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'firstName', 'lastName', 'role', 'createdAt')
    
    def get_role(self, obj):
        """Get user role from profile, default to 'student' if no profile exists"""
        try:
            return obj.profile.role
        except:
            return 'student'
    
    def to_representation(self, instance):
        """Override to handle profile.role safely"""
        data = super().to_representation(instance)
        data['role'] = self.get_role(instance)
        return data

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

def home(request):
    return HttpResponse("Hello from Courses App!")




@login_required
def lesson_view(request, lesson_id):
    lesson = get_object_or_404(Lesson, id=lesson_id)
    # TODO: check enrollment/permissions here

    pdf_signed = signed_url(lesson.pdf_path, expires_sec=60) if lesson.pdf_path else None
    wm_text = f"{request.user.username or request.user.email} • {timezone.now().strftime('%Y-%m-%d %H:%M')}"
    return render(request, "courses/lesson_view.html", {"lesson": lesson, "pdf_url": pdf_signed, "wm_text": wm_text})
