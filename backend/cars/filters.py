"""
Car filters for Spinny Car Marketplace
"""
import django_filters
from django.db import models
from .models import Car, CarBrand, City


class CarFilter(django_filters.FilterSet):
    """
    Filter set for car listings
    """
    # Brand filter
    brand = django_filters.CharFilter(
        field_name='brand__name',
        lookup_expr='iexact',
        help_text='Filter by car brand (case insensitive)'
    )
    
    # Fuel type filter
    fuelType = django_filters.ChoiceFilter(
        field_name='fuel_type',
        choices=Car.FUEL_CHOICES,
        help_text='Filter by fuel type'
    )
    
    # Price range filters
    minPrice = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='gte',
        help_text='Minimum price filter'
    )
    maxPrice = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='lte',
        help_text='Maximum price filter'
    )
    
    # City filter
    city = django_filters.CharFilter(
        field_name='city__name',
        lookup_expr='iexact',
        help_text='Filter by city (case insensitive)'
    )
    
    # Year filter
    year = django_filters.NumberFilter(
        field_name='year',
        help_text='Filter by manufacturing year'
    )
    
    # Year range filters
    yearFrom = django_filters.NumberFilter(
        field_name='year',
        lookup_expr='gte',
        help_text='Minimum year filter'
    )
    yearTo = django_filters.NumberFilter(
        field_name='year',
        lookup_expr='lte',
        help_text='Maximum year filter'
    )
    
    # Transmission filter
    transmission = django_filters.ChoiceFilter(
        field_name='transmission',
        choices=Car.TRANSMISSION_CHOICES,
        help_text='Filter by transmission type'
    )
    
    # Model filter
    model = django_filters.CharFilter(
        field_name='car_model__name',
        lookup_expr='iexact',
        help_text='Filter by car model'
    )
    
    # Owner filter
    owner = django_filters.ChoiceFilter(
        field_name='owner_number',
        choices=Car.OWNER_CHOICES,
        help_text='Filter by number of owners'
    )
    
    # Mileage range filters
    minKm = django_filters.NumberFilter(
        field_name='km_driven',
        lookup_expr='gte',
        help_text='Minimum kilometers driven'
    )
    maxKm = django_filters.NumberFilter(
        field_name='km_driven',
        lookup_expr='lte',
        help_text='Maximum kilometers driven'
    )
    
    # Condition filters
    exteriorCondition = django_filters.ChoiceFilter(
        field_name='exterior_condition',
        choices=Car.CONDITION_CHOICES,
        help_text='Filter by exterior condition'
    )
    interiorCondition = django_filters.ChoiceFilter(
        field_name='interior_condition',
        choices=Car.CONDITION_CHOICES,
        help_text='Filter by interior condition'
    )
    engineCondition = django_filters.ChoiceFilter(
        field_name='engine_condition',
        choices=Car.CONDITION_CHOICES,
        help_text='Filter by engine condition'
    )
    
    # Insurance filter
    hasValidInsurance = django_filters.BooleanFilter(
        field_name='insurance_valid',
        help_text='Filter cars with valid insurance'
    )
    
    # Verified filter
    verified = django_filters.BooleanFilter(
        field_name='verified',
        help_text='Filter verified cars only'
    )
    
    # Featured filter
    featured = django_filters.BooleanFilter(
        field_name='featured',
        help_text='Filter featured cars only'
    )
    
    # Status filter (for admin use)
    status = django_filters.ChoiceFilter(
        field_name='status',
        choices=Car.STATUS_CHOICES,
        help_text='Filter by listing status'
    )
    
    # Custom filters for complex queries
    priceRange = django_filters.CharFilter(
        method='filter_price_range',
        help_text='Price range filter (e.g., "200000-500000")'
    )
    
    yearRange = django_filters.CharFilter(
        method='filter_year_range',
        help_text='Year range filter (e.g., "2018-2022")'
    )
    
    features = django_filters.CharFilter(
        method='filter_features',
        help_text='Filter by car features (comma-separated)'
    )
    
    location = django_filters.CharFilter(
        method='filter_location',
        help_text='Filter by location (city or area)'
    )
    
    # Sorting helper
    sortBy = django_filters.CharFilter(
        method='filter_sort_by',
        help_text='Sort by: price_asc, price_desc, year_desc, km_asc, created_desc'
    )
    
    class Meta:
        model = Car
        fields = [
            'brand', 'fuelType', 'minPrice', 'maxPrice', 'city', 'year',
            'transmission', 'model', 'owner', 'minKm', 'maxKm',
            'exteriorCondition', 'interiorCondition', 'engineCondition',
            'hasValidInsurance', 'verified', 'featured', 'status'
        ]
    
    def filter_price_range(self, queryset, name, value):
        """
        Filter by price range (e.g., "200000-500000")
        """
        if not value:
            return queryset
        
        try:
            min_price, max_price = value.split('-')
            return queryset.filter(
                price__gte=int(min_price),
                price__lte=int(max_price)
            )
        except (ValueError, AttributeError):
            return queryset
    
    def filter_year_range(self, queryset, name, value):
        """
        Filter by year range (e.g., "2018-2022")
        """
        if not value:
            return queryset
        
        try:
            min_year, max_year = value.split('-')
            return queryset.filter(
                year__gte=int(min_year),
                year__lte=int(max_year)
            )
        except (ValueError, AttributeError):
            return queryset
    
    def filter_features(self, queryset, name, value):
        """
        Filter by car features (comma-separated list)
        """
        if not value:
            return queryset
        
        features_list = [feature.strip() for feature in value.split(',')]
        
        # Filter cars that have all specified features
        for feature in features_list:
            queryset = queryset.filter(features__icontains=feature)
        
        return queryset
    
    def filter_location(self, queryset, name, value):
        """
        Filter by location (city or area)
        """
        if not value:
            return queryset
        
        return queryset.filter(
            models.Q(city__name__icontains=value) |
            models.Q(area__icontains=value)
        )
    
    def filter_sort_by(self, queryset, name, value):
        """
        Custom sorting logic
        """
        if not value:
            return queryset
        
        sort_mapping = {
            'price_asc': 'price',
            'price_desc': '-price',
            'year_desc': '-year',
            'year_asc': 'year',
            'km_asc': 'km_driven',
            'km_desc': '-km_driven',
            'created_desc': '-created_at',
            'created_asc': 'created_at',
            'popularity': '-views_count',
            'featured': '-featured'
        }
        
        sort_field = sort_mapping.get(value)
        if sort_field:
            return queryset.order_by(sort_field)
        
        return queryset


