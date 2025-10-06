import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { useWebSocket } from './useWebSocket';

export const useNotifications = (userType = null, userId = null) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useWebSocket();

  // Subscribe to notification changes
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifications, newUnreadCount) => {
      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
    });

    // Initialize with current notifications
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    return unsubscribe;
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    if (socket && userType && userId) {
      const cleanup = notificationService.setupWebSocketListeners(socket, userType, userId);
      return cleanup;
    }
  }, [socket, userType, userId]);

  // Notification actions
  const addNotification = useCallback((notification) => {
    return notificationService.addNotification(notification);
  }, []);

  const removeNotification = useCallback((id) => {
    notificationService.removeNotification(id);
  }, []);

  const markAsRead = useCallback((id) => {
    notificationService.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const clearAll = useCallback(() => {
    notificationService.clearAll();
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };
};

export default useNotifications;
