import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaTruck, FaArrowRight, FaCheck, FaIdCard, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import '../styles/DeliveryPartnerRegister.css';

const DeliveryPartnerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    vehicleType: '',
    licenseNumber: '',
    experience: '',
    availability: '',
    preferredAreas: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const vehicleTypes = [
    { value: 'bike', label: 'Bike', icon: '🏍️' },
    { value: 'scooter', label: 'Scooter', icon: '🛵' },
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'cycle', label: 'Cycle', icon: '🚲' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/delivery/dashboard');
    }, 1500);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="delivery-register">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Floating Delivery Elements */}
      <div className="floating-elements">
        <div className="floating-icon delivery-truck">🚚</div>
        <div className="floating-icon delivery-bike">🏍️</div>
        <div className="floating-icon delivery-scooter">🛵</div>
        <div className="floating-icon delivery-bag">🛍️</div>
        <div className="floating-icon delivery-clock">⏰</div>
        <div className="floating-icon delivery-map">🗺️</div>
      </div>

      <div className="register-container">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="logo">
              <div className="logo-icon">🚚</div>
              <span className="logo-text">ReelZomato</span>
            </div>
            <h1 className="register-title">Join as Delivery Partner</h1>
            <p className="register-subtitle">Start earning by delivering delicious food to customers</p>
          </div>

          {/* Registration Form */}
          <form className="register-form" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">
                <FaIdCard className="section-icon" />
                Basic Information
              </h3>
              
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
                <label htmlFor="phoneNumber" className="form-label">
                  <FaPhone className="label-icon" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="+91 98765 43210"
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

            {/* Vehicle Information */}
            <div className="form-section">
              <h3 className="section-title">
                <FaTruck className="section-icon" />
                Vehicle Information
              </h3>
              
              <div className="form-group">
                <label htmlFor="vehicleType" className="form-label">Vehicle Type</label>
                <div className="vehicle-grid">
                  {vehicleTypes.map((vehicle) => (
                    <button
                      key={vehicle.value}
                      type="button"
                      className={`vehicle-card ${formData.vehicleType === vehicle.value ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, vehicleType: vehicle.value }))}
                    >
                      <div className="vehicle-icon">{vehicle.icon}</div>
                      <span className="vehicle-label">{vehicle.label}</span>
                    </button>
                  ))}
                </div>
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
                  placeholder="Enter your driving license number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="experience" className="form-label">Driving Experience</label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Select experience</option>
                  <option value="0-1">0-1 years</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>
            </div>

            {/* Availability & Preferences */}
            <div className="form-section">
              <h3 className="section-title">
                <FaMapMarkerAlt className="section-icon" />
                Availability & Preferences
              </h3>
              
              <div className="form-group">
                <label htmlFor="availability" className="form-label">Preferred Working Hours</label>
                <select
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Select availability</option>
                  <option value="morning">Morning (6 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                  <option value="evening">Evening (6 PM - 12 AM)</option>
                  <option value="night">Night (12 AM - 6 AM)</option>
                  <option value="full-day">Full Day (Flexible)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="preferredAreas" className="form-label">Preferred Delivery Areas</label>
                <textarea
                  id="preferredAreas"
                  name="preferredAreas"
                  value={formData.preferredAreas}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="List the areas where you prefer to deliver (e.g., Sector 1, Sector 2, Downtown)"
                  rows="3"
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" required />
                <span className="checkmark"></span>
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`register-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <span>Join as Delivery Partner</span>
                  <FaCheck className="button-icon" />
                </>
              )}
            </button>
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

export default DeliveryPartnerRegister;
