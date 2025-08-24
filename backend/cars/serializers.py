"""
Car serializers for Spinny Car Marketplace
"""
from rest_framework import serializers
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import (
    Car, CarBrand, CarModel, CarVariant, City, CarImage, CarVideo,
    CarView, CarFavorite
)

User = get_user_model()


class CarBrandSerializer(serializers.ModelSerializer):
    """
    Serializer for car brands
    """
    class Meta:
        model = CarBrand
        fields = ['name', 'logo']


class CarModelSerializer(serializers.ModelSerializer):
    """
    Serializer for car models
    """
    variants = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = CarModel
        fields = ['name', 'variants']


class CarVariantSerializer(serializers.ModelSerializer):
    """
    Serializer for car variants
    """
    class Meta:
        model = CarVariant
        fields = ['name']


class CitySerializer(serializers.ModelSerializer):
    """
    Serializer for cities
    """
    class Meta:
        model = City
        fields = ['id', 'name', 'state', 'car_count']


class CarImageSerializer(serializers.ModelSerializer):
    """
    Serializer for car images
    """
    class Meta:
        model = CarImage
        fields = ['id', 'image', 'thumbnail', 'title', 'order']


class CarVideoSerializer(serializers.ModelSerializer):
    """
    Serializer for car videos
    """
    class Meta:
        model = CarVideo
        fields = ['id', 'video', 'thumbnail', 'title', 'duration']


class CarListSerializer(serializers.ModelSerializer):
    """
    Serializer for car listing in list views (following API doc format)
    """
    brand = serializers.CharField(source='brand.name')
    model = serializers.CharField(source='car_model.name')  # Changed from car_model to model
    location = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    seller = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()
    insurance = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = [
            'id', 'title', 'brand', 'model', 'year', 'price', 'original_price',
            'km_driven', 'fuel_type', 'transmission', 'location', 'images',
            'thumbnail', 'verified', 'owner_number', 'features', 'condition',
            'insurance', 'seller', 'status', 'created_at', 'updated_at'
        ]
    
    def get_location(self, obj):
        return {
            'city': obj.city.name,
            'state': obj.city.state,
            'area': obj.area
        }
    
    def get_images(self, obj):
        images = obj.images.all()[:1]  # First image only for list view
        return [
            {
                'id': str(img.id),
                'url': img.image.url if img.image else None,
                'thumbnail': img.thumbnail.url if img.thumbnail else None,
                'order': img.order
            } for img in images
        ]
    
    def get_seller(self, obj):
        return {
            'id': str(obj.seller.id),
            'name': obj.seller_name,
            'type': 'individual',
            'rating': 4.5  # TODO: Calculate actual rating
        }
    
    def get_condition(self, obj):
        return {
            'exterior': obj.exterior_condition.title(),
            'interior': obj.interior_condition.title(),
            'engine': obj.engine_condition.title()
        }
    
    def get_insurance(self, obj):
        return {
            'valid': obj.insurance_valid,
            'expiryDate': obj.insurance_expiry.isoformat() if obj.insurance_expiry else None
        }
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Set thumbnail from first image if not set
        if not data.get('thumbnail') and data.get('images'):
            data['thumbnail'] = data['images'][0].get('thumbnail')
        return data


