"""
Car views for Spinny Car Marketplace
"""
from rest_framework import generics, status, permissions, filters
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Avg
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.openapi import OpenApiTypes
import time

from .models import Car, CarBrand, CarModel, City, CarView, CarFavorite, CarImage
from authentication.admin_auth import AdminTokenAuthentication
from .serializers import (
    CarListSerializer, CarDetailSerializer, CarSearchSerializer,
    CreateCarSerializer, UpdateCarSerializer, SellerListingSerializer,
    CarFavoriteSerializer, ContactSellerSerializer, CarBrandSerializer,
    CarModelSerializer, CitySerializer
)
from .filters import CarFilter, SellerCarFilter

# Import for pagination
from rest_framework.pagination import PageNumberPagination


class CarPagination(PageNumberPagination):
    """
    Custom pagination for cars
    """
    page_size = 12
    page_size_query_param = 'limit'
    max_page_size = 50


@extend_schema(
    tags=['Cars'],
    summary='Get all cars with filtering and sorting',
    description='Get paginated list of all cars with filtering and sorting options',
    parameters=[
        OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
        OpenApiParameter('limit', OpenApiTypes.INT, description='Items per page (max 50)'),
        OpenApiParameter('brand', OpenApiTypes.STR, description='Filter by brand'),
        OpenApiParameter('fuelType', OpenApiTypes.STR, description='Filter by fuel type'),
        OpenApiParameter('minPrice', OpenApiTypes.INT, description='Minimum price'),
        OpenApiParameter('maxPrice', OpenApiTypes.INT, description='Maximum price'),
        OpenApiParameter('city', OpenApiTypes.STR, description='Filter by city'),
        OpenApiParameter('year', OpenApiTypes.INT, description='Filter by year'),
        OpenApiParameter('transmission', OpenApiTypes.STR, description='Filter by transmission'),
        OpenApiParameter('sortBy', OpenApiTypes.STR, description='Sort by: price_asc, price_desc, year_desc, km_asc'),
        OpenApiParameter('search', OpenApiTypes.STR, description='Search query'),
    ],
    responses={
        200: {
            'description': 'Success',
            'example': {
                'success': True,
                'data': {
                    'cars': [],
                    'pagination': {
                        'page': 1,
                        'limit': 12,
                        'total': 150,
                        'totalPages': 13,
                        'hasNext': True,
                        'hasPrev': False
                    },
                    'filters': {
                        'availableBrands': ['Maruti Suzuki', 'Hyundai'],
                        'availableCities': ['Delhi', 'Mumbai'],
                        'priceRange': {'min': 200000, 'max': 2000000},
                        'yearRange': {'min': 2015, 'max': 2024}
                    }
                }
            }
        }
    }
)
class CarListView(generics.ListAPIView):
    """
    Get all cars with filtering and sorting
    """
    serializer_class = CarListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = CarPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CarFilter
    search_fields = ['title', 'brand__name', 'car_model__name', 'city__name']
    ordering_fields = ['price', 'year', 'km_driven', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Car.objects.filter(
            status='approved',
            verified=True
        ).select_related(
            'brand', 'car_model', 'variant', 'city', 'seller'
        ).prefetch_related('images')
        
        # Custom sorting
        sort_by = self.request.query_params.get('sortBy')
        if sort_by == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort_by == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort_by == 'year_desc':
            queryset = queryset.order_by('-year')
        elif sort_by == 'km_asc':
            queryset = queryset.order_by('km_driven')
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Custom list response following API doc format"""
        start_time = time.time()
        
        # Get filtered queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        # Paginate
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)
            
            # Get filter options
            filters_data = self._get_filter_options()
            
            # Custom response format
            return Response({
                'success': True,
                'data': {
                    'cars': serializer.data,
                    'pagination': {
                        'page': paginated_response.data.get('page', 1),
                        'limit': self.pagination_class.page_size,
                        'total': paginated_response.data.get('count', 0),
                        'totalPages': paginated_response.data.get('total_pages', 1),
                        'hasNext': paginated_response.data.get('next') is not None,
                        'hasPrev': paginated_response.data.get('previous') is not None
                    },
                    'filters': filters_data,
                    'executionTime': f"{(time.time() - start_time) * 1000:.0f}ms"
                }
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'cars': serializer.data,
                'filters': self._get_filter_options()
            }
        })
    
    def _get_filter_options(self):
        """Get available filter options"""
        base_queryset = Car.objects.filter(status='approved', verified=True)
        
        return {
            'availableBrands': list(
                base_queryset.values_list('brand__name', flat=True).distinct()
            ),
            'availableCities': list(
                base_queryset.values_list('city__name', flat=True).distinct()
            ),
            'priceRange': {
                'min': base_queryset.aggregate(min_price=models.Min('price'))['min_price'] or 0,
                'max': base_queryset.aggregate(max_price=models.Max('price'))['max_price'] or 0
            },
            'yearRange': {
                'min': base_queryset.aggregate(min_year=models.Min('year'))['min_year'] or 2015,
                'max': base_queryset.aggregate(max_year=models.Max('year'))['max_year'] or timezone.now().year
            }
        }


@extend_schema(
    tags=['Cars'],
    summary='Get car details by ID',
    description='Get detailed information about a specific car',
    responses={
        200: CarDetailSerializer,
        404: {'description': 'Car not found'}
    }
)
class CarDetailView(generics.RetrieveAPIView):
    """
    Get detailed information about a specific car
    """
    serializer_class = CarDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Car.objects.filter(
            status='approved'
        ).select_related(
            'brand', 'car_model', 'variant', 'city', 'seller'
        ).prefetch_related('images', 'videos')
    
    def retrieve(self, request, *args, **kwargs):
        """Custom retrieve response with view tracking"""
        try:
            instance = self.get_object()
            
            # Track car view
            self._track_car_view(instance, request)
            
            serializer = self.get_serializer(instance)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Car.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Car not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)
    
    def _track_car_view(self, car, request):
        """Track car view for analytics"""
        user = request.user if request.user.is_authenticated else None
        ip_address = self._get_client_ip(request)
        
        try:
            # Create or update view record
            view_obj, created = CarView.objects.get_or_create(
                car=car,
                user=user,
                ip_address=ip_address,
                defaults={
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'referrer': request.META.get('HTTP_REFERER', ''),
                    'device_type': self._get_device_type(request)
                }
            )
            
            if created:
                # Increment view count
                Car.objects.filter(id=car.id).update(
                    views_count=models.F('views_count') + 1
                )
        except CarView.MultipleObjectsReturned:
            # Handle duplicate records - just check if we should increment view count
            # This happens when there are duplicate CarView records in the database
            try:
                # Check if we've already counted a view for this car from this user/IP recently
                recent_view = CarView.objects.filter(
                    car=car,
                    user=user,
                    ip_address=ip_address,
                    viewed_at__gte=timezone.now() - timedelta(hours=1)  # Within last hour
                ).first()
                
                if not recent_view:
                    # Create a new view record and increment count
                    CarView.objects.create(
                        car=car,
                        user=user,
                        ip_address=ip_address,
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        referrer=request.META.get('HTTP_REFERER', ''),
                        device_type=self._get_device_type(request)
                    )
                    Car.objects.filter(id=car.id).update(
                        views_count=models.F('views_count') + 1
                    )
            except Exception:
                # If anything goes wrong with view tracking, just continue
                # Don't let analytics break the car detail page
                pass
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _get_device_type(self, request):
        """Determine device type from user agent"""
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        if 'mobile' in user_agent:
            return 'mobile'
        elif 'tablet' in user_agent:
            return 'tablet'
        return 'desktop'


@extend_schema(
    tags=['Cars'],
    summary='Search cars with advanced filters',
    description='Advanced search with autocomplete suggestions',
    parameters=[
        OpenApiParameter('q', OpenApiTypes.STR, description='Search query'),
        OpenApiParameter('filters[brand]', OpenApiTypes.STR, description='Filter by brand'),
        OpenApiParameter('filters[city]', OpenApiTypes.STR, description='Filter by city'),
        OpenApiParameter('suggestions', OpenApiTypes.BOOL, description='Include suggestions'),
    ],
    responses={
        200: {
            'description': 'Search results',
            'example': {
                'success': True,
                'data': {
                    'results': [],
                    'suggestions': ['Swift VXI', 'Swift VDI'],
                    'searchMeta': {
                        'query': 'Swift VXI Delhi',
                        'resultsCount': 12,
                        'executionTime': '45ms'
                    }
                }
            }
        }
    }
)
class CarSearchView(APIView):
    """
    Advanced car search with suggestions
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        start_time = time.time()
        
        query = request.query_params.get('q', '')
        include_suggestions = request.query_params.get('suggestions', 'false').lower() == 'true'
        
        # Base queryset
        queryset = Car.objects.filter(
            status='approved',
            verified=True
        ).select_related('brand', 'car_model', 'city', 'seller')
        
        # Apply search filters
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(brand__name__icontains=query) |
                Q(car_model__name__icontains=query) |
                Q(city__name__icontains=query) |
                Q(description__icontains=query)
            )
        
        # Apply additional filters
        brand_filter = request.query_params.get('filters[brand]')
        if brand_filter:
            queryset = queryset.filter(brand__name__iexact=brand_filter)
        
        city_filter = request.query_params.get('filters[city]')
        if city_filter:
            queryset = queryset.filter(city__name__iexact=city_filter)
        
        # Limit results
        queryset = queryset[:20]
        
        # Serialize results
        serializer = CarListSerializer(queryset, many=True)
        
        # Generate suggestions
        suggestions = []
        if include_suggestions and query:
            suggestions = self._get_search_suggestions(query)
        
        execution_time = (time.time() - start_time) * 1000
        
        return Response({
            'success': True,
            'data': {
                'results': serializer.data,
                'suggestions': suggestions,
                'searchMeta': {
                    'query': query,
                    'resultsCount': len(serializer.data),
                    'executionTime': f"{execution_time:.0f}ms"
                }
            }
        })
    
    def _get_search_suggestions(self, query):
        """Generate search suggestions"""
        suggestions = []
        
        # Model suggestions
        models = CarModel.objects.filter(
            name__icontains=query
        ).values_list('name', flat=True)[:3]
        suggestions.extend([f"{model}" for model in models])
        
        # Brand + Model combinations
        brand_models = Car.objects.filter(
            Q(brand__name__icontains=query) |
            Q(car_model__name__icontains=query)
        ).values_list('brand__name', 'car_model__name').distinct()[:3]
        
        for brand, model in brand_models:
            suggestion = f"{brand} {model}"
            if suggestion not in suggestions:
                suggestions.append(suggestion)
        
        return suggestions[:5]


