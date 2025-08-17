"""
Authentication URL patterns for Spinny Car Marketplace
"""
from django.urls import path, include
from .views import (
    SendOTPView, VerifyOTPView, RefreshTokenView, LogoutView,
    UserProfileView, UpdateUserProfileView, SavedSearchListView,
    SavedSearchDetailView, AdminLoginView, UserListView, UserDetailView,
    check_auth_status, ChangePasswordView, DeleteAccountView, UploadAvatarView
)
from rest_framework.response import Response

# Authentication endpoints
urlpatterns = [
    # OTP Authentication
    path('send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh_token'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('status/', check_auth_status, name='auth_status'),
    
    # Admin Authentication
    path('admin/login/', AdminLoginView.as_view(), name='admin_login'),
    
    # Debug endpoint
    path('debug/test/', lambda request: Response({'status': 'ok', 'method': request.method}), name='debug_test'),
] 