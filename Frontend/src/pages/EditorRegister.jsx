import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaEdit, FaArrowRight, FaCheck, FaUser, FaPhone, FaBriefcase, FaFileAlt, FaCamera, FaVideo, FaPen } from 'react-icons/fa';
import '../styles/EditorRegister.css';

const EditorRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    experience: '',
    specialization: '',
    portfolio: '',
    skills: [],
    availability: '',
    hourlyRate: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const specializations = [
    { value: 'food-photography', label: 'Food Photography', icon: '📸' },
    { value: 'video-editing', label: 'Video Editing', icon: '🎬' },
    { value: 'content-writing', label: 'Content Writing', icon: '✍️' },
    { value: 'social-media', label: 'Social Media', icon: '📱' },
    { value: 'graphic-design', label: 'Graphic Design', icon: '🎨' },
    { value: 'ui-ux', label: 'UI/UX Design', icon: '💻' }
  ];

  const skills = [
    'Adobe Photoshop', 'Adobe Premiere Pro', 'Adobe After Effects', 'Figma',
    'Canva', 'Lightroom', 'Final Cut Pro', 'DaVinci Resolve', 'Illustrator',
    'InDesign', 'Sketch', 'Cinema 4D', 'Blender', 'WordPress', 'Content Management'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/editor/dashboard');
    }, 1500);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="editor-register">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Floating Editor Elements */}
      <div className="floating-elements">
        <div className="floating-icon camera">📸</div>
        <div className="floating-icon video">🎬</div>
        <div className="floating-icon pen">✍️</div>
        <div className="floating-icon design">🎨</div>
        <div className="floating-icon laptop">💻</div>
        <div className="floating-icon palette">🖌️</div>
      </div>

      <div className="register-container">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="logo">
              <div className="logo-icon">✍️</div>
              <span className="logo-text">ReelZomato</span>
            </div>
            <h1 className="register-title">Join as Content Editor</h1>
            <p className="register-subtitle">Create amazing content for food businesses</p>
          </div>

          {/* Registration Form */}
          <form className="register-form" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">
                <FaUser className="section-icon" />
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

            {/* Professional Information */}
            <div className="form-section">
              <h3 className="section-title">
                <FaBriefcase className="section-icon" />
                Professional Information
              </h3>
              
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
                <label htmlFor="specialization" className="form-label">Primary Specialization</label>
                <div className="specialization-grid">
                  {specializations.map((spec) => (
                    <button
                      key={spec.value}
                      type="button"
                      className={`specialization-card ${formData.specialization === spec.value ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, specialization: spec.value }))}
                    >
                      <div className="specialization-icon">{spec.icon}</div>
                      <span className="specialization-label">{spec.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Skills & Tools</label>
                <div className="skills-grid">
                  {skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className={`skill-tag ${formData.skills.includes(skill) ? 'selected' : ''}`}
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="portfolio" className="form-label">
                  <FaFileAlt className="label-icon" />
                  Portfolio/Previous Work
                </label>
                <textarea
                  id="portfolio"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Describe your previous work, provide portfolio links, or showcase your best projects"
                  rows="4"
                />
              </div>
            </div>

            {/* Availability & Rates */}
            <div className="form-section">
              <h3 className="section-title">
                <FaCamera className="section-icon" />
                Availability & Rates
              </h3>
              
              <div className="form-group">
                <label htmlFor="availability" className="form-label">Availability</label>
                <select
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Select availability</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="freelance">Freelance</option>
                  <option value="project-based">Project Based</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="hourlyRate" className="form-label">Expected Hourly Rate (₹)</label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your expected hourly rate"
                  min="0"
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
                  <span>Join as Content Editor</span>
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

export default EditorRegister;
