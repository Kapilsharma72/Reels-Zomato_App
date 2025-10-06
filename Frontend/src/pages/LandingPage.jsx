import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaLeaf, FaArrowRight, FaPlay, FaHeart } from 'react-icons/fa';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Debug log to check if component is rendering
  console.log('LandingPage component is rendering');

  const slides = [
    {
      id: 1,
      title: "Don't Eat Less",
      subtitle: "Just Eat Real",
      description: "Discover authentic flavors from local food partners. Watch, order, and enjoy real food made with love.",
      chef: true
    },
    {
      id: 2,
      title: "Fresh Ingredients",
      subtitle: "Daily Delivered",
      description: "Experience the freshest ingredients sourced daily from local farms and delivered to your favorite restaurants.",
      chef: false
    },
    {
      id: 3,
      title: "Order & Enjoy",
      subtitle: "Seamless Experience",
      description: "From watching mouth-watering reels to placing orders, enjoy a seamless food discovery and ordering experience.",
      chef: false
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleSkip = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
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
        <div className="floating-food salad">🥗</div>
        <div className="floating-food taco">🌮</div>
      </div>

      {/* Main Content Container */}
      <div className="main-container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="brand-logo">
              <div className="logo-icon">
                <FaUtensils />
              </div>
              <span className="logo-text">ReelZomato</span>
            </div>
            
            <div className="hero-text">
              <h1 className="hero-title">
                <span className="title-line">Don't Eat Less</span>
                <span className="title-line highlight">Just Eat Real</span>
              </h1>
              <p className="hero-description">
                Discover authentic flavors from local food partners. Watch, order, and enjoy real food made with love.
              </p>
            </div>

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
              <div className="tag">
                <FaUtensils className="tag-icon" />
                <span>Organic</span>
              </div>
            </div>
          </div>

          {/* Interactive Food Showcase */}
          <div className="food-showcase">
            <div className="showcase-item active">
              <div className="food-card">
                <div className="food-image">🍕</div>
                <div className="food-glow"></div>
              </div>
            </div>
            <div className="showcase-item">
              <div className="food-card">
                <div className="food-image">🍔</div>
                <div className="food-glow"></div>
              </div>
            </div>
            <div className="showcase-item">
              <div className="food-card">
                <div className="food-image">🍜</div>
                <div className="food-glow"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Slides */}
        <div className="content-slides">
          <div className="slide-container">
            <div 
              className="slide-content"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={slide.id} className="slide">
                  <div className="slide-content-inner">
                    <h2 className="slide-title">
                      <span className="title-part-1">{slide.title}</span>
                      <span className="title-part-2">{slide.subtitle}</span>
                    </h2>
                    <p className="slide-description">
                      {slide.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="slide-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slide-indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              >
                <div className="indicator-progress"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Section */}
        <div className="action-section">
          <button className="skip-button" onClick={handleSkip}>
            <span>Skip</span>
          </button>
          <button className="cta-button" onClick={handleGetStarted}>
            <span>Get Started</span>
            <div className="button-icon">
              <FaArrowRight />
            </div>
            <div className="button-ripple"></div>
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="decorative-elements">
        <div className="deco-circle circle-1"></div>
        <div className="deco-circle circle-2"></div>
        <div className="deco-circle circle-3"></div>
        <div className="deco-line line-1"></div>
        <div className="deco-line line-2"></div>
      </div>
    </div>
  );
};

export default LandingPage;
