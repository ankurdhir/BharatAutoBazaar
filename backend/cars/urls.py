"""
Car URL patterns for Spinny Car Marketplace
"""
from django.urls import path
from .views import (
    CarListView, CarDetailView, CarSearchView, ContactSellerView,
    CarDataView, CitiesView, SellerListingsView, SellerStatsView, 
    CreateCarView, UpdateCarView, DeleteCarView
)

# Public car endpoints
urlpatterns = [
    # Car listing endpoints
    path('', CarListView.as_view(), name='car_list'),
    path('<uuid:id>/', CarDetailView.as_view(), name='car_detail'),
    path('search/', CarSearchView.as_view(), name='car_search'),
    path('<uuid:car_id>/contact/', ContactSellerView.as_view(), name='contact_seller'),
    
    # Car data endpoints
    path('brands/', CarDataView.as_view(), name='car_brands'),
    path('cities/', CitiesView.as_view(), name='car_cities'),
    path('data/', CarDataView.as_view(), name='car_data'),
    
    # Seller endpoints (matching frontend expectations)
    path('seller/listings/', SellerListingsView.as_view(), name='seller_listings'),
    path('seller/stats/', SellerStatsView.as_view(), name='seller_stats'),
    path('seller/create/', CreateCarView.as_view(), name='seller_create_car'),
    path('seller/<uuid:id>/', UpdateCarView.as_view(), name='seller_update_car'),
    path('seller/<uuid:id>/delete/', DeleteCarView.as_view(), name='seller_delete_car'),
] 