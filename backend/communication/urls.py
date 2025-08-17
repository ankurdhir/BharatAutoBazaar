"""
Communication URL patterns for Spinny Car Marketplace
"""
from django.urls import path
from .views import (
    SellerInquiriesView, InquiryDetailView, RespondToInquiryView,
    UserNotificationsView, MarkNotificationReadView, MarkAllNotificationsReadView,
    CreateInquiryView
)

# Communication endpoints
urlpatterns = [
    # Inquiries
    path('', SellerInquiriesView.as_view(), name='seller_inquiries'),
    path('create/', CreateInquiryView.as_view(), name='create_inquiry'),
    path('<uuid:id>/', InquiryDetailView.as_view(), name='inquiry_detail'),
    path('<uuid:inquiry_id>/respond/', RespondToInquiryView.as_view(), name='respond_to_inquiry'),
    
    # Notifications
    path('notifications/', UserNotificationsView.as_view(), name='user_notifications'),
    path('notifications/<uuid:notification_id>/read/', MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),
] 