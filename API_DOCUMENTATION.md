# Spinny Car Marketplace - API Documentation

## Base URL
```
Production: https://api.spinny.com/v1
Staging: https://staging-api.spinny.com/v1
Development: http://localhost:3000/api/v1
```

## Authentication
All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication APIs

### 1.1 Send OTP
**POST** `/auth/send-otp`

Send OTP to user's phone number for login/registration.

**Request Body:**
```json
{
  "phoneNumber": "+919876543210",
  "countryCode": "+91"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otpId": "otp_12345",
    "expiresAt": "2024-01-01T10:35:00Z",
    "maskedPhone": "+91****43210"
  }
}
```

### 1.2 Verify OTP & Login
**POST** `/auth/verify-otp`

Verify OTP and login/register user.

**Request Body:**
```json
{
  "otpId": "otp_12345",
  "otp": "1234",
  "phoneNumber": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_123",
      "phoneNumber": "+919876543210",
      "name": "John Doe",
      "email": "john@example.com",
      "isNewUser": false,
      "profile": {
        "avatar": "https://cdn.spinny.com/avatars/user_123.jpg",
        "city": "Delhi",
        "verified": true
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2024-01-01T10:00:00Z"
    }
  }
}
```

### 1.3 Refresh Token
**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-01-01T11:00:00Z"
  }
}
```

### 1.4 Logout
**POST** `/auth/logout`

Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. Car Listings APIs

### 2.1 Get All Cars
**GET** `/cars`

Get paginated list of all cars with filtering and sorting.

**Query Parameters:**
```
page=1
limit=12
brand=Maruti Suzuki
fuelType=Petrol
minPrice=500000
maxPrice=1000000
city=Delhi
year=2020
transmission=Manual
sortBy=price_asc|price_desc|year_desc|km_asc
search=Swift VXI
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cars": [
      {
        "id": "car_123",
        "brand": "Maruti Suzuki",
        "model": "Swift VXI",
        "year": 2019,
        "price": 545000,
        "originalPrice": 620000,
        "kmDriven": 28000,
        "fuelType": "Petrol",
        "transmission": "Manual",
        "location": {
          "city": "Delhi",
          "state": "Delhi",
          "area": "Connaught Place"
        },
        "images": [
          {
            "id": "img_1",
            "url": "https://cdn.spinny.com/cars/car_123/image_1.jpg",
            "thumbnail": "https://cdn.spinny.com/cars/car_123/thumb_1.jpg",
            "order": 1
          }
        ],
        "thumbnail": "https://cdn.spinny.com/cars/car_123/thumb_1.jpg",
        "verified": true,
        "owner": "1st Owner",
        "features": ["AC", "Power Steering", "ABS", "Airbags"],
        "condition": {
          "exterior": "Good",
          "interior": "Excellent",
          "engine": "Good"
        },
        "insurance": {
          "valid": true,
          "expiryDate": "2024-12-31"
        },
        "seller": {
          "id": "seller_456",
          "name": "Rajesh Kumar",
          "type": "individual",
          "rating": 4.5
        },
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 150,
      "totalPages": 13,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "availableBrands": ["Maruti Suzuki", "Hyundai", "Honda"],
      "availableCities": ["Delhi", "Mumbai", "Bangalore"],
      "priceRange": {
        "min": 200000,
        "max": 2000000
      },
      "yearRange": {
        "min": 2015,
        "max": 2024
      }
    }
  }
}
```

### 2.2 Get Car Details
**GET** `/cars/{carId}`

Get detailed information about a specific car.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "car_123",
    "brand": "Maruti Suzuki",
    "model": "Swift VXI",
    "variant": "VXI",
    "year": 2019,
    "price": 545000,
    "originalPrice": 620000,
    "kmDriven": 28000,
    "fuelType": "Petrol",
    "transmission": "Manual",
    "location": {
      "city": "Delhi",
      "state": "Delhi",
      "area": "Connaught Place",
      "coordinates": {
        "lat": 28.6139,
        "lng": 77.2090
      }
    },
    "images": [
      {
        "id": "img_1",
        "url": "https://cdn.spinny.com/cars/car_123/image_1.jpg",
        "thumbnail": "https://cdn.spinny.com/cars/car_123/thumb_1.jpg",
        "order": 1,
        "title": "Front View"
      }
    ],
    "videos": [
      {
        "id": "vid_1",
        "url": "https://cdn.spinny.com/cars/car_123/video_1.mp4",
        "thumbnail": "https://cdn.spinny.com/cars/car_123/video_thumb_1.jpg",
        "duration": 30,
        "title": "Interior Tour"
      }
    ],
    "specifications": {
      "engine": "1.2L VVT Petrol",
      "mileage": "22.05 kmpl",
      "seatingCapacity": 5,
      "fuelTankCapacity": "37 L",
      "bootSpace": "268 L",
      "groundClearance": "163 mm",
      "kerbWeight": "860 kg",
      "maxPower": "82 bhp @ 6000 rpm",
      "maxTorque": "113 Nm @ 4200 rpm",
      "dimensions": {
        "length": "3840 mm",
        "width": "1735 mm",
        "height": "1530 mm",
        "wheelbase": "2450 mm"
      }
    },
    "verified": true,
    "owner": "1st Owner",
    "features": ["AC", "Power Steering", "ABS", "Airbags", "Power Windows"],
    "condition": {
      "exterior": "Good",
      "interior": "Excellent", 
      "engine": "Good"
    },
    "accidentHistory": "No Accident",
    "serviceHistory": {
      "records": 12,
      "lastServiceDate": "2023-11-15",
      "nextServiceDue": "2024-05-15"
    },
    "insurance": {
      "valid": true,
      "expiryDate": "2024-12-31",
      "company": "ICICI Lombard",
      "type": "Comprehensive"
    },
    "registration": {
      "number": "DL01XX1234",
      "state": "Delhi",
      "registrationDate": "2019-03-15",
      "transferAvailable": true
    },
    "seller": {
      "id": "seller_456",
      "name": "Rajesh Kumar",
      "phoneNumber": "+919876543210",
      "type": "individual",
      "rating": 4.5,
      "reviewCount": 23,
      "location": "Connaught Place, Delhi",
      "verified": true,
      "memberSince": "2023-01-15"
    },
    "description": "Well-maintained Swift VXI with complete service history...",
    "qualityScore": 85,
    "priceAnalysis": {
      "marketPrice": 580000,
      "dealValue": "Excellent",
      "savingAmount": 75000
    },
    "views": 1245,
    "inquiries": 23,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

### 2.3 Search Cars
**GET** `/cars/search`

Advanced search with autocomplete suggestions.

**Query Parameters:**
```
q=Swift VXI Delhi
filters[brand]=Maruti Suzuki
filters[city]=Delhi
suggestions=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      // Same car object structure as above
    ],
    "suggestions": [
      "Swift VXI",
      "Swift VDI",
      "Swift Dzire VXI"
    ],
    "searchMeta": {
      "query": "Swift VXI Delhi",
      "resultsCount": 12,
      "executionTime": "45ms"
    }
  }
}
```

---

## 3. Seller/Listing Management APIs

### 3.1 Create Car Listing
**POST** `/cars`

Create a new car listing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "brand": "Maruti Suzuki",
  "model": "Swift VXI",
  "variant": "VXI",
  "year": 2019,
  "fuelType": "Petrol",
  "transmission": "Manual",
  "kmDriven": 28000,
  "owners": "1st Owner",
  "expectedPrice": 545000,
  "urgency": "month",
  "condition": {
    "exterior": "Good",
    "interior": "Excellent",
    "engine": "Good"
  },
  "accidentHistory": "No Accident",
  "features": ["AC", "Power Steering", "ABS", "Airbags"],
  "location": {
    "city": "Delhi",
    "state": "Delhi",
    "area": "Connaught Place",
    "address": "123 Main Street, CP, New Delhi"
  },
  "description": "Well-maintained car with complete service history",
  "contact": {
    "sellerName": "Rajesh Kumar",
    "phoneNumber": "+919876543210",
    "email": "rajesh@example.com"
  },
  "imageIds": ["img_1", "img_2", "img_3", "img_4"],
  "videoIds": ["vid_1"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Listing created successfully",
  "data": {
    "id": "car_123",
    "status": "pending_verification",
    "estimatedApprovalTime": "24-48 hours",
    "listingUrl": "/listing/car_123",
    "nextSteps": [
      "Our team will verify the details",
      "Professional inspection will be scheduled",
      "Listing will go live after approval"
    ]
  }
}
```

