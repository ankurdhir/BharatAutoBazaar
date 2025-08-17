"""
Utility views for Spinny Car Marketplace
"""
import math
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.openapi import OpenApiTypes
from django.contrib.auth import get_user_model

from .models import EMICalculation
from cars.models import City, CarBrand, CarModel
from cars.serializers import CitySerializer

User = get_user_model()


@extend_schema(
    tags=['Utils'],
    summary='Calculate EMI',
    description='Calculate EMI for given loan parameters',
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'principal': {'type': 'integer', 'description': 'Loan amount in rupees'},
                'interestRate': {'type': 'number', 'description': 'Annual interest rate percentage'},
                'tenure': {'type': 'integer', 'description': 'Tenure in months'}
            },
            'required': ['principal', 'interestRate', 'tenure']
        }
    },
    responses={
        200: {
            'description': 'EMI calculated successfully',
            'example': {
                'success': True,
                'data': {
                    'emi': 11567,
                    'totalAmount': 694020,
                    'totalInterest': 149020,
                    'breakdown': [
                        {
                            'month': 1,
                            'emi': 11567,
                            'principal': 7243,
                            'interest': 4324,
                            'balance': 537757
                        }
                    ]
                }
            }
        },
        400: {'description': 'Invalid parameters'}
    }
)
class EMICalculatorView(APIView):
    """
    Calculate EMI for given parameters
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            # Get parameters
            principal = request.data.get('principal')
            interest_rate = request.data.get('interestRate')
            tenure = request.data.get('tenure')
            
            # Validate parameters
            if not all([principal, interest_rate, tenure]):
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Principal, interest rate, and tenure are required'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Convert to appropriate types
            try:
                principal = float(principal)
                interest_rate = float(interest_rate)
                tenure = int(tenure)
            except (ValueError, TypeError):
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Invalid parameter types'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate ranges
            if principal <= 0 or interest_rate <= 0 or tenure <= 0:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'All parameters must be positive'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if principal > 10000000:  # 1 crore limit
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Principal amount cannot exceed 1 crore'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if tenure > 360:  # 30 years limit
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Tenure cannot exceed 360 months'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate EMI using the formula: E = P*r*(1+r)^n/((1+r)^n-1)
            monthly_rate = interest_rate / (12 * 100)  # Convert annual % to monthly decimal
            
            if monthly_rate == 0:
                # If interest rate is 0, EMI is simply principal/tenure
                emi = principal / tenure
            else:
                # Standard EMI formula
                emi = (principal * monthly_rate * (1 + monthly_rate) ** tenure) / ((1 + monthly_rate) ** tenure - 1)
            
            emi = round(emi, 0)
            total_amount = emi * tenure
            total_interest = total_amount - principal
            
            # Generate breakdown for first few months
            breakdown = []
            remaining_principal = principal
            
            for month in range(1, min(13, tenure + 1)):  # Show first 12 months or all if less
                if monthly_rate == 0:
                    monthly_interest = 0
                    monthly_principal = emi
                else:
                    monthly_interest = remaining_principal * monthly_rate
                    monthly_principal = emi - monthly_interest
                
                remaining_principal -= monthly_principal
                
                breakdown.append({
                    'month': month,
                    'emi': int(emi),
                    'principal': int(monthly_principal),
                    'interest': int(monthly_interest),
                    'balance': int(max(0, remaining_principal))
                })
                
                if remaining_principal <= 0:
                    break
            
            # Store calculation in database for analytics
            if request.user.is_authenticated:
                EMICalculation.objects.create(
                    user=request.user,
                    principal=int(principal),
                    interest_rate=interest_rate,
                    tenure=tenure,
                    emi=int(emi),
                    total_amount=int(total_amount),
                    total_interest=int(total_interest),
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
            
            return Response({
                'success': True,
                'data': {
                    'emi': int(emi),
                    'totalAmount': int(total_amount),
                    'totalInterest': int(total_interest),
                    'breakdown': breakdown
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'CALCULATION_ERROR',
                    'message': 'Error calculating EMI'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@extend_schema(
    tags=['Utils'],
    summary='Get supported cities',
    description='Get list of cities where cars are available',
    responses={
        200: {
            'description': 'Cities retrieved successfully',
            'example': {
                'success': True,
                'data': {
                    'cities': [
                        {
                            'id': 'delhi',
                            'name': 'Delhi',
                            'state': 'Delhi',
                            'active': True,
                            'carCount': 1250
                        }
                    ]
                }
            }
        }
    }
)
class CitiesView(APIView):
    """
    Get list of supported cities
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        cities = City.objects.filter(is_active=True).order_by('name')
        
        cities_data = []
        for city in cities:
            cities_data.append({
                'id': city.slug or str(city.id),
                'name': city.name,
                'state': city.state,
                'active': city.is_active,
                'carCount': city.car_count
            })
        
        return Response({
            'success': True,
            'data': {
                'cities': cities_data
            }
        })


