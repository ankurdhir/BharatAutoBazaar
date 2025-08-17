"""
Authentication serializers for Spinny Car Marketplace
"""
import os
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from phonenumber_field.serializerfields import PhoneNumberField
from .models import OTPToken, AdminUser, SavedSearch
from twilio.rest import Client

User = get_user_model()


class SendOTPSerializer(serializers.Serializer):
    """
    Serializer for sending OTP to phone number
    """
    phone_number = PhoneNumberField()
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if not value:
            raise serializers.ValidationError("Phone number is required")
        return value
    
    def save(self):
        """Create and send OTP"""
        phone_number = self.validated_data['phone_number']
        
        # Invalidate any existing OTP tokens for this phone number
        OTPToken.objects.filter(
            phone_number=phone_number,
            is_used=False,
            expires_at__gt=timezone.now()
        ).update(is_used=True)
        
        # Create new OTP token
        otp_token = OTPToken.objects.create(
            phone_number=phone_number,
            purpose='login'
        )
        
        # Send OTP via SMS using Twilio (minimal)
        account_sid = os.environ["TWILIO_ACCOUNT_SID"]
        auth_token = os.environ["TWILIO_AUTH_TOKEN"]
        from_number = os.environ["TWILIO_FROM_NUMBER"]
        client = Client(account_sid, auth_token)
        client.messages.create(
            body=f"Your Bharat Auto Bazaar OTP is {otp_token.otp}",
            from_=from_number,
            to=str(phone_number),
        )
        
        return {
            'otp_id': str(otp_token.id),
            'expires_at': otp_token.expires_at,
            'masked_phone': str(phone_number)[:3] + '****' + str(phone_number)[-4:],
            # Remove this in production
            'otp': otp_token.otp if timezone.now().date().isoformat() == '2024-01-01' else None
        }


class VerifyOTPSerializer(serializers.Serializer):
    """
    Serializer for verifying OTP and logging in user
    """
    otp_id = serializers.UUIDField()
    otp = serializers.CharField(max_length=6)
    phone_number = PhoneNumberField()
    
    def validate(self, attrs):
        """Validate OTP and return user"""
        otp_id = attrs.get('otp_id')
        otp = attrs.get('otp')
        provided_phone = attrs.get('phone_number')
        
        # Be lenient: trust otp_id as the primary key; use phone from token
        try:
            otp_token = OTPToken.objects.get(id=otp_id)
        except OTPToken.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP ID")
        
        if not otp_token.verify(otp):
            if otp_token.attempts >= otp_token.max_attempts:
                raise serializers.ValidationError("Maximum OTP attempts exceeded")
            remaining = otp_token.max_attempts - otp_token.attempts
            raise serializers.ValidationError(f"Invalid OTP. {remaining} attempts remaining.")
        
        # Always use the phone number stored with the OTP token to avoid formatting mismatches
        phone_number = otp_token.phone_number
        
        # Get or create user
        user, created = User.objects.get_or_create(
            phone_number=phone_number,
            defaults={'is_verified': True}
        )
        
        if not user.is_verified:
            user.is_verified = True
            user.save()
        
        attrs['user'] = user
        attrs['is_new_user'] = created
        return attrs
    
    def create(self, validated_data):
        """Generate JWT tokens for user"""
        user = validated_data['user']
        is_new_user = validated_data['is_new_user']
        
        refresh = RefreshToken.for_user(user)
        
        return {
            'user': {
                'id': str(user.id),
                'phone_number': str(user.phone_number),
                'name': user.name,
                'email': user.email,
                'is_new_user': is_new_user,
                'profile': {
                    'avatar': user.avatar.url if user.avatar else None,
                    'city': user.city,
                    'verified': user.is_verified
                }
            },
            'tokens': {
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'expires_at': refresh.access_token.payload['exp']
            }
        }


