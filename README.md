# Spinny Car Marketplace - React Frontend

A modern, responsive React frontend for the Spinny car marketplace platform, fully integrated with Django REST API backend.

## 🚀 Features

### Core Features
- **Car Listings**: Browse, search, and filter car listings with real-time data
- **Authentication**: Phone-based OTP authentication system
- **Seller Dashboard**: Complete seller management with listings, inquiries, and analytics
- **Car Selling**: Multi-step form for listing cars with image/video upload
- **Contact System**: Direct communication between buyers and sellers
- **EMI Calculator**: Real-time EMI calculation for car financing
- **Favorites**: Save and manage favorite car listings

### Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Theme**: System preference detection with manual override
- **PWA Support**: Progressive Web App with offline capabilities
- **Real-time Updates**: Live data integration with Django API
- **Error Handling**: Comprehensive error boundaries and user feedback
- **File Upload**: Drag-drop image/video upload with progress tracking
- **Animations**: Smooth Framer Motion animations and transitions

## 🛠️ Tech Stack

- **Framework**: React 18+ with functional components and hooks
- **Styling**: Tailwind CSS with dark mode support
- **Animations**: Framer Motion for smooth transitions
- **Routing**: React Router DOM v6 with future flags
- **State Management**: React Context API + Local state
- **HTTP Client**: Native Fetch API with custom service layer
- **UI Components**: Custom shadcn/ui-style components
- **Build Tool**: Vite for fast development and building
- **PWA**: Vite PWA plugin for service worker generation

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   ├── Navbar.jsx      # Navigation component
│   ├── Footer.jsx      # Footer component
│   └── ErrorBoundary.jsx # Global error handling
├── contexts/           # React Context providers
│   ├── ThemeContext.jsx    # Theme management
│   ├── BrandContext.jsx    # Brand configuration
│   └── GlobalLoaderContext.jsx # Loading states
├── pages/              # Page components
│   ├── Home.jsx        # Homepage with search
│   ├── Buy.jsx         # Car listings with filters
│   ├── Sell.jsx        # Multi-step car listing form
│   ├── Login.jsx       # OTP-based authentication
│   ├── Dashboard.jsx   # Seller dashboard
│   └── ListingDetails.jsx # Car detail page
├── services/           # API service layer
│   ├── api.js          # Base API configuration
│   ├── authService.js  # Authentication APIs
│   ├── carService.js   # Car-related APIs
│   └── communicationService.js # Messaging APIs
├── config/             # Configuration files
│   └── app.js          # App constants and config
└── hooks/              # Custom React hooks
    └── usePageMeta.jsx # SEO meta management
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Django backend running on `http://localhost:8000`

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Configuration
Create a `.env.local` file in the project root:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_API_TIMEOUT=30000

# App Configuration
REACT_APP_APP_NAME=Spinny
REACT_APP_APP_TAGLINE=India's Most Trusted Car Marketplace

# Feature Flags
REACT_APP_ENABLE_DEBUG=false
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true

# File Upload Limits
REACT_APP_MAX_IMAGE_SIZE=5242880
REACT_APP_MAX_VIDEO_SIZE=52428800
REACT_APP_MAX_IMAGES_PER_LISTING=10
```

## 🔌 API Integration

### Service Layer Architecture
The frontend uses a service layer pattern for API communication:

- **`apiService`**: Base HTTP client with authentication, error handling, and request/response interceptors
- **`authService`**: Authentication, user management, and session handling
- **`carService`**: Car listings, search, creation, and file uploads
- **`communicationService`**: Inquiries, notifications, and messaging

### Authentication Flow
1. User enters phone number
2. Backend sends OTP via SMS
3. User verifies OTP
4. JWT tokens stored in localStorage
5. Automatic token refresh on expiry
6. Global logout functionality

### Error Handling
- **Network Errors**: Automatic retry with exponential backoff
- **API Errors**: Structured error responses with user-friendly messages
- **Validation Errors**: Field-level error display
- **Rate Limiting**: Graceful handling with retry suggestions
- **Global Error Boundary**: Catches React errors with recovery options

## 🎨 UI/UX Features

### Theme System
- **Auto Detection**: Respects system preference
- **Manual Override**: User can toggle light/dark mode
- **Persistence**: Theme choice saved in localStorage
- **Flash Prevention**: Prevents theme flash on page load

### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Friendly**: Larger touch targets and swipe gestures
- **Progressive Enhancement**: Core functionality works without JavaScript

### Animations
- **Page Transitions**: Smooth navigation between pages
- **Loading States**: Skeleton loaders and spinners
- **Micro-interactions**: Hover effects and button animations
- **Form Validation**: Real-time validation feedback

## 📱 PWA Features

- **Offline Support**: Basic functionality works offline
- **Install Prompt**: Add to home screen capability
- **Service Worker**: Automatic updates and caching
- **Manifest**: App metadata and icons
- **Push Notifications**: (Ready for implementation)

## 🔍 SEO Optimization

- **Meta Tags**: Dynamic meta tags for each page
- **Open Graph**: Social media sharing optimization
- **Structured Data**: JSON-LD for search engines
- **Canonical URLs**: Prevent duplicate content issues
- **Performance**: Optimized loading and rendering

## 🚦 Performance Optimizations

- **Code Splitting**: Lazy loading of route components
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: WebP support and lazy loading
- **API Caching**: Request deduplication and caching
- **Virtual Scrolling**: For large lists (ready for implementation)

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📦 Deployment

### Build Optimization
```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze
```

### Environment Variables for Production
- Set `REACT_APP_API_URL` to production API endpoint
- Enable analytics and disable debug mode
- Configure external service keys (analytics, error reporting)

## 🔐 Security Features

- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based requests
- **Authentication**: JWT with automatic refresh
- **Data Validation**: Client and server-side validation
- **Secure Headers**: CSP and security headers ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@spinny.com or create an issue in the repository.

---

**Note**: This frontend is designed to work with the Spinny Django REST API backend. Ensure the backend is running and accessible before starting the frontend development server. 