@extend_schema(
    tags=['Utils'],
    summary='Get car brands and models',
    description='Get car brands and models data',
    parameters=[
        OpenApiParameter('brand', OpenApiTypes.STR, description='Filter by specific brand'),
    ],
    responses={
        200: {
            'description': 'Car data retrieved successfully',
            'example': {
                'success': True,
                'data': {
                    'brands': [
                        {
                            'name': 'Maruti Suzuki',
                            'logo': 'https://cdn.spinny.com/brands/maruti.png',
                            'models': [
                                {
                                    'name': 'Swift',
                                    'variants': ['LXI', 'VXI', 'ZXI']
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }
)
class CarDataView(APIView):
    """
    Get car brands and models data
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        brand_filter = request.query_params.get('brand')
        
        if brand_filter:
            brands = CarBrand.objects.filter(
                name__iexact=brand_filter,
                is_active=True
            ).prefetch_related('models__variants')
        else:
            brands = CarBrand.objects.filter(
                is_active=True
            ).prefetch_related('models__variants')
        
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
    summary='Get car features',
    description='Get list of available car features',
    parameters=[
        OpenApiParameter('category', OpenApiTypes.STR, description='Filter by feature category'),
    ]
)
class CarFeaturesView(APIView):
    """
    Get car features data
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        from .models import CarFeature
        
        category_filter = request.query_params.get('category')
        
        if category_filter:
            features = CarFeature.objects.filter(
                category=category_filter,
                is_active=True
            ).order_by('name')
        else:
            features = CarFeature.objects.filter(
                is_active=True
            ).order_by('category', 'name')
        
        # Group by category
        features_by_category = {}
        for feature in features:
            if feature.category not in features_by_category:
                features_by_category[feature.category] = []
            
            features_by_category[feature.category].append({
                'name': feature.name,
                'description': feature.description,
                'icon': feature.icon,
                'usageCount': feature.usage_count
            })
        
        return Response({
            'success': True,
            'data': {
                'features': features_by_category
            }
        })


@extend_schema(
    tags=['Utils'],
    summary='Get system configuration',
    description='Get system configuration settings',
    responses={
        200: {
            'description': 'Configuration retrieved successfully',
            'example': {
                'success': True,
                'data': {
                    'config': {
                        'limits': {
                            'maxImagesPerListing': 10,
                            'maxImageSizeBytes': 5242880,
                            'maxVideoSizeBytes': 52428800,
                            'maxDescriptionLength': 2000
                        },
                        'supportedFormats': {
                            'images': ['jpeg', 'jpg', 'png', 'webp'],
                            'videos': ['mp4', 'mov', 'avi']
                        },
                        'features': {
                            'videoUploads': True,
                            'advancedSearch': True,
                            'emiCalculator': True
                        }
                    }
                }
            }
        }
    }
)
class ConfigurationView(APIView):
    """
    Get system configuration
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Static configuration for now
        # TODO: Make this dynamic from SystemConfiguration model
        config_data = {
            'limits': {
                'maxImagesPerListing': 10,
                'maxImageSizeBytes': 5242880,  # 5MB
                'maxVideoSizeBytes': 52428800,  # 50MB
                'maxDescriptionLength': 2000,
                'maxListingsPerUser': 50
            },
            'supportedFormats': {
                'images': ['jpeg', 'jpg', 'png', 'webp'],
                'videos': ['mp4', 'mov', 'avi']
            },
            'features': {
                'videoUploads': True,
                'advancedSearch': True,
                'savedSearches': True,
                'emiCalculator': True,
                'analytics': True,
                'notifications': True
            },
            'defaultCurrency': 'INR',
            'contactInfo': {
                'supportEmail': 'support@spinny.com',
                'supportPhone': '+91-800-SPINNY',
                'businessHours': '9 AM - 6 PM IST, Mon-Sat'
            }
        }
        
        return Response({
            'success': True,
            'data': {
                'config': config_data
            }
        })


# Health check endpoint
@extend_schema(
    tags=['System'],
    summary='Health check',
    description='Check API health status',
    responses={
        200: {
            'description': 'API is healthy',
            'example': {
                'success': True,
                'status': 'healthy',
                'timestamp': '2024-01-01T10:00:00Z',
                'version': '1.0.0'
            }
        }
    }
)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    Health check endpoint
    """
    from django.utils import timezone
    
    return Response({
        'success': True,
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',
        'environment': 'development'  # TODO: Get from settings
    }) 