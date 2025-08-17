"""
Admin panel models for Spinny Car Marketplace
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class CarReview(models.Model):
    """
    Admin review records for car listings
    """
    ACTION_CHOICES = [
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('request_changes', 'Request Changes'),
        ('flag', 'Flag for Review'),
        ('feature', 'Mark as Featured'),
        ('unfeature', 'Remove Featured'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Related objects
    car = models.ForeignKey('cars.Car', on_delete=models.CASCADE, related_name='admin_reviews')
    admin = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.CASCADE,
        related_name='car_reviews'
    )
    
    # Review details
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    reason = models.CharField(max_length=255, blank=True)
    feedback = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    
    # Pricing suggestions
    suggested_price = models.PositiveIntegerField(blank=True, null=True)
    price_feedback = models.TextField(blank=True)
    
    # Quality assessment
    quality_score = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Quality score out of 100"
    )
    completeness_score = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Listing completeness score out of 100"
    )
    
    # Priority and flags
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    requires_follow_up = models.BooleanField(default=False)
    follow_up_date = models.DateTimeField(blank=True, null=True)
    
    # Review checklist
    photos_quality = models.CharField(
        max_length=20,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('acceptable', 'Acceptable'),
            ('poor', 'Poor'),
        ],
        blank=True
    )
    description_quality = models.CharField(
        max_length=20,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('acceptable', 'Acceptable'),
            ('poor', 'Poor'),
        ],
        blank=True
    )
    pricing_appropriateness = models.CharField(
        max_length=20,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('acceptable', 'Acceptable'),
            ('overpriced', 'Overpriced'),
            ('underpriced', 'Underpriced'),
        ],
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'car_reviews'
        verbose_name = 'Car Review'
        verbose_name_plural = 'Car Reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['car', '-created_at']),
            models.Index(fields=['admin', '-created_at']),
            models.Index(fields=['action']),
            models.Index(fields=['priority']),
        ]
    
    def __str__(self):
        return f"{self.action.title()} for {self.car.title} by {self.admin.name}"


class ModerationQueue(models.Model):
    """
    Queue for items requiring moderation
    """
    ITEM_TYPES = [
        ('car_listing', 'Car Listing'),
        ('user_profile', 'User Profile'),
        ('inquiry', 'Inquiry'),
        ('user_report', 'User Report'),
        ('content_flag', 'Content Flag'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('escalated', 'Escalated'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Item details
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    item_id = models.UUIDField()  # Generic foreign key to any model
    item_title = models.CharField(max_length=255)
    
    # Related objects
    car = models.ForeignKey('cars.Car', on_delete=models.CASCADE, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    inquiry = models.ForeignKey(
        'communication.Inquiry',
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )
    
    # Moderation details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    assigned_to = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='assigned_items'
    )
    
    # Issue description
    issue_description = models.TextField()
    reporter = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='reported_items'
    )
    
    # Resolution
    resolution = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='resolved_items'
    )
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    escalated_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'moderation_queue'
        verbose_name = 'Moderation Queue Item'
        verbose_name_plural = 'Moderation Queue'
        ordering = ['priority', '-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['item_type', 'status']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.item_type} - {self.item_title} ({self.status})"


class AdminActivity(models.Model):
    """
    Log of admin activities for audit trail
    """
    ACTIVITY_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('car_approve', 'Car Approved'),
        ('car_reject', 'Car Rejected'),
        ('car_flag', 'Car Flagged'),
        ('user_suspend', 'User Suspended'),
        ('user_activate', 'User Activated'),
        ('config_change', 'Configuration Change'),
        ('bulk_action', 'Bulk Action'),
        ('report_generate', 'Report Generated'),
        ('moderation_action', 'Moderation Action'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Admin and activity details
    admin = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.CASCADE,
        related_name='activities'
    )
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField()
    
    # Context data
    metadata = models.JSONField(default=dict)  # Additional context like affected IDs, old/new values
    
    # Related objects
    affected_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='admin_actions'
    )
    affected_car = models.ForeignKey(
        'cars.Car',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    
    # Request details
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_activities'
        verbose_name = 'Admin Activity'
        verbose_name_plural = 'Admin Activities'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', '-created_at']),
            models.Index(fields=['activity_type', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.admin.name} - {self.activity_type} at {self.created_at}"


class SystemAlert(models.Model):
    """
    System alerts for administrators
    """
    ALERT_TYPES = [
        ('error', 'System Error'),
        ('warning', 'Warning'),
        ('info', 'Information'),
        ('security', 'Security Alert'),
        ('performance', 'Performance Issue'),
        ('maintenance', 'Maintenance Required'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Alert details
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    
    # Context data
    metadata = models.JSONField(default=dict)  # Technical details, stack traces, etc.
    source = models.CharField(max_length=100, blank=True)  # Component that generated the alert
    
    # Status
    is_acknowledged = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='acknowledged_alerts'
    )
    resolved_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='resolved_alerts'
    )
    
    # Resolution details
    resolution_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'system_alerts'
        verbose_name = 'System Alert'
        verbose_name_plural = 'System Alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['severity', '-created_at']),
            models.Index(fields=['alert_type', 'is_resolved']),
            models.Index(fields=['is_acknowledged', 'is_resolved']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.alert_type.title()}: {self.title}"


class BulkAction(models.Model):
    """
    Track bulk administrative actions
    """
    ACTION_TYPES = [
        ('approve_cars', 'Bulk Approve Cars'),
        ('reject_cars', 'Bulk Reject Cars'),
        ('delete_cars', 'Bulk Delete Cars'),
        ('suspend_users', 'Bulk Suspend Users'),
        ('activate_users', 'Bulk Activate Users'),
        ('send_notifications', 'Bulk Send Notifications'),
        ('update_prices', 'Bulk Update Prices'),
        ('feature_cars', 'Bulk Feature Cars'),
    ]
    
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Action details
    action_type = models.CharField(max_length=30, choices=ACTION_TYPES)
    description = models.TextField()
    admin = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.CASCADE,
        related_name='bulk_actions'
    )
    
    # Target selection criteria
    selection_criteria = models.JSONField(default=dict)  # Filters used to select items
    
    # Progress tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    total_items = models.PositiveIntegerField(default=0)
    processed_items = models.PositiveIntegerField(default=0)
    successful_items = models.PositiveIntegerField(default=0)
    failed_items = models.PositiveIntegerField(default=0)
    
    # Results
    results = models.JSONField(default=dict)  # Detailed results including errors
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'bulk_actions'
        verbose_name = 'Bulk Action'
        verbose_name_plural = 'Bulk Actions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['action_type']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.action_type} by {self.admin.name} - {self.status}"
    
    @property
    def progress_percentage(self):
        """Calculate progress percentage"""
        if self.total_items == 0:
            return 0
        return (self.processed_items / self.total_items) * 100 