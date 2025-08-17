"""
File upload URL patterns for Spinny Car Marketplace
"""
from django.urls import path
from .views import (
    UploadCarImagesView, UploadCarVideoView, DeleteFileView
)

# File upload endpoints
urlpatterns = [
    # File upload endpoints
    path('car-images/', UploadCarImagesView.as_view(), name='upload_car_images'),
    path('car-video/', UploadCarVideoView.as_view(), name='upload_car_video'),
    path('files/<uuid:file_id>/', DeleteFileView.as_view(), name='delete_file'),
] 