class CarDetailSerializer(serializers.ModelSerializer):
    """
    Detailed car serializer (following API doc format)
    """
    brand = serializers.CharField(source='brand.name')
    car_model = serializers.CharField(source='car_model.name')
    variant = serializers.CharField(source='variant.name', allow_null=True)
    location = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()
    seller = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()
    insurance = serializers.SerializerMethodField()
    registration = serializers.SerializerMethodField()
    service_history = serializers.SerializerMethodField()
    price_analysis = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = [
            'id', 'brand', 'car_model', 'variant', 'year', 'price', 'original_price',
            'km_driven', 'fuel_type', 'transmission', 'location', 'images', 'videos',
            'video_url',
            'specifications', 'verified', 'owner_number', 'features', 'condition',
            'accident_history', 'service_history', 'insurance', 'registration',
            'seller', 'description', 'quality_score', 'price_analysis',
            'views_count', 'inquiries_count', 'created_at', 'updated_at'
        ]
    
    def get_location(self, obj):
        return {
            'city': obj.city.name,
            'state': obj.city.state,
            'area': obj.area,
            'coordinates': {
                'lat': float(obj.city.latitude) if obj.city.latitude else None,
                'lng': float(obj.city.longitude) if obj.city.longitude else None
            }
        }
    
    def get_images(self, obj):
        images = obj.images.all().order_by('order', 'created_at')
        return [
            {
                'id': str(img.id),
                'url': img.image.url if img.image else None,
                'thumbnail': img.thumbnail.url if img.thumbnail else None,
                'order': img.order,
                'title': img.title or 'Car Image'
            } for img in images
        ]
    
    def get_videos(self, obj):
        videos = obj.videos.all()
        return [
            {
                'id': str(vid.id),
                'url': vid.video.url if vid.video else None,
                'thumbnail': vid.thumbnail.url if vid.thumbnail else None,
                'duration': vid.duration,
                'title': vid.title or 'Car Video'
            } for vid in videos
        ]
    
    def get_seller(self, obj):
        return {
            'id': str(obj.seller.id),
            'name': obj.seller_name,
            'phoneNumber': obj.seller_phone,
            'type': 'individual',
            'rating': 4.5,  # TODO: Calculate actual rating
            'reviewCount': 23,  # TODO: Get actual review count
            'location': f"{obj.area}, {obj.city.name}" if obj.area else obj.city.name,
            'verified': obj.seller.is_verified,
            'memberSince': obj.seller.created_at.date().isoformat()
        }
    
    def get_condition(self, obj):
        return {
            'exterior': obj.exterior_condition.title(),
            'interior': obj.interior_condition.title(),
            'engine': obj.engine_condition.title()
        }
    
    def get_insurance(self, obj):
        return {
            'valid': obj.insurance_valid,
            'expiryDate': obj.insurance_expiry.isoformat() if obj.insurance_expiry else None,
            'company': 'ICICI Lombard',  # TODO: Add insurance company field
            'type': 'Comprehensive'  # TODO: Add insurance type field
        }
    
    def get_registration(self, obj):
        return {
            'number': obj.registration_number or 'DL01XX1234',
            'state': obj.registration_state or obj.city.state,
            'registrationDate': obj.registration_date.isoformat() if obj.registration_date else None,
            'transferAvailable': obj.rc_transfer_available
        }
    
    def get_service_history(self, obj):
        return {
            'records': 12,  # TODO: Add service history tracking
            'lastServiceDate': '2023-11-15',  # TODO: Add last service date field
            'nextServiceDue': '2024-05-15'  # TODO: Calculate next service due
        }
    
    def get_price_analysis(self, obj):
        if obj.original_price and obj.original_price > obj.price:
            saving = obj.original_price - obj.price
            percentage = (saving / obj.original_price) * 100
            
            if percentage > 15:
                deal_value = "Excellent"
            elif percentage > 10:
                deal_value = "Great"
            elif percentage > 5:
                deal_value = "Good"
            else:
                deal_value = "Fair"
            
            return {
                'marketPrice': obj.original_price,
                'dealValue': deal_value,
                'savingAmount': saving
            }
        return None


class CarSearchSerializer(serializers.Serializer):
    """
    Serializer for car search with filters (following API doc format)
    """
    q = serializers.CharField(required=False, allow_blank=True)
    brand = serializers.CharField(required=False)
    fuel_type = serializers.CharField(required=False)
    min_price = serializers.IntegerField(required=False, min_value=0)
    max_price = serializers.IntegerField(required=False, min_value=0)
    city = serializers.CharField(required=False)
    year = serializers.IntegerField(required=False)
    transmission = serializers.CharField(required=False)
    sort_by = serializers.ChoiceField(
        choices=['price_asc', 'price_desc', 'year_desc', 'km_asc'],
        required=False,
        default='created_at'
    )
    page = serializers.IntegerField(required=False, default=1, min_value=1)
    limit = serializers.IntegerField(required=False, default=12, min_value=1, max_value=50)


