#!/usr/bin/env python
"""
Direct test of admin login API endpoint
Run this while Django server is running: python test_admin_login_direct.py
"""
import requests
import json

def test_admin_login_api():
    """Test the admin login API directly"""
    
    print("🔍 Testing Admin Login API Directly...")
    print("=" * 60)
    
    # Test data
    login_data = {
        'email': 'admin@spinny.com',
        'password': 'admin123'
    }
    
    print(f"📡 Testing POST /api/v1/auth/admin/login/")
    print(f"📧 Email: {login_data['email']}")
    print(f"🔑 Password: {login_data['password']}")
    
    try:
        # Test the admin login endpoint
        response = requests.post(
            'http://localhost:8000/api/v1/auth/admin/login/',
            json=login_data,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout=10
        )
        
        print(f"\n📊 Response Details:")
        print(f"   🌐 Status Code: {response.status_code}")
        print(f"   📄 Headers: {dict(response.headers)}")
        print(f"   📝 Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ Admin login API is working!")
            try:
                data = response.json()
                print(f"📋 Response Data: {json.dumps(data, indent=2)}")
            except:
                print("⚠️  Response is not valid JSON")
        else:
            print("❌ Admin login API returned an error")
            if response.status_code == 401:
                print("🔒 401 Unauthorized - Authentication failed")
            elif response.status_code == 403:
                print("🚫 403 Forbidden - Permission denied")
            elif response.status_code == 404:
                print("🔍 404 Not Found - Endpoint doesn't exist")
            elif response.status_code == 500:
                print("💥 500 Server Error - Internal server error")
                
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server at http://localhost:8000")
        print("💡 Make sure Django server is running: python manage.py runserver 8000")
    except Exception as e:
        print(f"❌ Error testing API: {str(e)}")
    
    # Also test a simple GET to see if the server is reachable
    print(f"\n🔍 Testing server connectivity...")
    try:
        response = requests.get('http://localhost:8000/api/v1/', timeout=5)
        print(f"✅ Server is reachable (status: {response.status_code})")
    except:
        print("❌ Server is not reachable")


if __name__ == '__main__':
    test_admin_login_api() 