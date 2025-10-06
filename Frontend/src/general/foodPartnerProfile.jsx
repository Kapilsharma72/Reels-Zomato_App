import React, { useState, useEffect } from "react";
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaStar, 
  FaPlay, 
  FaHeart,
  FaShare,
  FaEdit,
  FaCamera,
  FaInstagram,
  FaFacebook,
  FaTwitter
} from "react-icons/fa";
import axios from "axios";
import {useParams} from 'react-router-dom';
import "../styles/FoodPartnerProfile.css";
import { API_ENDPOINTS } from "../config/api";

const FoodPartnerProfile = () => {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    axios.get(`${API_ENDPOINTS.FOOD_PARTNER}/${id}`, { withCredentials: true })
      .then((response) => {
        setProfileData(response.data.foodPartner)
        setVideos(response.data.foodPartner.foodItems.map(item => ({
          id: item._id,
          thumbnail: item.video,
          title: item.dishName,
          views: 0,
          likes: 0
        })))
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.response?.data?.message || 'Failed to load profile');
        setIsLoading(false);
      });
  }, [id]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar key={i} className={i <= rating ? 'star-filled' : 'star-empty'} />
      );
    }
    return stars;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!profileData) {
    return <div>No data found</div>;
  }

  return (
    <div className="mobile-profile-page">
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

      {/* Mobile Header with Logo and Business Info */}
      <div className="mobile-header">
        <div className="mobile-logo-container">
          <img src={profileData?.logo || '/vite.svg'} alt="Business Logo" className="mobile-logo" />
        </div>
        <div className="mobile-business-info">
          <h1 className="mobile-business-name">{profileData.businessName}</h1>
          <p className="mobile-slogan">{profileData.slogan}</p>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="mobile-contact-card">
        <div className="mobile-contact-left">
          <div className="mobile-contact-item">
            <FaUser className="mobile-contact-icon" />
            <div className="mobile-contact-details">
              <span className="mobile-contact-label">Owner</span>
              <span className="mobile-contact-value">{profileData.name}</span>
            </div>
          </div>
          <div className="mobile-contact-item">
            <FaMapMarkerAlt className="mobile-contact-icon" />
            <div className="mobile-contact-details">
              <span className="mobile-contact-label">Address</span>
              <span className="mobile-contact-value">{profileData.address}</span>
            </div>
          </div>
        </div>
        
        <div className="mobile-contact-right">
          <div className="mobile-contact-item">
            <FaEnvelope className="mobile-contact-icon" />
            <div className="mobile-contact-details">
              <span className="mobile-contact-label">Email</span>
              <span className="mobile-contact-value">{profileData.email}</span>
            </div>
          </div>
          <div className="mobile-contact-item">
            <FaPhone className="mobile-contact-icon" />
            <div className="mobile-contact-details">
              <span className="mobile-contact-label">Phone</span>
              <span className="mobile-contact-value">{profileData.phoneNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="mobile-stats-section">
        <div className="mobile-stat-card">
          <div className="mobile-stat-content">
            <h3 className="mobile-stat-number">{profileData.totalPosts}</h3>
            <p className="mobile-stat-label">Total Posts</p>
          </div>
        </div>
        
        <div className="mobile-stat-card">
          <div className="mobile-stat-content">
            <h3 className="mobile-stat-number">{(profileData.totalCustomers / 1000).toFixed(0)}K</h3>
            <p className="mobile-stat-label">Total Customers</p>
          </div>
        </div>
        
        <div className="mobile-stat-card">
          <div className="mobile-stat-content">
            <div className="mobile-rating-container">
              <div className="mobile-stars">
                {renderStars(profileData.rating)}
              </div>
              <h3 className="mobile-stat-number">{profileData.rating}</h3>
            </div>
            <p className="mobile-stat-label">Rating</p>
          </div>
        </div>
      </div>

      {/* Separator Line */}
      <div className="mobile-separator"></div>

      {/* Video Grid Section */}
      <div className="mobile-video-section">
          <div className="mobile-video-grid">
          {videos.map((video) => (
            <div key={video.id} className="mobile-video-card">
              <div className="mobile-video-thumbnail">
                <video src={video.thumbnail} muted />
                <div className="mobile-video-overlay">
                  <button className="mobile-play-btn">
                    <FaPlay />
                  </button>
                </div>
              </div>
              <div className="mobile-video-info">
                <h4 className="mobile-video-title">{video.title}</h4>
                <div className="mobile-video-stats">
                  <span className="mobile-views">{video.views} views</span>
                  <span className="mobile-likes">{video.likes} likes</span>
                </div>
              </div>
            </div>
          ))}
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

export default FoodPartnerProfile;
