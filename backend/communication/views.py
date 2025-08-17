"""
Communication views for Spinny Car Marketplace
"""
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.openapi import OpenApiTypes

from .models import Inquiry, InquiryResponse, Notification
from .serializers import (
    InquirySerializer, InquiryDetailSerializer, InquiryResponseSerializer,
    NotificationSerializer, CreateInquirySerializer, RespondToInquirySerializer
)
from .filters import InquiryFilter, NotificationFilter
from cars.models import Car


@extend_schema(
    tags=['Communication'],
    summary='Get seller inquiries',
    description='Get all inquiries for seller listings',
    parameters=[
        OpenApiParameter('carId', OpenApiTypes.UUID, description='Filter by car ID'),
        OpenApiParameter('status', OpenApiTypes.STR, description='Filter by status'),
        OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
        OpenApiParameter('limit', OpenApiTypes.INT, description='Items per page'),
    ],
    responses={
        200: {
            'description': 'Inquiries retrieved successfully',
            'example': {
                'success': True,
                'data': {
                    'inquiries': [],
                    'stats': {
                        'total': 23,
                        'new': 5,
                        'responded': 15,
                        'closed': 3
                    }
                }
            }
        }
    }
)
class SellerInquiriesView(generics.ListAPIView):
    """
    Get inquiries for seller's listings
    """
    serializer_class = InquirySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = InquiryFilter
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Inquiry.objects.filter(
            seller=self.request.user
        ).select_related('car', 'buyer').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Custom list response with stats"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get statistics
        stats = {
            'total': queryset.count(),
            'new': queryset.filter(status='new').count(),
            'responded': queryset.filter(status='responded').count(),
            'closed': queryset.filter(status='closed').count()
        }
        
        # Paginate
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return Response({
                'success': True,
                'data': {
                    'inquiries': serializer.data,
                    'stats': stats
                }
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'inquiries': serializer.data,
                'stats': stats
            }
        })


@extend_schema(
    tags=['Communication'],
    summary='Get inquiry details',
    description='Get detailed information about a specific inquiry',
    responses={
        200: InquiryDetailSerializer,
        404: {'description': 'Inquiry not found'}
    }
)
class InquiryDetailView(generics.RetrieveAPIView):
    """
    Get inquiry details
    """
    serializer_class = InquiryDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Inquiry.objects.filter(
            Q(seller=self.request.user) | Q(buyer=self.request.user)
        ).select_related('car', 'seller', 'buyer').prefetch_related('responses')
    
    def retrieve(self, request, *args, **kwargs):
        """Custom retrieve response"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            # Mark as read if user is the seller
            if instance.seller == request.user and instance.status == 'new':
                instance.status = 'responded'
                instance.save()
            
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Inquiry.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Inquiry not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)


@extend_schema(
    tags=['Communication'],
    summary='Respond to inquiry',
    description='Respond to buyer inquiry',
    request=RespondToInquirySerializer,
    responses={
        200: {
            'description': 'Response sent successfully',
            'example': {
                'success': True,
                'message': 'Response sent successfully'
            }
        },
        404: {'description': 'Inquiry not found'}
    }
)
class RespondToInquiryView(APIView):
    """
    Respond to buyer inquiry
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, inquiry_id):
        try:
            inquiry = get_object_or_404(
                Inquiry,
                id=inquiry_id,
                seller=request.user
            )
            
            serializer = RespondToInquirySerializer(
                data=request.data,
                context={'inquiry': inquiry, 'request': request}
            )
            
            if serializer.is_valid():
                response = serializer.save()
                
                # Update inquiry status
                inquiry.mark_as_responded(serializer.validated_data['message'])
                
                # TODO: Send notification to buyer
                
                return Response({
                    'success': True,
                    'message': 'Response sent successfully'
                })
            
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid response data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Inquiry.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Inquiry not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)


@extend_schema(
    tags=['Communication'],
    summary='Get user notifications',
    description='Get notifications for authenticated user',
    parameters=[
        OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
        OpenApiParameter('limit', OpenApiTypes.INT, description='Items per page'),
        OpenApiParameter('unread', OpenApiTypes.BOOL, description='Filter unread notifications'),
    ],
    responses={
        200: {
            'description': 'Notifications retrieved successfully',
            'example': {
                'success': True,
                'data': {
                    'notifications': [],
                    'unreadCount': 3
                }
            }
        }
    }
)
class UserNotificationsView(generics.ListAPIView):
    """
    Get user notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = NotificationFilter
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).select_related('car', 'inquiry')
    
    def list(self, request, *args, **kwargs):
        """Custom list response with unread count"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get unread count
        unread_count = queryset.filter(is_read=False).count()
        
        # Paginate
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return Response({
                'success': True,
                'data': {
                    'notifications': serializer.data,
                    'unreadCount': unread_count
                }
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'notifications': serializer.data,
                'unreadCount': unread_count
            }
        })


