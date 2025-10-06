import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaBuilding, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaCamera, 
  FaUpload,
  FaCheck,
  FaExclamationTriangle,
  FaStar,
  FaUsers
} from 'react-icons/fa';
import authService from '../services/authService';
import { useFoodPartner } from '../contexts/FoodPartnerContext';
import '../styles/ProfileManagement.css';

const ProfileManagement = () => {
  const { foodPartnerData, updateFoodPartnerData, refreshFoodPartnerData } = useFoodPartner();
  const [profileData, setProfileData] = useState({
    businessName: '',
    name: '',
    email: '',
    address: '',
    phoneNumber: '',
    slogan: '',
    logo: '',
    totalCustomers: 0,
    rating: 0
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Update local profile data when context data changes
  useEffect(() => {
    console.log('ProfileManagement: foodPartnerData changed:', foodPartnerData);
    if (foodPartnerData && foodPartnerData.businessName !== 'Loading...') {
      console.log('ProfileManagement: Setting profile data:', foodPartnerData);
      setProfileData(foodPartnerData);
      if (foodPartnerData.logo) {
        setLogoPreview(foodPartnerData.logo);
      }
      setIsLoading(false);
    }
  }, [foodPartnerData]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          logo: 'Please select a valid image file'
        }));
        return;
      }
      
      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'Image size should be less than 10MB'
        }));
        return;
      }
      
      try {
        // Compress the image
        const compressedFile = await compressImage(file, 800, 0.8);
        
        // Check compressed size (max 2MB after compression)
        if (compressedFile.size > 2 * 1024 * 1024) {
          setErrors(prev => ({
            ...prev,
            logo: 'Image is too large even after compression. Please use a smaller image.'
          }));
          return;
        }
        
        setLogoFile(compressedFile);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target.result);
        };
        reader.readAsDataURL(compressedFile);
        
        // Clear logo error
        if (errors.logo) {
          setErrors(prev => ({
            ...prev,
            logo: ''
          }));
        }
      } catch (error) {
        console.error('Error compressing image:', error);
        setErrors(prev => ({
          ...prev,
          logo: 'Error processing image. Please try a different file.'
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!profileData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Contact name is required';
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!profileData.address.trim()) {
      newErrors.address = 'Business address is required';
    }
    
    if (!profileData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(profileData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const updateData = { ...profileData };
      
      // If logo file is selected, convert to base64 for now
      // In production, you'd upload to a file storage service
      if (logoFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          updateData.logo = e.target.result;
          performUpdate(updateData);
        };
        reader.readAsDataURL(logoFile);
      } else {
        performUpdate(updateData);
      }
    } catch (error) {
      console.error('Error preparing update:', error);
      setSaveMessage('Error preparing profile update');
      setIsSaving(false);
    }
  };

  const performUpdate = async (updateData) => {
    try {
      const response = await authService.updateFoodPartnerProfile(updateData);
      
      if (response && response.foodPartner) {
        // Update global state
        updateFoodPartnerData(response.foodPartner);
        
        // Update local state
        setProfileData(response.foodPartner);
        setSaveMessage('Profile updated successfully!');
        setIsEditing(false);
        setLogoFile(null);
        
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage(error.message || 'Error updating profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setSaveMessage('');
    setLogoFile(null);
    // Reset logo preview to original
    if (profileData.logo) {
      setLogoPreview(profileData.logo);
    } else {
      setLogoPreview('');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={`star ${i <= rating ? 'filled' : 'empty'}`} 
        />
      );
    }
    return stars;
  };

  if (isLoading) {
    return (
      <div className="profile-management">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-management">
      <div className="profile-header">
        <h2 className="profile-title">Profile Management</h2>
        <p className="profile-subtitle">Manage your restaurant profile and business information</p>
      </div>

      {/* Success/Error Message */}
      {saveMessage && (
        <div className={`message ${saveMessage.includes('successfully') ? 'success' : 'error'}`}>
          {saveMessage.includes('successfully') ? <FaCheck /> : <FaExclamationTriangle />}
          {saveMessage}
        </div>
      )}

      <div className="profile-content">
        {/* Profile Overview Card */}
        <div className="profile-overview-card">
          <div className="overview-header">
            <div className="logo-section">
              {logoPreview ? (
                <img src={logoPreview} alt="Business Logo" className="business-logo" />
              ) : (
                <div className="logo-placeholder">
                  <FaBuilding />
                </div>
              )}
              {isEditing && (
                <div className="logo-upload">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="logo-input"
                  />
                  <label htmlFor="logo-upload" className="logo-upload-btn">
                    <FaCamera />
                    Change Logo
                  </label>
                </div>
              )}
            </div>
            <div className="business-info">
              <h3 className="business-name">{profileData.businessName}</h3>
              <p className="business-slogan">{profileData.slogan || 'No slogan set'}</p>
              <div className="business-stats">
                <div className="stat-item">
                  <FaUsers />
                  <span>{profileData.totalCustomers} customers</span>
                </div>
                <div className="stat-item">
                  <FaStar />
                  <span>{profileData.rating.toFixed(1)} rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="profile-form-card">
          <div className="form-header">
            <h3>Business Information</h3>
            {!isEditing ? (
              <button 
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit />
                Edit Profile
              </button>
            ) : (
              <div className="form-actions">
                <button 
                  className="btn btn-success"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <FaSave />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  <FaTimes />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="form-content">
            <div className="form-grid">
              {/* Business Name */}
              <div className="form-group">
                <label htmlFor="businessName" className="form-label">
                  <FaBuilding />
                  Business Name *
                </label>
                <input
                  type="text"
                  id="businessName"
                  value={profileData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  disabled={!isEditing}
                  className={`form-input ${errors.businessName ? 'error' : ''}`}
                  placeholder="Enter your restaurant/cafe name"
                />
                {errors.businessName && <span className="error-message">{errors.businessName}</span>}
              </div>

              {/* Contact Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <FaUser />
                  Contact Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Your full name"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <FaEnvelope />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your@email.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label">
                  <FaPhone />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  disabled={!isEditing}
                  className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                  placeholder="+91 98765 43210"
                />
                {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
              </div>

              {/* Business Address */}
              <div className="form-group full-width">
                <label htmlFor="address" className="form-label">
                  <FaMapMarkerAlt />
                  Business Address *
                </label>
                <textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  className={`form-input ${errors.address ? 'error' : ''}`}
                  placeholder="Enter your complete business address"
                  rows="3"
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              {/* Slogan */}
              <div className="form-group full-width">
                <label htmlFor="slogan" className="form-label">
                  Business Slogan
                </label>
                <input
                  type="text"
                  id="slogan"
                  value={profileData.slogan}
                  onChange={(e) => handleInputChange('slogan', e.target.value)}
                  disabled={!isEditing}
                  className="form-input"
                  placeholder="Your restaurant's tagline or slogan"
                />
              </div>
            </div>

            {/* Logo Upload Error */}
            {errors.logo && (
              <div className="logo-error">
                <span className="error-message">{errors.logo}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
