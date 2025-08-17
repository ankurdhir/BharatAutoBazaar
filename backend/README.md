# Spinny Car Marketplace Django Backend

A comprehensive Django REST API backend for the Spinny car marketplace platform with authentication, car listings, file uploads, communication, admin panel, and analytics.

## 🚀 Features Implemented

### ✅ **Core APIs (50+ endpoints)**
- **Authentication**: Phone OTP login, JWT tokens, user management
- **Car Listings**: CRUD operations, search, filtering, favorites
- **File Upload**: Images/videos with validation and processing
- **Communication**: Inquiries, notifications, seller-buyer messaging
- **Admin Panel**: Car review, user management, bulk operations
- **Analytics**: Car performance, seller stats, system metrics
- **Utilities**: EMI calculator, cities data, car brands/models

### ✅ **Database Models (20+ models)**
- User management with phone-based authentication
- Comprehensive car data (brands, models, variants, cities)
- File handling (images, videos with metadata)
- Communication system (inquiries, responses, notifications)
- Admin workflow (reviews, moderation, activities)
- Analytics tracking (views, conversions, revenue)

### ✅ **Advanced Features**
- Rate limiting (10 OTP/min, 5 login attempts/min)
- File validation (type, size, format)
- Comprehensive filtering and search
- Pagination and performance optimization
- Admin audit trail and activity logging
- Notification system with templates

## 📋 API Documentation

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Authentication** | 6 endpoints | OTP login, JWT tokens, user profile |
| **Cars** | 12 endpoints | CRUD, search, filtering, favorites |
| **File Upload** | 3 endpoints | Images/videos upload with validation |
| **Sellers** | 5 endpoints | Seller dashboard, listings, stats |
| **Communication** | 7 endpoints | Inquiries, notifications, messaging |
| **Admin** | 8 endpoints | Car review, user management, analytics |
| **Utils** | 6 endpoints | EMI calculator, cities, car data |

**📖 Full API Documentation**: `http://localhost:8000/api/docs/` (Swagger UI)

## 🛠 Installation & Setup

### Prerequisites
- Python 3.8+
- PostgreSQL (optional, SQLite included)
- Redis (optional, for caching/celery)

### 1. Setup Environment
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
TWILIO_ACCOUNT_SID=your_twilio_sid  # For OTP SMS
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 3. Database Setup
```bash
# Create and apply migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json
```

### 4. Run Development Server
```bash
# Start Django development server
python manage.py runserver

# Server will start at http://localhost:8000
```

## 🔗 API Base URLs

- **Development**: `http://localhost:8000/api/v1/`
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **Admin Panel**: `http://localhost:8000/admin/`

## 📱 Quick API Testing

### 1. Send OTP
```bash
curl -X POST http://localhost:8000/api/v1/auth/send-otp/ \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+919876543210"}'
```

### 2. Verify OTP & Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp/ \
  -H "Content-Type: application/json" \
  -d '{
    "otp_id": "your-otp-id",
    "otp": "123456",
    "phone_number": "+919876543210"
  }'
```

### 3. Get Cars (Public)
```bash
curl -X GET "http://localhost:8000/api/v1/cars/?page=1&limit=12&brand=Maruti&city=Delhi"
```

### 4. Create Car Listing (Authenticated)
```bash
curl -X POST http://localhost:8000/api/v1/sellers/me/cars/create/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "Maruti Suzuki",
    "model_name": "Swift",
    "year": 2020,
    "fuel_type": "petrol",
    "transmission": "manual",
    "km_driven": 25000,
    "price": 650000,
    "city_name": "Delhi",
    "state_name": "Delhi",
    "contact": {
      "sellerName": "John Doe",
      "phoneNumber": "+919876543210"
    }
  }'
```

## 🏗 Project Structure

```
backend/
├── spinny_api/          # Django project settings
├── authentication/      # User auth, OTP, JWT
├── cars/               # Car models, listings, search
├── communication/      # Inquiries, notifications
├── admin_panel/        # Admin management
├── analytics/          # Performance tracking
├── utils/             # EMI calculator, utilities
├── requirements.txt   # Dependencies
└── manage.py         # Django management
```

## 📊 Database Models Overview

### Core Models
- **User**: Custom user with phone authentication
- **Car**: Main car listing with all details
- **CarBrand/Model/Variant**: Car hierarchy
- **City**: Location management
- **CarImage/Video**: File handling

### Communication
- **Inquiry**: Buyer-seller communication
- **Notification**: System notifications
- **EmailLog/SMSLog**: Communication tracking

### Admin & Analytics
- **CarReview**: Admin review workflow
- **CarAnalytics**: Performance metrics
- **AdminActivity**: Audit trail

## 🔐 Authentication Flow

1. **Send OTP**: `POST /api/v1/auth/send-otp/`
2. **Verify OTP**: `POST /api/v1/auth/verify-otp/` → Returns JWT tokens
3. **Use JWT**: Include `Authorization: Bearer <token>` in headers
4. **Refresh Token**: `POST /api/v1/auth/refresh/` when needed

## 📤 File Upload Process

1. **Upload Files**: `POST /api/v1/upload/car-images/`
2. **Get File IDs**: Response contains file IDs
3. **Create Listing**: Include `image_ids` in car creation
4. **Files Auto-Associate**: Files link to car listing

## 👥 Admin Panel Features

### Car Management
- Review pending listings
- Approve/reject with reasons
- Bulk operations (approve/reject multiple)
- Quality scoring and flagging

### User Management
- View all users and their activity
- Track seller performance
- Manage user permissions

### Analytics Dashboard
- System-wide statistics
- Performance metrics
- Revenue tracking

## 📈 Analytics & Tracking

### Car Analytics
- View counts and unique visitors
- Inquiry conversion rates
- Geographic performance
- Device type breakdown

### Seller Analytics
- Listing performance
- Response times
- Success rates
- Earnings tracking

## ⚡ Performance Features

### Caching
- Redis integration for session storage
- Query optimization with select_related
- Pagination for large datasets

### Rate Limiting
- 10 OTP requests per minute per IP
- 5 login attempts per minute per IP
- API rate limiting by user/endpoint

### File Handling
- Image compression and thumbnails
- Video processing with metadata
- S3 integration for production

## 🧪 Testing the APIs

### Using Swagger UI
1. Go to `http://localhost:8000/api/docs/`
2. Explore all endpoints with interactive docs
3. Test authentication flow
4. Try different car search filters

### Sample Data
```bash
# Create sample brands and models
python manage.py shell
>>> from cars.models import CarBrand, CarModel
>>> brand = CarBrand.objects.create(name="Maruti Suzuki")
>>> CarModel.objects.create(brand=brand, name="Swift")
```

## 🚀 Production Deployment

### Environment Variables
```bash
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DATABASE_URL=postgresql://user:pass@localhost/spinny_db
REDIS_URL=redis://localhost:6379/0
USE_S3=True
AWS_STORAGE_BUCKET_NAME=your-bucket
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /media/ {
        alias /path/to/media/;
    }
}
```

## 🤝 Contributing

1. Follow PEP 8 style guide
2. Add tests for new features
3. Update API documentation
4. Use type hints where possible

## 📞 Support

- **API Issues**: Check `/api/docs/` for endpoint details
- **Database**: Run `python manage.py dbshell` for direct access
- **Logs**: Check `logs/django.log` for application logs

---

**🎉 Your Django backend is ready!** Start the server and explore the comprehensive API at `http://localhost:8000/api/docs/` 