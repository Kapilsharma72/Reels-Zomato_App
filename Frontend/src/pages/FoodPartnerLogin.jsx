import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStore, FaEye, FaEyeSlash, FaArrowRight, FaLeaf, FaHeart, FaPlay } from 'react-icons/fa';
import '../styles/UserLogin.css';
import { API_ENDPOINTS } from '../config/api';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_ENDPOINTS.AUTH}/foodPartner/login`, {
        email: formData.email,
        password: formData.password,
      }, {
        withCredentials: true
      });
      console.log(response.data);
      navigate("/food-partner/dashboard");
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-page">
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

      {/* Main Container */}
      <div className="login-container">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="brand-logo">
            <div className="logo-icon">
              <FaStore />
            </div>
            <span className="logo-text">Partner Portal</span>
          </div>
          <h1 className="welcome-title">
            <span className="title-line">Welcome Back</span>
            <span className="title-line highlight">Food Partner!</span>
          </h1>
          <p className="welcome-subtitle">
            Access your partner dashboard and manage your business
          </p>
        </div>

        {/* Login Form */}
        <div className="form-section">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <input 
                type="email" 
                name="email"
                placeholder="Enter your business email" 
                value={formData.email}
                onChange={handleInputChange}
                required 
                className="form-input"
              />
              <div className="input-icon">
                <FaStore />
              </div>
            </div>
            
            <div className="input-group">
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password" 
                value={formData.password}
                onChange={handleInputChange}
                required 
                className="form-input"
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link to="#" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit" 
              className={`login-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <span>Access Dashboard</span>
                  <FaArrowRight className="btn-icon" />
                </>
              )}
            </button>
          </form>

          {/* Feature Tags */}
          <div className="feature-tags">
            <div className="tag">
              <FaLeaf className="tag-icon" />
              <span>Fresh</span>
            </div>
            <div className="tag">
              <FaHeart className="tag-icon" />
              <span>Healthy</span>
            </div>
            <div className="tag">
              <FaPlay className="tag-icon" />
              <span>Watch</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="signup-section">
            <p className="signup-text">
              New partner? 
              <Link to="/partner/register" className="signup-link">
                Register Here
              </Link>
            </p>
          </div>

          {/* User Link */}
          <div className="partner-section">
            <Link to="/user/login" className="partner-link">
              Log in as user instead
            </Link>
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
}
