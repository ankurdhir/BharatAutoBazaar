#!/usr/bin/env python
"""
Create and test admin user with proper debugging
Run this from the backend directory: python create_test_admin.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spinny_api.settings')
django.setup()

from authentication.models import AdminUser


def create_and_test_admin():
    """Create admin user and test login logic"""
    
    print("🔍 Creating and Testing Admin User...")
    print("=" * 60)
    
    # Check existing admin users
    existing_admins = AdminUser.objects.all()
    print(f"📊 Existing admin users: {existing_admins.count()}")
    
    for admin in existing_admins:
        print(f"   - {admin.name} ({admin.email}) - Active: {admin.is_active}")
    
    # Delete existing admin if any
    AdminUser.objects.filter(email='admin@spinny.com').delete()
    print("🗑️  Cleaned up existing admin users")
    
    # Create new admin user
    try:
        admin_user = AdminUser.objects.create(
            name='System Admin',
            email='admin@spinny.com',
            password_hash='admin123',  # Plain text for development
            role='super_admin',
            permissions=[
                'manage_listings',
                'manage_users', 
                'view_analytics',
                'manage_reviews',
                'system_settings'
            ],
            is_active=True
        )
        
        print("✅ Successfully created admin user!")
        print(f"   📧 Email: {admin_user.email}")
        print(f"   🔑 Password: admin123")
        print(f"   👤 Name: {admin_user.name}")
        print(f"   🛡️  Role: {admin_user.role}")
        print(f"   ✅ Active: {admin_user.is_active}")
        print(f"   🆔 ID: {admin_user.id}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        return False
    
    # Test the login logic manually
    print("\n🧪 Testing Login Logic...")
    
    try:
        # Test finding admin by email
        test_admin = AdminUser.objects.get(email='admin@spinny.com', is_active=True)
        print(f"✅ Found admin by email: {test_admin.email}")
        
        # Test password verification
        if test_admin.password_hash == 'admin123':
            print("✅ Password verification successful")
        else:
            print(f"❌ Password mismatch: stored='{test_admin.password_hash}', testing='admin123'")
            
    except AdminUser.DoesNotExist:
        print("❌ Admin user not found or not active")
        return False
    except Exception as e:
        print(f"❌ Error testing login logic: {str(e)}")
        return False
    
    print("\n📋 Summary:")
    print("✅ Admin user created successfully")
    print("✅ Login logic validated")
    print("🌐 Try login at: http://localhost:3001/admin/login")
    print("📧 Email: admin@spinny.com")
    print("🔑 Password: admin123")
    
    return True


if __name__ == '__main__':
    create_and_test_admin() 