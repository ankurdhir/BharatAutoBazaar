"""
Analytics URL patterns for Spinny Car Marketplace
"""
from django.urls import path
from .views import (
    CarAnalyticsView, SellerAnalyticsView, SystemAnalyticsView
)

# Analytics endpoints
urlpatterns = [
    # Car analytics
    path('cars/<uuid:car_id>/', CarAnalyticsView.as_view(), name='car_analytics'),
    
    # Seller analytics
    path('sellers/me/', SellerAnalyticsView.as_view(), name='seller_analytics'),
    
    # System analytics (admin only)
    path('system/', SystemAnalyticsView.as_view(), name='system_analytics'),
] 