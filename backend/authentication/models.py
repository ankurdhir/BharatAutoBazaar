"""
Authentication models for Spinny Car Marketplace
"""
import uuid
import random
from datetime import timedelta
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField


class User(AbstractUser):
    """
    Custom User model with phone number authentication
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=False, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone_number = PhoneNumberField(unique=True)
    name = models.CharField(max_length=255, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Profile information
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    is_seller = models.BooleanField(default=False)
    
    # Preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return str(self.phone_number)
    
    @property
    def full_name(self):
        return self.name or str(self.phone_number)
    
    def get_display_name(self):
        if self.name:
            return self.name
        return str(self.phone_number)


class OTPToken(models.Model):
    """
    OTP Token model for phone number verification
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = PhoneNumberField()
    otp = models.CharField(max_length=6)
    purpose = models.CharField(
        max_length=20,
        choices=[
            ('login', 'Login'),
            ('registration', 'Registration'),
            ('password_reset', 'Password Reset'),
            ('phone_verification', 'Phone Verification'),
        ],
        default='login'
    )
    
    # Token management
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    max_attempts = models.PositiveIntegerField(default=3)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'auth_otp_tokens'
        verbose_name = 'OTP Token'
        verbose_name_plural = 'OTP Tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP for {self.phone_number} - {self.purpose}"
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=5)
        if not self.otp:
            self.otp = self.generate_otp()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_otp():
        """Generate a 6-digit OTP"""
        return str(random.randint(100000, 999999))
    
    def is_valid(self):
        """Check if OTP is valid (not used, not expired, attempts not exceeded)"""
        return (
            not self.is_used and
            timezone.now() < self.expires_at and
            self.attempts < self.max_attempts
        )
    
    def verify(self, otp_input):
        """Verify the OTP"""
        self.attempts += 1
        
        if not self.is_valid():
            self.save()
            return False
        
        if self.otp == otp_input:
            self.is_used = True
            self.used_at = timezone.now()
            self.save()
            return True
        
        self.save()
        return False


class AdminUser(models.Model):
    """
    Admin user model for admin panel access
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=[
            ('admin', 'Admin'),
            ('super_admin', 'Super Admin'),
            ('moderator', 'Moderator'),
        ],
        default='admin'
    )
    
    # Permissions
    permissions = models.JSONField(default=list)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True)
    
    class Meta:
        db_table = 'admin_users'
        verbose_name = 'Admin User'
        verbose_name_plural = 'Admin Users'
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    def has_permission(self, permission):
        """Check if admin has specific permission"""
        return permission in self.permissions or self.role == 'super_admin'


class UserSession(models.Model):
    """
    User session tracking for analytics and security
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_token = models.CharField(max_length=255, unique=True)
    
    # Session details
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    device_type = models.CharField(max_length=50, blank=True)  # mobile, desktop, tablet
    browser = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=255, blank=True)  # City, Country
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    # Status
    is_active = models.BooleanField(default=True)
    logout_reason = models.CharField(
        max_length=20,
        choices=[
            ('manual', 'Manual Logout'),
            ('expired', 'Session Expired'),
            ('security', 'Security Logout'),
            ('admin', 'Admin Terminated'),
        ],
        blank=True
    )
    
    class Meta:
        db_table = 'user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Session for {self.user.phone_number}"
    
    def is_valid(self):
        """Check if session is still valid"""
        return self.is_active and timezone.now() < self.expires_at


class SavedSearch(models.Model):
    """
    User's saved search queries for notifications
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_searches')
    name = models.CharField(max_length=255)
    
    # Search parameters
    search_filters = models.JSONField()  # Store all search filters as JSON
    
    # Notification settings
    notifications_enabled = models.BooleanField(default=True)
    notification_frequency = models.CharField(
        max_length=20,
        choices=[
            ('immediate', 'Immediate'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
        ],
        default='daily'
    )
    last_notification_sent = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'saved_searches'
        verbose_name = 'Saved Search'
        verbose_name_plural = 'Saved Searches'
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.user.phone_number} - {self.name}" 