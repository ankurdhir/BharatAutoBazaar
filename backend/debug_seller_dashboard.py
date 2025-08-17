#!/usr/bin/env python
"""
Debug script for SellerDashboard issues
"""
import os
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spinny_api.settings')
django.setup()

from authentication.models import User
from cars.models import Car
from rest_framework_simplejwt.tokens import RefreshToken

def main():
    print("🔍 SellerDashboard Debug Script")
    print("=" * 50)
    
    # Check if our test user exists
    try:
        test_user = User.objects.get(phone_number='+919999999999')
        print(f"\n✅ Test user found: {test_user.name}")
        print(f"   📧 Email: {test_user.email}")
        print(f"   🆔 ID: {test_user.id}")
        print(f"   🔓 Is Active: {test_user.is_active}")
        print(f"   💼 Is Seller: {test_user.is_seller}")
    except User.DoesNotExist:
        print("\n❌ Test user not found. Run test_dashboard_fix.py first.")
        return
    
    # Check cars owned by test user
    user_cars = Car.objects.filter(seller=test_user)
    print(f"\n🚗 Cars owned by {test_user.name}: {user_cars.count()}")
    for car in user_cars:
        print(f"   - {car.title} (Status: {car.status})")
    
    # Generate fresh token
    refresh = RefreshToken.for_user(test_user)
    access_token = str(refresh.access_token)
    
    # Test seller endpoints
    print(f"\n🧪 Testing seller endpoints...")
    base_url = "http://localhost:8000/api/v1"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Test seller listings
        print("\n📡 Testing /cars/seller/listings/")
        response = requests.get(f"{base_url}/cars/seller/listings/", headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success')}")
            listings = data.get('data', {}).get('listings', [])
            stats = data.get('data', {}).get('stats', {})
            print(f"   Listings count: {len(listings)}")
            print(f"   Stats: {stats}")
            
            if listings:
                print("   First listing:")
                listing = listings[0]
                print(f"     - Title: {listing.get('title')}")
                print(f"     - Status: {listing.get('status')}")
                print(f"     - Images: {len(listing.get('images', []))}")
        else:
            print(f"   Error: {response.text}")
        
        # Test seller stats
        print("\n📡 Testing /cars/seller/stats/")
        response = requests.get(f"{base_url}/cars/seller/stats/", headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Stats data: {data}")
        else:
            print(f"   Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Server not running. Start Django server first.")
        return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Provide fresh token for frontend
    print(f"\n🎯 Fresh token for SellerDashboard:")
    print(f"   Copy this token to localStorage:")
    print(f"   localStorage.setItem('authToken', '{access_token}');")
    print(f"   localStorage.setItem('currentUser', JSON.stringify({{")
    print(f"     id: '{test_user.id}',")
    print(f"     name: '{test_user.name}',")
    print(f"     email: '{test_user.email}'")
    print(f"   }}));")
    print(f"   location.reload();")
    
    print(f"\n✅ Debug complete. Check console for any frontend errors.")

if __name__ == "__main__":
    main() 