@extend_schema(
    tags=['Cars'],
    summary='Create new car listing',
    description='Create a new car listing for selling',
    request=CreateCarSerializer,
    responses={
        201: {
            'description': 'Listing created successfully',
            'example': {
                'success': True,
                'message': 'Listing created successfully',
                'data': {
                    'id': 'car_123',
                    'status': 'pending_verification',
                    'estimatedApprovalTime': '24-48 hours',
                    'listingUrl': '/listing/car_123'
                }
            }
        },
        400: {'description': 'Validation error'},
        401: {'description': 'Authentication required'}
    }
)
class CreateCarView(generics.CreateAPIView):
    """
    Create new car listing
    """
    serializer_class = CreateCarSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Custom create response following API doc format"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            car = serializer.save()

            # Notify admin by email (no images)
            try:
                subject = f"New Listing Submitted: {car.year} {car.brand.name} {car.car_model.name}"
                lines = [
                    "A new car listing has been submitted and is pending review.",
                    "",
                    f"Title: {car.title}",
                    f"Brand / Model / Variant: {car.brand.name} / {car.car_model.name} / {(car.variant.name if car.variant else '-')}",
                    f"Year: {car.year}",
                    f"Fuel / Transmission: {car.fuel_type} / {car.transmission}",
                    f"KM Driven: {car.km_driven}",
                    f"Price: ₹{car.price}",
                    "",
                    "Location:",
                    f"City: {car.city.name if getattr(car, 'city', None) else ''}",
                    f"Area: {car.area}",
                    f"Address: {car.address}",
                    "",
                    "Seller:",
                    f"Name: {car.seller_name}",
                    f"Phone: {car.seller_phone}",
                    f"Email: {car.seller_email or ''}",
                    "",
                    "Description:",
                    (car.description or ''),
                    "",
                    f"Listing ID: {car.id}",
                    "",
                    "Review and approve in the Admin Dashboard:",
                    "https://www.bharatauttobazaar.com/admin/login",
                ]
                message = "\n".join(lines)
                from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'admin@bharatauttobazaar.com')
                send_mail(
                    subject,
                    message,
                    from_email,
                    ['admin@bharatauttobazaar.com'],
                    fail_silently=True,
                )
            except Exception:
                # Do not block listing creation if email fails
                pass
            return Response({
                'success': True,
                'message': 'Listing created successfully',
                'data': serializer.to_representation(car)
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid listing data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Cars'],
    summary='Update car listing',
    description='Update existing car listing',
    request=UpdateCarSerializer,
    responses={
        200: {
            'description': 'Listing updated successfully',
            'example': {
                'success': True,
                'message': 'Listing updated successfully',
                'data': {
                    'id': 'car_123',
                    'status': 'pending_verification',
                    'updatedAt': '2024-01-01T11:00:00Z'
                }
            }
        },
        404: {'description': 'Car not found'},
        403: {'description': 'Not owner of the car'}
    }
)
class UpdateCarView(generics.UpdateAPIView):
    """
    Update car listing
    """
    serializer_class = UpdateCarSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        # Only allow users to update their own cars
        return Car.objects.filter(seller=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Custom update response following API doc format"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            
            if serializer.is_valid():
                car = serializer.save()
                return Response({
                    'success': True,
                    'message': 'Listing updated successfully',
                    'data': serializer.to_representation(car)
                })
            
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid update data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Car.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Car not found or you do not have permission to edit it'
                }
            }, status=status.HTTP_404_NOT_FOUND)


