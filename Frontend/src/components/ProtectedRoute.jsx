import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const roleHomeMap = {
  'user': '/user/home',
  'food-partner': '/food-partner/dashboard',
  'delivery-partner': '/delivery/dashboard',
  'editor': '/editor/dashboard',
  'admin': '/admin/dashboard'
};

const ProtectedRoute = ({ children, requiredRole }) => {
  const [authState, setAuthState] = useState({ loading: true, user: null });

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        setAuthState({ loading: false, user: null });
        return;
      }
      try {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          setAuthState({ loading: false, user: JSON.parse(storedData) });
        } else {
          setAuthState({ loading: false, user: null });
        }
      } catch {
        setAuthState({ loading: false, user: null });
      }
    };
    checkAuth();
  }, []);

  if (authState.loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: '#1a1a2e', color: 'white', fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  if (!authState.user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = authState.user.role;

  if (requiredRole && userRole !== requiredRole) {
    const redirectTo = roleHomeMap[userRole] || '/login';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
