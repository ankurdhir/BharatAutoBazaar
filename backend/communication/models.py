"""
Communication models for Spinny Car Marketplace
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from phonenumber_field.modelfields import PhoneNumberField

User = get_user_model()


class Inquiry(models.Model):
    """
    Car inquiries from potential buyers
    """
    STATUS_CHOICES = [
        ('new', 'New'),
        ('responded', 'Responded'),
        ('closed', 'Closed'),
        ('spam', 'Spam'),
    ]
    
    CONTACT_TIME_CHOICES = [
        ('morning', 'Morning (9 AM - 12 PM)'),
        ('afternoon', 'Afternoon (12 PM - 5 PM)'),
        ('evening', 'Evening (5 PM - 9 PM)'),
        ('anytime', 'Anytime'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Car and users
    car = models.ForeignKey('cars.Car', on_delete=models.CASCADE, related_name='inquiries')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_inquiries')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='sent_inquiries')
    
    # Buyer contact information (for non-registered users)
    buyer_name = models.CharField(max_length=255)
    buyer_phone = PhoneNumberField()
    buyer_email = models.EmailField(blank=True)
    
    # Inquiry details
    message = models.TextField()
    preferred_contact_time = models.CharField(
        max_length=20,
        choices=CONTACT_TIME_CHOICES,
        default='anytime'
    )
    
    # Status and response
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    seller_response = models.TextField(blank=True)
    
    # Flags
    is_serious_buyer = models.BooleanField(default=True)
    is_spam = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    
    class Meta:
        db_table = 'inquiries'
        verbose_name = 'Inquiry'
        verbose_name_plural = 'Inquiries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['car', '-created_at']),
            models.Index(fields=['buyer_phone']),
        ]
    
    def __str__(self):
        return f"Inquiry for {self.car.title} from {self.buyer_name}"
    
    def mark_as_responded(self, response_message):
        """Mark inquiry as responded"""
        from django.utils import timezone
        self.status = 'responded'
        self.seller_response = response_message
        self.responded_at = timezone.now()
        self.save()


class InquiryResponse(models.Model):
    """
    Responses to inquiries - conversation thread
    """
    SENDER_CHOICES = [
        ('buyer', 'Buyer'),
        ('seller', 'Seller'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inquiry = models.ForeignKey(Inquiry, on_delete=models.CASCADE, related_name='responses')
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    
    # Message content
    message = models.TextField()
    
    # Availability and preferences
    available_for_call = models.BooleanField(default=False)
    preferred_contact_time = models.CharField(
        max_length=20,
        choices=Inquiry.CONTACT_TIME_CHOICES,
        blank=True
    )
    
    # Status
    is_read = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'inquiry_responses'
        verbose_name = 'Inquiry Response'
        verbose_name_plural = 'Inquiry Responses'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Response from {self.sender_type} on {self.inquiry}"


class Notification(models.Model):
    """
    User notifications
    """
    TYPE_CHOICES = [
        ('inquiry_received', 'New Inquiry Received'),
        ('inquiry_response', 'Inquiry Response'),
        ('car_approved', 'Car Listing Approved'),
        ('car_rejected', 'Car Listing Rejected'),
        ('car_sold', 'Car Marked as Sold'),
        ('saved_search_match', 'Saved Search Match'),
        ('price_drop', 'Price Drop Alert'),
        ('system', 'System Notification'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    # Notification content
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict)  # Additional data like car_id, inquiry_id, etc.
    
    # Related objects
    car = models.ForeignKey('cars.Car', on_delete=models.CASCADE, blank=True, null=True)
    inquiry = models.ForeignKey(Inquiry, on_delete=models.CASCADE, blank=True, null=True)
    
    # Notification settings
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    # Delivery status
    is_read = models.BooleanField(default=False)
    is_sent_email = models.BooleanField(default=False)
    is_sent_sms = models.BooleanField(default=False)
    is_sent_push = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    scheduled_for = models.DateTimeField(blank=True, null=True)  # For scheduled notifications
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['type', 'is_read']),
            models.Index(fields=['scheduled_for']),
        ]
    
    def __str__(self):
        return f"{self.title} for {self.user.phone_number}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class EmailTemplate(models.Model):
    """
    Email templates for different notification types
    """
    TEMPLATE_TYPES = [
        ('inquiry_received', 'Inquiry Received'),
        ('inquiry_response', 'Inquiry Response'),
        ('car_approved', 'Car Approved'),
        ('car_rejected', 'Car Rejected'),
        ('welcome', 'Welcome Email'),
        ('otp', 'OTP Email'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPES)
    
    # Template content
    subject = models.CharField(max_length=255)
    html_content = models.TextField()
    text_content = models.TextField(blank=True)
    
    # Template variables
    variables = models.JSONField(default=list)  # List of available variables like {name}, {car_title}, etc.
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    
    class Meta:
        db_table = 'email_templates'
        verbose_name = 'Email Template'
        verbose_name_plural = 'Email Templates'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class EmailLog(models.Model):
    """
    Log of sent emails for tracking and debugging
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
        ('opened', 'Opened'),
        ('clicked', 'Clicked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Email details
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_logs')
    recipient_email = models.EmailField()
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, blank=True, null=True)
    
    # Content
    subject = models.CharField(max_length=255)
    html_content = models.TextField(blank=True)
    text_content = models.TextField(blank=True)
    
    # Related objects
    notification = models.ForeignKey(Notification, on_delete=models.SET_NULL, blank=True, null=True)
    car = models.ForeignKey('cars.Car', on_delete=models.SET_NULL, blank=True, null=True)
    inquiry = models.ForeignKey(Inquiry, on_delete=models.SET_NULL, blank=True, null=True)
    
    # Delivery status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    external_id = models.CharField(max_length=255, blank=True)  # Email service provider ID
    
    # Tracking
    opened_count = models.PositiveIntegerField(default=0)
    clicked_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    opened_at = models.DateTimeField(blank=True, null=True)
    clicked_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'email_logs'
        verbose_name = 'Email Log'
        verbose_name_plural = 'Email Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['template']),
        ]
    
    def __str__(self):
        return f"Email to {self.recipient_email} - {self.subject}"


class SMSLog(models.Model):
    """
    Log of sent SMS for tracking
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('delivered', 'Delivered'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # SMS details
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sms_logs')
    recipient_phone = PhoneNumberField()
    message = models.TextField()
    
    # Related objects
    notification = models.ForeignKey(Notification, on_delete=models.SET_NULL, blank=True, null=True)
    otp_token = models.ForeignKey(
        'authentication.OTPToken',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    
    # Delivery status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    external_id = models.CharField(max_length=255, blank=True)  # Twilio message SID
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'sms_logs'
        verbose_name = 'SMS Log'
        verbose_name_plural = 'SMS Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"SMS to {self.recipient_phone}" 