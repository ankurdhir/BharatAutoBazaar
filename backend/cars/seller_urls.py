"""
Seller car management URL patterns for Spinny Car Marketplace
"""
from django.urls import path
from .views import (
    CreateCarView, UpdateCarView, DeleteCarView, SellerListingsView,
    SellerStatsView
)

# Seller car management endpoints
urlpatterns = [
    # Seller's own cars
    path('me/cars/', SellerListingsView.as_view(), name='seller_cars'),
    path('me/cars/create/', CreateCarView.as_view(), name='create_car'),
    path('me/cars/<uuid:id>/', UpdateCarView.as_view(), name='update_car'),
    path('me/cars/<uuid:id>/delete/', DeleteCarView.as_view(), name='delete_car'),
    path('me/stats/', SellerStatsView.as_view(), name='seller_stats'),
] 