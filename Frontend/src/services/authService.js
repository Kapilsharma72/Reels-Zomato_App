import { API_BASE_URL } from '../config/api.js';

class AuthService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/auth`;
  }

  // Generic API call method
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        
        if (response.status === 413) {
          throw new Error('File size too large. Please use a smaller image.');
        }
        
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  }

  // User registration
  async registerUser(userData) {
    return this.makeRequest('/user/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // User login
  async loginUser(credentials) {
    return this.makeRequest('/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // User logout
  async logoutUser() {
    try {
      return await this.makeRequest('/user/logout', {
        method: 'GET',
      });
    } finally {
      this.clearAuthData();
    }
  }

  // Food Partner registration
  async registerFoodPartner(foodPartnerData) {
    return this.makeRequest('/foodPartner/register', {
      method: 'POST',
      body: JSON.stringify(foodPartnerData),
    });
  }

  // Food Partner login
  async loginFoodPartner(credentials) {
    return this.makeRequest('/foodPartner/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Food Partner logout
  async logoutFoodPartner() {
    try {
      return await this.makeRequest('/foodPartner/logout', {
        method: 'GET',
      });
    } finally {
      this.clearAuthData();
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    // Check if there's a token in cookies
    const hasToken = document.cookie.includes('token=');
    
    // Also check if we have user data in localStorage as fallback
    const hasUserData = localStorage.getItem('userData') !== null;
    
    return hasToken || hasUserData;
  }

  // Get current user info from backend
  async getCurrentUser() {
    return this.makeRequest('/user/me', {
      method: 'GET',
    });
  }

  // Get current food partner info from backend
  async getCurrentFoodPartner() {
    try {
      return await this.makeRequest('/foodPartner/me', {
        method: 'GET',
      });
    } catch (error) {
      // If the error is about food partner not found, clear the token and redirect to login
      if (error.message.includes('Food partner not found') || error.message.includes('Please login')) {
        this.clearAuthData();
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  }

  // Update food partner profile
  async updateFoodPartnerProfile(profileData) {
    return this.makeRequest('/foodPartner/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Clear authentication data
  clearAuthData() {
    try {
      // Clear cookies by setting them to expire
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;';
      
      // Clear localStorage
      localStorage.removeItem('userData');
      localStorage.removeItem('tempUserData');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
    } catch (error) {
      // silently ignore errors during cleanup
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