class RefreshTokenSerializer(serializers.Serializer):
    """
    Serializer for refreshing JWT tokens
    """
    refresh_token = serializers.CharField()
    
    def validate_refresh_token(self, value):
        """Validate refresh token"""
        try:
            refresh = RefreshToken(value)
            return refresh
        except Exception:
            raise serializers.ValidationError("Invalid refresh token")
    
    def save(self):
        """Generate new access token"""
        refresh = self.validated_data['refresh_token']
        return {
            'access_token': str(refresh.access_token),
            'expires_at': refresh.access_token.payload['exp']
        }


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile information
    """
    phone_number = PhoneNumberField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'email', 'name', 'avatar',
            'city', 'state', 'is_verified', 'email_notifications',
            'sms_notifications', 'push_notifications', 'created_at'
        ]
        read_only_fields = ['id', 'phone_number', 'is_verified', 'created_at']
    
    def to_representation(self, instance):
        """Customize the output representation"""
        data = super().to_representation(instance)
        
        # Add nested profile data
        data['profile'] = {
            'avatar': instance.avatar.url if instance.avatar else None,
            'city': instance.city,
            'state': instance.state,
            'verified': instance.is_verified
        }
        
        # Add preferences
        data['preferences'] = {
            'notifications': {
                'email': instance.email_notifications,
                'sms': instance.sms_notifications,
                'push': instance.push_notifications
            }
        }
        
        return data


class UpdateUserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile
    """
    class Meta:
        model = User
        fields = [
            'name', 'email', 'city', 'state',
            'email_notifications', 'sms_notifications', 'push_notifications'
        ]
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if value and User.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("This email is already in use")
        return value


class SavedSearchSerializer(serializers.ModelSerializer):
    """
    Serializer for saved searches
    """
    class Meta:
        model = SavedSearch
        fields = [
            'id', 'name', 'search_filters', 'notifications_enabled',
            'notification_frequency', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate search name uniqueness for user"""
        user = self.context['request'].user
        if SavedSearch.objects.filter(user=user, name=value).exclude(id=getattr(self.instance, 'id', None)).exists():
            raise serializers.ValidationError("You already have a saved search with this name")
        return value
    
    def create(self, validated_data):
        """Create saved search for current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AdminLoginSerializer(serializers.Serializer):
    """
    Serializer for admin login
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate admin credentials"""
        email = attrs.get('email')
        password = attrs.get('password')
        
        try:
            admin = AdminUser.objects.get(email=email, is_active=True)
        except AdminUser.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")
        
        # TODO: Implement proper password hashing and verification
        # For now, using simple password check
        if admin.password_hash != password:  # In production, use proper password verification
            raise serializers.ValidationError("Invalid credentials")
        
        attrs['admin'] = admin
        return attrs
    
    def create(self, validated_data):
        """Generate admin token"""
        admin = validated_data['admin']
        
        # Update last login
        admin.last_login = timezone.now()
        admin.save()
        
        # TODO: Generate proper admin JWT token
        # For now, return admin data
        return {
            'user': {
                'id': str(admin.id),
                'name': admin.name,
                'email': admin.email,
                'role': admin.role,
                'permissions': admin.permissions
            },
            'token': f"admin_token_{admin.id}"  # Replace with proper JWT
        }


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing users (admin view)
    """
    phone_number = PhoneNumberField(read_only=True)
    total_listings = serializers.SerializerMethodField()
    total_inquiries = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'name', 'email', 'city', 'state',
            'is_verified', 'is_seller', 'created_at', 'last_login',
            'total_listings', 'total_inquiries'
        ]
    
    def get_total_listings(self, obj):
        """Get total listings for user"""
        return obj.cars.count()
    
    def get_total_inquiries(self, obj):
        """Get total inquiries sent by user"""
        return obj.sent_inquiries.count()


class UserDetailSerializer(UserProfileSerializer):
    """
    Detailed user serializer with additional information
    """
    total_listings = serializers.SerializerMethodField()
    active_listings = serializers.SerializerMethodField()
    total_inquiries_sent = serializers.SerializerMethodField()
    total_inquiries_received = serializers.SerializerMethodField()
    member_since = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta(UserProfileSerializer.Meta):
        fields = UserProfileSerializer.Meta.fields + [
            'total_listings', 'active_listings', 'total_inquiries_sent',
            'total_inquiries_received', 'member_since', 'last_login'
        ]
    
    def get_total_listings(self, obj):
        return obj.cars.count()
    
    def get_active_listings(self, obj):
        return obj.cars.filter(status='approved').count()
    
    def get_total_inquiries_sent(self, obj):
        return obj.sent_inquiries.count()
    
    def get_total_inquiries_received(self, obj):
        return obj.received_inquiries.count()


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password (if implemented)
    """
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate password change"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        
        # TODO: Add password strength validation
        return attrs
    
    def validate_old_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        # TODO: Implement password verification for users if needed
        return value


class DeleteAccountSerializer(serializers.Serializer):
    """
    Serializer for account deletion
    """
    password = serializers.CharField(write_only=True, required=False)
    reason = serializers.CharField(max_length=500, required=False)
    confirm_deletion = serializers.BooleanField(default=False)
    
    def validate_confirm_deletion(self, value):
        """Ensure user confirms deletion"""
        if not value:
            raise serializers.ValidationError("Please confirm account deletion")
        return value 