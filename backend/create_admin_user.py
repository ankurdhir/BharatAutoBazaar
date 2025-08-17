#!/usr/bin/env python
"""
Standalone script to create admin user
Run this from the backend directory: python create_admin_user.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spinny_api.settings')
django.setup()

from authentication.models import AdminUser


def create_admin_user():
    """Create default admin user"""
    
    # Default admin credentials
    admin_data = {
        'name': 'System Admin',
        'email': 'admin@spinny.com',
        'password_hash': 'admin123',  # Plain text for development
        'role': 'super_admin',
        'permissions': [
            'manage_listings',
            'manage_users', 
            'view_analytics',
            'manage_reviews',
            'system_settings'
        ],
        'is_active': True
    }
    
    # Check if admin already exists
    if AdminUser.objects.filter(email=admin_data['email']).exists():
        print(f"❌ Admin user with email {admin_data['email']} already exists!")
        
        # Show existing admin details
        admin = AdminUser.objects.get(email=admin_data['email'])
        print(f"📋 Existing admin details:")
        print(f"   Name: {admin.name}")
        print(f"   Email: {admin.email}")
        print(f"   Role: {admin.role}")
        print(f"   Password: admin123 (if unchanged)")
        return
    
    # Create admin user
    try:
        admin_user = AdminUser.objects.create(**admin_data)
        
        print("✅ Successfully created admin user!")
        print(f"📋 Admin Details:")
        print(f"   Name: {admin_user.name}")
        print(f"   Email: {admin_user.email}")
        print(f"   Password: admin123")
        print(f"   Role: {admin_user.role}")
        print(f"   ID: {admin_user.id}")
        
        print("\n🌐 You can now login at: http://localhost:3000/admin/login")
        print("⚠️  Note: Password is plain text for development only!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")


if __name__ == '__main__':
    create_admin_user() 