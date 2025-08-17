"""
Car models for Spinny Car Marketplace
"""
import uuid
import os
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()


class CarBrand(models.Model):
    """
    Car brands/manufacturers
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # SEO
    slug = models.SlugField(unique=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'car_brands'
        verbose_name = 'Car Brand'
        verbose_name_plural = 'Car Brands'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class CarModel(models.Model):
    """
    Car models for each brand
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.ForeignKey(CarBrand, on_delete=models.CASCADE, related_name='models')
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    
    # SEO
    slug = models.SlugField()
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'car_models'
        verbose_name = 'Car Model'
        verbose_name_plural = 'Car Models'
        unique_together = ['brand', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.brand.name} {self.name}"


class CarVariant(models.Model):
    """
    Car variants for each model
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car_model = models.ForeignKey(CarModel, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'car_variants'
        verbose_name = 'Car Variant'
        verbose_name_plural = 'Car Variants'
        unique_together = ['car_model', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.car_model} {self.name}"


class City(models.Model):
    """
    Cities where cars are available
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    
    # Location data
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    # SEO
    slug = models.SlugField(unique=True)
    
    # Metadata
    car_count = models.PositiveIntegerField(default=0)  # Cached count of available cars
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cities'
        verbose_name = 'City'
        verbose_name_plural = 'Cities'
        unique_together = ['name', 'state']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name}, {self.state}"


