"""
Admin panel views for Spinny Car Marketplace
"""
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.openapi import OpenApiTypes

from .models import CarReview, ModerationQueue, AdminActivity
from authentication.admin_auth import AdminTokenAuthentication
from .serializers import (
    AdminCarListSerializer, AdminCarDetailSerializer, CarReviewSerializer,
    ReviewCarSerializer, BulkActionSerializer
)
from cars.models import Car
from cars.filters import AdminCarFilter
from authentication.models import AdminUser


class IsAdminPermission(permissions.BasePermission):
    """
    Custom permission for admin users
    """
    def has_permission(self, request, view):
        # Check if user is authenticated and is admin
        if not request.user.is_authenticated:
            return False
            
        # Check if it's an admin user (from AdminTokenAuthentication)
        return (
            request.user.is_staff or 
            hasattr(request.user, 'admin_user') or
            hasattr(request.user, 'is_superuser')
        )


@extend_schema(
    tags=['Admin'],
    summary='Get all cars for admin review',
    description='Get paginated list of all cars for admin management',
    parameters=[
        OpenApiParameter('status', OpenApiTypes.STR, description='Filter by status'),
        OpenApiParameter('seller', OpenApiTypes.STR, description='Filter by seller phone'),
        OpenApiParameter('brand', OpenApiTypes.STR, description='Filter by brand'),
        OpenApiParameter('city', OpenApiTypes.STR, description='Filter by city'),
        OpenApiParameter('submittedFrom', OpenApiTypes.STR, description='Filter by submission date from'),
        OpenApiParameter('submittedTo', OpenApiTypes.STR, description='Filter by submission date to'),
        OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
        OpenApiParameter('limit', OpenApiTypes.INT, description='Items per page'),
    ],
    responses={
        200: {
            'description': 'Cars retrieved successfully',
            'example': {
                'success': True,
                'data': {
                    'cars': [],
                    'stats': {
                        'total': 1250,
                        'pending': 45,
                        'approved': 980,
                        'rejected': 25,
                        'flagged': 5
                    },
                    'pagination': {
                        'page': 1,
                        'limit': 20,
                        'total': 1250,
                        'totalPages': 63
                    }
                }
            }
        }
    }
)
class AdminCarListView(generics.ListAPIView):
    """
    Get all cars for admin review
    """
    serializer_class = AdminCarListSerializer
    permission_classes = [IsAdminPermission]
    authentication_classes = [AdminTokenAuthentication]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = AdminCarFilter
    search_fields = ['title', 'seller__phone_number', 'seller_name', 'brand__name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Car.objects.all().select_related(
            'brand', 'car_model', 'city', 'seller'
        ).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Custom list response with stats"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get statistics
        all_cars = Car.objects.all()
        stats = {
            'total': all_cars.count(),
            'pending': all_cars.filter(status='pending').count(),
            'approved': all_cars.filter(status='approved').count(),
            'rejected': all_cars.filter(status='rejected').count(),
            'flagged': all_cars.filter(quality_score__lt=50).count()
        }
        
        # Paginate
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)
            
            return Response({
                'success': True,
                'data': {
                    'cars': serializer.data,
                    'stats': stats,
                    'pagination': {
                        'page': paginated_response.data.get('page', 1),
                        'limit': 20,
                        'total': paginated_response.data.get('count', 0),
                        'totalPages': paginated_response.data.get('total_pages', 1)
                    }
                }
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'cars': serializer.data,
                'stats': stats
            }
        })


@extend_schema(
    tags=['Admin'],
    summary='Get car details for admin review',
    description='Get detailed car information for admin review',
    responses={
        200: AdminCarDetailSerializer,
        404: {'description': 'Car not found'}
    }
)
class AdminCarDetailView(generics.RetrieveAPIView):
    """
    Get car details for admin review
    """
    serializer_class = AdminCarDetailSerializer
    permission_classes = [IsAdminPermission]
    authentication_classes = [AdminTokenAuthentication]
    lookup_field = 'id'
    queryset = Car.objects.all().select_related(
        'brand', 'car_model', 'variant', 'city', 'seller'
    ).prefetch_related('images', 'videos', 'admin_reviews')
    
    def retrieve(self, request, *args, **kwargs):
        """Custom retrieve response"""
        try:
            instance = self.get_object()
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


