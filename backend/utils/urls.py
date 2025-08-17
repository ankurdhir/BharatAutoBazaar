"""
Utility URL patterns for Spinny Car Marketplace
"""
from django.urls import path
from .views import (
    EMICalculatorView, CitiesView, CarDataView, CarFeaturesView,
    ConfigurationView, health_check
)

# Utility endpoints
urlpatterns = [
    # EMI Calculator
    path('calculate-emi/', EMICalculatorView.as_view(), name='calculate_emi'),
    
    # Data endpoints
    path('cities/', CitiesView.as_view(), name='cities'),
    path('car-data/', CarDataView.as_view(), name='car_data'),
    path('car-features/', CarFeaturesView.as_view(), name='car_features'),
    
    # System
    path('config/', ConfigurationView.as_view(), name='configuration'),
    path('health/', health_check, name='health_check'),
] 