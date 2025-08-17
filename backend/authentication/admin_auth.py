"""
Custom authentication for admin tokens
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser
from .models import AdminUser


class AdminTokenAuthentication(BaseAuthentication):
    """
    Simple token based authentication for admin users.
    
    Clients should authenticate by passing the token key in the "Authorization"
    HTTP header, prepended with the string "Bearer ".  For example:
    
        Authorization: Bearer admin_token_1317ea67-0e36-42c3-95fc-e246f406d9c1
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None
            
        auth_parts = auth_header.split()
        
        if len(auth_parts) != 2 or auth_parts[0].lower() != 'bearer':
            return None
            
        token = auth_parts[1]
        
        # Check if it's an admin token (starts with 'admin_token_')
        if not token.startswith('admin_token_'):
            return None
            
        # Extract admin ID from token
        try:
            admin_id = token.replace('admin_token_', '')
            admin_user = AdminUser.objects.get(id=admin_id, is_active=True)
            
            # Create a custom user object for the admin
            user = AdminUserProxy(admin_user)
            return (user, token)
            
        except (AdminUser.DoesNotExist, ValueError):
            raise AuthenticationFailed('Invalid admin token')
    
    def authenticate_header(self, request):
        return 'Bearer'


class AdminUserProxy:
    """
    Proxy class to make AdminUser work with Django's authentication system
    """
    def __init__(self, admin_user):
        self.admin_user = admin_user  # Expose the original admin_user for serializers
        self.is_authenticated = True
        self.is_active = admin_user.is_active
        self.is_staff = True
        self.is_superuser = admin_user.role == 'super_admin'
        self.id = admin_user.id
        self.username = admin_user.email
        self.email = admin_user.email
        self.first_name = admin_user.name
        self.last_name = ''
    
    def __str__(self):
        return f"AdminUser: {self.admin_user.name} ({self.admin_user.email})"
    
    def has_perm(self, perm, obj=None):
        """Check if admin has permission"""
        return self.admin_user.has_permission(perm) if hasattr(self.admin_user, 'has_permission') else True
    
    def has_perms(self, perm_list, obj=None):
        """Check if admin has all permissions"""
        return all(self.has_perm(perm, obj) for perm in perm_list)
    
    def has_module_perms(self, app_label):
        """Check if admin has permissions for app"""
        return True
    
    def get_all_permissions(self, obj=None):
        """Get all permissions for admin"""
        return set(self.admin_user.permissions) if self.admin_user.permissions else set()
    
    def get_group_permissions(self, obj=None):
        """Get group permissions (empty for admin users)"""
        return set() 