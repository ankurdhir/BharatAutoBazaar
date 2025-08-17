"""
User profile URL patterns for Spinny Car Marketplace
"""
from django.urls import path
from .views import (
    UserProfileView, UpdateUserProfileView, SavedSearchListView,
    SavedSearchDetailView, UserListView, UserDetailView,
    ChangePasswordView, DeleteAccountView, UploadAvatarView
)

# User profile endpoints
urlpatterns = [
    # Current user profile
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('me/update/', UpdateUserProfileView.as_view(), name='update_profile'),
    path('me/avatar/', UploadAvatarView.as_view(), name='upload_avatar'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('me/delete/', DeleteAccountView.as_view(), name='delete_account'),
    
    # Saved searches
    path('me/saved-searches/', SavedSearchListView.as_view(), name='saved_searches'),
    path('me/saved-searches/<uuid:pk>/', SavedSearchDetailView.as_view(), name='saved_search_detail'),
    
    # User management (admin only)
    path('', UserListView.as_view(), name='user_list'),
    path('<uuid:pk>/', UserDetailView.as_view(), name='user_detail'),
] 