class AdminCarUpdateView(APIView):
    """
    Update car fields (admin only). Partial updates supported.
    """
    permission_classes = [IsAdminPermission]
    authentication_classes = [AdminTokenAuthentication]

    def patch(self, request, id):
        try:
            car = get_object_or_404(Car, id=id)

            allowed_fields = [
                'price', 'original_price', 'negotiable',
                'year', 'km_driven', 'fuel_type', 'transmission', 'owner_number',
                'exterior_condition', 'interior_condition', 'engine_condition',
                'accident_history', 'urgency', 'quality_score',
                'title', 'description', 'features',
                'area', 'address',
                'registration_number', 'registration_state', 'registration_date',
                'insurance_valid', 'insurance_expiry', 'rc_transfer_available',
                'status', 'verified', 'featured',
                'seller_name', 'seller_phone', 'seller_email',
                'admin_notes', 'rejection_reason'
            ]

            data = request.data

            # Handle brand/model/variant and city changes
            from cars.models import City, CarBrand, CarModel, CarVariant
            from django.utils.text import slugify

            # Brand / Model / Variant by names (optional)
            if data.get('brand_name'):
                brand_name = data['brand_name']
                brand = CarBrand.objects.filter(name=brand_name).first()
                if not brand:
                    brand = CarBrand.objects.create(name=brand_name, slug=slugify(brand_name))
                car.brand = brand

            if data.get('model_name') and car.brand_id:
                model_name = data['model_name']
                car_model = CarModel.objects.filter(brand=car.brand, name=model_name).first()
                if not car_model:
                    car_model = CarModel.objects.create(brand=car.brand, name=model_name, slug=slugify(f"{car.brand.name}-{model_name}"))
                car.car_model = car_model

            if data.get('variant_name') and car.car_model_id:
                variant_name = data['variant_name']
                variant = CarVariant.objects.filter(car_model=car.car_model, name=variant_name).first()
                if not variant:
                    variant = CarVariant.objects.create(car_model=car.car_model, name=variant_name)
                car.variant = variant

            # City by id or by name/state
            city_changed = False
            if 'city_id' in data and data['city_id']:
                car.city = get_object_or_404(City, id=data['city_id'])
                city_changed = True
            elif data.get('city_name') and data.get('state_name'):
                slug = slugify(f"{data['city_name']}-{data['state_name']}")
                car.city, _ = City.objects.get_or_create(name=data['city_name'], state=data['state_name'], defaults={'slug': slug})
                city_changed = True

            for field in allowed_fields:
                if field in data:
                    setattr(car, field, data[field])

            # Coercions
            if 'price' in data:
                car.price = int(data['price'])
            if 'original_price' in data and data['original_price'] is not None:
                car.original_price = int(data['original_price'])
            if 'km_driven' in data:
                car.km_driven = int(data['km_driven'])
            if 'quality_score' in data and data['quality_score'] is not None:
                car.quality_score = int(data['quality_score'])

            car.reviewed_by = self._get_admin_user(request.user)
            car.reviewed_at = timezone.now()
            car.save()

            serializer = AdminCarDetailSerializer(car)
            return Response({'success': True, 'data': serializer.data})
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'UPDATE_FAILED',
                    'message': str(e)
                }
            }, status=status.HTTP_400_BAD_REQUEST)

    def _get_admin_user(self, user):
        """Get admin user instance if available"""
        if hasattr(user, 'admin_user'):
            return user.admin_user
        return None

