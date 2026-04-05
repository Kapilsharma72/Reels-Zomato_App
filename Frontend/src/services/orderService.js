import { API_BASE_URL } from '../config/api.js';

class OrderService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/orders`;
  }

  // Generic API call method
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      return { success: true, ...data };
    } catch (error) {
      console.error('Order API Error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Create a new order
  async createOrder(orderData) {
    return this.makeRequest('/create', { method: 'POST', body: JSON.stringify(orderData) });
  }

  // Get order by ID for tracking
  async getOrderById(orderId) {
    return this.makeRequest(`/${orderId}`, {
      method: 'GET',
    });
  }

  // Get orders by user ID
  async getOrdersByUserId(userId) {
    return this.makeRequest(`/user/${userId}`, {
      method: 'GET',
    });
  }

  // Get orders for food partner (requires authentication)
  async getFoodPartnerOrders() {
    try {
      return await this.makeRequest('/foodpartner', { method: 'GET' });
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Please login') || error.message.includes('Food partner not found')) {
        throw new Error('Food partner authentication required. Please login as a food partner to view orders.');
      }
      throw error;
    }
  }

  // Get orders by food partner ID (alternative method)
  async getOrdersByFoodPartnerId(foodPartnerId) {
    return this.makeRequest(`/foodpartner/${foodPartnerId}`, {
      method: 'GET',
    });
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    return this.makeRequest(`/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Get order statistics
  async getOrderStats() {
    return this.makeRequest('/stats', {
      method: 'GET',
    });
  }

  async createPayment(amount, orderId) {
    return this.makeRequest('/create-payment', {
      method: 'POST',
      body: JSON.stringify({ amount, orderId }),
    });
  }

  async verifyPayment(payload) {
    return this.makeRequest('/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

// Create and export a singleton instance
const orderService = new OrderService();
export default orderService;
