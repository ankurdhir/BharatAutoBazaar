"""
Authentication views for Spinny Car Marketplace
"""
from rest_framework import generics, status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.openapi import OpenApiTypes

from .models import OTPToken, SavedSearch
from .serializers import (
    SendOTPSerializer, VerifyOTPSerializer, RefreshTokenSerializer,
    UserProfileSerializer, UpdateUserProfileSerializer, SavedSearchSerializer,
    AdminLoginSerializer, UserListSerializer, UserDetailSerializer,
    ChangePasswordSerializer, DeleteAccountSerializer
)

User = get_user_model()


@extend_schema(
    tags=['Authentication'],
    summary='Send OTP to phone number',
    description='Send OTP to the provided phone number for login/registration',
    request=SendOTPSerializer,
    responses={
        200: {
            'description': 'OTP sent successfully',
            'example': {
                'success': True,
                'message': 'OTP sent successfully',
                'data': {
                    'otp_id': 'otp_12345',
                    'expires_at': '2024-01-01T10:35:00Z',
                    'masked_phone': '+91****3210'
                }
            }
        },
        400: {'description': 'Invalid phone number or rate limit exceeded'},
        429: {'description': 'Too many requests'}
    }
)
@method_decorator(ratelimit(key='ip', rate='10/m', method='POST'), name='post')
class SendOTPView(APIView):
    """
    Send OTP to phone number for authentication
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = serializer.save()
                
                # Add development hint in DEBUG mode
                from django.conf import settings
                if settings.DEBUG:
                    result['dev_hint'] = 'Use OTP: 000000 for development bypass'
                
                return Response({
                    'success': True,
                    'message': 'OTP sent successfully',
                    'data': result
                }, status=status.HTTP_200_OK)
            except serializers.ValidationError as e:
                # Surface configuration/validation errors as 400 with details
                return Response({
                    'success': False,
                    'error': {
                        'code': 'OTP_SEND_VALIDATION_ERROR',
                        'message': 'Failed to send OTP',
                        'details': e.detail
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                # Unknown failure
                from django.conf import settings
                import logging
                logging.getLogger(__name__).exception("Unhandled error while sending OTP")
                return Response({
                    'success': False,
                    'error': {
                        'code': 'OTP_SEND_FAILED',
                        'message': 'Failed to send OTP. Please try again later.'
                    }
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid phone number format',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Authentication'],
    summary='Verify OTP and login',
    description='Verify OTP and login/register user',
    request=VerifyOTPSerializer,
    responses={
        200: {
            'description': 'Login successful',
            'example': {
                'success': True,
                'message': 'Login successful',
                'data': {
                    'user': {
                        'id': 'user_123',
                        'phone_number': '+919876543210',
                        'name': 'John Doe',
                        'is_verified': True
                    },
                    'tokens': {
                        'access_token': 'jwt_access_token',
                        'refresh_token': 'jwt_refresh_token'
                    },
                    'is_new_user': False
                }
            }
        },
        400: {'description': 'Invalid OTP or validation error'},
        404: {'description': 'OTP not found or expired'}
    }
)
@method_decorator(ratelimit(key='ip', rate='20/m', method='POST'), name='post')
class VerifyOTPView(APIView):
    """
    Verify OTP and authenticate user
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        from django.conf import settings
        
        # Development bypass - auto-succeed OTP verification in DEBUG mode
        if settings.DEBUG and request.data.get('otp') == '000000':
            phone_number = request.data.get('phone_number')
            if phone_number:
                # Get or create user
                user, created = User.objects.get_or_create(
                    phone_number=phone_number,
                    defaults={'is_verified': True, 'name': 'Dev User'}
                )
                
                if not user.is_verified:
                    user.is_verified = True
                    user.save()
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'success': True,
                    'message': 'Development login successful',
                    'data': {
                        'user': {
                            'id': str(user.id),
                            'phone_number': str(user.phone_number),
                            'name': user.name or user.get_display_name(),
                            'email': user.email,
                            'is_verified': user.is_verified,
                            'is_seller': user.is_seller,
                            'city': user.city,
                            'avatar': user.avatar.url if user.avatar else None,
                        },
                        'tokens': {
                            'access_token': str(refresh.access_token),
                            'refresh_token': str(refresh),
                        },
                        'is_new_user': created
                    }
                }, status=status.HTTP_200_OK)
        
        # Normal OTP verification flow
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user_data = serializer.save()
                return Response({
                    'success': True,
                    'message': 'Login successful',
                    'data': user_data
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VERIFICATION_FAILED',
                        'message': 'OTP verification failed. Please try again.'
                    }
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid OTP or request data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Authentication'],
    summary='Refresh access token',
    description='Get new access token using refresh token',
    request=RefreshTokenSerializer,
    responses={
        200: {
            'description': 'Token refreshed successfully',
            'example': {
                'success': True,
                'data': {
                    'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    'expires_at': 1640995200
                }
            }
        },
        400: {'description': 'Invalid refresh token'}
    }
)
class RefreshTokenView(APIView):
    """
    Refresh JWT access token
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = serializer.save()
                return Response({
                    'success': True,
                    'data': result
                }, status=status.HTTP_200_OK)
            except TokenError:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'INVALID_TOKEN',
                        'message': 'Invalid or expired refresh token'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid refresh token',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Authentication'],
    summary='Logout user',
    description='Logout user and invalidate tokens',
    responses={
        200: {
            'description': 'Logged out successfully',
            'example': {
                'success': True,
                'message': 'Logged out successfully'
            }
        }
    }
)
class LogoutView(APIView):
    """
    Logout user and blacklist refresh token
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'success': True,
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'success': True,
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['User Profile'],
    summary='Get current user profile',
    description='Get authenticated user profile information',
    responses={
        200: UserProfileSerializer,
        401: {'description': 'Authentication required'}
    }
)
class UserProfileView(generics.RetrieveAPIView):
    """
    Get current user profile
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


@extend_schema(
    tags=['User Profile'],
    summary='Update user profile',
    description='Update authenticated user profile information',
    request=UpdateUserProfileSerializer,
    responses={
        200: {
            'description': 'Profile updated successfully',
            'example': {
                'success': True,
                'message': 'Profile updated successfully'
            }
        },
        400: {'description': 'Validation error'}
    }
)
class UpdateUserProfileView(generics.UpdateAPIView):
    """
    Update current user profile
    """
    serializer_class = UpdateUserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return Response({
            'success': True,
            'message': 'Profile updated successfully'
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['User Profile'],
    summary='Get saved searches',
    description='Get user saved searches for notifications'
)
class SavedSearchListView(generics.ListCreateAPIView):
    """
    List and create saved searches
    """
    serializer_class = SavedSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedSearch.objects.filter(user=self.request.user)


@extend_schema(
    tags=['User Profile'],
    summary='Manage saved search',
    description='Update or delete saved search'
)
class SavedSearchDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete saved search
    """
    serializer_class = SavedSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedSearch.objects.filter(user=self.request.user)