class CreateCarSerializer(serializers.ModelSerializer):
    """
    Serializer for creating car listings (following API doc format)
    """
    brand_name = serializers.CharField(write_only=True)
    model_name = serializers.CharField(write_only=True)
    variant_name = serializers.CharField(write_only=True, required=True)
    city_name = serializers.CharField(write_only=True)
    state_name = serializers.CharField(write_only=True)
    area = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    contact = serializers.DictField(write_only=True)
    image_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)
    video_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)
    
    class Meta:
        model = Car
        fields = [
            'brand_name', 'model_name', 'variant_name', 'year', 'fuel_type',
            'transmission', 'km_driven', 'owner_number', 'price', 'urgency',
            'exterior_condition', 'interior_condition', 'engine_condition',
            'accident_history', 'features', 'city_name', 'state_name', 'area',
            'address', 'description', 'contact', 'image_ids', 'video_ids',
            'video_url'
        ]
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True},
            'area': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'video_url': {'required': False, 'allow_blank': True},
        }
    
    def validate_contact(self, value):
        """Validate contact information"""
        required_fields = ['sellerName', 'phoneNumber']
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"{field} is required in contact information")
        return value
    
    def validate_year(self, value):
        """Validate car year"""
        from django.utils import timezone
        current_year = timezone.now().year
        if value < 1980 or value > current_year + 1:
            raise serializers.ValidationError(f"Year must be between 1980 and {current_year + 1}")
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """Create car listing with related objects"""
        # Extract nested data
        brand_name = validated_data.pop('brand_name')
        model_name = validated_data.pop('model_name')
        variant_name = validated_data.pop('variant_name')
        city_name = validated_data.pop('city_name')
        state_name = validated_data.pop('state_name')
        contact = validated_data.pop('contact')
        image_ids = validated_data.pop('image_ids', [])
        video_ids = validated_data.pop('video_ids', [])
        video_url = validated_data.pop('video_url', '')
        
        # Get or create related objects
        from django.utils.text import slugify
        
        # Get or create brand with proper slug handling
        try:
            brand = CarBrand.objects.get(name=brand_name)
        except CarBrand.DoesNotExist:
            brand_slug = slugify(brand_name)
            # Handle duplicate slugs by adding number suffix
            counter = 1
            original_slug = brand_slug
            while CarBrand.objects.filter(slug=brand_slug).exists():
                brand_slug = f"{original_slug}-{counter}"
                counter += 1
            brand = CarBrand.objects.create(name=brand_name, slug=brand_slug)
        
        car_model, _ = CarModel.objects.get_or_create(
            brand=brand, 
            name=model_name,
            defaults={'slug': slugify(f"{brand_name}-{model_name}")}
        )
        
        # Get or create variant with proper handling
        car_variant, _ = CarVariant.objects.get_or_create(
            car_model=car_model, 
            name=variant_name
        )
        
        # Get or create city with proper slug handling
        try:
            city = City.objects.get(name=city_name, state=state_name)
        except City.DoesNotExist:
            city_slug = slugify(f"{city_name}-{state_name}")
            # Handle duplicate slugs by adding number suffix
            counter = 1
            original_slug = city_slug
            while City.objects.filter(slug=city_slug).exists():
                city_slug = f"{original_slug}-{counter}"
                counter += 1
            city = City.objects.create(
                name=city_name, 
                state=state_name,
                slug=city_slug
            )
        
        # Set related objects
        validated_data['brand'] = brand
        validated_data['car_model'] = car_model
        validated_data['variant'] = car_variant  # Use CarVariant instance instead of string
        validated_data['city'] = city
        validated_data['seller'] = self.context['request'].user
        validated_data['seller_name'] = contact['sellerName']
        validated_data['seller_phone'] = contact['phoneNumber']
        validated_data['seller_email'] = contact.get('email', '')
        validated_data['status'] = 'pending'
        
        # Create car
        car = super().create(validated_data)

        # Save optional video_url if provided
        if video_url:
            car.video_url = video_url
            car.save(update_fields=['video_url'])
        
        # Associate images and move them from temp to proper folder
        if image_ids:
            # Update database association
            CarImage.objects.filter(id__in=image_ids).update(car=car)
            
            # Move images from temp folder to car-specific folder
            self._move_images_to_car_folder(car, image_ids)
        
        # Note: Removed CarVideo association since CarVideo model doesn't exist
        
        return car
    
    def _move_images_to_car_folder(self, car, image_ids):
        """Move images from temp folder to car-specific folder"""
        import os
        import shutil
        from django.conf import settings
        
        for image in CarImage.objects.filter(id__in=image_ids, car=car):
            if image.image and 'temp/' in image.image.name:
                try:
                    old_path = image.image.path
                    old_name = os.path.basename(old_path)
                    
                    # New path structure: cars/{car_id}/images/{filename}
                    new_folder = os.path.join(settings.MEDIA_ROOT, 'cars', str(car.id), 'images')
                    new_path = os.path.join(new_folder, old_name)
                    new_relative_path = f'cars/{car.id}/images/{old_name}'
                    
                    # Create directory if it doesn't exist
                    os.makedirs(new_folder, exist_ok=True)
                    
                    # Move the file
                    if os.path.exists(old_path):
                        shutil.move(old_path, new_path)
                        
                        # Update database record
                        image.image.name = new_relative_path
                        image.save()
                        
                except Exception as e:
                    # Log error but don't break the car creation process
                    print(f"Warning: Could not move image {image.id}: {str(e)}")
    
    def to_representation(self, instance):
        """Return response in API doc format"""
        return {
            'id': str(instance.id),
            'status': instance.status,
            'estimatedApprovalTime': '24-48 hours',
            'listingUrl': f'/listing/{instance.id}',
            'nextSteps': [
                'Our team will verify the details',
                'Professional inspection will be scheduled',
                'Listing will go live after approval'
            ]
        }


