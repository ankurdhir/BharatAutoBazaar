/**
 * App Configuration
 * Centralized configuration for the Spinny Car Marketplace React app
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
}

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Bharat Auto Bazaar',
  TAGLINE: import.meta.env.VITE_APP_TAGLINE || 'India\'s Premier Auto Marketplace',
  PRIMARY_COLOR: import.meta.env.VITE_PRIMARY_COLOR || '#3b82f6',
  SECONDARY_COLOR: import.meta.env.VITE_SECONDARY_COLOR || '#1e40af',
}

// Feature Flags
export const FEATURES = {
  DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  PWA: import.meta.env.VITE_ENABLE_PWA === 'true',
}

// File Upload Configuration
export const FILE_CONFIG = {
  MAX_IMAGE_SIZE: parseInt(import.meta.env.VITE_MAX_IMAGE_SIZE) || 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: parseInt(import.meta.env.VITE_MAX_VIDEO_SIZE) || 50 * 1024 * 1024, // 50MB
  MAX_IMAGES_PER_LISTING: parseInt(import.meta.env.VITE_MAX_IMAGES_PER_LISTING) || 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/mov'],
}

// External Services
export const EXTERNAL_SERVICES = {
  GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  HOTJAR_ID: import.meta.env.VITE_HOTJAR_ID,
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
}

// App Constants
export const CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
  
  // EMI Calculation
  DEFAULT_INTEREST_RATE: 8.5,
  MIN_INTEREST_RATE: 7.0,
  MAX_INTEREST_RATE: 18.0,
  DEFAULT_TENURE_MONTHS: 60,
  MIN_TENURE_MONTHS: 12,
  MAX_TENURE_MONTHS: 84,
  
  // Search & Filters
  SEARCH_DEBOUNCE_MS: 300,
  MAX_SEARCH_RESULTS: 100,
  
  // Car Details
  MIN_CAR_YEAR: 2000,
  MAX_CAR_YEAR: new Date().getFullYear() + 1,
  MIN_CAR_PRICE: 10000,
  MAX_CAR_PRICE: 10000000,
  MIN_KM_DRIVEN: 0,
  MAX_KM_DRIVEN: 500000,
  
  // Contact Time Options
  CONTACT_TIME_OPTIONS: [
    { value: 'anytime', label: 'Anytime' },
    { value: 'morning', label: 'Morning (9 AM - 12 PM)' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
    { value: 'evening', label: 'Evening (5 PM - 9 PM)' },
  ],
  
  // Car Condition Options
  CONDITION_OPTIONS: [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ],
  
  // Fuel Type Options
  FUEL_TYPE_OPTIONS: [
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'cng', label: 'CNG' },
    { value: 'electric', label: 'Electric' },
  ],
  
  // Transmission Options
  TRANSMISSION_OPTIONS: [
    { value: 'manual', label: 'Manual' },
    { value: 'automatic', label: 'Automatic' },
  ],
  
  // Owner Options
  OWNER_OPTIONS: [
    { value: '1', label: '1st Owner' },
    { value: '2', label: '2nd Owner' },
    { value: '3', label: '3rd Owner' },
    { value: '4', label: '4+ Owners' },
  ],
  
  // Urgency Options for Selling
  URGENCY_OPTIONS: [
    { value: 'normal', label: 'Normal (Within 3 months)' },
    { value: 'urgent', label: 'Urgent (Within 1 month)' },
    { value: 'very_urgent', label: 'Very Urgent (Within 2 weeks)' },
  ],
  
  // Sort Options
  SORT_OPTIONS: [
    { value: 'created_desc', label: 'Latest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'year_desc', label: 'Year: Newest First' },
    { value: 'km_asc', label: 'Mileage: Low to High' },
  ],
}

// Validation Rules
export const VALIDATION = {
  PHONE_REGEX: /^[+]?[91]?[0-9]{10}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  MESSAGE_MIN_LENGTH: 10,
  MESSAGE_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 1000,
}

// Theme Configuration
export const THEME = {
  COLORS: {
    PRIMARY: APP_CONFIG.PRIMARY_COLOR,
    SECONDARY: APP_CONFIG.SECONDARY_COLOR,
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  FILE_SIZE: 'File size is too large.',
  FILE_TYPE: 'File type is not supported.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_OTP: 'Please enter a valid OTP.',
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  LOGOUT: 'Logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  LISTING_CREATED: 'Car listing created successfully.',
  LISTING_UPDATED: 'Car listing updated successfully.',
  LISTING_DELETED: 'Car listing deleted successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
  FILE_UPLOADED: 'File uploaded successfully.',
  FAVORITE_ADDED: 'Added to favorites.',
  FAVORITE_REMOVED: 'Removed from favorites.',
}

// Development helpers
export const isDevelopment = import.meta.env.MODE === 'development'
export const isProduction = import.meta.env.MODE === 'production'

// Debug helper
export const debug = (...args) => {
  if (FEATURES.DEBUG && isDevelopment) {
    console.log('[DEBUG]', ...args)
  }
}

export default {
  API_CONFIG,
  APP_CONFIG,
  FEATURES,
  FILE_CONFIG,
  EXTERNAL_SERVICES,
  CONSTANTS,
  VALIDATION,
  THEME,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  isDevelopment,
  isProduction,
  debug,
} 