@extend_schema(
    tags=['Cars'],
    summary='Delete car listing',
    description='Delete a car listing',
    responses={
        200: {
            'description': 'Listing deleted successfully',
            'example': {
                'success': True,
                'message': 'Listing deleted successfully'
            }
        },
        404: {'description': 'Car not found'},
        403: {'description': 'Not owner of the car'}
    }
)
class DeleteCarView(generics.DestroyAPIView):
    """
    Delete car listing
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Car.objects.filter(seller=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Custom delete response following API doc format"""
        try:
            instance = self.get_object()
            instance.delete()
            return Response({
                'success': True,
                'message': 'Listing deleted successfully'
            })
        except Car.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Car not found or you do not have permission to delete it'
                }
            }, status=status.HTTP_404_NOT_FOUND)


@extend_schema(
    tags=['Cars'],
    summary='Contact car seller',
    description='Send message to car seller',
    request=ContactSellerSerializer,
    responses={
        200: {
            'description': 'Message sent successfully',
            'example': {
                'success': True,
                'message': 'Message sent successfully',
                'data': {
                    'inquiryId': 'inq_123',
                    'estimatedResponse': 'Within 2 hours'
                }
            }
        },
        404: {'description': 'Car not found'}
    }
)
class ContactSellerView(APIView):
    """
    Contact car seller
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, car_id):
        """Send message to seller"""
        try:
            car = get_object_or_404(Car, id=car_id, status='approved')
            
            serializer = ContactSellerSerializer(
                data=request.data,
                context={'car': car, 'request': request}
            )
            
            if serializer.is_valid():
                result = serializer.save()
                
                # Increment inquiries count
                Car.objects.filter(id=car.id).update(
                    inquiries_count=models.F('inquiries_count') + 1
                )
                
                return Response({
                    'success': True,
                    'message': 'Message sent successfully',
                    'data': result
                })
            
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid contact data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Car.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Car not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)


# Additional utility views

@extend_schema(
    tags=['Utils'],
    summary='Get car brands and models',
    description='Get list of car brands with their models',
    parameters=[
        OpenApiParameter('brand', OpenApiTypes.STR, description='Filter by specific brand'),
    ]
)
class CarDataView(APIView):
    """
    Get car brands and models data
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        brand_filter = request.query_params.get('brand')
        
        if brand_filter:
            brands = CarBrand.objects.filter(name__iexact=brand_filter, is_active=True)
        else:
            brands = CarBrand.objects.filter(is_active=True)
        
        brands_data = []
        for brand in brands:
            models = brand.models.filter(is_active=True)
            models_data = []
            
            for model in models:
                variants = model.variants.filter(is_active=True).values_list('name', flat=True)
                models_data.append({
                    'name': model.name,
                    'variants': list(variants)
                })
            
            brands_data.append({
                'name': brand.name,
                'logo': brand.logo.url if brand.logo else None,
                'models': models_data
            })
        
        return Response({
            'success': True,
            'data': {
                'brands': brands_data
            }
        })


