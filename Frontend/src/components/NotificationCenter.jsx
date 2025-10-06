import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaTimes, FaCheck, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import useNotifications from '../hooks/useNotifications';
import '../components/NotificationCenter.css';

const NotificationCenter = ({ userType, userId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, order, video, delivery
  const dropdownRef = useRef(null);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification
  } = useNotifications(userType, userId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'all') return true;
    return notification.type === filter;
  });

  // Get notification icon
  const getNotificationIcon = (notification) => {
    if (notification.icon) return notification.icon;
    
    const icons = {
      order: '📦',
      video: '🎬',
      delivery: '🚚',
      promotion: '🎉',
      story: '📸',
      default: '🔔'
    };
    
    return icons[notification.type] || icons.default;
  };

  // Get notification color class
  const getNotificationColorClass = (notification) => {
    const colors = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info',
      default: 'default'
    };
    
    return colors[notification.color] || colors.default;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return time.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle different notification types
    switch (notification.type) {
      case 'order':
        // Could open order details or navigate to orders page
        console.log('Order notification clicked:', notification);
        break;
      case 'video':
        // Could open video submissions or editor dashboard
        console.log('Video notification clicked:', notification);
        break;
      case 'delivery':
        // Could open delivery dashboard
        console.log('Delivery notification clicked:', notification);
        break;
      default:
        console.log('Notification clicked:', notification);
    }
  };

  return (
    <div className={`notification-center ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <FaEye />
                </button>
              )}
              <button
                className="clear-all-btn"
                onClick={clearAll}
                title="Clear all notifications"
              >
                <FaTrash />
              </button>
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="notification-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`filter-btn ${filter === 'order' ? 'active' : ''}`}
              onClick={() => setFilter('order')}
            >
              Orders
            </button>
            <button
              className={`filter-btn ${filter === 'video' ? 'active' : ''}`}
              onClick={() => setFilter('video')}
            >
              Videos
            </button>
            <button
              className={`filter-btn ${filter === 'delivery' ? 'active' : ''}`}
              onClick={() => setFilter('delivery')}
            >
              Delivery
            </button>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <p>No notifications</p>
                <small>You're all caught up!</small>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${getNotificationColorClass(notification)} ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>

                  <div className="notification-actions">
                    {!notification.read && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        <FaCheck />
                      </button>
                    )}
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      title="Remove notification"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="notification-footer">
              <button
                className="view-all-btn"
                onClick={() => {
                  // Could navigate to a full notifications page
                  console.log('View all notifications');
                }}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;