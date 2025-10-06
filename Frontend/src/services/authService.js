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
      console.log('Making request to:', url);
      console.log('Request config:', config);
      
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
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
      console.log('Response data:', data);

      if (!response.ok) {
        console.log('Request failed with status:', response.status);
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
    return this.makeRequest('/user/logout', {
      method: 'GET',
    });
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
    return this.makeRequest('/foodPartner/logout', {
      method: 'GET',
    });
  }

  // Check if user is authenticated (by checking if token exists)
  isAuthenticated() {
    // Check if there's a token in cookies
    const hasToken = document.cookie.includes('token=');
    console.log('Cookie check:', document.cookie);
    console.log('Has token:', hasToken);
    
    // Also check if we have user data in localStorage as fallback
    const hasUserData = localStorage.getItem('userData') !== null;
    console.log('Has user data:', hasUserData);
    
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
    console.log('Making request to /foodPartner/me');
    console.log('Current cookies:', document.cookie);
    try {
      return await this.makeRequest('/foodPartner/me', {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error getting current food partner:', error);
      
      // If the error is about food partner not found, clear the token and redirect to login
      if (error.message.includes('Food partner not found') || error.message.includes('Please login')) {
        console.log('Food partner not found, clearing authentication data');
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
      
      console.log('Authentication data cleared');
    } catch (error) {
      console.error('Error clearing authentication data:', error);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    try {
      const userData = localStorage.getItem('userData');
      const tempUserData = localStorage.getItem('tempUserData');
      return !!(userData || tempUserData);
    } catch (error) {
      return false;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
