import { useEffect, useRef, useState } from 'react';
import websocketService from '../services/websocketService';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('CLOSED');
  const listenersRef = useRef(new Map());

  useEffect(() => {
    // Set up connection status listeners
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionState('OPEN');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionState('CLOSED');
    };

    const handleError = (error) => {
      console.error('WebSocket error:', error);
      setConnectionState('ERROR');
    };

    // Add listeners
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('error', handleError);

    // Auto-connect when component mounts (cookies will be sent automatically)
    // Only connect if we have authentication data
    const hasAuthData = () => {
      try {
        const userData = localStorage.getItem('userData');
        const tempUserData = localStorage.getItem('tempUserData');
        return !!(userData || tempUserData);
      } catch (error) {
        return false;
      }
    };

    if (hasAuthData()) {
      console.log('Auto-connecting WebSocket...');
      websocketService.connect();
    } else {
      console.log('No authentication data found, skipping WebSocket connection');
    }

    // Cleanup function
    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('error', handleError);
    };
  }, []);

  const connect = (token) => {
    websocketService.connect(token);
  };

  const disconnect = () => {
    websocketService.disconnect();
  };

  const send = (message) => {
    return websocketService.send(message);
  };

  const addListener = (event, callback) => {
    websocketService.on(event, callback);
    listenersRef.current.set(event, callback);
  };

  const removeListener = (event, callback) => {
    websocketService.off(event, callback);
    listenersRef.current.delete(event);
  };

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach((callback, event) => {
        websocketService.off(event, callback);
      });
      listenersRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    send,
    addListener,
    removeListener,
    socket: websocketService
  };
};

// Hook for order-related WebSocket events
export const useOrderWebSocket = () => {
  const { addListener, removeListener, isConnected } = useWebSocket();

  useEffect(() => {
    const handleOrderUpdate = (data) => {
      console.log('Order update received:', data);
      // You can add custom logic here for order updates
    };

    const handleNewOrder = (data) => {
      console.log('New order received:', data);
      // You can add custom logic here for new orders
    };

    const handleOrderAssigned = (data) => {
      console.log('Order assigned received:', data);
      // You can add custom logic here for order assignments
    };

    addListener('order_update', handleOrderUpdate);
    addListener('new_order', handleNewOrder);
    addListener('order_assigned', handleOrderAssigned);

    return () => {
      removeListener('order_update', handleOrderUpdate);
      removeListener('new_order', handleNewOrder);
      removeListener('order_assigned', handleOrderAssigned);
    };
  }, [addListener, removeListener]);

  return {
    isConnected,
    onOrderUpdate: (callback) => addListener('order_update', callback),
    onNewOrder: (callback) => addListener('new_order', callback),
    onOrderAssigned: (callback) => addListener('order_assigned', callback)
  };
};

// Hook for video submission WebSocket events
export const useVideoSubmissionWebSocket = () => {
  const { addListener, removeListener, isConnected } = useWebSocket();

  useEffect(() => {
    const handleSubmissionUpdate = (data) => {
      console.log('Video submission update received:', data);
    };

    const handleNewSubmission = (data) => {
      console.log('New video submission received:', data);
    };

    addListener('video_submission_update', handleSubmissionUpdate);
    addListener('new_video_submission', handleNewSubmission);

    return () => {
      removeListener('video_submission_update', handleSubmissionUpdate);
      removeListener('new_video_submission', handleNewSubmission);
    };
  }, [addListener, removeListener]);

  return {
    isConnected,
    onSubmissionUpdate: (callback) => addListener('video_submission_update', callback),
    onNewSubmission: (callback) => addListener('new_video_submission', callback)
  };
};

// Hook for messaging WebSocket events
export const useMessagingWebSocket = () => {
  const { addListener, removeListener, isConnected } = useWebSocket();

  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log('New message received:', data);
    };

    addListener('new_message', handleNewMessage);

    return () => {
      removeListener('new_message', handleNewMessage);
    };
  }, [addListener, removeListener]);

  return {
    isConnected,
    onNewMessage: (callback) => addListener('new_message', callback)
  };
};

// Hook for system notifications
export const useNotificationWebSocket = () => {
  const { addListener, removeListener, isConnected } = useWebSocket();

  useEffect(() => {
    const handleSystemNotification = (data) => {
      console.log('System notification received:', data);
      // You can show toast notifications here
    };

    addListener('system_notification', handleSystemNotification);

    return () => {
      removeListener('system_notification', handleSystemNotification);
    };
  }, [addListener, removeListener]);

  return {
    isConnected,
    onSystemNotification: (callback) => addListener('system_notification', callback)
  };
};
