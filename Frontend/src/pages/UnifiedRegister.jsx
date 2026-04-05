import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaStore, FaTruck, FaEdit, FaArrowRight, FaCheck } from 'react-icons/fa';
import authService from '../services/authService';
import '../styles/UnifiedRegister.css';

const UnifiedRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    // User specific
    phoneNumber: '',
    // Food Partner specific
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    cuisineType: '',
    // Delivery Partner specific
    vehicleType: '',
    licenseNumber: '',
    // Editor specific
    experience: '',
    portfolio: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate required fields based on role
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      let response;
      
      if (formData.role === 'user') {
        // Register as regular user
        const userData = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber
        };
        response = await authService.registerUser(userData);
        setSuccess('User registered successfully!');
        
        // Store user data temporarily for immediate display
        if (response && response.user) {
          localStorage.setItem('tempUserData', JSON.stringify(response.user));
        }
      } else if (formData.role === 'food-partner') {
        // Register as food partner
        if (!formData.businessName || !formData.businessAddress || !formData.businessPhone || !formData.cuisineType) {
          setError('Please fill in all required food partner fields');
          setIsLoading(false);
          return;
        }
        
        const foodPartnerData = {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          address: formData.businessAddress,
          phoneNumber: formData.businessPhone,
          cuisineType: formData.cuisineType
        };
        response = await authService.registerFoodPartner(foodPartnerData);
        setSuccess('Food Partner registered successfully!');
        
        // Store user data temporarily for immediate display
        if (response && response.foodPartner) {
          localStorage.setItem('userData', JSON.stringify({
            fullName: response.foodPartner.name,
            email: response.foodPartner.email,
            role: 'food-partner'
          }));
        }
      } else {
        // For delivery-partner and editor, we'll register as regular users for now
        // You can extend this later with specific models
        const userData = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          // Add role-specific fields
          ...(formData.role === 'delivery-partner' && {
            vehicleType: formData.vehicleType,
            licenseNumber: formData.licenseNumber
          }),
          ...(formData.role === 'editor' && {
            experience: formData.experience,
            portfolio: formData.portfolio
          })
        };
        response = await authService.registerUser(userData);
        setSuccess(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} registered successfully!`);
        
        // Store user data temporarily for immediate display
        if (response && response.user) {
          localStorage.setItem('tempUserData', JSON.stringify(response.user));
        }
      }

      // Redirect based on role after successful registration
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
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const renderStep1 = () => (
    <>
      {/* Role Selection */}
      <div className="role-selection">
        <h3 className="role-title">I want to register as a...</h3>
        <div className="role-grid">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                type="button"
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

      {/* Basic Information */}
      <div className="form-section">
        <h3 className="section-title">Basic Information</h3>
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter your full name"
            required
          />
        </div>

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
              placeholder="Create a password"
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

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <div className="form-section">
      <h3 className="section-title">Additional Information</h3>
      
      {/* User specific fields */}
      {formData.role === 'user' && (
        <>
          <div className="form-group">
            <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="form-input"
              placeholder="+91 98765 43210"
            />
          </div>
        </>
      )}

      {/* Food Partner specific fields */}
      {formData.role === 'food-partner' && (
        <>
          <div className="form-group">
            <label htmlFor="businessName" className="form-label">Business Name</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Your restaurant/cafe name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="businessAddress" className="form-label">Business Address</label>
            <textarea
              id="businessAddress"
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Complete business address"
              rows="3"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="businessPhone" className="form-label">Business Phone</label>
            <input
              type="tel"
              id="businessPhone"
              name="businessPhone"
              value={formData.businessPhone}
              onChange={handleInputChange}
              className="form-input"
              placeholder="+91 98765 43210"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cuisineType" className="form-label">Cuisine Type</label>
            <select
              id="cuisineType"
              name="cuisineType"
              value={formData.cuisineType}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Select cuisine type</option>
              <option value="indian">Indian</option>
              <option value="chinese">Chinese</option>
              <option value="italian">Italian</option>
              <option value="mexican">Mexican</option>
              <option value="thai">Thai</option>
              <option value="continental">Continental</option>
              <option value="fast-food">Fast Food</option>
              <option value="desserts">Desserts</option>
              <option value="beverages">Beverages</option>
              <option value="other">Other</option>
            </select>
          </div>
        </>
      )}

      {/* Delivery Partner specific fields */}
      {formData.role === 'delivery-partner' && (
        <>
          <div className="form-group">
            <label htmlFor="vehicleType" className="form-label">Vehicle Type</label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Select vehicle type</option>
              <option value="bike">Bike</option>
              <option value="scooter">Scooter</option>
              <option value="car">Car</option>
              <option value="cycle">Cycle</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="licenseNumber" className="form-label">License Number</label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your license number"
              required
            />
          </div>
        </>
      )}

      {/* Editor specific fields */}
      {formData.role === 'editor' && (
        <>
          <div className="form-group">
            <label htmlFor="experience" className="form-label">Years of Experience</label>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Select experience level</option>
              <option value="0-1">0-1 years</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5+">5+ years</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="portfolio" className="form-label">Portfolio/Previous Work</label>
            <textarea
              id="portfolio"
              name="portfolio"
              value={formData.portfolio}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Describe your previous work or provide portfolio links"
              rows="4"
            />
          </div>
        </>
      )}

      <div className="form-options">
        <label className="checkbox-container">
          <input type="checkbox" required />
          <span className="checkmark"></span>
          I agree to the Terms of Service and Privacy Policy
        </label>
      </div>
    </div>
  );

  return (
    <div className="unified-register">
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

      <div className="register-container">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="logo">
              <div className="logo-icon">🍽️</div>
              <span className="logo-text">ReelZomato</span>
            </div>
            <h1 className="register-title">Join ReelZomato</h1>
            <p className="register-subtitle">Create your account and start your journey</p>
            
            {/* Progress Steps */}
            <div className="progress-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <span className="step-label">Basic Info</span>
              </div>
              <div className="step-divider"></div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <span className="step-label">Details</span>
              </div>
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

          {/* Registration Form */}
          <form className="register-form" onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep === 2 && (
                <button 
                  type="button" 
                  className="nav-button secondary"
                  onClick={handlePrevStep}
                >
                  Back
                </button>
              )}
              
              {currentStep === 1 ? (
                <button 
                  type="button" 
                  className="nav-button primary"
                  onClick={handleNextStep}
                >
                  Next
                  <FaArrowRight className="button-icon" />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className={`register-button ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <FaCheck className="button-icon" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="register-footer">
            <p className="login-text">
              Already have an account? 
              <button className="login-link" onClick={handleLogin}>
                Sign In
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

export default UnifiedRegister;
