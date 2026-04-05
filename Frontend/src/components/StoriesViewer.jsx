import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaPlay, FaPause, FaShoppingCart, FaBolt } from 'react-icons/fa';
import '../styles/StoriesViewer.css';

const StoriesViewer = ({ stories, isOpen, onClose, initialStoryIndex = 0, onStoryViewed }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderNotification, setOrderNotification] = useState('');

  const progressIntervalRef = useRef(null);
  const viewedStoriesRef = useRef(new Set());
  // Store refs to avoid stale closures in the interval
  const currentStoryIndexRef = useRef(currentStoryIndex);
  const currentMediaIndexRef = useRef(currentMediaIndex);
  const storiesRef = useRef(stories);

  useEffect(() => { currentStoryIndexRef.current = currentStoryIndex; }, [currentStoryIndex]);
  useEffect(() => { currentMediaIndexRef.current = currentMediaIndex; }, [currentMediaIndex]);
  useEffect(() => { storiesRef.current = stories; }, [stories]);

  const currentStory = stories[currentStoryIndex];
  const currentMedia = currentStory?.media?.[currentMediaIndex];

  // ── Clear interval helper ──────────────────────────────────────────────────
  const clearProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // ── Advance to next media / story ─────────────────────────────────────────
  const advance = useCallback(() => {
    const si = currentStoryIndexRef.current;
    const mi = currentMediaIndexRef.current;
    const storyList = storiesRef.current;
    const story = storyList[si];

    if (!story) { onClose(); return; }

    if (mi < story.media.length - 1) {
      setCurrentMediaIndex(mi + 1);
      setProgress(0);
    } else if (si < storyList.length - 1) {
      setCurrentStoryIndex(si + 1);
      setCurrentMediaIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [onClose]);

  // ── Start progress timer ───────────────────────────────────────────────────
  const startProgress = useCallback(() => {
    if (!currentMedia) return;
    clearProgress();
    const duration = currentMedia.duration || 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          advance();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
  }, [currentMedia, clearProgress, advance]);

  // ── Start/stop on open + media change ─────────────────────────────────────
  // Also pause when the order modal is open so the story doesn't auto-advance
  // underneath the modal (which causes the visible blink/flicker).
  useEffect(() => {
    if (isOpen && currentMedia && isPlaying && !showOrderModal) {
      startProgress();
    } else {
      clearProgress();
    }
    return clearProgress;
  }, [isOpen, currentStoryIndex, currentMediaIndex, isPlaying, showOrderModal]);

  // ── Reset on close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      viewedStoriesRef.current.clear();
      setShowOrderModal(false);
    }
  }, [isOpen]);

  // ── Reset on initial index change ─────────────────────────────────────────
  useEffect(() => {
    setCurrentStoryIndex(initialStoryIndex);
    setCurrentMediaIndex(0);
    setProgress(0);
    setIsPlaying(true);
  }, [initialStoryIndex]);

  // ── Mark as viewed ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && currentMedia && onStoryViewed) {
      const mediaId = currentMedia.id;
      if (!viewedStoriesRef.current.has(mediaId)) {
        viewedStoriesRef.current.add(mediaId);
        onStoryViewed(mediaId);
      }
    }
  }, [isOpen, currentStoryIndex, currentMediaIndex]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = useCallback(() => advance(), [advance]);

  const goPrev = useCallback(() => {
    const si = currentStoryIndexRef.current;
    const mi = currentMediaIndexRef.current;
    if (mi > 0) {
      setCurrentMediaIndex(mi - 1);
      setProgress(0);
    } else if (si > 0) {
      setCurrentStoryIndex(si - 1);
      setCurrentMediaIndex(0);
      setProgress(0);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(p => !p);
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ') { e.preventDefault(); togglePlayPause(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, goNext, goPrev, togglePlayPause]);

  // ── Order helpers ─────────────────────────────────────────────────────────
  const getOrderData = () => {
    if (!currentStory || !currentMedia) return null;
    const price = parseFloat(String(currentMedia.price || '0').replace(/[^0-9.]/g, '')) || 0;
    return {
      _id: currentStory._id || `story_${Date.now()}`,
      dishName: currentMedia.title || currentStory.businessName || 'Special Item',
      description: currentMedia.caption || currentMedia.description || 'Delicious food item from our story',
      price,
      businessName: currentStory.businessName,
      businessId: currentStory.businessId || currentStory._id || currentStory.id,
      image: currentMedia.url || '/images/default-food.jpg',
      category: currentStory.category || 'Special',
      tags: currentStory.tags || [],
      foodPartner: {
        _id: currentStory.businessId || currentStory._id || currentStory.id,
        businessName: currentStory.businessName,
        name: currentStory.foodPartner?.name || currentStory.businessName,
        phone: currentStory.foodPartner?.phone || '+91 9876543210',
        email: currentStory.foodPartner?.email || 'contact@business.com',
        businessAddress: currentStory.foodPartner?.businessAddress || 'Business Address',
        businessPhone: currentStory.foodPartner?.businessPhone || '+91 9876543210',
      },
      source: 'story',
    };
  };

  const showNotif = (msg) => {
    setOrderNotification(msg);
    setTimeout(() => setOrderNotification(''), 3000);
  };

  const handleAddToCart = () => {
    const data = getOrderData();
    if (!data) return;
    window.dispatchEvent(new CustomEvent('storyAddToCart', { detail: { ...data, success: true, timestamp: Date.now() } }));

    // Compute new cart count from localStorage so UserHome can show a badge/toast
    try {
      const saved = localStorage.getItem('reelsCart');
      const currentCart = saved ? JSON.parse(saved) : [];
      const existing = currentCart.find(i => i._id === data._id);
      const newCount = existing
        ? currentCart.reduce((sum, i) => sum + i.quantity, 0) + 1
        : currentCart.reduce((sum, i) => sum + i.quantity, 0) + 1;
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: newCount } }));
    } catch {
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: 1 } }));
    }

    showNotif('Added to cart! 🛒');
    setShowOrderModal(false);
  };

  const handleOrderNow = () => {
    const data = getOrderData();
    if (!data) return;
    // Dispatch event so home.jsx can open the checkout flow (address → payment → confirmation)
    window.dispatchEvent(new CustomEvent('storyOrderNow', { detail: { ...data, success: true, timestamp: Date.now() } }));
    // Close the order modal and the story viewer so the checkout modal is visible
    setShowOrderModal(false);
    onClose();
  };

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!isOpen || !currentStory || !currentMedia) return null;

  const price = parseFloat(String(currentMedia.price || '0').replace(/[^0-9.]/g, '')) || 0;
  const hasPrice = price > 0;

  return (
    <div className="stories-viewer-overlay">
      <div className="stories-viewer">

        {/* Progress bars + header */}
        <div className="stories-header">
          <div className="story-progress-container">
            {currentStory.media.map((_, i) => (
              <div key={i} className="story-progress-bar">
                <div
                  className="story-progress-fill"
                  style={{
                    width: i === currentMediaIndex ? `${progress}%`
                      : i < currentMediaIndex ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          <div className="story-header-info">
            <div className="story-user-info">
              <div className="story-avatar">
                <span className="avatar-emoji">{currentStory.avatar || '🍽️'}</span>
              </div>
              <div className="story-details">
                <span className="story-username">{currentStory.businessName}</span>
                <span className="story-time">{currentStory.time}</span>
              </div>
            </div>
            <div className="story-actions">
              <button className="story-action-btn" onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button className="story-action-btn" onClick={onClose} aria-label="Close">
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="story-media-container">
          {currentMedia.type === 'image' ? (
            <img src={currentMedia.url} alt={currentStory.businessName} className="story-media" />
          ) : (
            <video
              src={currentMedia.url}
              className="story-media"
              autoPlay={isPlaying}
              muted
              loop
              playsInline
            />
          )}

          {/* Tap zones */}
          <div className="story-click-area left" onClick={goPrev} />
          <div className="story-click-area right" onClick={goNext} />
        </div>

        {/* Caption / price */}
        <div className="story-content">
          {currentMedia.caption && (
            <div className="story-caption"><p>{currentMedia.caption}</p></div>
          )}
          {currentMedia.music && (
            <div className="story-music">
              <span className="music-icon">🎵</span>
              <span className="music-info">{currentMedia.music.name} by {currentMedia.music.artist}</span>
            </div>
          )}
          {hasPrice && (
            <div className="story-price">
              <span className="price-label">Special Price:</span>
              <span className="price-value">₹{price}</span>
            </div>
          )}
        </div>

        {/* Order button */}
        {hasPrice && (
          <div className="story-interactions">
            <div className="interaction-buttons">
              <button className="interaction-btn order" onClick={() => setShowOrderModal(true)}>
                <FaShoppingCart />
                <span>Order Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Notification toast */}
        {orderNotification && (
          <div className="story-order-notification">
            <div className="story-notification-content">
              <span className="story-notification-icon">✅</span>
              <span className="story-notification-text">{orderNotification}</span>
            </div>
          </div>
        )}
      </div>

      {/* Order Modal — React-rendered, no DOM injection */}
      {showOrderModal && (
        <div className="story-order-modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="story-order-modal" onClick={e => e.stopPropagation()}>
            <div className="story-order-header">
              <div className="story-order-business-info">
                <h3>{currentStory.businessName}</h3>
                <p className="story-order-source">📱 From Story</p>
              </div>
              <button className="close-story-order" onClick={() => setShowOrderModal(false)}>×</button>
            </div>

            <div className="story-order-content">
              <div className="story-order-item">
                <div className="story-order-item-image">
                  <img
                    src={currentMedia.url}
                    alt={currentStory.businessName}
                    onError={e => { e.target.src = '/images/default-food.jpg'; }}
                  />
                </div>
                <div className="story-order-item-details">
                  <h4>{currentMedia.title || currentStory.businessName}</h4>
                  <p className="story-order-description">
                    {currentMedia.caption || 'Delicious food item from our story'}
                  </p>
                  <div className="story-order-price">₹{price}</div>
                  <span className="story-order-category">{currentStory.category || 'Special'}</span>
                </div>
              </div>

              <div className="story-order-business-details">
                <div className="business-info-row">
                  <span className="business-label">📍 Address:</span>
                  <span className="business-value">
                    {currentStory.foodPartner?.businessAddress || 'Business Address'}
                  </span>
                </div>
                <div className="business-info-row">
                  <span className="business-label">📞 Phone:</span>
                  <span className="business-value">
                    {currentStory.foodPartner?.businessPhone || currentStory.foodPartner?.phone || '+91 9876543210'}
                  </span>
                </div>
              </div>

              <div className="story-order-actions">
                <button className="story-order-btn btn-secondary" onClick={handleAddToCart}>
                  🛒 Add to Cart
                </button>
                <button className="story-order-btn btn-primary" onClick={handleOrderNow}>
                  <FaBolt /> Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesViewer;
