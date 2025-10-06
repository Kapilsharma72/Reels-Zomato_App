import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaPlay, FaPause, FaChevronLeft, FaChevronRight, FaHeart, FaComment, FaShare, FaShoppingCart } from 'react-icons/fa';
import '../styles/StoriesViewer.css';

const StoriesViewer = ({ stories, isOpen, onClose, initialStoryIndex = 0, onStoryViewed }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  const progressIntervalRef = useRef(null);
  const storyTimeoutRef = useRef(null);
  const viewedStoriesRef = useRef(new Set()); // Track viewed stories to prevent duplicate calls

  const currentStory = stories[currentStoryIndex];
  const currentMedia = currentStory?.media[currentMediaIndex];

  useEffect(() => {
    if (isOpen && currentMedia) {
      startProgress();
    }
    return () => {
      clearProgress();
    };
  }, [isOpen, currentStoryIndex, currentMediaIndex]);

  // Reset viewed stories when viewer closes
  useEffect(() => {
    if (!isOpen) {
      viewedStoriesRef.current.clear();
    }
  }, [isOpen]);

  // Reset state when initial story index changes
  useEffect(() => {
    setCurrentStoryIndex(initialStoryIndex);
    setCurrentMediaIndex(0);
    setProgress(0);
    setIsPlaying(true);
  }, [initialStoryIndex]);

  // Call onStoryViewed when a story is viewed (with debouncing)
  useEffect(() => {
    if (isOpen && currentStory && currentMedia && onStoryViewed) {
      const mediaId = currentMedia.id;
      
      // Check if this media has already been marked as viewed
      if (!viewedStoriesRef.current.has(mediaId)) {
        viewedStoriesRef.current.add(mediaId);
        onStoryViewed(mediaId);
      }
    }
  }, [isOpen, currentStoryIndex, currentMediaIndex, onStoryViewed]);

  const clearProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (storyTimeoutRef.current) {
      clearTimeout(storyTimeoutRef.current);
    }
  };

  const nextStory = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setCurrentMediaIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, stories.length, onClose]);

  const prevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setCurrentMediaIndex(0);
      setProgress(0);
    }
  }, [currentStoryIndex]);

  const nextMedia = useCallback(() => {
    if (currentMediaIndex < currentStory.media.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
      setProgress(0);
    } else {
      nextStory();
    }
  }, [currentMediaIndex, currentStory, nextStory]);

  const prevMedia = useCallback(() => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
      setProgress(0);
    } else {
      prevStory();
    }
  }, [currentMediaIndex, prevStory]);

  const startProgress = useCallback(() => {
    clearProgress();
    const duration = currentMedia.duration || 5000; // Default 5 seconds
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextMedia();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
  }, [currentMedia, nextMedia]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      clearProgress();
    } else {
      startProgress();
    }
  }, [isPlaying, startProgress]);

  const handleLike = () => {
    setLiked(!liked);
    setShowReactions(true);
    setTimeout(() => setShowReactions(false), 1000);
  };

  const handleOrderNow = () => {
    // Handle order functionality
    console.log('Order now clicked for:', currentStory.businessName);
    
    // Validate required data
    if (!currentMedia.price || currentMedia.price <= 0) {
      alert('Price information not available for this item');
      return;
    }
    
    if (!currentStory.businessName) {
      alert('Business information not available');
      return;
    }
    
    // Create comprehensive order data from current story
    const orderData = {
      _id: currentStory._id || `story_${Date.now()}`,
      dishName: currentMedia.title || currentStory.businessName || 'Special Item',
      description: currentMedia.description || currentStory.description || 'Delicious food item from our story',
      price: parseFloat(currentMedia.price) || 0,
      businessName: currentStory.businessName,
      businessId: currentStory.businessId || currentStory._id,
      image: currentMedia.url || '/images/default-food.jpg',
      category: currentStory.category || 'Special',
      tags: currentStory.tags || [],
      foodPartner: {
        _id: currentStory.businessId || currentStory._id,
        businessName: currentStory.businessName,
        name: currentStory.foodPartner?.name || currentStory.businessName,
        phone: currentStory.foodPartner?.phone || '+91 9876543210',
        email: currentStory.foodPartner?.email || 'contact@business.com',
        businessAddress: currentStory.foodPartner?.businessAddress || 'Business Address',
        businessPhone: currentStory.foodPartner?.businessPhone || '+91 9876543210'
      },
      source: 'story', // Track that this order came from a story
      storyId: currentStory._id,
      mediaId: currentMedia._id || currentMedia.id
    };
    
    // Create a comprehensive order modal for stories
    const orderModal = document.createElement('div');
    orderModal.className = 'story-order-modal-overlay';
    orderModal.innerHTML = `
      <div class="story-order-modal">
        <div class="story-order-header">
          <div class="story-order-business-info">
            <h3>${orderData.businessName}</h3>
            <p class="story-order-source">📱 From Story</p>
          </div>
          <button class="close-story-order" onclick="this.closest('.story-order-modal-overlay').remove()">×</button>
        </div>
        <div class="story-order-content">
          <div class="story-order-item">
            <div class="story-order-item-image">
              <img src="${orderData.image}" alt="${orderData.dishName}" onerror="this.src='/images/default-food.jpg'">
            </div>
            <div class="story-order-item-details">
              <h4>${orderData.dishName}</h4>
              <p class="story-order-description">${orderData.description}</p>
              <div class="story-order-price">₹${orderData.price}</div>
              ${orderData.category ? `<span class="story-order-category">${orderData.category}</span>` : ''}
            </div>
          </div>
          <div class="story-order-business-details">
            <div class="business-info-row">
              <span class="business-label">📍 Address:</span>
              <span class="business-value">${orderData.foodPartner.businessAddress}</span>
            </div>
            <div class="business-info-row">
              <span class="business-label">📞 Phone:</span>
              <span class="business-value">${orderData.foodPartner.businessPhone}</span>
            </div>
          </div>
          <div class="story-order-actions">
            <button class="btn btn-secondary story-order-btn" onclick="addToCartFromStory('${JSON.stringify(orderData).replace(/'/g, "\\'")}')">
              🛒 Add to Cart
            </button>
            <button class="btn btn-primary story-order-btn" onclick="orderNowFromStory('${JSON.stringify(orderData).replace(/'/g, "\\'")}')">
              ⚡ Order Now
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add global functions for story ordering with enhanced error handling
    window.addToCartFromStory = (orderDataStr) => {
      try {
        const data = JSON.parse(orderDataStr);
        
        // Validate order data
        if (!data.dishName || !data.price || !data.businessName) {
          alert('Invalid order data. Please try again.');
          return;
        }
        
        // Dispatch event with success flag
        window.dispatchEvent(new CustomEvent('storyAddToCart', { 
          detail: { ...data, success: true, timestamp: Date.now() }
        }));
        
        // Show success notification
        showStoryOrderNotification('Item added to cart successfully! 🛒');
        
        orderModal.remove();
      } catch (error) {
        console.error('Error adding to cart from story:', error);
        alert('Error adding item to cart. Please try again.');
      }
    };
    
    window.orderNowFromStory = (orderDataStr) => {
      try {
        const data = JSON.parse(orderDataStr);
        
        // Validate order data
        if (!data.dishName || !data.price || !data.businessName) {
          alert('Invalid order data. Please try again.');
          return;
        }
        
        // Dispatch event with success flag
        window.dispatchEvent(new CustomEvent('storyOrderNow', { 
          detail: { ...data, success: true, timestamp: Date.now() }
        }));
        
        // Show success notification
        showStoryOrderNotification('Redirecting to checkout... ⚡');
        
        orderModal.remove();
      } catch (error) {
        console.error('Error ordering from story:', error);
        alert('Error processing order. Please try again.');
      }
    };
    
    // Helper function to show notifications
    const showStoryOrderNotification = (message) => {
      const notification = document.createElement('div');
      notification.className = 'story-order-notification';
      notification.innerHTML = `
        <div class="story-notification-content">
          <span class="story-notification-icon">✅</span>
          <span class="story-notification-text">${message}</span>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    };
    
    document.body.appendChild(orderModal);
    
    // Also trigger the original event for backward compatibility
    window.dispatchEvent(new CustomEvent('storyOrder', { detail: orderData }));
  };

  const handleKeyPress = useCallback((e) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        prevMedia();
        break;
      case 'ArrowRight':
        nextMedia();
        break;
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
    }
  }, [onClose, prevMedia, nextMedia, togglePlayPause]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, handleKeyPress]);

  // Debug logging
  console.log('🎬 StoriesViewer render check:', {
    isOpen,
    currentStory: currentStory ? { id: currentStory.id, businessName: currentStory.businessName, mediaCount: currentStory.media?.length } : null,
    currentMedia: currentMedia ? { id: currentMedia.id, type: currentMedia.type, url: currentMedia.url } : null,
    currentStoryIndex,
    currentMediaIndex,
    storiesLength: stories?.length
  });

  if (!isOpen) {
    console.log('🚫 StoriesViewer: Not open, returning null');
    return null;
  }

  if (!currentStory) {
    console.log('🚫 StoriesViewer: No current story, returning null');
    return null;
  }

  if (!currentMedia) {
    console.log('🚫 StoriesViewer: No current media, returning null');
    return null;
  }

  console.log('✅ StoriesViewer: All checks passed, rendering viewer');

  return (
    <div className="stories-viewer-overlay">
      <div className="stories-viewer">
        {/* Header */}
        <div className="stories-header">
          <div className="story-progress-container">
            {currentStory.media.map((_, index) => (
              <div key={index} className="story-progress-bar">
                <div 
                  className={`story-progress-fill ${index === currentMediaIndex ? 'active' : ''}`}
                  style={{ 
                    width: index === currentMediaIndex ? `${progress}%` : 
                           index < currentMediaIndex ? '100%' : '0%' 
                  }}
                />
              </div>
            ))}
          </div>
          
          <div className="story-header-info">
            <div className="story-user-info">
              <div className="story-avatar">
                <span className="avatar-emoji">{currentStory.avatar}</span>
              </div>
              <div className="story-details">
                <span className="story-username">{currentStory.businessName}</span>
                <span className="story-time">{currentStory.time}</span>
              </div>
            </div>
            
            <div className="story-actions">
              <button className="story-action-btn" onClick={togglePlayPause}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button className="story-action-btn" onClick={onClose}>
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        {/* Media Content */}
        <div className="story-media-container">
          {currentMedia.type === 'image' ? (
            <img 
              src={currentMedia.url} 
              alt={currentStory.businessName}
              className="story-media"
            />
          ) : (
            <video 
              src={currentMedia.url}
              className="story-media"
              autoPlay={isPlaying}
              muted
              loop
              onPlay={() => {
                // Play music if available
                if (currentMedia.music) {
                  const audioElement = document.getElementById(`story-audio-${currentMedia.id}`);
                  if (audioElement) {
                    audioElement.volume = (currentMedia.musicVolume || 50) / 100;
                    audioElement.play().catch(console.error);
                  }
                }
              }}
              onPause={() => {
                // Pause music if available
                if (currentMedia.music) {
                  const audioElement = document.getElementById(`story-audio-${currentMedia.id}`);
                  if (audioElement) {
                    audioElement.pause();
                  }
                }
              }}
            />
          )}
          
          {/* Music Audio Element for Stories */}
          {currentMedia && currentMedia.music && (
            <audio
              id={`story-audio-${currentMedia.id}`}
              src={currentMedia.music.audioUrl}
              loop
              preload="metadata"
              onEnded={() => {
                // Restart music when it ends
                const audioElement = document.getElementById(`story-audio-${currentMedia.id}`);
                if (audioElement) {
                  audioElement.currentTime = 0;
                  audioElement.play().catch(console.error);
                }
              }}
            />
          )}
          
          {/* Clickable areas for navigation */}
          <div 
            className="story-click-area left"
            onClick={prevMedia}
            title="Previous"
          />
          <div 
            className="story-click-area right"
            onClick={nextMedia}
            title="Next"
          />
          
        </div>

        {/* Story Content */}
        <div className="story-content">
          {currentMedia.caption && (
            <div className="story-caption">
              <p>{currentMedia.caption}</p>
            </div>
          )}
          
          {currentMedia.music && (
            <div className="story-music">
              <span className="music-icon">🎵</span>
              <span className="music-info">
                {currentMedia.music.name} by {currentMedia.music.artist}
              </span>
            </div>
          )}
          
          {currentMedia.price && (
            <div className="story-price">
              <span className="price-label">Special Price:</span>
              <span className="price-value">{currentMedia.price}</span>
            </div>
          )}
        </div>

        {/* Interactive Elements */}
        <div className="story-interactions">
          <div className="interaction-buttons">
            {currentMedia.price && (
              <button 
                className="interaction-btn order"
                onClick={handleOrderNow}
              >
                <FaShoppingCart />
                <span>Order Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Reactions Animation */}
        {showReactions && (
          <div className="reactions-animation">
            <div className="reaction-heart">❤️</div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StoriesViewer;