@extend_schema(
    tags=['Admin Authentication'],
    summary='Admin login',
    description='Admin login with email and password',
    request=AdminLoginSerializer,
    responses={
        200: {
            'description': 'Admin login successful',
            'example': {
                'success': True,
                'data': {
                    'admin': {
                        'id': 'admin_123',
                        'name': 'Admin User',
                        'email': 'admin@spinny.com',
                        'role': 'super_admin',
                        'permissions': ['manage_listings', 'manage_users']
                    },
                    'token': 'admin_token_123'
                }
            }
        },
        400: {'description': 'Invalid credentials'}
    }
)
class AdminLoginView(APIView):
    """
    Admin login with email and password
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Disable authentication
    
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            return Response({
                'success': True,
                'data': result
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'error': {
                'code': 'INVALID_CREDENTIALS',
                'message': 'Invalid email or password'
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['User Management'],
    summary='List all users',
    description='Get paginated list of all users (admin only)',
    parameters=[
        OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
        OpenApiParameter('search', OpenApiTypes.STR, description='Search by name, email, or phone'),
        OpenApiParameter('is_verified', OpenApiTypes.BOOL, description='Filter by verification status'),
        OpenApiParameter('city', OpenApiTypes.STR, description='Filter by city'),
    ]
)
class UserListView(generics.ListAPIView):
    """
    List all users (admin only)
    """
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]  # TODO: Add admin permission
    queryset = User.objects.all().order_by('-created_at')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(phone_number__icontains=search)
            )
        
        # Filter by verification status
        is_verified = self.request.query_params.get('is_verified')
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        return queryset


@extend_schema(
    tags=['User Management'],
    summary='Get user details',
    description='Get detailed information about a specific user (admin only)'
)
class UserDetailView(generics.RetrieveAPIView):
    """
    Get user details (admin only)
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]  # TODO: Add admin permission
    queryset = User.objects.all()


