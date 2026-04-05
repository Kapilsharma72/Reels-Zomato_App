import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaClock, 
  FaUtensils, 
  FaTruck, 
  FaMapMarkerAlt, 
  FaPhone,
  FaUser,
  FaCalendarAlt,
  FaReceipt,
  FaStar,
  FaTimes,
  FaPlay,
  FaPause
} from 'react-icons/fa';
import orderService from '../services/orderService';
import { useWebSocket } from '../hooks/useWebSocket';
import { API_ENDPOINTS } from '../config/api';
import './OrderTracking.css';

const OrderTracking = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { socket, isConnected } = useWebSocket();

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Order status steps — sequence: pending → preparing → ready → picked_up → on_the_way → delivered
  const orderSteps = [
    { 
      id: 'pending', 
      label: 'Order Placed', 
      icon: FaCheckCircle, 
      description: 'Your order has been placed and is waiting for confirmation' 
    },
    { 
      id: 'preparing', 
      label: 'Preparing', 
      icon: FaUtensils, 
      description: 'Your delicious meal is being prepared with care' 
    },
    { 
      id: 'ready', 
      label: 'Ready for Pickup', 
      icon: FaClock, 
      description: 'Your order is ready and waiting for delivery partner' 
    },
    { 
      id: 'picked_up', 
      label: 'Picked Up', 
      icon: FaTruck, 
      description: 'Delivery partner has picked up your order' 
    },
    { 
      id: 'on_the_way', 
      label: 'On The Way', 
      icon: FaTruck, 
      description: 'Your order is on its way to you' 
    },
    { 
      id: 'delivered', 
      label: 'Delivered', 
      icon: FaCheckCircle, 
      description: 'Order delivered successfully! Enjoy your meal!' 
    }
  ];

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await orderService.getOrderById(orderId);
      if (response.success || response.message === "Order retrieved successfully") {
        const fetchedOrder = response.order || response.data;
        setOrder(fetchedOrder);
        
        // Calculate current step based on status
        const stepIndex = orderSteps.findIndex(step => step.id === fetchedOrder?.status);
        setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
        
        // Show estimated delivery time when on_the_way
        if (fetchedOrder?.status === 'on_the_way' && fetchedOrder?.estimatedTime) {
          setEstimatedTime(fetchedOrder.estimatedTime);
        } else if (fetchedOrder?.estimatedTime) {
          setEstimatedTime(fetchedOrder.estimatedTime);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // WebSocket listeners for real-time updates — subscribe to order_update event
  useEffect(() => {
    if (socket && order) {
      const handleOrderUpdate = (data) => {
        // Match by orderId string or MongoDB _id
        const matchesOrder =
          data.orderId === order.orderId ||
          data.orderId === order._id?.toString() ||
          data.id === order._id?.toString();

        if (!matchesOrder) return;

        // Update order status and estimated time from payload
        setOrder(prev => ({
          ...prev,
          status: data.status || prev.status,
          estimatedTime: data.estimatedDeliveryTime ?? data.estimatedTime ?? prev.estimatedTime
        }));

        // Show estimated delivery time when on_the_way
        if (data.status === 'on_the_way' && (data.estimatedDeliveryTime || data.estimatedTime)) {
          setEstimatedTime(data.estimatedDeliveryTime || data.estimatedTime);
        }

        // Update current step in the timeline
        const stepIndex = orderSteps.findIndex(step => step.id === data.status);
        if (stepIndex >= 0) {
          setCurrentStep(stepIndex);
        }

        // Show rating modal when order is delivered
        if (data.status === 'delivered') {
          setShowRatingModal(true);
        }
      };

      // Subscribe to the unified order_update event
      socket.on('order_update', handleOrderUpdate);

      return () => {
        socket.off('order_update', handleOrderUpdate);
      };
    }
  }, [socket, order]);

  // Initial fetch
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Show rating modal if order is already delivered on load
  useEffect(() => {
    if (order?.status === 'delivered' && !ratingSuccess) {
      setShowRatingModal(true);
    }
  }, [order?.status]);

  // Submit rating
  const submitRating = async () => {
    if (!ratingValue) {
      setRatingError('Please select a star rating.');
      return;
    }
    try {
      setRatingSubmitting(true);
      setRatingError('');
      const response = await fetch(`${API_ENDPOINTS.ORDERS}/${orderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating: ratingValue, review: reviewText }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit rating');
      }
      setShowRatingModal(false);
      setRatingSuccess(true);
    } catch (err) {
      setRatingError(err.message || 'Failed to submit rating');
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      accepted: '#17a2b8',
      preparing: '#fd7e14',
      ready: '#28a745',
      picked_up: '#6f42c1',
      on_the_way: '#20c997',
      delivered: '#28a745',
      cancelled: '#dc3545',
      rejected: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  // Get estimated delivery time
  const getEstimatedDeliveryTime = () => {
    if (!order) return null;
    
    const orderTime = new Date(order.orderTime);
    const estimatedMinutes = order.estimatedTime || 30;
    const deliveryTime = new Date(orderTime.getTime() + estimatedMinutes * 60000);
    
    return deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="order-tracking-overlay">
        <div className="order-tracking-modal">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-tracking-overlay">
        <div className="order-tracking-modal">
          <div className="error-state">
            <h3>Error Loading Order</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchOrderDetails}>
              Try Again
            </button>
            {onClose && (
              <button className="close-btn" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking-overlay">
        <div className="order-tracking-modal">
          <div className="empty-state">
            <h3>Order Not Found</h3>
            <p>The order you're looking for doesn't exist or has been removed.</p>
            {onClose && (
              <button className="close-btn" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracking-overlay">
      <div className="order-tracking-modal">
        {/* Header */}
        <div className="tracking-header">
          <div className="header-info">
            <h2>Order Tracking</h2>
            <div className="order-id">Order #{order.orderId}</div>
          </div>
          <div className="header-actions">
            <div className="connection-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢' : '🔴'}
              </div>
              <span className="status-text">
                {isConnected ? 'Live Updates' : 'Offline'}
              </span>
            </div>
            {onClose && (
              <button className="close-btn" onClick={onClose}>
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-item">
            <FaUser />
            <div className="item-details">
              <span className="item-label">Customer</span>
              <span className="item-value">{order.customerName}</span>
            </div>
          </div>
          <div className="summary-item">
            <FaCalendarAlt />
            <div className="item-details">
              <span className="item-label">Order Time</span>
              <span className="item-value">
                {new Date(order.orderTime).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="summary-item">
            <FaReceipt />
            <div className="item-details">
              <span className="item-label">Total Amount</span>
              <span className="item-value">${order.total}</span>
            </div>
          </div>
          {(estimatedTime || order?.status === 'on_the_way') && (
            <div className="summary-item">
              <FaClock />
              <div className="item-details">
                <span className="item-label">Estimated Delivery</span>
                <span className="item-value">{getEstimatedDeliveryTime()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Timeline */}
        <div className="progress-timeline">
          <h3>Order Progress</h3>
          <div className="timeline">
            {orderSteps.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="step-icon">
                    <Icon />
                  </div>
                  <div className="step-content">
                    <div className="step-title">{step.label}</div>
                    <div className="step-description">{step.description}</div>
                    {isCurrent && order.status === step.id && (
                      <div className="step-time">
                        {new Date().toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="order-details">
          <h3>Order Details</h3>
          <div className="items-list">
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                </div>
                <div className="item-price">${item.price}</div>
              </div>
            ))}
          </div>
          
          <div className="order-totals">
            <div className="total-line">
              <span>Subtotal</span>
              <span>${order.subtotal}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="total-line">
                <span>Delivery Fee</span>
                <span>${order.deliveryFee}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="total-line">
                <span>Tax</span>
                <span>${order.tax}</span>
              </div>
            )}
            <div className="total-line total">
              <span>Total</span>
              <span>${order.total}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-info">
          <h3>Contact Information</h3>
          <div className="contact-details">
            <div className="contact-item">
              <FaMapMarkerAlt />
              <div className="contact-details">
                <span className="contact-label">Delivery Address</span>
                <span className="contact-value">{order.customerAddress}</span>
              </div>
            </div>
            <div className="contact-item">
              <FaPhone />
              <div className="contact-details">
                <span className="contact-label">Phone Number</span>
                <span className="contact-value">{order.customerPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.orderNotes && (
          <div className="special-instructions">
            <h3>Special Instructions</h3>
            <p>{order.orderNotes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="tracking-actions">
          <button className="refresh-btn" onClick={fetchOrderDetails}>
            <FaPlay />
            Refresh Status
          </button>
          {order.status === 'delivered' && (
            <button className="rate-btn" onClick={() => setShowRatingModal(true)}>
              <FaStar />
              Rate Order
            </button>
          )}
        </div>

        {/* Rating Success Message */}
        {ratingSuccess && (
          <div className="rating-success-banner">
            <FaCheckCircle />
            <span>Thanks for your rating! Your feedback helps others.</span>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="rating-modal-overlay">
          <div className="rating-modal">
            <div className="rating-modal-header">
              <h3>Rate Your Order</h3>
              <button className="rating-close-btn" onClick={() => setShowRatingModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="rating-modal-body">
              <p>How was your experience with this order?</p>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star-btn ${star <= (hoverRating || ratingValue) ? 'active' : ''}`}
                    onClick={() => setRatingValue(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
              <textarea
                className="review-input"
                placeholder="Write a review (optional)..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
              />
              {ratingError && <p className="rating-error">{ratingError}</p>}
            </div>
            <div className="rating-modal-footer">
              <button className="rating-cancel-btn" onClick={() => setShowRatingModal(false)}>
                Cancel
              </button>
              <button
                className="rating-submit-btn"
                onClick={submitRating}
                disabled={ratingSubmitting}
              >
                {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
