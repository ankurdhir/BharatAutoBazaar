"""
Authentication serializers for Spinny Car Marketplace
"""
import os
import logging
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from phonenumber_field.serializerfields import PhoneNumberField
from django.core.mail import send_mail
from django.conf import settings
from .models import OTPToken, AdminUser, SavedSearch
from twilio.rest import Client

User = get_user_model()

logger = logging.getLogger(__name__)

class SendOTPSerializer(serializers.Serializer):
    """
    Serializer for sending OTP to phone number or email
    """
    phone_number = PhoneNumberField(required=False)
    email = serializers.EmailField(required=False)

    def validate(self, attrs):
        phone = attrs.get('phone_number')
        email = attrs.get('email')
        if not phone and not email:
            raise serializers.ValidationError("Provide phone_number or email")
        if phone and email:
            raise serializers.ValidationError("Provide only one of phone_number or email")
        return attrs

    def save(self):
        """Create and send OTP via SMS or Email based on input"""
        phone_number = self.validated_data.get('phone_number')
        email = self.validated_data.get('email')

        # Invalidate existing OTP tokens for this target
        q = {}
        if phone_number:
            q['phone_number'] = phone_number
        if email:
            q['email'] = email
        OTPToken.objects.filter(
            **q,
            is_used=False,
            expires_at__gt=timezone.now()
        ).update(is_used=True)

        # Create new OTP token
        otp_token = OTPToken.objects.create(
            phone_number=phone_number,
            email=email,
            purpose='login'
        )

        # Dispatch OTP
        if phone_number:
            # Send OTP via SMS using Twilio
            account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
            auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
            from_number = os.environ.get("TWILIO_FROM_NUMBER") or os.environ.get("TWILIO_PHONE_NUMBER")
            if not (account_sid and auth_token and from_number):
                logger.error("Twilio env vars missing for SMS OTP")
                raise serializers.ValidationError("OTP service not configured. Please try again later.")
            try:
                client = Client(account_sid, auth_token)
                client.messages.create(
                    body=f"Your Bharat Auto Bazaar OTP is {otp_token.otp}",
                    from_=from_number,
                    to=str(phone_number),
                )
            except Exception:
                logger.exception("Failed to send OTP via Twilio")
                raise serializers.ValidationError("Failed to send OTP. Please try again later.")
        else:
            # Send OTP via Email using Django SMTP settings
            try:
                # Log non-sensitive email settings for diagnostics
                masked_email_for_log = None
                if email:
                    local, _, domain = email.partition('@')
                    masked_local = (local[:1] + '***') if local else '***'
                    dom_main, _, dom_tld = domain.partition('.')
                    masked_domain = (dom_main[:1] + '***') if dom_main else '***'
                    masked_email_for_log = f"{masked_local}@{masked_domain}.{dom_tld or '***'}"

                logger.info(
                    "Sending OTP email",
                    extra={
                        'otp_id': str(otp_token.id),
                        'target': masked_email_for_log,
                        'email_backend': getattr(settings, 'EMAIL_BACKEND', None),
                        'email_host': getattr(settings, 'EMAIL_HOST', None),
                        'email_port': getattr(settings, 'EMAIL_PORT', None),
                        'email_use_tls': getattr(settings, 'EMAIL_USE_TLS', None),
                        'default_from_email': getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                    }
                )
                subject = "Your Bharat Auto Bazaar OTP"
                message = f"Your OTP is {otp_token.otp}. It expires in 5 minutes."
                sent = send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False
                )
                logger.info(
                    "OTP email dispatched",
                    extra={'otp_id': str(otp_token.id), 'target': masked_email_for_log, 'sent_count': sent}
                )
            except Exception:
                logger.exception(
                    "Failed to send OTP via Email",
                    extra={
                        'otp_id': str(otp_token.id),
                        'target': masked_email_for_log,
                        'email_backend': getattr(settings, 'EMAIL_BACKEND', None),
                        'email_host': getattr(settings, 'EMAIL_HOST', None),
                        'email_port': getattr(settings, 'EMAIL_PORT', None),
                        'email_use_tls': getattr(settings, 'EMAIL_USE_TLS', None),
                        'default_from_email': getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                    }
                )
                raise serializers.ValidationError("Failed to send OTP. Please try again later.")

        masked = None
        if phone_number:
            s = str(phone_number)
            masked = s[:3] + '****' + s[-4:]
            key = 'masked_phone'
        else:
            # mask email like a***@d***.com
            local, _, domain = email.partition('@')
            masked_local = (local[0] + '***') if local else '***'
            dom_main, _, dom_tld = domain.partition('.')
            masked_domain = (dom_main[:1] + '***') if dom_main else '***'
            masked = f"{masked_local}@{masked_domain}.{dom_tld or '***'}"
            key = 'masked_email'

        return {
            'otp_id': str(otp_token.id),
            'expires_at': otp_token.expires_at,
            key: masked,
            # Optional dev hint (example)
            'otp': otp_token.otp if settings.DEBUG else None
        }


class VerifyOTPSerializer(serializers.Serializer):
    """
    Serializer for verifying OTP and logging in user
    """
    otp_id = serializers.UUIDField()
    otp = serializers.CharField(max_length=6)
    phone_number = PhoneNumberField(required=False)
    email = serializers.EmailField(required=False)
    
    def validate(self, attrs):
        """Validate OTP and return user"""
        otp_id = attrs.get('otp_id')
        otp = attrs.get('otp')
        # Email/phone are not strictly required here; otp_id is primary
        
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
        
        # Determine identity from token
        phone_number = otp_token.phone_number
        email = otp_token.email

        # Get or create user, preferring phone-based identity if present; else email
        if phone_number:
            user, created = User.objects.get_or_create(
                phone_number=phone_number,
                defaults={'is_verified': True, 'email': email or None}
            )
            # If user exists but email empty and token has email, set it (best-effort)
            if email and not user.email:
                user.email = email
                user.save()
        else:
            # Email-only login; need to find or create a user. Since our User model uses phone_number as USERNAME_FIELD,
            # we will create a placeholder phone_number for email-only users (not ideal long-term but works for OTP-only auth).
            # Use a synthetic E.164-like value that won't collide: +999<uuid4 last 9 digits>
            import uuid
            placeholder = f"+999{str(uuid.uuid4().int)[-9:]}"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'is_verified': True, 'phone_number': placeholder}
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