class Car(models.Model):
    """
    Main car listing model
    """
    FUEL_CHOICES = [
        ('petrol', 'Petrol'),
        ('diesel', 'Diesel'),
        ('cng', 'CNG'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid'),
        ('lpg', 'LPG'),
    ]
    
    TRANSMISSION_CHOICES = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
        ('cvt', 'CVT'),
        ('amt', 'AMT'),
    ]
    
    OWNER_CHOICES = [
        ('1st', '1st Owner'),
        ('2nd', '2nd Owner'),
        ('3rd', '3rd Owner'),
        ('4th+', '4th+ Owner'),
    ]
    
    URGENCY_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
        ('very_urgent', 'Very Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('sold', 'Sold'),
        ('inactive', 'Inactive'),
    ]
    
    CONDITION_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('average', 'Average'),
        ('poor', 'Poor'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic car information
    brand = models.ForeignKey(CarBrand, on_delete=models.CASCADE)
    car_model = models.ForeignKey(CarModel, on_delete=models.CASCADE)
    variant = models.ForeignKey(CarVariant, on_delete=models.SET_NULL, blank=True, null=True)
    year = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1980),
            MaxValueValidator(timezone.now().year + 1)
        ]
    )
    
    # Technical specifications
    fuel_type = models.CharField(max_length=10, choices=FUEL_CHOICES)
    transmission = models.CharField(max_length=10, choices=TRANSMISSION_CHOICES)
    km_driven = models.PositiveIntegerField()
    engine_displacement = models.PositiveIntegerField(blank=True, null=True)  # in CC
    mileage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)  # kmpl
    
    # Ownership and condition
    owner_number = models.CharField(max_length=4, choices=OWNER_CHOICES)
    exterior_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)
    interior_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)
    engine_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)
    accident_history = models.CharField(max_length=255, default='No Accident')
    
    # Pricing
    price = models.PositiveIntegerField()  # in rupees
    original_price = models.PositiveIntegerField(blank=True, null=True)  # market price
    negotiable = models.BooleanField(default=True)
    
    # Location
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    area = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    
    # Seller information
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cars')
    seller_name = models.CharField(max_length=255)
    seller_phone = models.CharField(max_length=20)
    seller_email = models.EmailField(blank=True)
    
    # Car details
    title = models.CharField(max_length=255)  # Auto-generated or custom
    description = models.TextField()
    features = models.JSONField(default=list)  # List of car features
    
    # Vehicle documents
    registration_number = models.CharField(max_length=20, blank=True)
    registration_state = models.CharField(max_length=100, blank=True)
    registration_date = models.DateField(blank=True, null=True)
    insurance_valid = models.BooleanField(default=False)
    insurance_expiry = models.DateField(blank=True, null=True)
    rc_transfer_available = models.BooleanField(default=True)
    
    # Additional specifications
    specifications = models.JSONField(default=dict)  # Technical specs like power, torque, etc.
    
    # Listing management
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    verified = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)
    urgency = models.CharField(
        max_length=20,
        choices=URGENCY_CHOICES,
        default='normal'
    )
    
    # Quality and analytics
    quality_score = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(100)])
    views_count = models.PositiveIntegerField(default=0)
    inquiries_count = models.PositiveIntegerField(default=0)
    favorites_count = models.PositiveIntegerField(default=0)
    
    # Admin review
    reviewed_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='reviewed_cars'
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    sold_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'cars'
        verbose_name = 'Car'
        verbose_name_plural = 'Cars'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'verified']),
            models.Index(fields=['brand', 'car_model']),
            models.Index(fields=['city', 'price']),
            models.Index(fields=['fuel_type', 'transmission']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return self.title or f"{self.brand.name} {self.car_model.name} {self.year}"
    
    def save(self, *args, **kwargs):
        if not self.title:
            variant_name = self.variant.name if self.variant else ''
            self.title = f"{self.year} {self.brand.name} {self.car_model.name} {variant_name}".strip()
        super().save(*args, **kwargs)
    
    @property
    def thumbnail(self):
        """Get the first image as thumbnail"""
        first_image = self.images.filter(is_primary=True).first()
        if not first_image:
            first_image = self.images.first()
        return first_image.image.url if first_image else None
    
    @property
    def price_analysis(self):
        """Calculate price analysis compared to market"""
        if not self.original_price:
            return None
        
        saving = self.original_price - self.price
        percentage = (saving / self.original_price) * 100
        
        if percentage > 15:
            deal_value = "Excellent"
        elif percentage > 10:
            deal_value = "Great"
        elif percentage > 5:
            deal_value = "Good"
        else:
            deal_value = "Fair"
        
        return {
            'market_price': self.original_price,
            'deal_value': deal_value,
            'saving_amount': saving,
            'saving_percentage': round(percentage, 1)
        }


def car_image_upload_path(instance, filename):
    """Generate upload path for car images"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    
    # If car is not assigned yet, use a temporary folder
    if instance.car is None:
        return f"cars/temp/images/{filename}"
    
    return f"cars/{instance.car.id}/images/{filename}"


class CarImage(models.Model):
    """
    Car images
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='images', null=True, blank=True)
    image = models.ImageField(upload_to=car_image_upload_path)
    thumbnail = models.ImageField(upload_to='cars/thumbnails/', blank=True, null=True)
    
    # Image metadata
    title = models.CharField(max_length=255, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    
    # File information
    file_size = models.PositiveIntegerField(blank=True, null=True)  # in bytes
    width = models.PositiveIntegerField(blank=True, null=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'car_images'
        verbose_name = 'Car Image'
        verbose_name_plural = 'Car Images'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        if self.car:
            return f"Image for {self.car.title}"
        return f"Unassigned Image {self.id}"
    
    def save(self, *args, **kwargs):
        # Set as primary if it's the first image for this car
        if self.car and not self.car.images.exists():
            self.is_primary = True
        super().save(*args, **kwargs)


def car_video_upload_path(instance, filename):
    """Generate upload path for car videos"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"cars/{instance.car.id}/videos/{filename}"


class CarVideo(models.Model):
    """
    Car videos
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField(upload_to=car_video_upload_path)
    thumbnail = models.ImageField(upload_to='cars/video_thumbnails/', blank=True, null=True)
    
    # Video metadata
    title = models.CharField(max_length=255, blank=True)
    duration = models.PositiveIntegerField(blank=True, null=True)  # in seconds
    
    # File information
    file_size = models.PositiveIntegerField(blank=True, null=True)  # in bytes
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'car_videos'
        verbose_name = 'Car Video'
        verbose_name_plural = 'Car Videos'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Video for {self.car.title}"


class CarView(models.Model):
    """
    Track car views for analytics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='view_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    
    # View metadata
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    device_type = models.CharField(max_length=50, blank=True)  # mobile, desktop, tablet
    
    # Timestamps
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'car_views'
        verbose_name = 'Car View'
        verbose_name_plural = 'Car Views'
        ordering = ['-viewed_at']
        unique_together = ['car', 'user', 'ip_address']  # Prevent duplicate views
    
    def __str__(self):
        return f"View of {self.car.title}"


class CarFavorite(models.Model):
    """
    User favorites/wishlist
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='favorited_by')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'car_favorites'
        verbose_name = 'Car Favorite'
        verbose_name_plural = 'Car Favorites'
        unique_together = ['user', 'car']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.phone_number} favorited {self.car.title}" 