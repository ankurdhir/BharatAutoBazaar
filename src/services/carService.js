/**
 * Car Service for Spinny Car Marketplace
 * Handles car listings, search, and related operations
 */

import apiService, { ApiError } from './api';

class CarService {
  // Get all cars with filtering and pagination
  async getCars(filters = {}) {
    try {
      const response = await apiService.get('/cars/', filters, { includeAuth: false });
      
      return {
        success: true,
        data: response.data || { cars: [], pagination: {} },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get car details by ID
  async getCarById(carId) {
    try {
      const response = await apiService.get(`/cars/${carId}/`, {}, { includeAuth: false });
      return {
        success: true,
        car: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        notFound: error.status === 404,
      };
    }
  }

  // Create a new car listing
  async createCarListing(carData) {
    try {
      const response = await apiService.post('/cars/seller/create/', carData);
      return {
        success: true,
        car: response.data,
      };
    } catch (error) {
      console.log('Create car listing error:', error);
      return {
        success: false,
        error: error.message,
        validationErrors: error.getValidationErrors ? error.getValidationErrors() : 
                         (error.data?.error?.details || null),
      };
    }
  }

  // Update car listing
  async updateCarListing(carId, carData) {
    try {
      const response = await apiService.put(`/cars/${carId}/`, carData);
      return {
        success: true,
        car: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationErrors: error.validationErrors || null,
      };
    }
  }

  // Delete car listing
  async deleteCarListing(carId) {
    try {
      // Backend delete for sellers is at /cars/seller/<id>/delete/
      await apiService.delete(`/cars/seller/${carId}/delete/`);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload car images
  async uploadCarImages(carId, files) {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const response = await apiService.post(`/cars/${carId}/upload-images/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        images: response.data.images,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload car video
  async uploadCarVideo(carId, videoFile) {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await apiService.post(`/cars/${carId}/upload-video/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        video: response.data.video,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete image
  async deleteCarImage(carId, imageId) {
    try {
      await apiService.delete(`/cars/${carId}/images/${imageId}/`);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Contact seller
  async contactSeller(carId, contactData) {
    try {
      const response = await apiService.post(`/cars/${carId}/contact/`, contactData, { includeAuth: false });
      return {
        success: true,
        inquiry: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationErrors: error.validationErrors || null,
      };
    }
  }

  // Add to favorites
  async addToFavorites(carId) {
    try {
      const response = await apiService.post(`/cars/${carId}/favorite/`);
      return {
        success: true,
        favorite: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Remove from favorites
  async removeFromFavorites(carId) {
    try {
      await apiService.delete(`/cars/${carId}/favorite/`);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get cities
  async getCities() {
    try {
      const response = await apiService.get('/cars/cities/', {}, { includeAuth: false });
      return {
        success: true,
        cities: response.data.cities || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        cities: [],
      };
    }
  }

  // Get car brands and models
  async getCarData() {
    try {
      const response = await apiService.get('/cars/brands/', {}, { includeAuth: false });
      return {
        success: true,
        data: response.data.data || { brands: [], models: [] },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: { brands: [], models: [] },
      };
    }
  }

  // Calculate EMI (moved to frontend - no backend call needed)
  calculateEMI(loanAmount, interestRate, tenureMonths) {
    // Simple frontend EMI calculation
    const principal = loanAmount;
    const monthlyRate = interestRate / 12 / 100;
    const numberOfMonths = tenureMonths;

    if (monthlyRate === 0) {
      return principal / numberOfMonths;
    }

    // EMI Formula: EMI = P*r*(1+r)^n/((1+r)^n-1)
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) / 
                (Math.pow(1 + monthlyRate, numberOfMonths) - 1);
    
    return emi;
  }

  // Get seller listings
  async getSellerListings(params = {}) {
    try {
      const response = await apiService.get('/cars/seller/listings/', params);
      
      // Extract listings from response and map to expected structure
      const responseData = response.data || {};
      const listings = responseData.listings || [];
      const stats = responseData.stats || {};
      
      return {
        success: true,
        data: { 
          cars: listings,  // Map 'listings' to 'cars' for frontend compatibility
          pagination: {},  // Add pagination structure if needed
          stats: stats     // Include stats for dashboard
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: { cars: [], pagination: {} },
      };
    }
  }

  // Get seller stats
  async getSellerStats() {
    try {
      const response = await apiService.get('/cars/seller/stats/');
      return {
        success: true,
        stats: response.data || {},
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stats: {},
      };
    }
  }

  // Admin Methods
  async getAdminListings(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 50,
        status: params.status || 'pending',
        ...params
      })

      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || ''
      const response = await apiService.get(`/admin/cars/?${queryParams}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to load admin listings',
        notFound: error.status === 404
      }
    }
  }

  async getAdminStats() {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || ''
      const response = await apiService.get('/admin/dashboard/', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return { success: true, stats: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to load admin stats',
        stats: {}
      }
    }
  }

  async getAdminCarDetail(listingId) {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || ''
      const response = await apiService.get(`/admin/cars/${listingId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async adminUpdateListing(listingId, data = {}) {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || ''
      const response = await apiService.patch(`/admin/cars/${listingId}/update/`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message, validationErrors: error.getValidationErrors?.() }
    }
  }

  async adminUploadImages(listingId, files) {
    try {
      const formData = new FormData()
      formData.append('carId', listingId)
      files.forEach(file => formData.append('images', file))
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || ''
      const res = await apiService.post(`/upload/car-images/`, formData, {
        contentType: null,
        headers: { Authorization: `Bearer ${token}` }
      })
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async adminDeleteFile(fileId) {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || ''
      await apiService.delete(`/upload/files/${fileId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async adminDeleteListing(listingId) {
    try {
      const token = localStorage.getItem('adminToken') || ''
      const res = await apiService.delete(`/admin/cars/${listingId}/delete/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get car features
  async getCarFeatures() {
    try {
      const response = await apiService.get('/utils/car-features/');
      return {
        success: true,
        features: response.data.data?.features || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        features: [],
      };
    }
  }

  // Get system configuration
  async getSystemConfig() {
    try {
      const response = await apiService.get('/utils/config/');
      return {
        success: true,
        config: response.data.data || { limits: { maxImagesPerListing: 10, maxVideosPerListing: 1 } },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        config: { limits: { maxImagesPerListing: 10, maxVideosPerListing: 1 } },
      };
    }
  }

  // Upload car images
  async uploadCarImages(files) {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('images', file);
      });

      const response = await apiService.post('/upload/car-images/', formData, {
        contentType: null, // Let browser set multipart/form-data
      });

      return {
        success: true,
        images: response.data.images || [], // Extract images array from response.data.images
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        images: [],
      };
    }
  }

  // Upload car video
  async uploadCarVideo(file) {
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await apiService.post('/upload/car-video/', formData, {
        contentType: null, // Let browser set multipart/form-data
      });

      return {
        success: true,
        video: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        video: null,
      };
    }
  }

  // Delete uploaded file
  async deleteFile(fileId) {
    try {
      await apiService.delete(`/upload/files/${fileId}/`);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async adminApproveListing(listingId) {
    try {
      const response = await apiService.post(`/admin/cars/${listingId}/review/`, { action: 'approve' })
      return { success: true, data: response }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to approve listing'
      }
    }
  }

  async adminRejectListing(listingId, data = {}) {
    try {
      const response = await apiService.post(`/admin/cars/${listingId}/review/`, { action: 'reject', ...data })
      return { success: true, data: response }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to reject listing'
      }
    }
  }

  // Helper Methods
  formatPrice(price) {
    if (!price || isNaN(price)) return '₹0'
    return `₹${parseInt(price).toLocaleString()}`
  }

  getCarDisplayName(car) {
    return `${car.year} ${car.brand} ${car.car_model}`
  }

  getCarLocation(car) {
    if (!car.location) return 'Location not specified'
    return car.location.area ? 
      `${car.location.area}, ${car.location.city}` : 
      car.location.city
  }

  getRelativeTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months > 1 ? 's' : ''} ago`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} year${years > 1 ? 's' : ''} ago`
    }
  }
}

// Create singleton instance
const carService = new CarService()

export default carService
export { CarService }