@extend_schema(
    tags=['Admin'],
    summary='Review car listing',
    description='Approve, reject, or request changes for a car listing',
    request=ReviewCarSerializer,
    responses={
        200: {
            'description': 'Car reviewed successfully',
            'example': {
                'success': True,
                'message': 'Car listing approved successfully'
            }
        },
        404: {'description': 'Car not found'}
    }
)
class ReviewCarView(APIView):
    """
    Review car listing (approve/reject)
    """
    permission_classes = [IsAdminPermission]
    authentication_classes = [AdminTokenAuthentication]
    
    def post(self, request, car_id):
        try:
            car = get_object_or_404(Car, id=car_id)
            
            serializer = ReviewCarSerializer(
                data=request.data,
                context={'car': car, 'request': request}
            )
            
            if serializer.is_valid():
                review = serializer.save()
                
                # Update car status based on action
                action = serializer.validated_data['action']
                if action == 'approve':
                    car.status = 'approved'
                    car.verified = True
                    car.approved_at = timezone.now()
                    message = 'Car listing approved successfully'
                elif action == 'reject':
                    car.status = 'rejected'
                    message = 'Car listing rejected'
                elif action == 'request_changes':
                    car.status = 'pending'
                    message = 'Changes requested for car listing'
                elif action == 'feature':
                    car.featured = True
                    message = 'Car marked as featured'
                elif action == 'unfeature':
                    car.featured = False
                    message = 'Car unmarked as featured'
                
                car.reviewed_by = self._get_admin_user(request.user)
                car.reviewed_at = timezone.now()
                car.save()
                
                # Log admin activity
                self._log_admin_activity(
                    admin=self._get_admin_user(request.user),
                    activity_type=f'car_{action}',
                    description=f'Car {action}: {car.title}',
                    affected_car=car,
                    metadata={
                        'carId': str(car.id),
                        'action': action,
                        'reason': serializer.validated_data.get('reason', '')
                    },
                    request=request
                )
                
                # TODO: Send notification to seller
                
                return Response({
                    'success': True,
                    'message': message
                })
            
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid review data',
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
    
    def _get_admin_user(self, user):
        """Get admin user instance"""
        if hasattr(user, 'admin_user'):
            return user.admin_user
        return None
    
    def _log_admin_activity(self, admin, activity_type, description, **kwargs):
        """Log admin activity"""
        AdminActivity.objects.create(
            admin=admin,
            activity_type=activity_type,
            description=description,
            metadata=kwargs.get('metadata', {}),
            affected_car=kwargs.get('affected_car'),
            ip_address=self._get_client_ip(kwargs.get('request')),
            user_agent=kwargs.get('request', {}).META.get('HTTP_USER_AGENT', '') if kwargs.get('request') else ''
        )
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        if not request:
            return None
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@extend_schema(
    tags=['Admin'],
    summary='Bulk actions on cars',
    description='Perform bulk actions on multiple cars',
    request=BulkActionSerializer,
    responses={
        200: {
            'description': 'Bulk action completed',
            'example': {
                'success': True,
                'message': 'Bulk action completed successfully',
                'data': {
                    'processed': 10,
                    'successful': 9,
                    'failed': 1,
                    'details': []
                }
            }
        }
    }
)
class BulkActionView(APIView):
    """
    Perform bulk actions on cars
    """
    permission_classes = [IsAdminPermission]
    authentication_classes = [AdminTokenAuthentication]
    
    def post(self, request):
        serializer = BulkActionSerializer(data=request.data)
        if serializer.is_valid():
            action = serializer.validated_data['action']
            car_ids = serializer.validated_data['carIds']
            
            cars = Car.objects.filter(id__in=car_ids)
            processed = 0
            successful = 0
            failed = 0
            details = []
            
            for car in cars:
                try:
                    if action == 'approve':
                        car.status = 'approved'
                        car.verified = True
                        car.approved_at = timezone.now()
                    elif action == 'reject':
                        car.status = 'rejected'
                    elif action == 'feature':
                        car.featured = True
                    elif action == 'unfeature':
                        car.featured = False
                    elif action == 'delete':
                        car.delete()
                        processed += 1
                        successful += 1
                        continue
                    
                    car.reviewed_by = self._get_admin_user(request.user)
                    car.reviewed_at = timezone.now()
                    car.save()
                    
                    processed += 1
                    successful += 1
                    
                except Exception as e:
                    failed += 1
                    details.append({
                        'carId': str(car.id),
                        'error': str(e)
                    })
            
            # Log bulk action
            self._log_admin_activity(
                admin=self._get_admin_user(request.user),
                activity_type='bulk_action',
                description=f'Bulk {action} on {len(car_ids)} cars',
                metadata={
                    'action': action,
                    'carIds': car_ids,
                    'processed': processed,
                    'successful': successful,
                    'failed': failed
                },
                request=request
            )
            
            return Response({
                'success': True,
                'message': 'Bulk action completed successfully',
                'data': {
                    'processed': processed,
                    'successful': successful,
                    'failed': failed,
                    'details': details
                }
            })
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid bulk action data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_admin_user(self, user):
        """Get admin user instance"""
        if hasattr(user, 'admin_user'):
            return user.admin_user
        return None
    
    def _log_admin_activity(self, admin, activity_type, description, **kwargs):
        """Log admin activity"""
        AdminActivity.objects.create(
            admin=admin,
            activity_type=activity_type,
            description=description,
            metadata=kwargs.get('metadata', {}),
            ip_address=self._get_client_ip(kwargs.get('request')),
            user_agent=kwargs.get('request', {}).META.get('HTTP_USER_AGENT', '') if kwargs.get('request') else ''
        )
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        if not request:
            return None
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@extend_schema(
    tags=['Admin'],
    summary='Get admin dashboard stats',
    description='Get admin dashboard statistics',
    responses={
        200: {
            'description': 'Admin stats retrieved successfully',
            'example': {
                'success': True,
                'data': {
                    'overview': {
                        'totalCars': 1250,
                        'pendingReview': 45,
                        'totalUsers': 8750,
                        'totalInquiries': 3420
                    },
                    'recentActivity': [],
                    'alerts': []
                }
            }
        }
    }
)
class AdminDashboardView(APIView):
    """
    Get admin dashboard statistics
    """
    permission_classes = [IsAdminPermission]
    authentication_classes = [AdminTokenAuthentication]
    
    def get(self, request):
        # Get overview statistics
        total_cars = Car.objects.count()
        pending_review = Car.objects.filter(status='pending').count()
        
        from authentication.models import User
        total_users = User.objects.count()
        
        from communication.models import Inquiry
        total_inquiries = Inquiry.objects.count()
        
        # Get recent admin activities
        recent_activities = AdminActivity.objects.select_related('admin').order_by('-created_at')[:10]
        activities_data = []
        
        for activity in recent_activities:
            activities_data.append({
                'id': str(activity.id),
                'admin': activity.admin.name if activity.admin else 'Unknown',
                'type': activity.activity_type,
                'description': activity.description,
                'timestamp': activity.created_at.isoformat()
            })
        
        # Get system alerts (simplified)
        alerts = []
        if pending_review > 50:
            alerts.append({
                'type': 'warning',
                'message': f'{pending_review} cars are pending review',
                'priority': 'high'
            })
        
        # Calculate additional stats for frontend
        approved_today = Car.objects.filter(
            status='approved',
            created_at__date=timezone.now().date()
        ).count()
        
        active_sellers = User.objects.filter(
            is_seller=True,
            is_active=True
        ).count()
        
        dashboard_data = {
            'pending_listings': pending_review,
            'approved_today': approved_today,
            'total_active': total_cars,
            'active_sellers': active_sellers,
            'overview': {
                'totalCars': total_cars,
                'pendingReview': pending_review,
                'totalUsers': total_users,
                'totalInquiries': total_inquiries
            },
            'recentActivity': activities_data,
            'alerts': alerts
        }
        
        return Response({
            'success': True,
            'data': dashboard_data
        })


# Admin authentication views are already implemented in authentication app 