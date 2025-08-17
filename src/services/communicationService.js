/**
 * Communication Service for Spinny Car Marketplace
 * Handles inquiries, notifications, and messaging
 */

import apiService, { ApiError } from './api';

class CommunicationService {
  // Get seller inquiries
  async getSellerInquiries(filters = {}) {
    try {
      const response = await apiService.get('/inquiries/', filters);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get inquiry details
  async getInquiryDetails(inquiryId) {
    try {
      const response = await apiService.get(`/inquiries/${inquiryId}/`);
      return {
        success: true,
        inquiry: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        notFound: error.status === 404,
      };
    }
  }

  // Create new inquiry
  async createInquiry(inquiryData) {
    try {
      const response = await apiService.post('/inquiries/create/', inquiryData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationErrors: error.getValidationErrors(),
      };
    }
  }

  // Respond to inquiry
  async respondToInquiry(inquiryId, responseData) {
    try {
      const response = await apiService.post(`/inquiries/${inquiryId}/respond/`, responseData);
      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationErrors: error.getValidationErrors(),
      };
    }
  }

  // Get user notifications
  async getNotifications(filters = {}) {
    try {
      const response = await apiService.get('/inquiries/notifications/', filters);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      const response = await apiService.put(`/inquiries/notifications/${notificationId}/read/`);
      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead() {
    try {
      const response = await apiService.put('/inquiries/notifications/mark-all-read/');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await this.getNotifications({ unread: true, limit: 1 });
      if (response.success) {
        return {
          success: true,
          count: response.data.unreadCount || 0,
        };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Format notification for display
  formatNotification(notification) {
    const typeMessages = {
      inquiry_received: '💬 New inquiry received',
      inquiry_response: '↩️ Seller responded',
      car_approved: '✅ Car listing approved',
      car_rejected: '❌ Car listing needs updates',
      car_sold: '🎉 Car marked as sold',
      saved_search_match: '🔍 New car matches your search',
      price_drop: '💰 Price drop alert',
      system: '🔔 System notification',
    };

    return {
      ...notification,
      typeIcon: typeMessages[notification.type] || '🔔',
      timeAgo: this.getRelativeTime(notification.created_at),
      isUrgent: notification.priority === 'urgent' || notification.priority === 'high',
    };
  }

  // Get relative time
  getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Format inquiry for display
  formatInquiry(inquiry) {
    return {
      ...inquiry,
      timeAgo: this.getRelativeTime(inquiry.created_at),
      statusLabel: this.getInquiryStatusLabel(inquiry.status),
      contactTimeLabel: this.getContactTimeLabel(inquiry.preferred_contact_time),
    };
  }

  // Get inquiry status label
  getInquiryStatusLabel(status) {
    const labels = {
      new: { text: 'New', color: 'bg-blue-100 text-blue-800' },
      responded: { text: 'Responded', color: 'bg-green-100 text-green-800' },
      closed: { text: 'Closed', color: 'bg-gray-100 text-gray-800' },
      spam: { text: 'Spam', color: 'bg-red-100 text-red-800' },
    };
    return labels[status] || labels.new;
  }

  // Get contact time label
  getContactTimeLabel(contactTime) {
    const labels = {
      morning: 'Morning (9 AM - 12 PM)',
      afternoon: 'Afternoon (12 PM - 5 PM)',
      evening: 'Evening (5 PM - 9 PM)',
      anytime: 'Anytime',
    };
    return labels[contactTime] || labels.anytime;
  }

  // Validate phone number
  validatePhoneNumber(phoneNumber) {
    // Basic Indian phone number validation
    const phoneRegex = /^[+]?[91]?[0-9]{10}$/;
    return phoneRegex.test(phoneNumber.replace(/\s+/g, ''));
  }

  // Format phone number for display
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove country code and format
    const cleaned = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phoneNumber;
  }

  // Generate inquiry preview
  generateInquiryPreview(message, maxLength = 100) {
    if (!message) return '';
    
    if (message.length <= maxLength) {
      return message;
    }
    
    return message.substring(0, maxLength).trim() + '...';
  }

  // Get default inquiry templates
  getInquiryTemplates() {
    return [
      {
        id: 'general',
        title: 'General Inquiry',
        message: 'Hi, I am interested in this car. Could you please share more details?',
      },
      {
        id: 'inspection',
        title: 'Request Inspection',
        message: 'Hello, I would like to schedule an inspection of this vehicle. When would be a good time?',
      },
      {
        id: 'negotiation',
        title: 'Price Negotiation',
        message: 'Hi, I am seriously interested in buying this car. Is the price negotiable?',
      },
      {
        id: 'test_drive',
        title: 'Test Drive Request',
        message: 'Hello, I would like to schedule a test drive. Please let me know your availability.',
      },
      {
        id: 'documents',
        title: 'Document Inquiry',
        message: 'Hi, could you please share the documents and service history of this vehicle?',
      },
    ];
  }

  // Get response templates for sellers
  getResponseTemplates() {
    return [
      {
        id: 'welcome',
        title: 'Welcome Response',
        message: 'Thank you for your interest in my car. I would be happy to answer any questions you have.',
      },
      {
        id: 'available',
        title: 'Available for Call',
        message: 'I am available for a phone call to discuss the details. Please let me know when it would be convenient for you.',
      },
      {
        id: 'schedule_meeting',
        title: 'Schedule Meeting',
        message: 'Would you like to schedule a meeting to see the car in person? I am flexible with timing.',
      },
      {
        id: 'document_ready',
        title: 'Documents Ready',
        message: 'All documents are ready and the car has a clean history. I can share them when we meet.',
      },
      {
        id: 'price_discussion',
        title: 'Price Discussion',
        message: 'The price is slightly negotiable for serious buyers. Let\'s discuss when you see the car.',
      },
    ];
  }
}

// Create singleton instance
const communicationService = new CommunicationService();

export default communicationService;
export { CommunicationService }; 