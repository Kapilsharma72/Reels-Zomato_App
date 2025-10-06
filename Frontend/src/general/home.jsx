import React, { useEffect, useState } from 'react';
import '../styles/Home.css';
import {useNavigate} from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { FaShoppingCart, FaCheck, FaTimes, FaPlus, FaMinus, FaArrowLeft } from 'react-icons/fa';
import orderService from '../services/orderService';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Home component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: 'white',
          background: '#1a1a2e',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2>Something went wrong with the Reels page</h2>
          <p>Please refresh the page or try again later.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Home = () => {
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [descVisible, setDescVisible] = useState({});
  
  // Cart and Order State
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on initialization
    try {
      const savedCart = localStorage.getItem('reelsCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });
  const [showCart, setShowCart] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  
  // Video controls and interactions
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoProgress, setVideoProgress] = useState({});
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  
  // Order Flow State
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderStep, setOrderStep] = useState(1); // 1: Address, 2: Payment, 3: Confirmation
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    // Initialize with logged-in user data if available
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          name: user.fullName || user.name || user.email || 'John Doe',
          phone: user.phone || '+91 9876543210',
          address: '123 Main Street, Apartment 4B',
          landmark: 'Near Central Park',
          city: 'Mumbai',
          pincode: '400001',
          type: 'Home'
        };
      }
    } catch (error) {
      console.error('Error loading user data for delivery address:', error);
    }
    
    // Fallback to default values
    return {
      name: 'John Doe',
      phone: '+91 9876543210',
      address: '123 Main Street, Apartment 4B',
      landmark: 'Near Central Park',
      city: 'Mumbai',
      pincode: '400001',
      type: 'Home'
    };
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(25);
  const [tax, setTax] = useState(0);
  const [orderId, setOrderId] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Order tracking state
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  // Toggle description function (adapted from vanilla JS to React)
  const toggleDescription = (reelId) => {
    setDescVisible(prev => ({
      ...prev,
      [reelId]: !prev[reelId]
    }));
  };

  // Cart Functions
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    // Ensure food partner info is included
    const itemWithPartner = {
      ...item,
      foodPartner: item.foodPartner || {
        _id: item.businessId || item._id,
        businessName: item.businessName || item.dishName,
        name: item.foodPartner?.name || item.businessName || 'Food Partner',
        phone: item.foodPartner?.phone || '+91 9876543210',
        email: item.foodPartner?.email || 'contact@business.com'
      }
    };
    
    let newCart;
    if (existingItem) {
      newCart = cart.map(cartItem => 
        cartItem._id === item._id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...cart, { ...itemWithPartner, quantity: 1 }];
    }
    
    setCart(newCart);
    
    // Save to localStorage
    try {
      localStorage.setItem('reelsCart', JSON.stringify(newCart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
    
    // Show success feedback
    setOrderSuccess(true);
    setTimeout(() => setOrderSuccess(false), 2000);
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(item => item._id !== itemId);
    setCart(newCart);
    
    // Save to localStorage
    try {
      localStorage.setItem('reelsCart', JSON.stringify(newCart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const newCart = cart.map(item => 
      item._id === itemId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCart(newCart);
    
    // Save to localStorage
    try {
      localStorage.setItem('reelsCart', JSON.stringify(newCart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const getCartItemQuantity = (itemId) => {
    const item = cart.find(cartItem => cartItem._id === itemId);
    return item ? item.quantity : 0;
  };

  // Video interaction functions
  const handleVideoPlay = (reelId) => {
    setPlayingVideo(reelId);
  };

  const handleVideoPause = (reelId) => {
    setPlayingVideo(null);
  };

  const handleVideoProgress = (reelId, progress) => {
    setVideoProgress(prev => ({
      ...prev,
      [reelId]: progress
    }));
  };


  const handleReelScroll = (index) => {
    setCurrentReelIndex(index);
  };

  // Order tracking functions
  const handleTrackOrder = async () => {
    if (!trackingOrderId.trim()) {
      setTrackingError('Please enter an order ID');
      return;
    }

    setIsTracking(true);
    setTrackingError('');
    setTrackedOrder(null);

    try {
      const response = await orderService.getOrderById(trackingOrderId.trim());
      if (response.success || response.message === "Order retrieved successfully") {
        setTrackedOrder(response.order);
      } else {
        setTrackingError('Order not found');
      }
    } catch (error) {
      setTrackingError(error.message || 'Order not found');
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'preparing': return '#2196f3';
      case 'ready': return '#4caf50';
      case 'completed': return '#8bc34a';
      case 'cancelled': return '#f44336';
      case 'rejected': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Order Received';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup';
      case 'completed': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Form validation functions
  const validateAddress = () => {
    const errors = {};
    
    if (!deliveryAddress.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!deliveryAddress.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(deliveryAddress.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!deliveryAddress.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!deliveryAddress.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!deliveryAddress.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(deliveryAddress.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = () => {
    const errors = {};
    
    if (!paymentMethod) {
      errors.paymentMethod = 'Please select a payment method';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Order Functions
  const handleOrderNow = (item) => {
    setSelectedItem(item);
    setShowOrderModal(true);
  };

  const handleQuickOrder = async (item) => {
    // Start checkout process for single item with food partner info
    const orderItem = {
      ...item,
      quantity: 1,
      foodPartner: item.foodPartner || {
        _id: item.businessId,
        businessName: item.businessName,
        name: item.foodPartner?.name || item.businessName,
        phone: item.foodPartner?.phone || '+91 9876543210',
        email: item.foodPartner?.email || 'contact@business.com'
      }
    };
    setCart([orderItem]);
    setShowOrderModal(false);
    setShowCheckout(true);
    setOrderStep(1);
  };

  const handleCartOrder = () => {
    // Start checkout process for cart
    setShowCart(false);
    setShowCheckout(true);
    setOrderStep(1);
  };

  const handleCheckoutStep = (step) => {
    setOrderStep(step);
  };

  const handleAddressSubmit = () => {
    if (validateAddress()) {
      setOrderStep(2);
      setFormErrors({});
    }
  };

  const handlePaymentSubmit = async () => {
    if (!validatePayment()) {
      return;
    }
    
    setIsSubmitting(true);
    setOrderStep(3);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate order ID and estimated time
    const newOrderId = 'ORD' + Date.now();
    const estimatedMinutes = Math.floor(Math.random() * 30) + 20; // 20-50 minutes
    
    setOrderId(newOrderId);
    setEstimatedTime(`${estimatedMinutes} minutes`);
    
    // Calculate tax
    const subtotal = cartTotal;
    const calculatedTax = Math.round(subtotal * 0.18); // 18% GST
    setTax(calculatedTax);
    
    // Group orders by food partner
    const ordersByPartner = {};
    cart.forEach(item => {
      const partnerId = item.foodPartner._id;
      if (!ordersByPartner[partnerId]) {
        ordersByPartner[partnerId] = {
          foodPartner: item.foodPartner,
          items: [],
          subtotal: 0
        };
      }
      ordersByPartner[partnerId].items.push({
        dishName: item.dishName,
        price: item.price,
        quantity: item.quantity,
        description: item.description
      });
      ordersByPartner[partnerId].subtotal += item.price * item.quantity;
    });
    
    // Send orders to respective food partners
    const orderPromises = Object.values(ordersByPartner).map(async (partnerOrder) => {
      console.log('Partner order data:', partnerOrder);
      console.log('Food partner ID:', partnerOrder.foodPartner._id);
      
      const orderData = {
        foodPartnerId: partnerOrder.foodPartner._id,
        customerName: deliveryAddress.name,
        customerPhone: deliveryAddress.phone,
        customerAddress: {
          name: deliveryAddress.name,
          phone: deliveryAddress.phone,
          address: deliveryAddress.address,
          landmark: deliveryAddress.landmark,
          city: deliveryAddress.city,
          pincode: deliveryAddress.pincode,
          type: deliveryAddress.type
        },
        items: partnerOrder.items.map(item => ({
          name: item.dishName,
          quantity: item.quantity,
          price: item.price,
          description: item.description
        })),
        subtotal: partnerOrder.subtotal,
        deliveryFee: deliveryFee,
        tax: Math.round(partnerOrder.subtotal * 0.18),
        total: Math.round((partnerOrder.subtotal + deliveryFee + Math.round(partnerOrder.subtotal * 0.18)) * 100) / 100,
        paymentMethod: paymentMethod,
        orderNotes: orderNotes
      };
      
      try {
        console.log(`Sending order to ${partnerOrder.foodPartner.businessName}:`, orderData);
        const response = await orderService.createOrder(orderData);
        console.log(`Order created successfully for ${partnerOrder.foodPartner.businessName}:`, response);
        return response;
      } catch (error) {
        console.error(`Error creating order for ${partnerOrder.foodPartner.businessName}:`, error);
        throw error;
      }
    });

    // Wait for all orders to be created
    try {
      await Promise.all(orderPromises);
      console.log('All orders created successfully');
      
      // Dispatch event to notify other components that orders were created
      window.dispatchEvent(new CustomEvent('orderCreated', {
        detail: { 
          success: true, 
          timestamp: Date.now(),
          orderCount: Object.keys(ordersByPartner).length
        }
      }));
      
    } catch (error) {
      console.error('Error creating some orders:', error);
      // Still show success to user, but log the error
    }
    
    // Show success after 3 seconds
    setTimeout(() => {
      setOrderSuccess(true);
      setShowCheckout(false);
      setCart([]);
      setOrderStep(1);
      
      // Dispatch order success event
      window.dispatchEvent(new CustomEvent('orderSuccess', {
        detail: { 
          success: true, 
          timestamp: Date.now(),
          orderId: newOrderId
        }
      }));
      
      setTimeout(() => setOrderSuccess(false), 3000);
    }, 3000);
  };

  const calculateOrderTotal = () => {
    return cartTotal + deliveryFee + tax;
  };

  // Navigation Functions
  const handleBackToUserHome = () => {
    navigate('/user/home');
  };

  // Calculate cart total
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(total);
  }, [cart]);

  // Handle story orders
  useEffect(() => {
    const handleStoryAddToCart = (event) => {
      const orderData = event.detail;
      
      // Validate the order data
      if (!orderData.success) {
        console.error('Story add to cart failed:', orderData);
        return;
      }
      
      // Add to cart with enhanced data
      addToCart({
        ...orderData,
        source: 'story',
        addedAt: new Date().toISOString()
      });
      
      // Show success notification
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 2000);
    };

    const handleStoryOrderNow = (event) => {
      const orderData = event.detail;
      
      // Validate the order data
      if (!orderData.success) {
        console.error('Story order now failed:', orderData);
        return;
      }
      
      // Process quick order with enhanced data
      handleQuickOrder({
        ...orderData,
        source: 'story',
        orderedAt: new Date().toISOString()
      });
    };

    window.addEventListener('storyAddToCart', handleStoryAddToCart);
    window.addEventListener('storyOrderNow', handleStoryOrderNow);

    return () => {
      window.removeEventListener('storyAddToCart', handleStoryAddToCart);
      window.removeEventListener('storyOrderNow', handleStoryOrderNow);
    };
  }, []);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(API_ENDPOINTS.FOOD, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data.foodItems)) {
          setReels(data.foodItems);
        } else {
          console.warn('Invalid data format received:', data);
          setReels([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('API Error:', error);
        setError(error.message || 'Failed to load reels');
        setReels([]); // Set empty array on error
        setLoading(false);
      }
    };

    fetchReels();

    // Video autoplay logic - with proper error handling
    const setupVideoAutoplay = () => {
      try {
        const reelSections = Array.from(document.querySelectorAll('.reel'));
        const videos = Array.from(document.querySelectorAll('.reel video'));

        if (reelSections.length === 0 || videos.length === 0) {
          // DOM elements not ready yet, retry after a short delay
          setTimeout(setupVideoAutoplay, 100);
          return;
        }

        const playExclusive = (target) => {
          videos.forEach((v) => {
            if (v !== target) {
              v.pause();
            }
          });
          const play = async () => {
            try {
              await target.play();
            } catch (e) {
              // Autoplay might be blocked; ignore
            }
          };
          if (target) play();
        };

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const video = entry.target.querySelector('video');
              if (!video) return;
              if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
                playExclusive(video);
              } else {
                video.pause();
              }
            });
          },
          { threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        reelSections.forEach((sec) => observer.observe(sec));

        // Attempt to start the first video on mount
        const firstVideo = document.querySelector('.reel video');
        if (firstVideo) {
          const start = async () => {
            try { await firstVideo.play(); } catch {}
          };
          start();
        }
      } catch (error) {
        console.error('Error setting up video autoplay:', error);
      }
    };

    // Call the setup function
    setupVideoAutoplay();

    // Cleanup function
    return () => {
      try {
        const videos = Array.from(document.querySelectorAll('.reel video'));
        videos.forEach(video => video.pause());
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);

  if (loading) {
    return <div style={{textAlign: 'center', padding: '2rem'}}>Loading reels...</div>;
  }
  if (error) {
    return <div style={{color: 'red', textAlign: 'center', padding: '2rem'}}>Error: {error}</div>;
  }
  if (!reels.length) {
    return <div style={{textAlign: 'center', padding: '2rem'}}>No reels available.</div>;
  }

  return (
    <div className="reels-container">
      {/* Back Button */}
      <button 
        className="back-button"
        onClick={handleBackToUserHome}
        title="Back to Home"
      >
        <FaArrowLeft />
        <span>Back</span>
      </button>

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

      {reels.map((reel, idx) => (
        <section className="reel" key={reel._id || idx} data-reel-index={idx}>
          <video
            className="reel-video"
            src={reel.video}
            playsInline
            muted
            loop
            autoPlay={idx === 0}
            preload="metadata"
            onPlay={() => handleVideoPlay(reel._id)}
            onPause={() => handleVideoPause(reel._id)}
            onTimeUpdate={(e) => {
              const progress = (e.target.currentTime / e.target.duration) * 100;
              handleVideoProgress(reel._id, progress);
            }}
            onClick={(e) => {
              if (e.target.paused) {
                e.target.play();
                // Play music if available
                if (reel.music) {
                  const audioElement = document.getElementById(`audio-${reel._id}`);
                  if (audioElement) {
                    audioElement.volume = (reel.musicVolume || 50) / 100;
                    audioElement.play().catch(console.error);
                  }
                }
              } else {
                e.target.pause();
                // Pause music if available
                if (reel.music) {
                  const audioElement = document.getElementById(`audio-${reel._id}`);
                  if (audioElement) {
                    audioElement.pause();
                  }
                }
              }
            }}
          />
          
          {/* Music Audio Element */}
          {reel.music && (
            <audio
              id={`audio-${reel._id}`}
              src={reel.music.audioUrl}
              loop
              preload="metadata"
              onEnded={() => {
                // Restart music when it ends
                const audioElement = document.getElementById(`audio-${reel._id}`);
                if (audioElement) {
                  audioElement.currentTime = 0;
                  audioElement.play().catch(console.error);
                }
              }}
            />
          )}

          <div className="reel-overlay">
            <div className="top-bar">
              <div className="left-section">
                <div className="logo-container">
                  <img src={reel.foodPartner?.logo || '/vite.svg'} alt={`${reel.foodPartner?.businessName} logo`} />
                </div>
                <div className="text-info">
                  <div className="business-name">{reel.foodPartner?.businessName || 'Business Name'}</div>
                  <div className="user-name">{reel.foodPartner?.name || 'Username'}</div>
                </div>
              </div>
              <button type="button" className="visit-btn" onClick={() => navigate(`/food-partner/${reel.foodPartner?._id}`)}>Follow</button>
            </div>
          </div>

          <div className="overlay-right">
            <div className="dish-header">
              <h2 className="dish-name">{reel.dishName}</h2>
              <div className="header-controls">
                {reel.music && (
                  <div className="music-indicator" title={`Music: ${reel.music.name} by ${reel.music.artist}`}>
                    <span className="music-icon">🎵</span>
                    <span className="music-name">{reel.music.name}</span>
                  </div>
                )}
                <button 
                  className="desc-toggle" 
                  onClick={() => toggleDescription(reel._id)}
                >
                  {descVisible[reel._id] ? '−' : '+'}
                </button>
              </div>
            </div>
            {reel.description && (
              <p 
                id={`desc-${reel._id}`}
                className={`dish-description ${descVisible[reel._id] ? 'show' : ''}`}
              >
                {reel.description}
              </p>
            )}

            <div className="dish-options">
              <span className="price-tag">₹{reel.price || '---'}</span>
              <button 
                className="order-btn"
                onClick={() => handleOrderNow(reel)}
              >
                Order
              </button>
            </div>
            <button 
              className="add-to-cart"
              onClick={() => addToCart(reel)}
            >
              {getCartItemQuantity(reel._id) > 0 ? (
                <>
                  <FaCheck /> Added ({getCartItemQuantity(reel._id)})
                </>
              ) : (
                <>
                  <FaShoppingCart /> Add to Cart
                </>
              )}
            </button>
            
            
            {/* Video Progress Bar */}
            <div className="video-progress-container">
              <div 
                className="video-progress-bar"
                style={{ width: `${videoProgress[reel._id] || 0}%` }}
              />
            </div>
          </div>
        </section>
      ))}

      {/* Decorative Elements */}
      <div className="decorative-elements">
        <div className="deco-circle circle-1"></div>
        <div className="deco-circle circle-2"></div>
        <div className="deco-line line-1"></div>
        <div className="deco-line line-2"></div>
      </div>

      {/* Navigation Buttons */}
      <div className="nav-buttons">
        
        {cart.length > 0 && (
          <button 
            className="cart-button"
            onClick={() => setShowCart(true)}
          >
            <FaShoppingCart />
            <span className="cart-count">{cart.length}</span>
            <span className="cart-total">₹{cartTotal.toFixed(2)}</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {orderSuccess && (
        <div className="success-notification">
          <FaCheck />
          <span>Order placed successfully!</span>
        </div>
      )}

      {/* Order Tracking Modal */}
      {showOrderTracking && (
        <div className="modal-overlay" onClick={() => setShowOrderTracking(false)}>
          <div className="modal-content order-tracking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Track Your Order</h3>
              <button className="close-btn" onClick={() => setShowOrderTracking(false)}>
                <span>×</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="tracking-input-section">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter Order ID (e.g., ORD1234567890ABC)"
                    value={trackingOrderId}
                    onChange={(e) => setTrackingOrderId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
                  />
                  <button 
                    onClick={handleTrackOrder}
                    disabled={isTracking}
                    className="track-btn"
                  >
                    {isTracking ? 'Tracking...' : 'Track Order'}
                  </button>
                </div>
                
                {trackingError && (
                  <div className="error-message">{trackingError}</div>
                )}
              </div>

              {trackedOrder && (
                <div className="order-details">
                  <div className="order-header">
                    <h4>Order #{trackedOrder.orderId}</h4>
                    <div 
                      className="order-status"
                      style={{ backgroundColor: getStatusColor(trackedOrder.status) }}
                    >
                      {getStatusText(trackedOrder.status)}
                    </div>
                  </div>

                  <div className="order-info">
                    <div className="info-row">
                      <span className="label">Restaurant:</span>
                      <span className="value">{trackedOrder.foodPartner?.businessName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Order Time:</span>
                      <span className="value">{formatTime(trackedOrder.orderTime)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Estimated Time:</span>
                      <span className="value">{trackedOrder.estimatedTime} minutes</span>
                    </div>
                    {trackedOrder.completedTime && (
                      <div className="info-row">
                        <span className="label">Completed Time:</span>
                        <span className="value">{formatTime(trackedOrder.completedTime)}</span>
                      </div>
                    )}
                  </div>

                  <div className="order-items">
                    <h5>Order Items:</h5>
                    {trackedOrder.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                        <span className="item-price">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-summary">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>₹{trackedOrder.subtotal}</span>
                    </div>
                    <div className="summary-row">
                      <span>Delivery Fee:</span>
                      <span>₹{trackedOrder.deliveryFee}</span>
                    </div>
                    <div className="summary-row">
                      <span>Tax:</span>
                      <span>₹{trackedOrder.tax}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>₹{trackedOrder.total}</span>
                    </div>
                  </div>

                  <div className="delivery-info">
                    <h5>Delivery Address:</h5>
                    <p>{trackedOrder.customerAddress.address}</p>
                    <p>{trackedOrder.customerAddress.city} - {trackedOrder.customerAddress.pincode}</p>
                    <p>Phone: {trackedOrder.customerPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="cart-modal-overlay">
          <div className="cart-modal">
            <div className="cart-header">
              <h3>Shopping Cart</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCart(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <FaShoppingCart />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item._id} className="cart-item">
                    <div className="item-info">
                      <h4>{item.dishName}</h4>
                      <p>₹{item.price}</p>
                    </div>
                    <div className="quantity-controls">
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      >
                        <FaMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      >
                        <FaPlus />
                      </button>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item._id)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <strong>Total: ₹{cartTotal.toFixed(2)}</strong>
                </div>
                <button 
                  className="checkout-btn"
                  onClick={handleCartOrder}
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedItem && (
        <div className="order-modal-overlay">
          <div className="order-modal">
            <div className="order-header">
              <h3>Place Order</h3>
              <button 
                className="close-btn"
                onClick={() => setShowOrderModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="order-content">
              <div className="order-item">
                <h4>{selectedItem.dishName}</h4>
                <p className="order-description">{selectedItem.description}</p>
                <div className="order-price">₹{selectedItem.price}</div>
              </div>
              
              <div className="order-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    addToCart(selectedItem);
                    setShowOrderModal(false);
                  }}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleQuickOrder(selectedItem)}
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal">
            <div className="checkout-header">
              <h3>Checkout</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCheckout(false);
                  setOrderStep(1);
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="checkout-steps">
              <div className={`step ${orderStep >= 1 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Address</span>
              </div>
              <div className={`step ${orderStep >= 2 ? 'active' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Payment</span>
              </div>
              <div className={`step ${orderStep >= 3 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Confirmation</span>
              </div>
            </div>

            <div className="checkout-content">
              {/* Step 1: Delivery Address */}
              {orderStep === 1 && (
                <div className="checkout-step">
                  <h4>Delivery Address</h4>
                  <div className="address-form">
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        value={deliveryAddress.name}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, name: e.target.value})}
                        className={formErrors.name ? 'error' : ''}
                      />
                      {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input 
                        type="tel" 
                        value={deliveryAddress.phone}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                        className={formErrors.phone ? 'error' : ''}
                      />
                      {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <textarea 
                        value={deliveryAddress.address}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, address: e.target.value})}
                        rows="3"
                        className={formErrors.address ? 'error' : ''}
                      />
                      {formErrors.address && <span className="error-message">{formErrors.address}</span>}
                    </div>
                    <div className="form-group">
                      <label>Landmark</label>
                      <input 
                        type="text" 
                        value={deliveryAddress.landmark}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, landmark: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input 
                          type="text" 
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                          className={formErrors.city ? 'error' : ''}
                        />
                        {formErrors.city && <span className="error-message">{formErrors.city}</span>}
                      </div>
                      <div className="form-group">
                        <label>Pincode</label>
                        <input 
                          type="text" 
                          value={deliveryAddress.pincode}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                          className={formErrors.pincode ? 'error' : ''}
                        />
                        {formErrors.pincode && <span className="error-message">{formErrors.pincode}</span>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Address Type</label>
                      <select 
                        value={deliveryAddress.type}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, type: e.target.value})}
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={handleAddressSubmit}
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {orderStep === 2 && (
                <div className="checkout-step">
                  <h4>Payment Method</h4>
                  <div className="payment-options">
                    <div className="payment-method">
                      <input 
                        type="radio" 
                        id="card" 
                        name="payment" 
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label htmlFor="card">
                        <span className="payment-icon">💳</span>
                        Credit/Debit Card
                      </label>
                    </div>
                    <div className="payment-method">
                      <input 
                        type="radio" 
                        id="upi" 
                        name="payment" 
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label htmlFor="upi">
                        <span className="payment-icon">📱</span>
                        UPI
                      </label>
                    </div>
                    <div className="payment-method">
                      <input 
                        type="radio" 
                        id="cod" 
                        name="payment" 
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label htmlFor="cod">
                        <span className="payment-icon">💰</span>
                        Cash on Delivery
                      </label>
                    </div>
                  </div>
                  {formErrors.paymentMethod && <span className="error-message">{formErrors.paymentMethod}</span>}
                  
                  <div className="order-summary">
                    <h5>Order Summary</h5>
                    {cart.map((item) => (
                      <div key={item._id} className="summary-item">
                        <span>{item.dishName} x {item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="summary-line">
                      <span>Subtotal</span>
                      <span>₹{cartTotal}</span>
                    </div>
                    <div className="summary-line">
                      <span>Delivery Fee</span>
                      <span>₹{deliveryFee}</span>
                    </div>
                    <div className="summary-line">
                      <span>Tax (18%)</span>
                      <span>₹{Math.round(cartTotal * 0.18)}</span>
                    </div>
                    <div className="summary-total">
                      <span>Total</span>
                      <span>₹{calculateOrderTotal()}</span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Order Notes (Optional)</label>
                    <textarea 
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Any special instructions..."
                      rows="2"
                    />
                  </div>
                  
                  <button 
                    className="btn btn-primary"
                    onClick={handlePaymentSubmit}
                  >
                    Place Order
                  </button>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {orderStep === 3 && (
                <div className="checkout-step">
                  <div className="order-confirmation">
                    <div className="success-icon">✅</div>
                    <h4>Order Placed Successfully!</h4>
                    <p>Your order has been confirmed and is being prepared by the restaurants.</p>
                    
                    <div className="order-details">
                      <div className="detail-item">
                        <span>Order ID:</span>
                        <span>{orderId}</span>
                      </div>
                      <div className="detail-item">
                        <span>Estimated Delivery:</span>
                        <span>{estimatedTime}</span>
                      </div>
                      <div className="detail-item">
                        <span>Total Amount:</span>
                        <span>₹{calculateOrderTotal()}</span>
                      </div>
                    </div>
                    
                    {/* Food Partners */}
                    <div className="food-partners-info">
                      <h5>Orders sent to:</h5>
                      {Object.values(
                        cart.reduce((partners, item) => {
                          const partnerId = item.foodPartner._id;
                          if (!partners[partnerId]) {
                            partners[partnerId] = item.foodPartner;
                          }
                          return partners;
                        }, {})
                      ).map((partner) => (
                        <div key={partner._id} className="partner-info">
                          <div className="partner-details">
                            <h6>{partner.businessName}</h6>
                            <p>📞 {partner.phone}</p>
                          </div>
                          <div className="partner-status">
                            <span className="status-badge">Order Sent</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="tracking-info">
                      <h5>Track Your Order</h5>
                      <div className="tracking-steps">
                        <div className="tracking-step active">
                          <span className="step-dot"></span>
                          <span>Order Confirmed</span>
                        </div>
                        <div className="tracking-step">
                          <span className="step-dot"></span>
                          <span>Preparing</span>
                        </div>
                        <div className="tracking-step">
                          <span className="step-dot"></span>
                          <span>Out for Delivery</span>
                        </div>
                        <div className="tracking-step">
                          <span className="step-dot"></span>
                          <span>Delivered</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap Home component with ErrorBoundary
const HomeWithErrorBoundary = () => (
  <ErrorBoundary>
    <Home />
  </ErrorBoundary>
);

export default HomeWithErrorBoundary;