@extend_schema(
    tags=['Communication'],
    summary='Mark notification as read',
    description='Mark a notification as read',
    responses={
        200: {
            'description': 'Notification marked as read',
            'example': {
                'success': True,
                'message': 'Notification marked as read'
            }
        },
        404: {'description': 'Notification not found'}
    }
)
class MarkNotificationReadView(APIView):
    """
    Mark notification as read
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request, notification_id):
        try:
            notification = get_object_or_404(
                Notification,
                id=notification_id,
                user=request.user
            )
            
            notification.mark_as_read()
            
            return Response({
                'success': True,
                'message': 'Notification marked as read'
            })
            
        except Notification.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Notification not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)


@extend_schema(
    tags=['Communication'],
    summary='Mark all notifications as read',
    description='Mark all user notifications as read',
    responses={
        200: {
            'description': 'All notifications marked as read',
            'example': {
                'success': True,
                'message': 'All notifications marked as read',
                'data': {
                    'markedCount': 5
                }
            }
        }
    }
)
class MarkAllNotificationsReadView(APIView):
    """
    Mark all notifications as read
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request):
        unread_notifications = Notification.objects.filter(
            user=request.user,
            is_read=False
        )
        
        count = unread_notifications.count()
        
        unread_notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'success': True,
            'message': 'All notifications marked as read',
            'data': {
                'markedCount': count
            }
        })


@extend_schema(
    tags=['Communication'],
    summary='Create inquiry',
    description='Create a new inquiry for a car',
    request=CreateInquirySerializer,
    responses={
        201: {
            'description': 'Inquiry created successfully',
            'example': {
                'success': True,
                'message': 'Message sent successfully',
                'data': {
                    'inquiryId': 'inq_123',
                    'estimatedResponse': 'Within 2 hours'
                }
            }
        }
    }
)
class CreateInquiryView(generics.CreateAPIView):
    """
    Create inquiry for a car
    """
    serializer_class = CreateInquirySerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        """Custom create response"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            inquiry = serializer.save()
            
            # TODO: Send notification to seller
            # TODO: Send email to seller
            
            return Response({
                'success': True,
                'message': 'Message sent successfully',
                'data': {
                    'inquiryId': str(inquiry.id),
                    'estimatedResponse': 'Within 2 hours'
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid inquiry data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


# Utility functions for notifications

def create_notification(user, notification_type, title, message, **kwargs):
    """
    Helper function to create notifications
    """
    notification_data = {
        'user': user,
        'type': notification_type,
        'title': title,
        'message': message,
        'data': kwargs.get('data', {}),
        'car': kwargs.get('car'),
        'inquiry': kwargs.get('inquiry'),
        'priority': kwargs.get('priority', 'normal')
    }
    
    return Notification.objects.create(**notification_data)


def send_inquiry_notification(inquiry):
    """
    Send notification when new inquiry is received
    """
    return create_notification(
        user=inquiry.seller,
        notification_type='inquiry_received',
        title='New Inquiry Received',
        message=f'You have a new inquiry for your {inquiry.car.title}',
        car=inquiry.car,
        inquiry=inquiry,
        data={
            'inquiryId': str(inquiry.id),
            'carId': str(inquiry.car.id),
            'buyerName': inquiry.buyer_name
        }
    )


def send_response_notification(inquiry_response):
    """
    Send notification when seller responds to inquiry
    """
    if inquiry_response.inquiry.buyer:
        return create_notification(
            user=inquiry_response.inquiry.buyer,
            notification_type='inquiry_response',
            title='Seller Responded',
            message=f'The seller responded to your inquiry about {inquiry_response.inquiry.car.title}',
            car=inquiry_response.inquiry.car,
            inquiry=inquiry_response.inquiry,
            data={
                'inquiryId': str(inquiry_response.inquiry.id),
                'carId': str(inquiry_response.inquiry.car.id),
                'responseId': str(inquiry_response.id)
            }
        )


def send_car_status_notification(car, old_status, new_status):
    """
    Send notification when car status changes
    """
    if new_status == 'approved':
        title = 'Car Listing Approved'
        message = f'Your car listing "{car.title}" has been approved and is now live!'
    elif new_status == 'rejected':
        title = 'Car Listing Requires Updates'
        message = f'Your car listing "{car.title}" needs some updates before approval.'
    else:
        return None
    
    return create_notification(
        user=car.seller,
        notification_type=f'car_{new_status}',
        title=title,
        message=message,
        car=car,
        data={
            'carId': str(car.id),
            'oldStatus': old_status,
            'newStatus': new_status
        }
    ) 