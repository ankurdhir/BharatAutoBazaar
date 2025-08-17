"""
URL configuration for spinny_api project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API v1 endpoints
    path('api/v1/auth/', include('authentication.urls')),
    path('api/v1/cars/', include('cars.urls')),
    path('api/v1/admin/', include('admin_panel.urls')),
    path('api/v1/sellers/', include('cars.seller_urls')),
    path('api/v1/upload/', include('cars.upload_urls')),
    path('api/v1/users/', include('authentication.user_urls')),
    path('api/v1/inquiries/', include('communication.urls')),
    path('api/v1/utils/', include('utils.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom admin site configuration
admin.site.site_header = "Spinny Car Marketplace Admin"
admin.site.site_title = "Spinny Admin Portal"
admin.site.index_title = "Welcome to Spinny Car Marketplace Administration" 