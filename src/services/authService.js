/**
 * Authentication Service for Spinny Car Marketplace
 * Handles OTP login, JWT tokens, and user management
 */

import apiService, { ApiError } from './api';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    
    // Initialize user from localStorage if token exists
    if (this.token) {
      try {
        const currentUserData = localStorage.getItem('currentUser');
        this.currentUser = currentUserData && currentUserData !== 'undefined' 
          ? JSON.parse(currentUserData) 
          : null;
      } catch (error) {
        console.warn('Failed to parse currentUser from localStorage:', error);
        this.currentUser = null;
        // Clear corrupted data
        localStorage.removeItem('currentUser');
      }
      apiService.setToken(this.token);
    }
  }

  // Send OTP to phone number or email
  async sendOTP(target, countryCode = '+91') {
    try {
      const payload = {};
      if (String(target).includes('@')) {
        payload.email = String(target).trim();
      } else {
        // Format phone number properly for django-phonenumber-field
        let formattedPhone = target;
        if (!String(target).startsWith('+')) {
          const cleanNumber = String(target).replace(/^0+/, '').replace(/\s+/g, '');
          formattedPhone = countryCode + cleanNumber;
        }
        payload.phone_number = formattedPhone;
      }

      const response = await apiService.post('/auth/send-otp/', payload, { includeAuth: false });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isRateLimit: error.isRateLimitError(),
      };
    }
  }

  // Verify OTP and login
  async verifyOTP(otpId, otp, target) {
    try {
      const payload = { otp_id: otpId, otp };
      if (target) {
        if (String(target).includes('@')) {
          payload.email = String(target).trim();
        } else {
          let formattedPhone = target;
          const digitsOnly = String(target).replace(/\D+/g, '')
          if (String(target).startsWith('+')) {
            formattedPhone = `+${digitsOnly}`
          } else {
            const withoutCountry = digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly
            formattedPhone = `+91${withoutCountry}`
          }
          payload.phone_number = formattedPhone;
        }
      }

      console.log('AuthService verifyOTP called with:', payload)

      const response = await apiService.post('/auth/verify-otp/', payload, { includeAuth: false });

      console.log('AuthService verifyOTP response:', response)

      // Store authentication data - Handle different response structures
      let user, tokens;
      
      if (response.data && response.data.data) {
        // Nested structure: response.data.data
        ({ user, tokens } = response.data.data);
      } else if (response.data) {
        // Direct structure: response.data
        ({ user, tokens } = response.data);
      } else {
        throw new Error('Invalid response structure');
      }
      
      if (!user || !tokens) {
        throw new Error('Missing user or tokens in response');
      }
      
      this.currentUser = user;
      this.token = tokens.access_token;
      this.refreshToken = tokens.refresh_token;

      // Persist to localStorage
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('refreshToken', this.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(user));

      // Set token in API service
      apiService.setToken(this.token);

      return {
        success: true,
        user: user,
        isNewUser: user.is_new_user,
      };
    } catch (error) {
      console.error('AuthService verifyOTP error:', error)
      return {
        success: false,
        error: error.message,
        validationErrors: error.getValidationErrors ? error.getValidationErrors() : {},
      };
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.post('/auth/refresh/', {
        refresh_token: this.refreshToken,
      }, { includeAuth: false });

      this.token = response.data.access_token;
      localStorage.setItem('authToken', this.token);
      apiService.setToken(this.token);

      return true;
    } catch (error) {
      // Refresh token is invalid, logout user
      this.logout();
      throw error;
    }
  }

  // Clear all authentication data and corrupted localStorage
  clearAuthData() {
    this.currentUser = null;
    this.token = null;
    this.refreshToken = null;
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    
    // Clear token from API service
    apiService.setToken(null);
  }

  // Logout user
  logout() {
    this.clearAuthData();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(this.token && this.currentUser);
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check authentication status with server
  async checkAuthStatus() {
    if (!this.token) {
      return { authenticated: false };
    }

    try {
      const response = await apiService.get('/auth/status/');
      return {
        authenticated: true,
        user: response.data.user,
      };
    } catch (error) {
      if (error.isAuthError()) {
        // Try to refresh token
        try {
          await this.refreshAccessToken();
          return this.checkAuthStatus(); // Retry with new token
        } catch (refreshError) {
          this.logout();
          return { authenticated: false };
        }
      }
      throw error;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const response = await apiService.get('/users/me/');
      
      // Update current user data
      this.currentUser = response.data;
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      return {
        success: true,
        user: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const response = await apiService.put('/users/me/update/', profileData);
      
      // Update current user data
      this.currentUser = { ...this.currentUser, ...response.data };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      return {
        success: true,
        user: this.currentUser,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationErrors: error.getValidationErrors(),
      };
    }
  }

  // Upload user avatar
  async uploadAvatar(file) {
    try {
      const response = await apiService.uploadFiles('/users/me/avatar/', file);
      
      // Update current user data
      this.currentUser = { ...this.currentUser, avatar: response.data.avatar };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      return {
        success: true,
        avatarUrl: response.data.avatar,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get saved searches
  async getSavedSearches() {
    try {
      const response = await apiService.get('/users/me/saved-searches/');
      return {
        success: true,
        searches: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Save search
  async saveSearch(searchData) {
    try {
      const response = await apiService.post('/users/me/saved-searches/', searchData);
      return {
        success: true,
        search: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationErrors: error.getValidationErrors(),
      };
    }
  }

  // Delete saved search
  async deleteSavedSearch(searchId) {
    try {
      await apiService.delete(`/users/me/saved-searches/${searchId}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Handle API errors globally
  handleApiError(error) {
    if (error.isAuthError()) {
      // Token expired or invalid
      this.logout();
      window.location.href = '/login';
    } else if (error.isRateLimitError()) {
      // Rate limit exceeded
      throw new Error('Too many requests. Please try again later.');
    } else if (error.isServerError()) {
      // Server error
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }

  // Admin login
  async adminLogin(credentials) {
    try {
      const response = await apiService.post('/auth/admin/login/', credentials)
      
      // Check if login was successful
      if (response.success && response.data && response.data.token) {
        const { token, user } = response.data
        
        // Set tokens and user data
        this.token = token
        this.currentUser = user
        
        // Persist to localStorage
        localStorage.setItem('authToken', this.token)
        localStorage.setItem('adminToken', this.token)
        localStorage.setItem('currentUser', JSON.stringify(user))
        
        // Set token in API service
        apiService.setToken(this.token)
        
        return {
          success: true,
          token: token,
          user: user
        }
      }
      
      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    }
  }

  // Development bypass login (auto OTP 000000)
  async devLogin(phoneNumber, countryCode = '+91') {
    try {
      // Format phone number
      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        const cleanNumber = phoneNumber.replace(/^0+/, '').replace(/\s+/g, '');
        formattedPhone = countryCode + cleanNumber;
      }

      // Use bypass OTP
      const response = await apiService.post('/auth/verify-otp/', {
        otp_id: 'dev-bypass',
        otp: '000000',
        phone_number: formattedPhone,
      }, { includeAuth: false });

      // Store authentication data - Fix: extract from response.data.data
      const { user, tokens } = response.data.data;
      
      this.currentUser = user;
      this.token = tokens.access_token;
      this.refreshToken = tokens.refresh_token;

      // Persist to localStorage
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('refreshToken', this.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(user));

      // Set token in API service
      apiService.setToken(this.token);

      return {
        success: true,
        user: user,
        isNewUser: user.is_new_user,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationErrors: error.getValidationErrors(),
      };
    }
  }

  // Static method to clean up corrupted localStorage (can be called directly)
  static cleanupLocalStorage() {
    try {
      const keys = ['authToken', 'refreshToken', 'currentUser'];
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value === 'undefined' || value === 'null' || value === '') {
          localStorage.removeItem(key);
        }
      });
      console.log('localStorage cleanup completed');
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { AuthService }; 