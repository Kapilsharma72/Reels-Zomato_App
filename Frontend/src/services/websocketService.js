import { API_BASE_URL } from '../config/api.js';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.heartbeatInterval = null;
  }

  connect(token = null) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    const wsUrl = import.meta.env.VITE_WS_URL || API_BASE_URL.replace(/^http/, 'ws') + '/ws';
    
    try {
      console.log('WebSocket: Attempting to connect to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnected', event);
        
        // Handle different close codes
        if (event.code === 1006) {
          console.log('WebSocket: Connection lost, attempting to reconnect...');
        } else if (event.code === 1008) {
          console.log('WebSocket: Policy violation, not reconnecting');
          return;
        } else if (event.code === 1011) {
          console.log('WebSocket: Server error, not reconnecting');
          return;
        }
        
        // Attempt to reconnect if not a manual close and we haven't exceeded max attempts
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('WebSocket: Max reconnection attempts reached, giving up');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
        
        // Don't attempt to reconnect on authentication errors
        if (error.type === 'error' && this.ws.readyState === WebSocket.CLOSED) {
          console.log('WebSocket: Connection failed, likely due to authentication issues');
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts && !this.isConnecting) {
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect();
      } else if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.log('WebSocket: Max reconnection attempts reached, giving up');
        this.emit('max_reconnect_attempts_reached');
      }
    }, delay);
  }

  getToken() {
    // Get token from localStorage or auth service
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  // Reset connection status (useful after successful authentication)
  resetConnectionStatus() {
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    console.log('WebSocket: Connection status reset');
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  handleMessage(message) {
    console.log('WebSocket message received:', message);
    
    // Emit specific message types
    this.emit(message.type, message);
    
    // Emit general message event
    this.emit('message', message);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Event listener methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Convenience methods for specific message types
  onOrderUpdate(callback) {
    this.on('order_update', callback);
  }

  onNewOrder(callback) {
    this.on('new_order', callback);
  }

  onOrderAssigned(callback) {
    this.on('order_assigned', callback);
  }

  onVideoSubmissionUpdate(callback) {
    this.on('video_submission_update', callback);
  }

  onNewVideoSubmission(callback) {
    this.on('new_video_submission', callback);
  }

  onNewMessage(callback) {
    this.on('new_message', callback);
  }

  onSystemNotification(callback) {
    this.on('system_notification', callback);
  }

  // Room management
  joinRoom(roomId) {
    this.send({ type: 'join_room', room: roomId });
  }

  leaveRoom(roomId) {
    this.send({ type: 'leave_room', room: roomId });
  }

  // Connection status
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    if (!this.ws) return 'CLOSED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

// Export singleton instance
export default new WebSocketService();
