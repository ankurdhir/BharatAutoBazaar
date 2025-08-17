#!/usr/bin/env python
"""
Test public API endpoints to ensure they work without authentication
"""
import requests
import json

def test_public_endpoints():
    """Test public endpoints"""
    
    print("🔍 Testing Public API Endpoints...")
    print("=" * 60)
    
    endpoints = [
        ('GET', '/api/v1/cars/', 'Car listings'),
        ('GET', '/api/v1/cars/brands/', 'Car brands'),
        ('GET', '/api/v1/cars/cities/', 'Cities'),
        ('GET', '/api/v1/cars/data/', 'Car data'),
    ]
    
    for method, endpoint, description in endpoints:
        try:
            print(f"\n📡 Testing {method} {endpoint} ({description})")
            
            response = requests.get(f'http://localhost:8000{endpoint}', timeout=10)
            
            print(f"   📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ SUCCESS - {description} endpoint working")
            elif response.status_code == 401:
                print(f"   ❌ 401 Unauthorized - Authentication required")
            else:
                print(f"   ⚠️  Status {response.status_code} - {response.text[:100]}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Cannot connect to server")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print(f"\n" + "=" * 60)
    print("If any endpoints show 401 errors, public access is broken")


if __name__ == '__main__':
    test_public_endpoints() 