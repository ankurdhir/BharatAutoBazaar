/**
 * API Service for Spinny Car Marketplace
 * Handles all communication with Django backend
 */

// API Configuration: match current page protocol (http/https)
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  if (envUrl) {
    try {
      if (envUrl.startsWith('http')) {
        const u = new URL(envUrl);
        u.protocol = protocol; // force same scheme as current page
        return u.toString().replace(/\/$/, '');
      }
      if (envUrl.startsWith('/')) {
        return `${window.location.origin}${envUrl}`.replace(/\/$/, '');
      }
      return `${protocol}//${envUrl}`.replace(/\/$/, '');
    } catch {
      // fall through to default
    }
  }

  // Default dev backend
  return `${protocol}//localhost:8000/api/v1`;
};

const API_BASE_URL = resolveApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
    
    // Validate token format (basic check)
    if (this.token && !this.token.startsWith('eyJ') && !this.token.startsWith('admin_token_')) {
      console.warn('Invalid token format detected, clearing token');
      this.setToken(null);
    }
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders(includeAuth = true, contentType = 'application/json') {
    const headers = {
      'Accept': 'application/json',
    };

    // Only set Content-Type if it's not null (FormData needs browser to set it)
    if (contentType !== null) {
      headers['Content-Type'] = contentType;
    }

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.includeAuth !== false, options.contentType),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses (like file downloads)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 errors - clear invalid tokens
        if (response.status === 401 && this.token) {
          console.warn('401 Unauthorized - clearing invalid token');
          this.setToken(null);
        }
        throw new ApiError(data.error?.message || 'Request failed', response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      console.error('API Request failed:', error);
      throw new ApiError('Network error. Please check your connection.', 0, { originalError: error });
    }
  }

  // GET request
  async get(endpoint, params = {}, options = {}) {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key]);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, { method: 'GET', contentType: null, ...options });
  }

  // POST request
  async post(endpoint, data = {}, options = {}) {
    // Handle FormData differently - don't stringify it
    const body = data instanceof FormData ? data : JSON.stringify(data);
    
    return this.request(endpoint, {
      method: 'POST',
      body: body,
      ...options,
    });
  }

  // PUT request
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // PATCH request
  async patch(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  // Upload files
  async uploadFiles(endpoint, files, additionalData = {}) {
    const formData = new FormData();
    
    // Add files
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('images', file);
      });
    } else {
      formData.append('video', files);
    }

    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      contentType: null, // Let browser set multipart/form-data
    });
  }
}

// Custom error class for API errors
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  // Check if error is due to authentication
  isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  // Check if error is due to validation
  isValidationError() {
    return this.status === 400 && this.data?.error?.code === 'VALIDATION_ERROR';
  }

  // Get validation errors
  getValidationErrors() {
    return this.data?.error?.details || {};
  }

  // Check if error is due to rate limiting
  isRateLimitError() {
    return this.status === 429;
  }

  // Check if error is server-side
  isServerError() {
    return this.status >= 500;
  }
}

// Create singleton instance
const apiService = new ApiService();

export { apiService, ApiError };
export default apiService; 