@extend_schema(
    tags=['Utils'],
    summary='Get supported cities',
    description='Get list of cities where cars are available'
)
class CitiesView(APIView):
    """
    Get list of supported cities
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        cities = City.objects.filter(is_active=True).order_by('name')
        serializer = CitySerializer(cities, many=True)
        
        return Response({
            'success': True,
            'data': {
                'cities': serializer.data
            }
        }) 

"""
Additional views for seller management and file uploads
"""
from django.db import models
import uuid
import os


# Add these views to the existing cars/views.py file

@extend_schema(
    tags=['Sellers'],
    summary='Get seller listings',
    description='Get all listings for the authenticated seller',
    parameters=[
        OpenApiParameter('status', OpenApiTypes.STR, description='Filter by status'),
        OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
        OpenApiParameter('limit', OpenApiTypes.INT, description='Items per page'),
    ],
    responses={
        200: {
            'description': 'Seller listings retrieved successfully',
            'example': {
                'success': True,
                'data': {
                    'listings': [],
                    'stats': {
                        'total': 5,
                        'pending': 1,
                        'approved': 3,
                        'rejected': 0,
                        'sold': 1
                    }
                }
            }
        }
    }
)
class SellerListingsView(generics.ListAPIView):
    """
    Get seller's own listings
    """
    serializer_class = SellerListingSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CarPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = SellerCarFilter
    
    def get_queryset(self):
        return Car.objects.filter(
            seller=self.request.user
        ).select_related('brand', 'car_model', 'city').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Custom list response with stats"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get statistics
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'approved': queryset.filter(status='approved').count(),
            'rejected': queryset.filter(status='rejected').count(),
            'sold': queryset.filter(status='sold').count()
        }
        
        # Paginate
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return Response({
                'success': True,
                'data': {
                    'listings': serializer.data,
                    'stats': stats
                }
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'listings': serializer.data,
                'stats': stats
            }
        })


@extend_schema(
    tags=['Sellers'],
    summary='Get seller dashboard stats',
    description='Get seller dashboard statistics',
    responses={
        200: {
            'description': 'Seller stats retrieved successfully',
            'example': {
                'success': True,
                'data': {
                    'listings': {
                        'total': 5,
                        'active': 3,
                        'sold': 1,
                        'pending': 1
                    },
                    'performance': {
                        'totalViews': 5678,
                        'totalInquiries': 89,
                        'averageResponseTime': '2.5 hours',
                        'rating': 4.5
                    },
                    'earnings': {
                        'totalSales': 1545000,
                        'thisMonth': 545000
                    }
                }
            }
        }
    }
)
class SellerStatsView(APIView):
    """
    Get seller dashboard statistics
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get car statistics
        user_cars = Car.objects.filter(seller=user)
        total_cars = user_cars.count()
        active_cars = user_cars.filter(status='approved').count()
        sold_cars = user_cars.filter(status='sold').count()
        pending_cars = user_cars.filter(status='pending').count()
        
        # Calculate performance metrics
        total_views = user_cars.aggregate(
            total=models.Sum('views_count')
        )['total'] or 0
        
        total_inquiries = user_cars.aggregate(
            total=models.Sum('inquiries_count')
        )['total'] or 0
        
        # Mock calculations for demo
        average_response_time = "2.5 hours"
        rating = 4.5
        
        # Mock earnings for demo
        total_sales = sold_cars * 545000  # Average price
        this_month_sales = 545000 if sold_cars > 0 else 0
        
        stats_data = {
            'listings': {
                'total': total_cars,
                'active': active_cars,
                'sold': sold_cars,
                'pending': pending_cars
            },
            'performance': {
                'totalViews': total_views,
                'totalInquiries': total_inquiries,
                'averageResponseTime': average_response_time,
                'rating': rating
            },
            'earnings': {
                'totalSales': total_sales,
                'thisMonth': this_month_sales
            }
        }
        
        return Response({
            'success': True,
            'data': stats_data
        })


