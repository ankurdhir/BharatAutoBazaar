"""
Django admin configuration for authentication models
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, OTPToken, AdminUser, UserSession, SavedSearch


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom user admin configuration
    """
    list_display = [
        'phone_number', 'name', 'email', 'city', 'is_verified', 
        'is_seller', 'is_active', 'created_at'
    ]
    list_filter = [
        'is_verified', 'is_seller', 'is_active', 'city', 'state', 'created_at'
    ]
    search_fields = ['phone_number', 'name', 'email', 'city']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'phone_number', 'email', 'name', 'avatar')
        }),
        ('Location', {
            'fields': ('city', 'state')
        }),
        ('Status', {
            'fields': ('is_active', 'is_verified', 'is_seller')
        }),
        ('Preferences', {
            'fields': ('email_notifications', 'sms_notifications', 'push_notifications')
        }),
        ('Important dates', {
            'fields': ('last_login', 'created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(OTPToken)
class OTPTokenAdmin(admin.ModelAdmin):
    """
    OTP Token admin configuration
    """
    list_display = [
        'phone_number', 'purpose', 'otp', 'is_used', 'attempts', 
        'created_at', 'expires_at', 'is_expired'
    ]
    list_filter = ['purpose', 'is_used', 'created_at', 'expires_at']
    search_fields = ['phone_number', 'otp']
    readonly_fields = ['id', 'otp', 'created_at', 'expires_at', 'used_at']
    ordering = ['-created_at']
    
    def is_expired(self, obj):
        """Check if OTP is expired"""
        from django.utils import timezone
        return timezone.now() > obj.expires_at
    is_expired.boolean = True
    is_expired.short_description = 'Expired'
    
    def has_add_permission(self, request):
        """Disable manual OTP creation"""
        return False


@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    """
    Admin user configuration
    """
    list_display = ['name', 'email', 'role', 'is_active', 'last_login', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['name', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_login']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'email', 'password_hash')
        }),
        ('Role & Permissions', {
            'fields': ('role', 'permissions', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at', 'last_login')
        }),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """
    User session admin configuration
    """
    list_display = [
        'user_display', 'device_type', 'browser', 'location', 
        'is_active', 'created_at', 'last_activity'
    ]
    list_filter = ['device_type', 'browser', 'is_active', 'created_at']
    search_fields = ['user__phone_number', 'user__name', 'ip_address', 'location']
    readonly_fields = [
        'id', 'session_token', 'ip_address', 'user_agent', 'created_at', 
        'last_activity', 'expires_at'
    ]
    ordering = ['-created_at']
    
    def user_display(self, obj):
        """Display user information"""
        return f"{obj.user.name or obj.user.phone_number}"
    user_display.short_description = 'User'
    
    def has_add_permission(self, request):
        """Disable manual session creation"""
        return False


@admin.register(SavedSearch)
class SavedSearchAdmin(admin.ModelAdmin):
    """
    Saved search admin configuration
    """
    list_display = [
        'user_display', 'name', 'notifications_enabled', 
        'notification_frequency', 'created_at'
    ]
    list_filter = ['notifications_enabled', 'notification_frequency', 'created_at']
    search_fields = ['user__phone_number', 'user__name', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def user_display(self, obj):
        """Display user information"""
        return f"{obj.user.name or obj.user.phone_number}"
    user_display.short_description = 'User'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


# Customize admin site headers
admin.site.site_header = "Bharat Auto Bazaar Admin"
admin.site.site_title = "Bharat Auto Bazaar Admin Portal"
admin.site.index_title = "Welcome to Bharat Auto Bazaar Administration" 