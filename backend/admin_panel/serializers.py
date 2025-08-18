"""
Admin panel serializers for Spinny Car Marketplace
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import CarReview, AdminActivity, BulkAction
from cars.models import Car
from cars.serializers import CarListSerializer

User = get_user_model()


class AdminCarListSerializer(serializers.ModelSerializer):
    """
    Serializer for admin car list view
    """
    brand = serializers.CharField(source='brand.name')
    car_model = serializers.CharField(source='car_model.name')
    city = serializers.CharField(source='city.name')
    seller_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = [
            'id', 'brand', 'car_model', 'year', 'price', 'status',
            'seller_info', 'city', 'quality_score', 'views_count',
            'inquiries_count', 'created_at', 'reviewed_at'
        ]
    
    def get_seller_info(self, obj):
        return {
            'name': obj.seller_name,
            'phone': obj.seller_phone,
            'verified': obj.seller.is_verified
        }


class AdminCarDetailSerializer(serializers.ModelSerializer):
    """
    Detailed admin car serializer
    """
    brand = serializers.CharField(source='brand.name')
    car_model = serializers.CharField(source='car_model.name')
    variant = serializers.CharField(source='variant.name', allow_null=True)
    city = serializers.CharField(source='city.name')
    seller_info = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()
    review_history = serializers.SerializerMethodField()
    
    choices = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = [
            'id', 'brand', 'car_model', 'variant', 'year', 'price', 'original_price',
            'km_driven', 'fuel_type', 'transmission', 'owner_number', 'urgency',
            'status', 'verified', 'featured',
            'seller_info', 'city', 'area', 'address', 'description', 'features',
            'exterior_condition', 'interior_condition', 'engine_condition',
            'accident_history', 'quality_score', 'images', 'videos', 'video_url',
            'views_count', 'inquiries_count', 'review_history',
            'created_at', 'reviewed_at', 'rejection_reason', 'admin_notes', 'choices'
        ]
    
    def get_seller_info(self, obj):
        return {
            'id': str(obj.seller.id),
            'name': obj.seller_name,
            'phone': obj.seller_phone,
            'email': obj.seller_email,
            'verified': obj.seller.is_verified,
            'total_listings': obj.seller.cars.count(),
            'member_since': obj.seller.created_at.date().isoformat()
        }
    
    def get_images(self, obj):
        request = self.context.get('request')
        def abs_url(path):
            if not path:
                return None
            return request.build_absolute_uri(path) if request else path
        return [
            {
                'id': str(img.id),
                'url': abs_url(img.image.url if img.image else None),
                'thumbnail': abs_url(img.thumbnail.url if img.thumbnail else None),
                'order': img.order
            } for img in obj.images.all()
        ]
    
    def get_videos(self, obj):
        return [
            {
                'id': str(vid.id),
                'url': vid.video.url if vid.video else None,
                'thumbnail': vid.thumbnail.url if vid.thumbnail else None,
                'duration': vid.duration
            } for vid in obj.videos.all()
        ]
    
    def get_review_history(self, obj):
        reviews = obj.admin_reviews.all().order_by('-created_at')
        return [
            {
                'id': str(review.id),
                'action': review.action,
                'reason': review.reason,
                'feedback': review.feedback,
                'admin': review.admin.name if review.admin else 'Unknown',
                'created_at': review.created_at.isoformat()
            } for review in reviews
        ]

    def get_choices(self, obj):
        return {
            'fuel_type': [c[0] for c in Car.FUEL_CHOICES],
            'transmission': [c[0] for c in Car.TRANSMISSION_CHOICES],
            'owner_number': [c[0] for c in Car.OWNER_CHOICES],
            'status': [c[0] for c in Car.STATUS_CHOICES],
            'urgency': [c[0] for c in Car.URGENCY_CHOICES],
            'condition': [c[0] for c in Car.CONDITION_CHOICES],
        }


class CarReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for car reviews
    """
    admin_name = serializers.CharField(source='admin.name', read_only=True)
    car_title = serializers.CharField(source='car.title', read_only=True)
    
    class Meta:
        model = CarReview
        fields = [
            'id', 'action', 'reason', 'feedback', 'internal_notes',
            'suggested_price', 'price_feedback', 'quality_score',
            'completeness_score', 'priority', 'admin_name', 'car_title',
            'created_at'
        ]


class ReviewCarSerializer(serializers.Serializer):
    """
    Serializer for reviewing cars
    """
    action = serializers.ChoiceField(choices=CarReview.ACTION_CHOICES)
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True)
    feedback = serializers.CharField(required=False, allow_blank=True)
    internal_notes = serializers.CharField(required=False, allow_blank=True)
    suggested_price = serializers.IntegerField(required=False, allow_null=True)
    price_feedback = serializers.CharField(required=False, allow_blank=True)
    quality_score = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=100)
    priority = serializers.ChoiceField(choices=CarReview.PRIORITY_CHOICES, default='normal')
    
    def create(self, validated_data):
        """Create car review"""
        car = self.context['car']
        request = self.context['request']
        
        validated_data['car'] = car
        
        # Get admin user from authenticated request
        if hasattr(request.user, 'admin_user'):
            validated_data['admin'] = request.user.admin_user
        else:
            raise serializers.ValidationError("Admin user not found in request")
        
        return CarReview.objects.create(**validated_data)


class BulkActionSerializer(serializers.Serializer):
    """
    Serializer for bulk actions
    """
    action = serializers.ChoiceField(choices=[
        'approve', 'reject', 'feature', 'unfeature', 'delete'
    ])
    carIds = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=100
    )
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate_carIds(self, value):
        """Validate that all car IDs exist"""
        existing_cars = Car.objects.filter(id__in=value).count()
        if existing_cars != len(value):
            raise serializers.ValidationError("Some car IDs do not exist")
        return value


class AdminActivitySerializer(serializers.ModelSerializer):
    """
    Serializer for admin activities
    """
    admin_name = serializers.CharField(source='admin.name', read_only=True)
    
    class Meta:
        model = AdminActivity
        fields = [
            'id', 'admin_name', 'activity_type', 'description',
            'metadata', 'created_at'
        ] 