### 3.2 Update Car Listing
**PUT** `/cars/{carId}`

Update existing car listing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "expectedPrice": 550000,
  "description": "Updated description...",
  "urgency": "immediate"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Listing updated successfully",
  "data": {
    "id": "car_123",
    "status": "pending_verification",
    "updatedAt": "2024-01-01T11:00:00Z"
  }
}
```

### 3.3 Delete Car Listing
**DELETE** `/cars/{carId}`

Delete a car listing.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

### 3.4 Get Seller Listings
**GET** `/sellers/me/cars`

Get all listings for the authenticated seller.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```
status=pending|approved|rejected|sold
page=1
limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "car_123",
        "brand": "Maruti Suzuki",
        "model": "Swift VXI",
        "year": 2019,
        "price": 545000,
        "status": "approved",
        "views": 1245,
        "inquiries": 23,
        "thumbnail": "https://cdn.spinny.com/cars/car_123/thumb_1.jpg",
        "createdAt": "2024-01-01T10:00:00Z",
        "approvedAt": "2024-01-02T10:00:00Z"
      }
    ],
    "stats": {
      "total": 5,
      "pending": 1,
      "approved": 3,
      "rejected": 0,
      "sold": 1
    }
  }
}
```

---

## 4. File Upload APIs

### 4.1 Upload Car Images
**POST** `/upload/car-images`

Upload multiple car images.

**Headers:** 
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form Data:
- images: File[] (max 10 files, 5MB each)
- carId: string (optional, for existing cars)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "img_123",
        "url": "https://cdn.spinny.com/uploads/img_123.jpg",
        "thumbnail": "https://cdn.spinny.com/uploads/thumb_123.jpg",
        "size": 1024000,
        "dimensions": {
          "width": 1920,
          "height": 1080
        }
      }
    ]
  }
}
```

