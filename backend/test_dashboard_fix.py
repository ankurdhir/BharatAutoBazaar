#!/usr/bin/env python
"""
Script to test and fix dashboard listings issue
"""
import os
import sys
import django
import requests
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spinny_api.settings')
django.setup()

from authentication.models import User
from cars.models import Car
from rest_framework_simplejwt.tokens import RefreshToken

def main():
    print("🔧 Dashboard Fix Script")
    print("=" * 50)
    
    # Step 1: Check current database state
    print("\n📊 Current Database State:")
    total_cars = Car.objects.count()
    total_users = User.objects.count()
    print(f"   Total Cars: {total_cars}")
    print(f"   Total Users: {total_users}")
    
    # Show cars and their owners
    print("\n🚗 Cars and Owners:")
    for car in Car.objects.all():
        seller_info = f"{car.seller.name} (ID: {car.seller.id})" if car.seller else "No seller"
        print(f"   - {car.title}: {seller_info}")
    
    # Step 2: Create or get a test user
    print("\n👤 Setting up test user...")
    test_user, created = User.objects.get_or_create(
        phone_number='+919999999999',
        defaults={
            'name': 'Test User',
            'email': 'testuser@spinny.com',
            'is_verified': True,
            'is_active': True,
            'is_seller': True
        }
    )
    
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"   ✅ Created new test user: {test_user.name}")
    else:
        print(f"   ✅ Using existing test user: {test_user.name}")
    
    print(f"   📧 Email: {test_user.email}")
    print(f"   📱 Phone: {test_user.phone_number}")
    print(f"   🆔 ID: {test_user.id}")
    
    # Step 3: Assign existing cars to test user
    print("\n🔄 Assigning cars to test user...")
    cars_updated = 0
    for car in Car.objects.all():
        if not car.seller or car.seller.id != test_user.id:
            car.seller = test_user
            car.save()
            cars_updated += 1
            print(f"   ✅ Assigned '{car.title}' to {test_user.name}")
    
    if cars_updated == 0:
        print("   ℹ️  All cars already assigned to test user")
    
    # Step 4: Generate tokens for the test user
    print("\n🔑 Generating authentication tokens...")
    refresh = RefreshToken.for_user(test_user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    print(f"   ✅ Access Token: {access_token[:50]}...")
    print(f"   ✅ Refresh Token: {refresh_token[:50]}...")
    
    # Step 5: Test the API endpoints
    print("\n🧪 Testing API endpoints...")
    base_url = "http://localhost:8000/api/v1"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Test seller listings endpoint
        response = requests.get(f"{base_url}/cars/seller/listings/", headers=headers)
        print(f"   📡 Seller listings API: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                listings = data.get('data', {}).get('listings', [])
                stats = data.get('data', {}).get('stats', {})
                print(f"   ✅ Found {len(listings)} listings")
                print(f"   📊 Stats: {stats}")
            else:
                print(f"   ❌ API returned error: {data}")
        else:
            print(f"   ❌ API Error: {response.text}")
        
        # Test seller stats endpoint
        response = requests.get(f"{base_url}/cars/seller/stats/", headers=headers)
        print(f"   📡 Seller stats API: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Stats response: {data}")
        
    except requests.exceptions.ConnectionError:
        print("   ❌ Could not connect to server. Make sure Django server is running on port 8000")
    except Exception as e:
        print(f"   ❌ Error testing API: {e}")
    
    # Step 6: Provide frontend instructions
    print("\n💻 Frontend Login Instructions:")
    print("   1. Go to http://localhost:3001/login")
    print(f"   2. Login with phone: {test_user.phone_number}")
    print(f"   3. Or login with email: {test_user.email}")
    print("   4. Password: testpass123")
    print("   5. Go to dashboard to see your listings")
    
    print("\n🎯 Alternative: Use these tokens in browser console:")
    print(f"   localStorage.setItem('authToken', '{access_token}');")
    print(f"   localStorage.setItem('currentUser', JSON.stringify({{")
    print(f"     id: '{test_user.id}',")
    print(f"     name: '{test_user.name}',")
    print(f"     email: '{test_user.email}'")
    print(f"   }}));")
    print("   location.reload();")
    
    print("\n✅ Dashboard fix complete!")

if __name__ == "__main__":
    main() 