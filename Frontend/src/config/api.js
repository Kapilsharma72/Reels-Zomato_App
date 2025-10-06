// API Configuration
const getApiBaseUrl = () => {
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    // Check if we're accessing from mobile (different hostname)
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local development
      return 'http://localhost:3001';
    } else {
      // Mobile access - use the same hostname as the frontend
      return `http://${hostname}:3001`;
    }
  }
  
  // Production - you can set this to your production API URL
  return process.env.REACT_APP_API_URL || 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  FOOD: `${API_BASE_URL}/api/food`,
  AUTH: `${API_BASE_URL}/api/auth`,
  FOOD_PARTNER: `${API_BASE_URL}/api/food-partner`,
  POSTS: `${API_BASE_URL}/api/posts`,
  STORIES: `${API_BASE_URL}/api/stories`,
};