class UpdateCarSerializer(serializers.ModelSerializer):
    """
    Serializer for updating car listings
    """
    class Meta:
        model = Car
        fields = ['price', 'description', 'urgency', 'features']
    
    def update(self, instance, validated_data):
        """Update car and reset status to pending if needed"""
        # If price is updated, reset status to pending for review
        if 'price' in validated_data and validated_data['price'] != instance.price:
            validated_data['status'] = 'pending'
        
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        """Return response in API doc format"""
        return {
            'id': str(instance.id),
            'status': instance.status,
            'updatedAt': instance.updated_at.isoformat()
        }


class SellerListingSerializer(serializers.ModelSerializer):
    """
    Serializer for seller's own listings
    """
    brand = serializers.CharField(source='brand.name')
    car_model = serializers.CharField(source='car_model.name')
    variant = serializers.CharField(source='variant.name', default='')
    city = serializers.CharField(source='city.name')
    thumbnail = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = [
            'id', 'title', 'brand', 'car_model', 'variant', 'year', 'price', 
            'km_driven', 'fuel_type', 'transmission', 'status',
            'city', 'views_count', 'inquiries_count', 'thumbnail', 'images',
            'created_at', 'approved_at', 'description'
        ]
    
    def get_thumbnail(self, obj):
        first_image = obj.images.first()
        return first_image.thumbnail.url if first_image and first_image.thumbnail else None
    
    def get_images(self, obj):
        """Get all car images"""
        return [
            {
                'id': str(image.id),
                'url': image.image.url if image.image else '',
                'thumbnail': image.thumbnail.url if image.thumbnail else '',
                'alt_text': image.alt_text or f"{obj.brand.name} {obj.car_model.name} - Image"
            }
            for image in obj.images.all()
        ]
    
    def get_title(self, obj):
        """Generate car title"""
        parts = [str(obj.year), obj.brand.name, obj.car_model.name]
        if obj.variant:
            parts.append(obj.variant.name)
        return ' '.join(parts)


class CarFavoriteSerializer(serializers.ModelSerializer):
    """
    Serializer for car favorites
    """
    car = CarListSerializer(read_only=True)
    
    class Meta:
        model = CarFavorite
        fields = ['id', 'car', 'created_at']


class ContactSellerSerializer(serializers.Serializer):
    """
    Serializer for contacting car seller
    """
    buyer_name = serializers.CharField(max_length=255)
    buyer_phone = serializers.CharField(max_length=20)
    buyer_email = serializers.EmailField(required=False, allow_blank=True)
    message = serializers.CharField()
    preferred_contact_time = serializers.ChoiceField(
        choices=['morning', 'afternoon', 'evening', 'anytime'],
        default='anytime'
    )
    
    def create(self, validated_data):
        """Create inquiry"""
        from communication.models import Inquiry
        
        car = self.context['car']
        validated_data['car'] = car
        validated_data['seller'] = car.seller
        
        # Set buyer if authenticated
        request = self.context['request']
        if request.user.is_authenticated:
            validated_data['buyer'] = request.user
        
        inquiry = Inquiry.objects.create(**validated_data)

        # Send notification email to admins (non-blocking)
        try:
            subject = f"New Inquiry for {car.title}"
            body_lines = [
                f"Car: {car.title}",
                f"Seller: {car.seller_name} ({car.seller_phone})",
                "",
                "Buyer Details:",
                f"Name: {validated_data.get('buyer_name')}",
                f"Phone: {validated_data.get('buyer_phone')}",
                f"Email: {validated_data.get('buyer_email', '')}",
                f"Preferred time: {validated_data.get('preferred_contact_time', 'anytime')}",
                "",
                "Message:",
                validated_data.get('message', ''),
                "",
                f"Inquiry ID: {inquiry.id}",
            ]
            message = "\n".join(body_lines)
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'admin@bharatauttobazaar.com')
            recipients = ['admin@bharatauttobazaar.com']
            send_mail(
                subject,
                message,
                from_email,
                recipients,
                fail_silently=True,
            )
        except Exception:
            logging.getLogger(__name__).exception('Failed to send inquiry notification email')
        
        return {
            'inquiry_id': str(inquiry.id),
            'estimated_response': 'Within 2 hours'
        } 