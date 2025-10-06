import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaStore, FaTruck, FaEdit, FaArrowRight } from 'react-icons/fa';
import authService from '../services/authService';
import '../styles/UnifiedLogin.css';

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = [
    { id: 'user', label: 'User', icon: FaUser, description: 'Browse and order food' },
    { id: 'food-partner', label: 'Food Partner', icon: FaStore, description: 'Restaurant/Cafe owner' },
    { id: 'delivery-partner', label: 'Delivery Partner', icon: FaTruck, description: 'Delivery driver' },
    { id: 'editor', label: 'Editor', icon: FaEdit, description: 'Content editor' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleSelect = (roleId) => {
    setFormData(prev => ({
      ...prev,
      role: roleId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      let response;
      
      if (formData.role === 'food-partner') {
        // Login as food partner
        response = await authService.loginFoodPartner({
          email: formData.email,
          password: formData.password
        });
        setSuccess('Food Partner logged in successfully!');
        
        // Store user data for immediate display
        if (response && response.foodPartner) {
          localStorage.setItem('userData', JSON.stringify({
            fullName: response.foodPartner.name,
            email: response.foodPartner.email,
            role: 'food-partner'
          }));
        }
      } else {
        // Login as regular user (for user, delivery-partner, editor)
        response = await authService.loginUser({
          email: formData.email,
          password: formData.password
        });
        setSuccess('User logged in successfully!');
        
        // Store user data for immediate display
        if (response && response.user) {
          localStorage.setItem('userData', JSON.stringify(response.user));
        }
      }

      // Redirect based on role after successful login
      setTimeout(() => {
        switch (formData.role) {
          case 'user':
            navigate('/user/home');
            break;
          case 'food-partner':
            navigate('/food-partner/dashboard');
            break;
          case 'delivery-partner':
            navigate('/delivery/dashboard');
            break;
          case 'editor':
            navigate('/editor/dashboard');
            break;
          default:
            navigate('/user/home');
        }
      }, 1500);

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="unified-login">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Floating Food Elements */}
      <div className="floating-elements">
        <div className="floating-food pizza">🍕</div>
        <div className="floating-food burger">🍔</div>
        <div className="floating-food ramen">🍜</div>
        <div className="floating-food sushi">🍣</div>
        <div className="floating-food cake">🍰</div>
        <div className="floating-food fries">🍟</div>
      </div>

      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="logo">
              <div className="logo-icon">🍽️</div>
              <span className="logo-text">ReelZomato</span>
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your account</p>
          </div>

          {/* Role Selection */}
          <div className="role-selection">
            <h3 className="role-title">I am a...</h3>
            <div className="role-grid">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    className={`role-card ${formData.role === role.id ? 'selected' : ''}`}
                    onClick={() => handleRoleSelect(role.id)}
                    data-role={role.id}
                  >
                    <div className="role-icon">
                      <Icon />
                    </div>
                    <div className="role-info">
                      <span className="role-label">{role.label}</span>
                      <span className="role-description">{role.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {success}
            </div>
          )}

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <FaArrowRight className="button-icon" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="register-text">
              Don't have an account? 
              <button className="register-link" onClick={handleRegister}>
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="decorative-elements">
        <div className="deco-circle circle-1"></div>
        <div className="deco-circle circle-2"></div>
        <div className="deco-line line-1"></div>
        <div className="deco-line line-2"></div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
