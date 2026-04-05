const getApiBaseUrl = () => {
  if (import.meta.env.MODE === 'development') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    return `http://${hostname}:3001`;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  FOOD: `${API_BASE_URL}/api/food`,
  AUTH: `${API_BASE_URL}/api/auth`,
  FOOD_PARTNER: `${API_BASE_URL}/api/food-partner`,
  POSTS: `${API_BASE_URL}/api/posts`,
  STORIES: `${API_BASE_URL}/api/stories`,
  SEARCH: `${API_BASE_URL}/api/search`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  ADMIN: `${API_BASE_URL}/api/admin`,
  TRENDING_FOOD: `${API_BASE_URL}/api/trending/food`,
  TRENDING_RESTAURANTS: `${API_BASE_URL}/api/trending/restaurants`,
  TRENDING_STREET_FOOD: `${API_BASE_URL}/api/trending/street-food`,
};
