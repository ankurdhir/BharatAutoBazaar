"""
Communication filters for Spinny Car Marketplace
"""
import django_filters
from django.db import models
from .models import Inquiry, Notification


class InquiryFilter(django_filters.FilterSet):
    """
    Filter set for inquiries
    """
    carId = django_filters.UUIDFilter(
        field_name='car__id',
        help_text='Filter by car ID'
    )
    
    status = django_filters.ChoiceFilter(
        field_name='status',
        choices=Inquiry.STATUS_CHOICES,
        help_text='Filter by inquiry status'
    )
    
    dateFrom = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='Filter inquiries from this date'
    )
    
    dateTo = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='Filter inquiries until this date'
    )
    
    isSerious = django_filters.BooleanFilter(
        field_name='is_serious_buyer',
        help_text='Filter serious buyers'
    )
    
    buyerPhone = django_filters.CharFilter(
        field_name='buyer_phone',
        lookup_expr='icontains',
        help_text='Filter by buyer phone number'
    )
    
    class Meta:
        model = Inquiry
        fields = ['carId', 'status', 'dateFrom', 'dateTo', 'isSerious', 'buyerPhone']


class NotificationFilter(django_filters.FilterSet):
    """
    Filter set for notifications
    """
    type = django_filters.ChoiceFilter(
        field_name='type',
        choices=Notification.TYPE_CHOICES,
        help_text='Filter by notification type'
    )
    
    unread = django_filters.BooleanFilter(
        method='filter_unread',
        help_text='Filter unread notifications'
    )
    
    priority = django_filters.ChoiceFilter(
        field_name='priority',
        choices=Notification.PRIORITY_CHOICES,
        help_text='Filter by priority'
    )
    
    dateFrom = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='Filter notifications from this date'
    )
    
    dateTo = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='Filter notifications until this date'
    )
    
    class Meta:
        model = Notification
        fields = ['type', 'unread', 'priority', 'dateFrom', 'dateTo']
    
    def filter_unread(self, queryset, name, value):
        """Filter unread notifications"""
        if value:
            return queryset.filter(is_read=False)
        elif value is False:
            return queryset.filter(is_read=True)
        return queryset 