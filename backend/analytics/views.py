"""
Analytics views for Spinny Car Marketplace
"""
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from cars.models import Car


@extend_schema(
    tags=['Analytics'],
    summary='Get car analytics',
    description='Get analytics data for a specific car'
)
class CarAnalyticsView(APIView):
    """
    Get car analytics data
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, car_id):
        try:
            car = Car.objects.get(id=car_id, seller=request.user)
            
            # Mock analytics data
            analytics_data = {
                'views': {
                    'total': car.views_count,
                    'thisWeek': car.views_count // 4,
                    'unique': car.views_count // 2
                },
                'inquiries': {
                    'total': car.inquiries_count,
                    'conversion': round((car.inquiries_count / max(car.views_count, 1)) * 100, 1)
                },
                'performance': {
                    'rank': 'Top 20%',
                    'category': 'Excellent'
                }
            }
            
            return Response({
                'success': True,
                'data': analytics_data
            })
            
        except Car.DoesNotExist:
            return Response({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Car not found'}
            }, status=404)


@extend_schema(
    tags=['Analytics'],
    summary='Get seller analytics',
    description='Get analytics data for the authenticated seller'
)
class SellerAnalyticsView(APIView):
    """
    Get seller analytics data
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_cars = Car.objects.filter(seller=request.user)
        
        analytics_data = {
            'overview': {
                'totalListings': user_cars.count(),
                'totalViews': sum(car.views_count for car in user_cars),
                'totalInquiries': sum(car.inquiries_count for car in user_cars)
            }
        }
        
        return Response({
            'success': True,
            'data': analytics_data
        })


@extend_schema(
    tags=['Analytics'],
    summary='Get system analytics',
    description='Get system-wide analytics (admin only)'
)
class SystemAnalyticsView(APIView):
    """
    Get system analytics data (admin only)
    """
    permission_classes = [permissions.IsAuthenticated]  # TODO: Add admin permission
    
    def get(self, request):
        analytics_data = {
            'cars': {
                'total': Car.objects.count(),
                'active': Car.objects.filter(status='approved').count()
            }
        }
        
        return Response({
            'success': True,
            'data': analytics_data
        }) 