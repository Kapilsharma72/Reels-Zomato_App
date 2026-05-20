import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * GuestContext — tracks whether the current visitor is a guest (not logged in)
 * and controls the auth modal that appears when a guest tries a protected action.
 */
const GuestContext = createContext(null);

export const GuestProvider = ({ children }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');

  /** Call this before any action that requires login (like, order, share, etc.) */
  const requireAuth = useCallback((message = '') => {
    const isLoggedIn =
      document.cookie.includes('token=') ||
      localStorage.getItem('userData') !== null;

    if (isLoggedIn) return true; // user is authenticated — allow action

    // Guest — show the modal
    setAuthModalMessage(message || 'Please sign in to continue');
    setShowAuthModal(true);
    return false;
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setAuthModalMessage('');
  }, []);

  return (
    <GuestContext.Provider value={{ requireAuth, showAuthModal, authModalMessage, closeAuthModal }}>
      {children}
    </GuestContext.Provider>
  );
};

export const useGuest = () => {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used inside GuestProvider');
  return ctx;
};

export default GuestContext;
