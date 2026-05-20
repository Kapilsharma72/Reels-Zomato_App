import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaUtensils, FaArrowRight } from 'react-icons/fa';
import { useGuest } from '../contexts/GuestContext';
import './GuestAuthModal.css';

/**
 * GuestAuthModal — shown when a guest tries a protected action.
 * Offers Sign In / Create Account buttons and a brief message.
 */
const GuestAuthModal = () => {
  const { showAuthModal, authModalMessage, closeAuthModal } = useGuest();
  const navigate = useNavigate();

  if (!showAuthModal) return null;

  const handleSignIn = () => {
    closeAuthModal();
    navigate('/login');
  };

  const handleRegister = () => {
    closeAuthModal();
    navigate('/register');
  };

  return (
    <div className="guest-modal-overlay" onClick={closeAuthModal}>
      <div className="guest-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="guest-modal-close" onClick={closeAuthModal} aria-label="Close">
          <FaTimes />
        </button>

        {/* Brand */}
        <div className="guest-modal-brand">
          <div className="guest-modal-brand-icon"><FaUtensils /></div>
          <span>Reel<span>Zomato</span></span>
        </div>

        {/* Message */}
        <h2 className="guest-modal-title">Join the Experience</h2>
        <p className="guest-modal-message">
          {authModalMessage || 'Sign in to like, share, and order your favourite food.'}
        </p>

        {/* Actions */}
        <div className="guest-modal-actions">
          <button className="guest-modal-btn guest-modal-btn--primary" onClick={handleSignIn}>
            Sign In <FaArrowRight />
          </button>
          <button className="guest-modal-btn guest-modal-btn--secondary" onClick={handleRegister}>
            Create Account
          </button>
        </div>

        <p className="guest-modal-hint">
          It's free and takes less than a minute.
        </p>
      </div>
    </div>
  );
};

export default GuestAuthModal;
