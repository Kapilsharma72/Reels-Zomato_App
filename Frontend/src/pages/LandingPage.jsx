import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaPlay, FaArrowRight, FaVideo, FaTruck, FaEdit, FaStar, FaFire, FaShieldAlt, FaBolt } from 'react-icons/fa';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaVideo />,
      title: 'Food Reels',
      desc: 'Scroll through mouth-watering video reels of dishes and order directly from what you see.',
    },
    {
      icon: <FaFire />,
      title: 'Live Orders',
      desc: 'Real-time order tracking from kitchen to your door with live status updates.',
    },
    {
      icon: <FaTruck />,
      title: 'Fast Delivery',
      desc: 'Dedicated delivery partners ensure your food arrives hot and on time.',
    },
    {
      icon: <FaEdit />,
      title: 'Pro Video Editing',
      desc: 'Food partners get professional video editing for their reels by expert editors.',
    },
    {
      icon: <FaStar />,
      title: 'Discover Local',
      desc: 'Find hidden gems and local food partners near you with authentic reviews.',
    },
    {
      icon: <FaShieldAlt />,
      title: 'Secure Payments',
      desc: 'Pay safely with Razorpay — UPI, cards, wallets all supported.',
    },
  ];

  const steps = [
    { num: '01', title: 'Browse Reels', desc: 'Scroll through food videos from local restaurants' },
    { num: '02', title: 'Pick Your Dish', desc: 'Add items to cart directly from the reel' },
    { num: '03', title: 'Place Order', desc: 'Checkout with your saved address in seconds' },
    { num: '04', title: 'Track Live', desc: 'Watch your order move from kitchen to door' },
  ];

  const roles = [
    { emoji: '🍽️', title: 'Food Lover', desc: 'Discover, watch, and order amazing food', path: '/register', cta: 'Start Eating' },
    { emoji: '🍳', title: 'Food Partner', desc: 'Grow your restaurant with video marketing', path: '/food-partner/login', cta: 'Join as Partner' },
    { emoji: '🛵', title: 'Delivery Partner', desc: 'Earn by delivering happiness', path: '/delivery/register', cta: 'Start Delivering' },
    { emoji: '🎬', title: 'Video Editor', desc: 'Edit food reels and earn per project', path: '/editor/register', cta: 'Start Editing' },
  ];

  return (
    <div className="landing-page">
      {/* Background */}
      <div className="landing-bg">
        <div className="bg-grid" />
      </div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <div className="brand-icon"><FaUtensils /></div>
          <span className="brand-name">Reel<span>Zomato</span></span>
        </div>
        <div className="nav-actions">
          <a href="/login" className="nav-link">Sign In</a>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            Get Started <FaArrowRight />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            India's First Food Reels Platform
          </div>

          <h1 className="hero-title">
            Don't Just Order.
            <span className="highlight">Watch & Crave.</span>
          </h1>

          <p className="hero-description">
            Discover authentic food through short videos. Watch mouth-watering reels,
            order instantly, and track your delivery live — all in one place.
          </p>

          <div className="hero-cta">
            <button className="cta-primary" onClick={() => navigate('/register')}>
              <FaBolt /> Start Exploring
            </button>
            <button className="cta-secondary" onClick={() => navigate('/login')}>
              <FaPlay /> Watch Reels
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-num">500<span>+</span></div>
              <div className="stat-desc">Food Partners</div>
            </div>
            <div className="hero-stat">
              <div className="stat-num">10K<span>+</span></div>
              <div className="stat-desc">Happy Users</div>
            </div>
            <div className="hero-stat">
              <div className="stat-num">50K<span>+</span></div>
              <div className="stat-desc">Orders Delivered</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="phone-reel">
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"
                  alt="Food reel"
                  className="phone-reel-img"
                />
                <div className="phone-reel-overlay">
                  <div className="phone-reel-title">Spicy Butter Chicken</div>
                  <div className="phone-reel-price">₹299 · Order Now →</div>
                </div>
                <div className="phone-reel-actions">
                  <div className="phone-action-btn">❤️</div>
                  <div className="phone-action-btn">💬</div>
                  <div className="phone-action-btn">🛒</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-label"><FaFire /> Why ReelZomato</div>
        <h2 className="section-title">Everything you need,<br />in one app</h2>
        <p className="section-subtitle">
          From discovering food through videos to tracking your delivery live — we've got it all.
        </p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-label"><FaBolt /> How It Works</div>
          <h2 className="section-title">Order in 4 simple steps</h2>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div className="step-card" key={i}>
                <div className="step-number">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="roles-section">
        <div className="section-label"><FaStar /> Join the Platform</div>
        <h2 className="section-title">Pick your role</h2>
        <p className="section-subtitle">
          Whether you're hungry, cooking, delivering, or editing — there's a place for you.
        </p>
        <div className="roles-grid">
          {roles.map((r, i) => (
            <div className="role-card" key={i} onClick={() => navigate(r.path)}>
              <span className="role-emoji">{r.emoji}</span>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
              <span className="role-cta">{r.cta} <FaArrowRight /></span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="footer-cta">
        <h2>Ready to <span>taste the future?</span></h2>
        <p>Join thousands of food lovers already on ReelZomato.</p>
        <button className="cta-primary" onClick={() => navigate('/register')}>
          <FaBolt /> Create Free Account
        </button>
      </section>
    </div>
  );
};

export default LandingPage;