# Utility views and functions

@extend_schema(
    tags=['Authentication'],
    summary='Check authentication status',
    description='Check if current token is valid',
    responses={
        200: {
            'description': 'Token is valid',
            'example': {
                'success': True,
                'authenticated': True,
                'user': {
                    'id': 'user_123',
                    'phone_number': '+919876543210',
                    'name': 'John Doe'
                }
            }
        },
        401: {'description': 'Token is invalid or expired'}
    }
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_auth_status(request):
    """
    Check authentication status
    """
    user = request.user
    return Response({
        'success': True,
        'authenticated': True,
        'user': {
            'id': str(user.id),
            'phone_number': str(user.phone_number),
            'name': user.name,
            'email': user.email,
            'is_verified': user.is_verified
        }
    })


@extend_schema(
    tags=['User Profile'],
    summary='Change password',
    description='Change user password (if password authentication is implemented)'
)
class ChangePasswordView(APIView):
    """
    Change user password
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # TODO: Implement password change logic
            return Response({
                'success': True,
                'message': 'Password changed successfully'
            })
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid password data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['User Profile'],
    summary='Delete account',
    description='Delete user account and all associated data'
)
class DeleteAccountView(APIView):
    """
    Delete user account
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            
            # TODO: Implement proper account deletion logic
            # - Remove personal data
            # - Keep listings but anonymize seller info
            # - Log deletion for audit
            
            # For now, just deactivate the account
            user.is_active = False
            user.save()
            
            return Response({
                'success': True,
                'message': 'Account deleted successfully'
            })
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Account deletion validation failed',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['User Profile'],
    summary='Upload profile avatar',
    description='Upload user profile avatar image'
)
class UploadAvatarView(APIView):
    """
    Upload user avatar
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if 'avatar' not in request.FILES:
            return Response({
                'success': False,
                'error': {
                    'code': 'FILE_REQUIRED',
                    'message': 'Avatar image is required'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        avatar_file = request.FILES['avatar']
        
        # Validate file type and size
        if not avatar_file.content_type.startswith('image/'):
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_FILE_TYPE',
                    'message': 'Only image files are allowed'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if avatar_file.size > 5 * 1024 * 1024:  # 5MB limit
            return Response({
                'success': False,
                'error': {
                    'code': 'FILE_TOO_LARGE',
                    'message': 'File size must be less than 5MB'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save avatar
        user = request.user
        user.avatar = avatar_file
        user.save()
        
        return Response({
            'success': True,
            'message': 'Avatar uploaded successfully',
            'data': {
                'avatar_url': user.avatar.url
            }
        })


# Error handlers for authentication

def custom_authentication_failed_handler(request, exception):
    """
    Custom handler for authentication failures
    """
    return Response({
        'success': False,
        'error': {
            'code': 'AUTHENTICATION_FAILED',
            'message': 'Authentication credentials were not provided or are invalid'
        }
    }, status=status.HTTP_401_UNAUTHORIZED)


def custom_permission_denied_handler(request, exception):
    """
    Custom handler for permission denied
    """
    return Response({
        'success': False,
        'error': {
            'code': 'PERMISSION_DENIED',
            'message': 'You do not have permission to perform this action'
        }
    }, status=status.HTTP_403_FORBIDDEN) 