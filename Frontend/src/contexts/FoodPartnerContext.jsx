import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const FoodPartnerContext = createContext();

export const useFoodPartner = () => {
  const context = useContext(FoodPartnerContext);
  if (!context) {
    throw new Error('useFoodPartner must be used within a FoodPartnerProvider');
  }
  return context;
};

export const FoodPartnerProvider = ({ children }) => {
  const [foodPartnerData, setFoodPartnerData] = useState({
    businessName: 'Loading...',
    email: 'Loading...',
    name: 'Loading...',
    logo: '',
    slogan: '',
    address: '',
    phoneNumber: '',
    totalCustomers: 0,
    rating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch food partner data
  const fetchFoodPartnerData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('FoodPartnerContext: Fetching food partner data...');
      const response = await authService.getCurrentFoodPartner();
      console.log('FoodPartnerContext: Response received:', response);
      
      if (response && response.foodPartner) {
        console.log('FoodPartnerContext: Setting food partner data:', response.foodPartner);
        setFoodPartnerData(response.foodPartner);
      }
    } catch (error) {
      console.error('FoodPartnerContext: Error fetching food partner data:', error);
      
      // Handle session expiration gracefully
      if (error.message.includes('Session expired') || error.message.includes('Please login')) {
        console.log('FoodPartnerContext: Session expired, clearing data and redirecting to login');
        setFoodPartnerData(null);
        setError('Session expired. Please login again.');
        
        // Clear authentication data
        authService.clearAuthData();
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update food partner data
  const updateFoodPartnerData = (newData) => {
    setFoodPartnerData(prev => ({
      ...prev,
      ...newData
    }));
  };

  // Refresh food partner data
  const refreshFoodPartnerData = () => {
    fetchFoodPartnerData();
  };

  // Initialize data on mount
  useEffect(() => {
    fetchFoodPartnerData();
  }, []);

  const value = {
    foodPartnerData,
    loading,
    error,
    updateFoodPartnerData,
    refreshFoodPartnerData,
    fetchFoodPartnerData
  };

  return (
    <FoodPartnerContext.Provider value={value}>
      {children}
    </FoodPartnerContext.Provider>
  );
};
