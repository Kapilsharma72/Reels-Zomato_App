import { API_BASE_URL } from '../config/api.js';

class DeliveryService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/delivery`;
  }

  // Generic API call method
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      console.log('Making delivery request to:', url);
      const response = await fetch(url, config);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Ensure consistent response format
      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Delivery API Error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Get available orders for delivery
  async getAvailableOrders() {
    return this.makeRequest('/available-orders', {
      method: 'GET',
    });
  }

  // Accept an order for delivery
  async acceptOrder(orderId) {
    return this.makeRequest(`/accept-order/${orderId}`, {
      method: 'POST',
    });
  }

  // Update delivery status
  async updateDeliveryStatus(orderId, status) {
    return this.makeRequest(`/update-status/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Get delivery partner's orders
  async getDeliveryPartnerOrders(status = null) {
    const endpoint = status ? `/my-orders?status=${status}` : '/my-orders';
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  // Get delivery statistics
  async getDeliveryStats() {
    return this.makeRequest('/stats', {
      method: 'GET',
    });
  }
}

// Create and export a singleton instance
const deliveryService = new DeliveryService();
export default deliveryService;
