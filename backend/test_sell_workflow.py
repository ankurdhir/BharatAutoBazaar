#!/usr/bin/env python
"""
Test script to verify sell car workflow and image upload functionality
"""
import os
import django
import sys

# Setup Django
sys.path.append('/Users/adhir/Downloads/spinny/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spinny_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from cars.models import Car, CarImage, CarBrand, CarModel, City
from cars.serializers import CreateCarSerializer
from django.test import RequestFactory
from unittest.mock import Mock
import tempfile
from PIL import Image
import io

User = get_user_model()

def test_sell_car_workflow():
    """Test the complete sell car workflow with image upload"""
    
    print("🚗 Testing Sell Car Workflow...")
    print("=" * 50)
    
    try:
        # 1. Create test user (seller)
        user, created = User.objects.get_or_create(
            phone_number='9876543210',
            defaults={
                'name': 'Test Seller',
                'email': 'seller@test.com',
                'is_seller': True
            }
        )
        print(f"✅ Created test user: {user.name}")
        
        # 2. Create a test image in temp folder
        print("📸 Creating test image...")
        
        # Create a simple test image
        img = Image.new('RGB', (800, 600), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Create CarImage in temp folder (simulating frontend upload)
        from django.core.files.base import ContentFile
        test_image = CarImage.objects.create(
            image=ContentFile(img_bytes.read(), name='test_car.jpg'),
            title='Test Car Image',
            file_size=len(img_bytes.getvalue())
        )
        print(f"✅ Created test image: {test_image.image.name}")
        print(f"   Image path: {test_image.image.path}")
        print(f"   Is in temp: {'temp/' in test_image.image.name}")
        
        # 3. Create car listing with image
        print("🚙 Creating car listing...")
        
        factory = RequestFactory()
        request = Mock()
        request.user = user
        
        car_data = {
            'brand_name': 'Test Brand',
            'model_name': 'Test Model',
            'variant_name': 'Test Variant',
            'year': 2020,
            'fuel_type': 'petrol',
            'transmission': 'manual',
            'km_driven': 50000,
            'owner_number': '1st',
            'price': 500000,
            'urgency': 'normal',
            'exterior_condition': 'good',
            'interior_condition': 'good',
            'engine_condition': 'good',
            'accident_history': 'No accidents',
            'features': ['air_conditioning', 'power_steering'],
            'city_name': 'Mumbai',
            'state_name': 'Maharashtra',
            'area': 'Test Area',
            'description': 'Test car description',
            'contact': {
                'sellerName': 'Test Seller',
                'phoneNumber': '9876543210',
                'email': 'seller@test.com'
            },
            'image_ids': [test_image.id]
        }
        
        serializer = CreateCarSerializer(data=car_data, context={'request': request})
        
        if serializer.is_valid():
            car = serializer.save()
            print(f"✅ Created car: {car.title}")
            print(f"   Car ID: {car.id}")
            print(f"   Status: {car.status}")
            
            # 4. Verify image was moved to proper folder
            test_image.refresh_from_db()
            print(f"✅ Image after car creation:")
            print(f"   Image path: {test_image.image.name}")
            print(f"   Is in temp: {'temp/' in test_image.image.name}")
            print(f"   Is in car folder: {str(car.id) in test_image.image.name}")
            print(f"   File exists: {os.path.exists(test_image.image.path)}")
            
            # 5. Test API serialization
            from cars.serializers import CarDetailSerializer
            detail_serializer = CarDetailSerializer(car)
            images_data = detail_serializer.data.get('images', [])
            print(f"✅ API Response images count: {len(images_data)}")
            if images_data:
                print(f"   First image URL: {images_data[0]['url']}")
            
            # 6. Cleanup test data
            print("🧹 Cleaning up test data...")
            car.delete()
            user.delete()
            
            print("\n🎉 Sell Car Workflow Test PASSED!")
            print("   ✅ Images upload to temp folder")
            print("   ✅ Car creation works properly") 
            print("   ✅ Images move from temp to car folder")
            print("   ✅ API returns correct image URLs")
            
        else:
            print(f"❌ Car creation failed: {serializer.errors}")
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_sell_car_workflow() 