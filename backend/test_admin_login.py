#!/usr/bin/env python
"""
Test script to verify admin login functionality
Run this from the backend directory: python test_admin_login.py
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spinny_api.settings')
django.setup()

from authentication.models import AdminUser


def test_admin_setup():
    """Test admin user creation and API login"""
    
    print("🔍 Testing Admin Setup...")
    print("=" * 50)
    
    # Check if admin user exists
    admin_count = AdminUser.objects.count()
    print(f"📊 Total admin users in database: {admin_count}")
    
    if admin_count == 0:
        print("❌ No admin users found! Creating default admin...")
        
        # Create admin user
        admin_user = AdminUser.objects.create(
            name='System Admin',
            email='admin@spinny.com',
            password_hash='admin123',
            role='super_admin',
            permissions=['manage_listings', 'manage_users', 'view_analytics', 'manage_reviews', 'system_settings'],
            is_active=True
        )
        print(f"✅ Created admin user: {admin_user.name} ({admin_user.email})")
    else:
        print("✅ Admin users found:")
        for admin in AdminUser.objects.all():
            print(f"   - {admin.name} ({admin.email}) - {admin.role}")
    
    # Test API endpoint
    print("\n🌐 Testing API endpoint...")
    try:
        response = requests.post(
            'http://localhost:8000/api/v1/auth/admin/login/',
            json={
                'email': 'admin@spinny.com',
                'password': 'admin123'
            },
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        print(f"📡 Status Code: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Admin login API is working!")
        else:
            print("❌ Admin login API returned an error")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server at http://localhost:8000")
        print("💡 Make sure to run: python manage.py runserver 8000")
    except Exception as e:
        print(f"❌ Error testing API: {str(e)}")
    
    print("\n📋 Summary:")
    print("1. Make sure Django server is running: python manage.py runserver 8000")
    print("2. Admin credentials: admin@spinny.com / admin123") 
    print("3. Frontend URL: http://localhost:3001/admin/login")
    print("4. API endpoint: http://localhost:8000/api/v1/auth/admin/login/")


if __name__ == '__main__':
    test_admin_setup() 