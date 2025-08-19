"""
Admin panel URL patterns for Spinny Car Marketplace
"""
from django.urls import path
from .views import (
    AdminCarListView, AdminCarDetailView, ReviewCarView,
    BulkActionView, AdminDashboardView, AdminCarUpdateView, AdminDeleteCarView
)

# Admin panel endpoints
urlpatterns = [
    # Dashboard
    path('dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    
    # Car management
    path('cars/', AdminCarListView.as_view(), name='admin_cars'),
    path('cars/<uuid:id>/', AdminCarDetailView.as_view(), name='admin_car_detail'),
    path('cars/<uuid:id>/update/', AdminCarUpdateView.as_view(), name='admin_car_update'),
    path('cars/<uuid:id>/delete/', AdminDeleteCarView.as_view(), name='admin_car_delete'),
    path('cars/<uuid:car_id>/review/', ReviewCarView.as_view(), name='review_car'),
    path('cars/bulk-action/', BulkActionView.as_view(), name='bulk_action'),
] 