class SellerCarFilter(django_filters.FilterSet):
    """
    Filter set for seller's own cars
    """
    status = django_filters.ChoiceFilter(
        field_name='status',
        choices=Car.STATUS_CHOICES,
        help_text='Filter by listing status'
    )
    
    brand = django_filters.CharFilter(
        field_name='brand__name',
        lookup_expr='icontains',
        help_text='Filter by brand name'
    )
    
    dateFrom = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='Filter cars created from this date'
    )
    
    dateTo = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='Filter cars created until this date'
    )
    
    minPrice = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='gte'
    )
    
    maxPrice = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='lte'
    )
    
    class Meta:
        model = Car
        fields = ['status', 'brand', 'dateFrom', 'dateTo', 'minPrice', 'maxPrice']


class AdminCarFilter(django_filters.FilterSet):
    """
    Filter set for admin car management
    """
    status = django_filters.ChoiceFilter(
        field_name='status',
        choices=Car.STATUS_CHOICES
    )
    
    seller = django_filters.CharFilter(
        field_name='seller__phone_number',
        lookup_expr='icontains',
        help_text='Filter by seller phone number'
    )
    
    sellerName = django_filters.CharFilter(
        field_name='seller_name',
        lookup_expr='icontains',
        help_text='Filter by seller name'
    )
    
    brand = django_filters.CharFilter(
        field_name='brand__name',
        lookup_expr='icontains'
    )
    
    city = django_filters.CharFilter(
        field_name='city__name',
        lookup_expr='icontains'
    )
    
    verified = django_filters.BooleanFilter(
        field_name='verified'
    )
    
    featured = django_filters.BooleanFilter(
        field_name='featured'
    )
    
    submittedFrom = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    
    submittedTo = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    
    qualityScore = django_filters.NumberFilter(
        field_name='quality_score',
        lookup_expr='gte'
    )
    
    flagged = django_filters.BooleanFilter(
        method='filter_flagged',
        help_text='Filter flagged cars'
    )
    
    class Meta:
        model = Car
        fields = [
            'status', 'seller', 'sellerName', 'brand', 'city',
            'verified', 'featured', 'submittedFrom', 'submittedTo',
            'qualityScore'
        ]
    
    def filter_flagged(self, queryset, name, value):
        """
        Filter cars that have been flagged for review
        """
        if value:
            # TODO: Implement flagging system
            # For now, return cars with low quality scores
            return queryset.filter(quality_score__lt=50)
        return queryset 