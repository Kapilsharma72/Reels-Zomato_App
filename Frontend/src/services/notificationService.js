import { useWebSocket } from '../hooks/useWebSocket';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.maxNotifications = 50;
  }

  // Add a notification
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    
    // Keep only the latest notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Notify all listeners
    this.notifyListeners();

    // Auto-remove notification after 10 seconds if it's not important
    if (!notification.persistent) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, 10000);
    }

    return newNotification;
  }

  // Remove a notification
  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Mark notification as read
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Get all notifications
  getNotifications() {
    return [...this.notifications];
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Subscribe to notification changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getNotifications(), this.getUnreadCount());
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Create notification types
  createOrderNotification(type, data) {
    const notifications = {
      order_accepted: {
        type: 'order',
        title: 'Order Accepted',
        message: `Your order ${data.orderId} has been accepted and is being prepared`,
        icon: '✅',
        color: 'success'
      },
      order_rejected: {
        type: 'order',
        title: 'Order Rejected',
        message: `Your order ${data.orderId} has been rejected. ${data.reason ? `Reason: ${data.reason}` : ''}`,
        icon: '❌',
        color: 'error'
      },
      order_preparing: {
        type: 'order',
        title: 'Order Being Prepared',
        message: `Your order ${data.orderId} is being prepared. ${data.estimatedTime ? `ETA: ${data.estimatedTime}` : ''}`,
        icon: '👨‍🍳',
        color: 'info'
      },
      order_ready: {
        type: 'order',
        title: 'Order Ready',
        message: `Your order ${data.orderId} is ready for pickup!`,
        icon: '🍽️',
        color: 'success'
      },
      order_picked_up: {
        type: 'order',
        title: 'Order Picked Up',
        message: `Your order ${data.orderId} has been picked up and is on its way!`,
        icon: '🚚',
        color: 'info'
      },
      order_on_the_way: {
        type: 'order',
        title: 'Order On The Way',
        message: `Your order ${data.orderId} is on the way! ${data.estimatedDeliveryTime ? `ETA: ${data.estimatedDeliveryTime}` : ''}`,
        icon: '🚗',
        color: 'info'
      },
      order_delivered: {
        type: 'order',
        title: 'Order Delivered',
        message: `Your order ${data.orderId} has been delivered successfully! Enjoy your meal!`,
        icon: '🎉',
        color: 'success',
        persistent: true
      }
    };

    return notifications[type] || {
      type: 'order',
      title: 'Order Update',
      message: `Your order ${data.orderId} status has been updated`,
      icon: '📦',
      color: 'info'
    };
  }

  createVideoNotification(type, data) {
    const notifications = {
      video_assigned_to_editor: {
        type: 'video',
        title: 'Video Assigned',
        message: `Your video "${data.projectTitle}" has been assigned to an editor`,
        icon: '🎬',
        color: 'info'
      },
      video_edit_progress: {
        type: 'video',
        title: 'Edit Progress',
        message: `Video "${data.projectTitle}" editing progress: ${data.progress}%`,
        icon: '⚡',
        color: 'info'
      },
      video_edit_completed: {
        type: 'video',
        title: 'Video Ready',
        message: `Your edited video "${data.projectTitle}" is ready for download!`,
        icon: '✨',
        color: 'success',
        persistent: true
      },
      video_downloaded: {
        type: 'video',
        title: 'Video Downloaded',
        message: `Video "${data.projectTitle}" has been downloaded by the client`,
        icon: '📥',
        color: 'info'
      }
    };

    return notifications[type] || {
      type: 'video',
      title: 'Video Update',
      message: `Video "${data.projectTitle}" status has been updated`,
      icon: '🎥',
      color: 'info'
    };
  }

  createDeliveryNotification(type, data) {
    const notifications = {
      new_order: {
        type: 'delivery',
        title: 'New Order Available',
        message: `New delivery order available: ${data.orderId}`,
        icon: '📦',
        color: 'info'
      },
      order_assigned: {
        type: 'delivery',
        title: 'Order Assigned',
        message: `Order ${data.orderId} has been assigned to you`,
        icon: '✅',
        color: 'success'
      },
      order_ready: {
        type: 'delivery',
        title: 'Order Ready for Pickup',
        message: `Order ${data.orderId} is ready for pickup`,
        icon: '🍽️',
        color: 'info'
      }
    };

    return notifications[type] || {
      type: 'delivery',
      title: 'Delivery Update',
      message: `Order ${data.orderId} status has been updated`,
      icon: '🚚',
      color: 'info'
    };
  }

  // Setup WebSocket listeners for different user types
  setupWebSocketListeners(socket, userType, userId) {
    if (!socket) return;

    const cleanupFunctions = [];

    // Order notifications
    const orderEvents = [
      'order_accepted', 'order_rejected', 'order_preparing', 
      'order_ready', 'order_picked_up', 'order_on_the_way', 'order_delivered'
    ];

    orderEvents.forEach(event => {
      const handler = (data) => {
        // Check if this notification is for the current user
        if (userType === 'customer' && (data.customerId === userId || data.customerName === userId)) {
          const notification = this.createOrderNotification(event, data);
          this.addNotification(notification);
        } else if (userType === 'food_partner' && data.foodPartnerId === userId) {
          const notification = this.createOrderNotification(event, data);
          this.addNotification(notification);
        } else if (userType === 'delivery_partner' && data.deliveryPartnerId === userId) {
          const notification = this.createOrderNotification(event, data);
          this.addNotification(notification);
        }
      };

      socket.on(event, handler);
      cleanupFunctions.push(() => socket.off(event, handler));
    });

    // Video notifications
    const videoEvents = [
      'video_assigned_to_editor', 'video_edit_progress', 
      'video_edit_completed', 'video_downloaded'
    ];

    videoEvents.forEach(event => {
      const handler = (data) => {
        if (userType === 'food_partner' && data.foodPartnerId === userId) {
          const notification = this.createVideoNotification(event, data);
          this.addNotification(notification);
        } else if (userType === 'editor' && data.editorId === userId) {
          const notification = this.createVideoNotification(event, data);
          this.addNotification(notification);
        }
      };

      socket.on(event, handler);
      cleanupFunctions.push(() => socket.off(event, handler));
    });

    // Delivery notifications
    const deliveryEvents = ['new_order', 'order_assigned', 'order_ready'];

    deliveryEvents.forEach(event => {
      const handler = (data) => {
        if (userType === 'delivery_partner') {
          const notification = this.createDeliveryNotification(event, data);
          this.addNotification(notification);
        }
      };

      socket.on(event, handler);
      cleanupFunctions.push(() => socket.off(event, handler));
    });

    // Return cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;