@extend_schema(
    tags=['File Upload'],
    summary='Upload car images',
    description='Upload multiple car images',
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'images': {'type': 'array', 'items': {'type': 'string', 'format': 'binary'}},
                'carId': {'type': 'string', 'format': 'uuid'}
            }
        }
    },
    responses={
        200: {
            'description': 'Images uploaded successfully',
            'example': {
                'success': True,
                'data': {
                    'images': [
                        {
                            'id': 'img_123',
                            'url': 'https://cdn.spinny.com/uploads/img_123.jpg',
                            'thumbnail': 'https://cdn.spinny.com/uploads/thumb_123.jpg',
                            'size': 1024000,
                            'dimensions': {
                                'width': 1920,
                                'height': 1080
                            }
                        }
                    ]
                }
            }
        }
    }
)
class UploadCarImagesView(APIView):
    """
    Upload car images
    """
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication, JWTAuthentication]
    
    def post(self, request):
        if 'images' not in request.FILES:
            return Response({
                'success': False,
                'error': {
                    'code': 'NO_FILES',
                    'message': 'No images provided'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        car_id = request.data.get('carId')
        images = request.FILES.getlist('images')
        
        # Validate number of images (max 10)
        if len(images) > 10:
            return Response({
                'success': False,
                'error': {
                    'code': 'TOO_MANY_FILES',
                    'message': 'Maximum 10 images allowed'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_images = []
        
        for image_file in images:
            # Validate file type
            if not image_file.content_type.startswith('image/'):
                return Response({
                    'success': False,
                    'error': {
                        'code': 'INVALID_FILE_TYPE',
                        'message': f'File {image_file.name} is not an image'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'FILE_TOO_LARGE',
                        'message': f'File {image_file.name} exceeds 5MB limit'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create CarImage object
            car_image = CarImage.objects.create(
                image=image_file,
                title=f'Car Image {len(uploaded_images) + 1}',
                order=len(uploaded_images),
                file_size=image_file.size
            )
            
            # Associate with car if provided
            if car_id:
                try:
                    is_admin = hasattr(request.user, 'admin_user') or getattr(request.user, 'is_staff', False)
                    car = Car.objects.get(id=car_id)
                    if is_admin or car.seller == request.user:
                        car_image.car = car
                        car_image.save()
                except Car.DoesNotExist:
                    pass
            
            # Get image dimensions (simplified)
            width, height = 1920, 1080  # TODO: Get actual dimensions
            
            uploaded_images.append({
                'id': str(car_image.id),
                'url': request.build_absolute_uri(car_image.image.url),
                'thumbnail': request.build_absolute_uri(car_image.thumbnail.url) if car_image.thumbnail else None,
                'size': car_image.file_size,
                'dimensions': {
                    'width': width,
                    'height': height
                }
            })
        
        return Response({
            'success': True,
            'data': {
                'images': uploaded_images
            }
        })


@extend_schema(
    tags=['File Upload'],
    summary='Upload car video',
    description='Upload car video',
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'video': {'type': 'string', 'format': 'binary'},
                'carId': {'type': 'string', 'format': 'uuid'}
            }
        }
    },
    responses={
        200: {
            'description': 'Video uploaded successfully',
            'example': {
                'success': True,
                'data': {
                    'video': {
                        'id': 'vid_123',
                        'url': 'https://cdn.spinny.com/uploads/vid_123.mp4',
                        'thumbnail': 'https://cdn.spinny.com/uploads/vid_thumb_123.jpg',
                        'duration': 30,
                        'size': 25600000
                    }
                }
            }
        }
    }
)
class UploadCarVideoView(APIView):
    """
    Upload car video
    """
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication, JWTAuthentication]
    
    def post(self, request):
        if 'video' not in request.FILES:
            return Response({
                'success': False,
                'error': {
                    'code': 'NO_FILE',
                    'message': 'No video provided'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        video_file = request.FILES['video']
        car_id = request.data.get('carId')
        
        # Validate file type
        allowed_types = ['video/mp4', 'video/mov', 'video/avi']
        if video_file.content_type not in allowed_types:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_FILE_TYPE',
                    'message': 'Only MP4, MOV, and AVI files are allowed'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 50MB)
        if video_file.size > 50 * 1024 * 1024:
            return Response({
                'success': False,
                'error': {
                    'code': 'FILE_TOO_LARGE',
                    'message': 'Video file exceeds 50MB limit'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create CarVideo object
        car_video = CarVideo.objects.create(
            video=video_file,
            title='Car Video',
            duration=30,  # TODO: Calculate actual duration
            file_size=video_file.size
        )
        
        # Associate with car if provided
        if car_id:
            try:
                car = Car.objects.get(id=car_id, seller=request.user)
                car_video.car = car
                car_video.save()
            except Car.DoesNotExist:
                pass
        
        return Response({
            'success': True,
            'data': {
                'video': {
                    'id': str(car_video.id),
                    'url': car_video.video.url,
                    'thumbnail': car_video.thumbnail.url if car_video.thumbnail else None,
                    'duration': car_video.duration,
                    'size': car_video.file_size
                }
            }
        })


@extend_schema(
    tags=['File Upload'],
    summary='Delete uploaded file',
    description='Delete an uploaded file',
    responses={
        200: {
            'description': 'File deleted successfully',
            'example': {
                'success': True,
                'message': 'File deleted successfully'
            }
        },
        404: {'description': 'File not found'}
    }
)
class DeleteFileView(APIView):
    """
    Delete uploaded file
    """
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication, JWTAuthentication]
    
    def delete(self, request, file_id):
        try:
            # Try to find CarImage first
            try:
                car_image = CarImage.objects.get(id=file_id)
                # Check if user owns the car or is admin
                is_admin = hasattr(request.user, 'admin_user') or getattr(request.user, 'is_staff', False)
                # If unauthenticated due to missing token, fall back to allowing delete by admin token from header
                # AdminTokenAuthentication returns a proxy user; above check covers it. If request.user is Anonymous, this won't be admin
                if car_image.car and (not is_admin) and car_image.car.seller != request.user:
                    return Response({
                        'success': False,
                        'error': {
                            'code': 'PERMISSION_DENIED',
                            'message': 'You do not have permission to delete this file'
                        }
                    }, status=status.HTTP_403_FORBIDDEN)
                
                car_image.delete()
                return Response({
                    'success': True,
                    'message': 'Image deleted successfully'
                })
            except CarImage.DoesNotExist:
                pass
            
            # Try to find CarVideo
            try:
                car_video = CarVideo.objects.get(id=file_id)
                is_admin = hasattr(request.user, 'admin_user') or getattr(request.user, 'is_staff', False)
                if car_video.car and (not is_admin) and car_video.car.seller != request.user:
                    return Response({
                        'success': False,
                        'error': {
                            'code': 'PERMISSION_DENIED',
                            'message': 'You do not have permission to delete this file'
                        }
                    }, status=status.HTTP_403_FORBIDDEN)
                
                car_video.delete()
                return Response({
                    'success': True,
                    'message': 'Video deleted successfully'
                })
            except CarVideo.DoesNotExist:
                pass
            
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'File not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'An error occurred while deleting the file'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 