### 4.2 Upload Car Video
**POST** `/upload/car-video`

Upload car video.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form Data:
- video: File (max 50MB, mp4/mov)
- carId: string (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "vid_123",
      "url": "https://cdn.spinny.com/uploads/vid_123.mp4",
      "thumbnail": "https://cdn.spinny.com/uploads/vid_thumb_123.jpg",
      "duration": 30,
      "size": 25600000
    }
  }
}
```

---

## 5. Communication APIs

### 5.1 Contact Seller
**POST** `/cars/{carId}/contact`

Send message to car seller.

**Request Body:**
```json
{
  "buyerName": "John Doe",
  "buyerPhone": "+919876543210",
  "buyerEmail": "john@example.com",
  "message": "Hi, I am interested in this car. Please share more details.",
  "preferredContactTime": "morning|afternoon|evening|anytime"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "inquiryId": "inq_123",
    "estimatedResponse": "Within 2 hours"
  }
}
```

### 5.2 Get Inquiries (Seller)
**GET** `/sellers/me/inquiries`

Get all inquiries for seller's listings.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```
carId=car_123
status=new|responded|closed
page=1
limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inquiries": [
      {
        "id": "inq_123",
        "car": {
          "id": "car_123",
          "brand": "Maruti Suzuki",
          "model": "Swift VXI",
          "thumbnail": "https://cdn.spinny.com/cars/car_123/thumb_1.jpg"
        },
        "buyer": {
          "name": "John Doe",
          "phone": "+919876543210",
          "email": "john@example.com"
        },
        "message": "Hi, I am interested in this car...",
        "status": "new",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "stats": {
      "total": 23,
      "new": 5,
      "responded": 15,
      "closed": 3
    }
  }
}
```

### 5.3 Respond to Inquiry
**POST** `/inquiries/{inquiryId}/respond`

Respond to buyer inquiry.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "message": "Thank you for your interest. The car is available for viewing.",
  "availableForCall": true,
  "preferredContactTime": "morning"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Response sent successfully"
}
```

---

## 6. User Profile APIs

