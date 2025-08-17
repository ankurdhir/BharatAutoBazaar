"""
Utility models for Spinny Car Marketplace
"""
import uuid
from django.db import models


class EMICalculation(models.Model):
    """
    Store EMI calculation history for analytics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Calculation parameters
    principal = models.PositiveIntegerField()  # Loan amount in rupees
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Annual interest rate percentage
    tenure = models.PositiveIntegerField()  # Tenure in months
    
    # Calculated values
    emi = models.PositiveIntegerField()  # Monthly EMI
    total_amount = models.PositiveIntegerField()  # Total amount payable
    total_interest = models.PositiveIntegerField()  # Total interest
    
    # Related car (optional)
    car = models.ForeignKey('cars.Car', on_delete=models.SET_NULL, blank=True, null=True)
    
    # User tracking
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='emi_calculations'
    )
    session_id = models.CharField(max_length=255, blank=True)  # For anonymous users
    
    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'emi_calculations'
        verbose_name = 'EMI Calculation'
        verbose_name_plural = 'EMI Calculations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['car']),
        ]
    
    def __str__(self):
        return f"EMI Calculation: ₹{self.principal} @ {self.interest_rate}% for {self.tenure} months"


class CarFeature(models.Model):
    """
    Master list of car features
    """
    CATEGORY_CHOICES = [
        ('safety', 'Safety'),
        ('comfort', 'Comfort'),
        ('convenience', 'Convenience'),
        ('entertainment', 'Entertainment'),
        ('exterior', 'Exterior'),
        ('interior', 'Interior'),
        ('engine', 'Engine'),
        ('technology', 'Technology'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # CSS icon class or emoji
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0)  # How many cars have this feature
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'car_features'
        verbose_name = 'Car Feature'
        verbose_name_plural = 'Car Features'
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class SystemConfiguration(models.Model):
    """
    System-wide configuration settings
    """
    CONFIG_TYPES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('float', 'Float'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    value_type = models.CharField(max_length=10, choices=CONFIG_TYPES, default='string')
    description = models.TextField(blank=True)
    
    # Categorization
    category = models.CharField(max_length=50, default='general')
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    
    class Meta:
        db_table = 'system_configurations'
        verbose_name = 'System Configuration'
        verbose_name_plural = 'System Configurations'
        ordering = ['category', 'key']
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    def get_value(self):
        """Get the properly typed value"""
        if self.value_type == 'integer':
            return int(self.value)
        elif self.value_type == 'float':
            return float(self.value)
        elif self.value_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.value_type == 'json':
            import json
            return json.loads(self.value)
        return self.value


class APIRateLimit(models.Model):
    """
    Track API rate limiting per user/IP
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Identifier
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='rate_limits'
    )
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    endpoint = models.CharField(max_length=255)
    
    # Rate limiting data
    request_count = models.PositiveIntegerField(default=1)
    window_start = models.DateTimeField(auto_now_add=True)
    last_request = models.DateTimeField(auto_now=True)
    
    # Status
    is_blocked = models.BooleanField(default=False)
    blocked_until = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'api_rate_limits'
        verbose_name = 'API Rate Limit'
        verbose_name_plural = 'API Rate Limits'
        unique_together = [
            ['user', 'endpoint'],
            ['ip_address', 'endpoint'],
        ]
        indexes = [
            models.Index(fields=['user', 'endpoint']),
            models.Index(fields=['ip_address', 'endpoint']),
            models.Index(fields=['window_start']),
        ]
    
    def __str__(self):
        identifier = self.user.phone_number if self.user else self.ip_address
        return f"Rate limit for {identifier} on {self.endpoint}"


class FileUpload(models.Model):
    """
    Track file uploads for cars
    """
    UPLOAD_TYPES = [
        ('car_image', 'Car Image'),
        ('car_video', 'Car Video'),
        ('user_avatar', 'User Avatar'),
        ('brand_logo', 'Brand Logo'),
        ('document', 'Document'),
    ]
    
    STATUS_CHOICES = [
        ('uploading', 'Uploading'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # File details
    original_filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size = models.PositiveIntegerField()  # in bytes
    mime_type = models.CharField(max_length=100)
    file_hash = models.CharField(max_length=64, blank=True)  # SHA256 hash
    
    # Upload metadata
    upload_type = models.CharField(max_length=20, choices=UPLOAD_TYPES)
    uploader = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='uploaded_files'
    )
    
    # Related objects
    car = models.ForeignKey('cars.Car', on_delete=models.CASCADE, blank=True, null=True)
    
    # Processing status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
    processing_progress = models.PositiveIntegerField(default=0)  # 0-100%
    error_message = models.TextField(blank=True)
    
    # Image/Video specific data
    width = models.PositiveIntegerField(blank=True, null=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    duration = models.PositiveIntegerField(blank=True, null=True)  # for videos, in seconds
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'file_uploads'
        verbose_name = 'File Upload'
        verbose_name_plural = 'File Uploads'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['uploader', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['upload_type']),
            models.Index(fields=['car']),
        ]
    
    def __str__(self):
        return f"{self.original_filename} by {self.uploader.phone_number}"


class SearchQuery(models.Model):
    """
    Track search queries for analytics and improving search
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Search details
    query = models.TextField()
    filters = models.JSONField(default=dict)  # Applied filters
    results_count = models.PositiveIntegerField(default=0)
    
    # User context
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='search_queries'
    )
    session_id = models.CharField(max_length=255, blank=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    page_number = models.PositiveIntegerField(default=1)
    
    # Performance
    execution_time = models.FloatField(blank=True, null=True)  # in milliseconds
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'search_queries'
        verbose_name = 'Search Query'
        verbose_name_plural = 'Search Queries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['query']),
        ]
    
    def __str__(self):
        return f"Search: {self.query[:50]}{'...' if len(self.query) > 50 else ''}" 