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
import './OrderTracking.css';

const OrderTracking = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { socket, isConnected } = useWebSocket();

  // Order status steps
  const orderSteps = [
    { 
      id: 'pending', 
      label: 'Order Placed', 
      icon: FaCheckCircle, 
      description: 'Your order has been placed and is waiting for confirmation' 
    },
    { 
      id: 'accepted', 
      label: 'Order Accepted', 
      icon: FaCheckCircle, 
      description: 'Restaurant has accepted your order and started preparation' 
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
        setOrder(response.order || response.data);
        
        // Calculate current step based on status
        const stepIndex = orderSteps.findIndex(step => step.id === response.order?.status);
        setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
        
        // Calculate estimated time
        if (response.order?.estimatedTime) {
          setEstimatedTime(response.order.estimatedTime);
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

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (socket && order) {
      const handleOrderUpdate = (data) => {
        if (data.orderId === order.orderId || data.id === order._id) {
          // Update order status
          setOrder(prev => ({
            ...prev,
            status: data.status || prev.status,
            estimatedTime: data.estimatedTime || prev.estimatedTime
          }));
          
          // Update current step
          const stepIndex = orderSteps.findIndex(step => step.id === data.status);
          if (stepIndex >= 0) {
            setCurrentStep(stepIndex);
          }
        }
      };

      // Listen for order status updates
      socket.on('order_accepted', handleOrderUpdate);
      socket.on('order_rejected', handleOrderUpdate);
      socket.on('order_preparing', handleOrderUpdate);
      socket.on('order_ready', handleOrderUpdate);
      socket.on('order_picked_up', handleOrderUpdate);
      socket.on('order_on_the_way', handleOrderUpdate);
      socket.on('order_delivered', handleOrderUpdate);

      return () => {
        socket.off('order_accepted', handleOrderUpdate);
        socket.off('order_rejected', handleOrderUpdate);
        socket.off('order_preparing', handleOrderUpdate);
        socket.off('order_ready', handleOrderUpdate);
        socket.off('order_picked_up', handleOrderUpdate);
        socket.off('order_on_the_way', handleOrderUpdate);
        socket.off('order_delivered', handleOrderUpdate);
      };
    }
  }, [socket, order]);

  // Initial fetch
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

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
          {estimatedTime && (
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
            <button className="rate-btn">
              <FaStar />
              Rate Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