### 6.1 Get User Profile
**GET** `/users/me`

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "phoneNumber": "+919876543210",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": "https://cdn.spinny.com/avatars/user_123.jpg",
    "location": {
      "city": "Delhi",
      "state": "Delhi"
    },
    "verified": true,
    "memberSince": "2023-01-15",
    "preferences": {
      "notifications": {
        "email": true,
        "sms": true,
        "push": true
      },
      "savedSearches": [
        {
          "id": "search_1",
          "name": "Swift in Delhi",
          "filters": {
            "brand": "Maruti Suzuki",
            "model": "Swift",
            "city": "Delhi"
          }
        }
      ]
    }
  }
}
```

### 6.2 Update User Profile
**PUT** `/users/me`

Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

## 7. Admin APIs

### 7.1 Admin Login
**POST** `/admin/auth/login`

Admin login with email and password.

**Request Body:**
```json
{
  "email": "admin@spinny.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "admin_123",
      "name": "Admin User",
      "email": "admin@spinny.com",
      "role": "super_admin",
      "permissions": ["manage_listings", "manage_users", "view_analytics"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 7.2 Get All Listings (Admin)
**GET** `/admin/cars`

Get all listings for admin review.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
```
status=pending|approved|rejected
page=1
limit=20
sortBy=created_desc|price_asc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "car_123",
        "brand": "Maruti Suzuki",
        "model": "Swift VXI",
        "year": 2019,
        "price": 545000,
        "status": "pending",
        "seller": {
          "id": "seller_456",
          "name": "Rajesh Kumar",
          "phone": "+919876543210"
        },
        "submittedAt": "2024-01-01T10:00:00Z",
        "qualityScore": 85,
        "flagged": false
      }
    ],
    "stats": {
      "total": 150,
      "pending": 25,
      "approved": 120,
      "rejected": 5
    }
  }
}
```

### 7.3 Approve/Reject Listing
**POST** `/admin/cars/{carId}/review`

Approve or reject a car listing.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "action": "approve|reject",
  "reason": "Quality standards met|Price too high|Incomplete information",
  "feedback": "Optional feedback for seller",
  "suggestedPrice": 520000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Listing approved successfully",
  "data": {
    "status": "approved",
    "reviewedAt": "2024-01-01T11:00:00Z",
    "reviewedBy": "admin_123"
  }
}
```

---

## 8. Analytics & Metrics APIs

### 8.1 Car Analytics
**GET** `/cars/{carId}/analytics`

Get analytics for a specific car listing.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "views": {
      "total": 1245,
      "weekly": 89,
      "daily": 12
    },
    "inquiries": {
      "total": 23,
      "conversion": 1.8
    },
    "performance": {
      "rank": 15,
      "category": "Good",
      "averageTimeToSell": "18 days"
    },
    "priceComparison": {
      "similar": [
        {
          "carId": "car_456",
          "price": 525000,
          "status": "sold"
        }
      ]
    }
  }
}
```

### 8.2 Seller Dashboard Stats
**GET** `/sellers/me/stats`

Get seller dashboard statistics.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": {
      "total": 5,
      "active": 3,
      "sold": 1,
      "pending": 1
    },
    "performance": {
      "totalViews": 5678,
      "totalInquiries": 89,
      "averageResponseTime": "2.5 hours",
      "rating": 4.5
    },
    "earnings": {
      "totalSales": 1545000,
      "thisMonth": 545000
    }
  }
}
```

---

## 9. Utility APIs

### 9.1 EMI Calculator
**POST** `/utils/calculate-emi`

Calculate EMI for given parameters.

**Request Body:**
```json
{
  "principal": 545000,
  "interestRate": 9.5,
  "tenure": 60
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emi": 11567,
    "totalAmount": 694020,
    "totalInterest": 149020,
    "breakdown": [
      {
        "month": 1,
        "emi": 11567,
        "principal": 7243,
        "interest": 4324,
        "balance": 537757
      }
    ]
  }
}
```

### 9.2 Get Cities
**GET** `/utils/cities`

Get list of supported cities.

**Response:**
```json
{
  "success": true,
  "data": {
    "cities": [
      {
        "id": "delhi",
        "name": "Delhi",
        "state": "Delhi",
        "active": true,
        "carCount": 1250
      }
    ]
  }
}
```

### 9.3 Get Car Brands/Models
**GET** `/utils/car-data`

Get car brands and models data.

**Query Parameters:**
```
brand=Maruti Suzuki
```

**Response:**
```json
{
  "success": true,
  "data": {
    "brands": [
      {
        "name": "Maruti Suzuki",
        "logo": "https://cdn.spinny.com/brands/maruti.png",
        "models": [
          {
            "name": "Swift",
            "variants": ["LXI", "VXI", "ZXI"]
          }
        ]
      }
    ]
  }
}
```

---

## Error Responses

All APIs return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": {
      "field": "phoneNumber",
      "value": "invalid_phone"
    }
  }
}
```

### Common Error Codes:
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Invalid or missing authentication token
- `FORBIDDEN` - User doesn't have permission for this action
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes:
- `200` - Success
- `201` - Created successfully
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `409` - Conflict
- `422` - Validation error
- `429` - Rate limit exceeded
- `500` - Internal server error

---

## Rate Limiting

API endpoints are rate limited:
- **Authentication APIs**: 10 requests per minute per IP
- **Search APIs**: 100 requests per minute per user
- **Upload APIs**: 20 requests per hour per user
- **General APIs**: 1000 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Webhooks

### Car Status Updates
Webhook sent when car listing status changes.

**POST** `{webhook_url}`

**Payload:**
```json
{
  "event": "car.status_changed",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "carId": "car_123",
    "oldStatus": "pending",
    "newStatus": "approved",
    "sellerId": "seller_456"
  }
}
```

### New Inquiry
Webhook sent when someone contacts seller.

**Payload:**
```json
{
  "event": "inquiry.created",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "inquiryId": "inq_123",
    "carId": "car_123",
    "sellerId": "seller_456",
    "buyerContact": "+919876543210"
  }
}
```

---

This comprehensive API documentation covers all the functionality we've built in the Spinny car marketplace frontend application. 