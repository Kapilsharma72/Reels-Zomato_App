import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaStore, FaTruck, FaEdit, FaArrowRight, FaUtensils, FaEnvelope, FaLock } from 'react-icons/fa';
import authService from '../services/authService';
import '../styles/Auth.css';

const roles = [
  { id: 'user', emoji: '🍽️', label: 'Food Lover' },
  { id: 'food-partner', emoji: '🍳', label: 'Food Partner' },
  { id: 'delivery-partner', emoji: '🛵', label: 'Delivery' },
  { id: 'editor', emoji: '🎬', label: 'Editor' },
];

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      let response;
      if (formData.role === 'food-partner') {
        response = await authService.loginFoodPartner({ email: formData.email, password: formData.password });
        if (response?.foodPartner) {
          localStorage.setItem('userData', JSON.stringify({ fullName: response.foodPartner.name, email: response.foodPartner.email, role: 'food-partner' }));
        }
      } else {
        response = await authService.loginUser({ email: formData.email, password: formData.password });
        if (response?.user) localStorage.setItem('userData', JSON.stringify(response.user));
      }

      setSuccess('Signed in successfully!');
      setTimeout(() => {
        const routes = { user: '/user/home', 'food-partner': '/food-partner/dashboard', 'delivery-partner': '/delivery/dashboard', editor: '/editor/dashboard' };
        navigate(routes[formData.role] || '/user/home');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon"><FaUtensils /></div>
          <span className="logo-text">Reel<span>Zomato</span></span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue your food journey</p>

        {/* Role Selector */}
        <div className="role-selector">
          {roles.map(r => (
            <div
              key={r.id}
              className={`role-option ${formData.role === r.id ? 'selected' : ''}`}
              onClick={() => setFormData(p => ({ ...p, role: r.id }))}
            >
              <span className="role-emoji">{r.emoji}</span>
              <span className="role-label">{r.label}</span>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error && <div className="auth-alert error">⚠️ {error}</div>}
        {success && <div className="auth-alert success">✅ {success}</div>}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <FaEnvelope className="auth-input-icon" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="Email address"
              required
            />
          </div>

          <div className="auth-input-group">
            <FaLock className="auth-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="Password"
              required
            />
            <button type="button" className="auth-input-toggle" onClick={() => setShowPassword(p => !p)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="auth-forgot">
            <a href="/forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : <>Sign In <FaArrowRight /></>}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <a href="/register">Create one</a>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
