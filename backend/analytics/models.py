"""
Analytics models for Spinny Car Marketplace
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class CarAnalytics(models.Model):
    """
    Analytics data for individual cars
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car = models.OneToOneField('cars.Car', on_delete=models.CASCADE, related_name='analytics')
    
    # View metrics
    total_views = models.PositiveIntegerField(default=0)
    unique_views = models.PositiveIntegerField(default=0)
    weekly_views = models.PositiveIntegerField(default=0)
    daily_views = models.PositiveIntegerField(default=0)
    
    # Engagement metrics
    total_inquiries = models.PositiveIntegerField(default=0)
    inquiry_conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)  # inquiries/views * 100
    total_favorites = models.PositiveIntegerField(default=0)
    phone_clicks = models.PositiveIntegerField(default=0)
    email_clicks = models.PositiveIntegerField(default=0)
    
    # Performance ranking
    performance_rank = models.PositiveIntegerField(default=0)  # Rank among similar cars
    performance_category = models.CharField(
        max_length=20,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('average', 'Average'),
            ('poor', 'Poor'),
        ],
        default='average'
    )
    
    # Time metrics
    average_time_on_page = models.FloatField(default=0.0)  # in seconds
    bounce_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)  # percentage
    
    # Geographic data
    top_cities = models.JSONField(default=list)  # [{"city": "Delhi", "views": 45}, ...]
    
    # Device breakdown
    mobile_views = models.PositiveIntegerField(default=0)
    desktop_views = models.PositiveIntegerField(default=0)
    tablet_views = models.PositiveIntegerField(default=0)
    
    # Price analysis
    price_competitiveness = models.CharField(
        max_length=20,
        choices=[
            ('very_high', 'Very High'),
            ('high', 'High'),
            ('market', 'At Market'),
            ('below_market', 'Below Market'),
            ('bargain', 'Bargain'),
        ],
        default='market'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_calculated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'car_analytics'
        verbose_name = 'Car Analytics'
        verbose_name_plural = 'Car Analytics'
        indexes = [
            models.Index(fields=['performance_rank']),
            models.Index(fields=['total_views']),
            models.Index(fields=['inquiry_conversion_rate']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.car.title}"
    
    def calculate_conversion_rate(self):
        """Calculate and update inquiry conversion rate"""
        if self.total_views > 0:
            self.inquiry_conversion_rate = (self.total_inquiries / self.total_views) * 100
        else:
            self.inquiry_conversion_rate = 0.0
        self.save()


class SellerAnalytics(models.Model):
    """
    Analytics data for sellers
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_analytics')
    
    # Listing metrics
    total_listings = models.PositiveIntegerField(default=0)
    active_listings = models.PositiveIntegerField(default=0)
    sold_listings = models.PositiveIntegerField(default=0)
    pending_listings = models.PositiveIntegerField(default=0)
    rejected_listings = models.PositiveIntegerField(default=0)
    
    # Performance metrics
    total_views = models.PositiveIntegerField(default=0)
    total_inquiries = models.PositiveIntegerField(default=0)
    average_response_time = models.FloatField(default=0.0)  # in hours
    response_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)  # percentage
    
    # Rating and reviews
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)
    
    # Financial metrics
    total_sales_value = models.PositiveIntegerField(default=0)  # in rupees
    average_selling_time = models.PositiveIntegerField(default=0)  # in days
    this_month_sales = models.PositiveIntegerField(default=0)
    
    # Quality metrics
    listing_approval_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    average_quality_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_calculated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seller_analytics'
        verbose_name = 'Seller Analytics'
        verbose_name_plural = 'Seller Analytics'
        indexes = [
            models.Index(fields=['average_rating']),
            models.Index(fields=['total_sales_value']),
            models.Index(fields=['response_rate']),
        ]
    
    def __str__(self):
        return f"Analytics for seller {self.seller.phone_number}"


class SystemAnalytics(models.Model):
    """
    System-wide analytics and metrics
    """
    METRIC_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Metric identification
    metric_type = models.CharField(max_length=10, choices=METRIC_TYPES)
    date = models.DateField()
    
    # User metrics
    total_users = models.PositiveIntegerField(default=0)
    new_users = models.PositiveIntegerField(default=0)
    active_users = models.PositiveIntegerField(default=0)
    verified_users = models.PositiveIntegerField(default=0)
    
    # Listing metrics
    total_listings = models.PositiveIntegerField(default=0)
    new_listings = models.PositiveIntegerField(default=0)
    approved_listings = models.PositiveIntegerField(default=0)
    rejected_listings = models.PositiveIntegerField(default=0)
    sold_listings = models.PositiveIntegerField(default=0)
    
    # Engagement metrics
    total_views = models.PositiveIntegerField(default=0)
    total_inquiries = models.PositiveIntegerField(default=0)
    total_searches = models.PositiveIntegerField(default=0)
    total_favorites = models.PositiveIntegerField(default=0)
    
    # Financial metrics
    total_sales_value = models.BigIntegerField(default=0)  # in rupees
    average_car_price = models.PositiveIntegerField(default=0)
    
    # Quality metrics
    average_listing_quality = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    average_response_time = models.FloatField(default=0.0)  # in hours
    
    # Geographic distribution
    top_cities = models.JSONField(default=list)
    city_distribution = models.JSONField(default=dict)
    
    # Device and traffic metrics
    mobile_traffic_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    desktop_traffic_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    tablet_traffic_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    # Popular searches
    top_search_terms = models.JSONField(default=list)
    top_brands = models.JSONField(default=list)
    top_price_ranges = models.JSONField(default=list)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_analytics'
        verbose_name = 'System Analytics'
        verbose_name_plural = 'System Analytics'
        unique_together = ['metric_type', 'date']
        ordering = ['-date', 'metric_type']
        indexes = [
            models.Index(fields=['metric_type', 'date']),
            models.Index(fields=['-date']),
        ]
    
    def __str__(self):
        return f"{self.metric_type.title()} analytics for {self.date}"


class UserActivityLog(models.Model):
    """
    Track user activities for analytics
    """
    ACTION_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('view_car', 'View Car'),
        ('search', 'Search'),
        ('inquiry', 'Send Inquiry'),
        ('favorite', 'Add to Favorites'),
        ('create_listing', 'Create Listing'),
        ('edit_listing', 'Edit Listing'),
        ('delete_listing', 'Delete Listing'),
        ('upload_image', 'Upload Image'),
        ('calculate_emi', 'Calculate EMI'),
        ('profile_update', 'Update Profile'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # User and action details
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField(blank=True)
    
    # Context data
    metadata = models.JSONField(default=dict)  # Additional context data
    
    # Related objects
    car = models.ForeignKey('cars.Car', on_delete=models.SET_NULL, blank=True, null=True)
    inquiry = models.ForeignKey(
        'communication.Inquiry',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    
    # Request details
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_activity_logs'
        verbose_name = 'User Activity Log'
        verbose_name_plural = 'User Activity Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action_type', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.phone_number} - {self.action_type}"


class ConversionFunnel(models.Model):
    """
    Track conversion funnel metrics
    """
    FUNNEL_STAGES = [
        ('visit', 'Website Visit'),
        ('search', 'Search Cars'),
        ('view', 'View Car Details'),
        ('inquiry', 'Send Inquiry'),
        ('contact', 'Contact Seller'),
        ('test_drive', 'Schedule Test Drive'),
        ('purchase', 'Purchase'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Funnel tracking
    stage = models.CharField(max_length=20, choices=FUNNEL_STAGES)
    date = models.DateField()
    
    # Metrics
    total_users = models.PositiveIntegerField(default=0)
    new_users = models.PositiveIntegerField(default=0)
    returning_users = models.PositiveIntegerField(default=0)
    conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    # User segmentation
    mobile_users = models.PositiveIntegerField(default=0)
    desktop_users = models.PositiveIntegerField(default=0)
    
    # Geographic breakdown
    city_breakdown = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversion_funnel'
        verbose_name = 'Conversion Funnel'
        verbose_name_plural = 'Conversion Funnel'
        unique_together = ['stage', 'date']
        ordering = ['-date', 'stage']
        indexes = [
            models.Index(fields=['date', 'stage']),
            models.Index(fields=['-date']),
        ]
    
    def __str__(self):
        return f"{self.stage} - {self.date}"


class RevenueAnalytics(models.Model):
    """
    Revenue and financial analytics
    """
    PERIOD_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Period identification
    period_type = models.CharField(max_length=10, choices=PERIOD_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Revenue metrics
    total_revenue = models.BigIntegerField(default=0)  # in rupees
    commission_revenue = models.BigIntegerField(default=0)
    featured_listing_revenue = models.BigIntegerField(default=0)
    premium_service_revenue = models.BigIntegerField(default=0)
    
    # Transaction metrics
    total_transactions = models.PositiveIntegerField(default=0)
    average_transaction_value = models.PositiveIntegerField(default=0)
    
    # Growth metrics
    revenue_growth = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)  # percentage
    transaction_growth = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    
    # Top performers
    top_selling_brands = models.JSONField(default=list)
    top_selling_cities = models.JSONField(default=list)
    top_revenue_sellers = models.JSONField(default=list)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'revenue_analytics'
        verbose_name = 'Revenue Analytics'
        verbose_name_plural = 'Revenue Analytics'
        unique_together = ['period_type', 'start_date', 'end_date']
        ordering = ['-start_date', 'period_type']
        indexes = [
            models.Index(fields=['period_type', 'start_date']),
            models.Index(fields=['-start_date']),
        ]
    
    def __str__(self):
        return f"{self.period_type.title()} revenue for {self.start_date} to {self.end_date}" 