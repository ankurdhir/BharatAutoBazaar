"""
Communication serializers for Spinny Car Marketplace
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from phonenumber_field.serializerfields import PhoneNumberField

from .models import Inquiry, InquiryResponse, Notification
from cars.models import Car

User = get_user_model()


class InquirySerializer(serializers.ModelSerializer):
    """
    Serializer for inquiry list view
    """
    car_info = serializers.SerializerMethodField()
    buyer_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Inquiry
        fields = [
            'id', 'car_info', 'buyer_info', 'message', 'status',
            'preferred_contact_time', 'is_serious_buyer', 'created_at'
        ]
    
    def get_car_info(self, obj):
        return {
            'id': str(obj.car.id),
            'title': obj.car.title,
            'brand': obj.car.brand.name,
            'model': obj.car.car_model.name,
            'year': obj.car.year,
            'price': obj.car.price,
            'thumbnail': obj.car.thumbnail
        }
    
    def get_buyer_info(self, obj):
        return {
            'name': obj.buyer_name,
            'phone': str(obj.buyer_phone),
            'email': obj.buyer_email or None,
            'registered': obj.buyer is not None
        }


class InquiryDetailSerializer(serializers.ModelSerializer):
    """
    Detailed inquiry serializer with responses
    """
    car_info = serializers.SerializerMethodField()
    buyer_info = serializers.SerializerMethodField()
    responses = serializers.SerializerMethodField()
    
    class Meta:
        model = Inquiry
        fields = [
            'id', 'car_info', 'buyer_info', 'message', 'status',
            'preferred_contact_time', 'is_serious_buyer', 'seller_response',
            'responses', 'created_at', 'responded_at'
        ]
    
    def get_car_info(self, obj):
        return {
            'id': str(obj.car.id),
            'title': obj.car.title,
            'brand': obj.car.brand.name,
            'model': obj.car.car_model.name,
            'year': obj.car.year,
            'price': obj.car.price,
            'thumbnail': obj.car.thumbnail
        }
    
    def get_buyer_info(self, obj):
        return {
            'name': obj.buyer_name,
            'phone': str(obj.buyer_phone),
            'email': obj.buyer_email or None,
            'registered': obj.buyer is not None
        }
    
    def get_responses(self, obj):
        responses = obj.responses.all().order_by('created_at')
        return [
            {
                'id': str(response.id),
                'sender': response.sender_type,
                'message': response.message,
                'availableForCall': response.available_for_call,
                'preferredContactTime': response.preferred_contact_time,
                'created_at': response.created_at.isoformat(),
                'is_read': response.is_read
            } for response in responses
        ]


class InquiryResponseSerializer(serializers.ModelSerializer):
    """
    Serializer for inquiry responses
    """
    class Meta:
        model = InquiryResponse
        fields = [
            'id', 'sender_type', 'message', 'available_for_call',
            'preferred_contact_time', 'is_read', 'created_at'
        ]


class CreateInquirySerializer(serializers.Serializer):
    """
    Serializer for creating inquiries
    """
    car_id = serializers.UUIDField()
    buyer_name = serializers.CharField(max_length=255)
    buyer_phone = PhoneNumberField()
    buyer_email = serializers.EmailField(required=False, allow_blank=True)
    message = serializers.CharField()
    preferred_contact_time = serializers.ChoiceField(
        choices=Inquiry.CONTACT_TIME_CHOICES,
        default='anytime'
    )
    
    def validate_car_id(self, value):
        """Validate car exists and is approved"""
        try:
            car = Car.objects.get(id=value, status='approved')
            return value
        except Car.DoesNotExist:
            raise serializers.ValidationError("Car not found or not available")
    
    def create(self, validated_data):
        """Create inquiry"""
        car_id = validated_data.pop('car_id')
        car = Car.objects.get(id=car_id)
        
        # Set car and seller
        validated_data['car'] = car
        validated_data['seller'] = car.seller
        
        # Set buyer if authenticated
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['buyer'] = request.user
        
        # Set metadata
        if request:
            validated_data['ip_address'] = self._get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
            validated_data['referrer'] = request.META.get('HTTP_REFERER', '')
        
        return Inquiry.objects.create(**validated_data)
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RespondToInquirySerializer(serializers.Serializer):
    """
    Serializer for responding to inquiries
    """
    message = serializers.CharField()
    available_for_call = serializers.BooleanField(default=False)
    preferred_contact_time = serializers.ChoiceField(
        choices=Inquiry.CONTACT_TIME_CHOICES,
        required=False,
        allow_blank=True
    )
    
    def create(self, validated_data):
        """Create inquiry response"""
        inquiry = self.context['inquiry']
        request = self.context['request']
        
        validated_data['inquiry'] = inquiry
        validated_data['sender_type'] = 'seller'
        validated_data['sender'] = request.user
        
        return InquiryResponse.objects.create(**validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for notifications
    """
    car_info = serializers.SerializerMethodField()
    inquiry_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'data', 'priority',
            'is_read', 'car_info', 'inquiry_info', 'created_at', 'read_at'
        ]
    
    def get_car_info(self, obj):
        if obj.car:
            return {
                'id': str(obj.car.id),
                'title': obj.car.title,
                'thumbnail': obj.car.thumbnail
            }
        return None
    
    def get_inquiry_info(self, obj):
        if obj.inquiry:
            return {
                'id': str(obj.inquiry.id),
                'buyer_name': obj.inquiry.buyer_name,
                'message': obj.inquiry.message[:100] + '...' if len(obj.inquiry.message) > 100 else obj.inquiry.message
            }
        return None 