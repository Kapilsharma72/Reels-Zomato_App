const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map to store connected clients by user ID
    this.rooms = new Map(); // Map to store room-based connections
    this.heartbeatInterval = null;
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      reconnections: 0,
      errors: 0
    };
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: (info) => {
        // Extract token from cookies (since we're using HTTP-only cookies)
        const cookies = info.req.headers.cookie;
        let token = null;
        
        if (cookies) {
          const tokenMatch = cookies.match(/token=([^;]+)/);
          if (tokenMatch) {
            token = tokenMatch[1];
          }
        }
        
        // Fallback to query parameters or headers for backward compatibility
        if (!token) {
          token = info.req.url.split('token=')[1]?.split('&')[0] || 
                  info.req.headers.authorization?.replace('Bearer ', '');
        }
        
        if (!token) {
          console.log('No token found for WebSocket connection');
          return false;
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          info.req.user = decoded;
          console.log('WebSocket authentication successful for user:', decoded.id);
          return true;
        } catch (error) {
          console.error('WebSocket authentication failed:', error.message);
          return false;
        }
      }
    });

    this.wss.on('connection', (ws, req) => {
      const user = req.user;
      console.log(`WebSocket client connected: ${user.id} (${user.userType})`);

      // Update connection stats
      this.connectionStats.totalConnections++;
      this.connectionStats.activeConnections++;

      // Store client connection
      this.clients.set(user.id.toString(), {
        ws,
        user,
        lastPing: Date.now(),
        connectedAt: Date.now(),
        reconnectCount: 0
      });

      // Join user-specific room
      this.joinRoom(user.id.toString(), ws);

      // Send welcome message
      this.sendToClient(user.id.toString(), {
        type: 'connection_established',
        message: 'Connected to ReelZomato real-time updates',
        timestamp: new Date().toISOString(),
        connectionId: user.id
      });

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(user.id, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', (code, reason) => {
        this.connectionStats.activeConnections--;
        this.clients.delete(user.id.toString());
        this.leaveRoom(user.id.toString());
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${user.id}:`, error);
        this.connectionStats.errors++;
        this.connectionStats.activeConnections--;
        this.clients.delete(user.id.toString());
        this.leaveRoom(user.id.toString());
      });

      // Handle pong responses
      ws.on('pong', () => {
        const client = this.clients.get(user.id);
        if (client) {
          client.lastPing = Date.now();
        }
      });

      // Send ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });

    // Clean up inactive connections every 5 minutes
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 300000);

    console.log('WebSocket server initialized');
  }

  handleMessage(userId, message) {
    const client = this.clients.get(userId);
    if (!client) return;

    switch (message.type) {
      case 'join_room':
        this.joinRoom(message.room, client.ws);
        break;
      case 'leave_room':
        this.leaveRoom(message.room, client.ws);
        break;
      case 'ping':
        this.sendToClient(userId, { type: 'pong', timestamp: Date.now() });
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  joinRoom(roomId, ws) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(ws);
    console.log(`Client joined room: ${roomId}`);
  }

  leaveRoom(roomId, ws) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  sendToClient(userId, message) {
    if (!userId) return false;
    const key = userId.toString(); // Normalize ObjectId or string
    const client = this.clients.get(key);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  sendToRoom(roomId, message) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      let sentCount = 0;
      
      room.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
          sentCount++;
        }
      });
      
      console.log(`Message sent to ${sentCount} clients in room: ${roomId}`);
      return sentCount;
    }
    return 0;
  }

  broadcast(message) {
    let sentCount = 0;
    this.clients.forEach((client, userId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
        sentCount++;
      }
    });
    console.log(`Broadcast message sent to ${sentCount} clients`);
    return sentCount;
  }

  // Order-related notifications
  notifyOrderUpdate(orderId, orderData, targetUsers = []) {
    const message = {
      type: 'order_update',
      orderId,
      data: orderData,
      timestamp: new Date().toISOString()
    };

    if (targetUsers.length > 0) {
      targetUsers.forEach(userId => {
        this.sendToClient(userId, message);
      });
    } else {
      // Send to order room
      this.sendToRoom(`order_${orderId}`, message);
    }
  }

  notifyNewOrder(orderData, foodPartnerId) {
    const message = {
      type: 'new_order',
      data: orderData,
      timestamp: new Date().toISOString()
    };

    // Notify food partner — ensure string ID
    this.sendToClient(foodPartnerId ? foodPartnerId.toString() : null, message);
    
    // Notify available delivery partners
    this.sendToRoom('delivery_partners', message);
  }

  notifyOrderAssigned(orderId, deliveryPartnerId, orderData) {
    const message = {
      type: 'order_assigned',
      orderId,
      data: orderData,
      timestamp: new Date().toISOString()
    };

    this.sendToClient(deliveryPartnerId, message);
  }

  // Enhanced order workflow notifications
  notifyOrderAccepted(orderId, foodPartnerId, customerId, orderData) {
    const message = {
      type: 'order_accepted',
      orderId,
      foodPartnerId,
      customerId,
      data: orderData,
      timestamp: new Date().toISOString()
    };

    // Notify customer that order was accepted
    this.sendToClient(customerId, message);
    
    // Notify food partner about acceptance
    this.sendToClient(foodPartnerId, message);
  }

  notifyOrderRejected(orderId, foodPartnerId, customerId, reason) {
    const message = {
      type: 'order_rejected',
      orderId,
      foodPartnerId,
      customerId,
      reason,
      timestamp: new Date().toISOString()
    };

    // Notify customer that order was rejected
    this.sendToClient(customerId, message);
    
    // Notify food partner about rejection
    this.sendToClient(foodPartnerId, message);
  }

  notifyOrderPreparing(orderId, foodPartnerId, customerId, estimatedTime) {
    const message = {
      type: 'order_preparing',
      orderId,
      foodPartnerId,
      customerId,
      estimatedTime,
      timestamp: new Date().toISOString()
    };

    // Notify customer that order is being prepared
    this.sendToClient(customerId, message);
  }

  notifyOrderReady(orderId, foodPartnerId, customerId, orderData) {
    const message = {
      type: 'order_ready',
      orderId,
      foodPartnerId,
      customerId,
      data: orderData,
      timestamp: new Date().toISOString()
    };

    // Notify customer that order is ready
    this.sendToClient(customerId, message);
    
    // Notify available delivery partners
    this.sendToRoom('delivery_partners', message);
  }

  notifyOrderPickedUp(orderId, deliveryPartnerId, customerId, foodPartnerId) {
    const message = {
      type: 'order_picked_up',
      orderId,
      deliveryPartnerId,
      customerId,
      foodPartnerId,
      timestamp: new Date().toISOString()
    };

    // Notify customer that order was picked up
    this.sendToClient(customerId, message);
    
    // Notify food partner
    this.sendToClient(foodPartnerId, message);
  }

  notifyOrderOnTheWay(orderId, deliveryPartnerId, customerId, foodPartnerId, estimatedDeliveryTime) {
    const message = {
      type: 'order_on_the_way',
      orderId,
      deliveryPartnerId,
      customerId,
      foodPartnerId,
      estimatedDeliveryTime,
      timestamp: new Date().toISOString()
    };

    // Notify customer that order is on the way
    this.sendToClient(customerId, message);
    
    // Notify food partner
    this.sendToClient(foodPartnerId, message);
  }

  notifyOrderDelivered(orderId, deliveryPartnerId, customerId, foodPartnerId, deliveryData) {
    const message = {
      type: 'order_delivered',
      orderId,
      deliveryPartnerId,
      customerId,
      foodPartnerId,
      deliveryData,
      timestamp: new Date().toISOString()
    };

    // Notify customer that order was delivered
    this.sendToClient(customerId, message);
    
    // Notify food partner
    this.sendToClient(foodPartnerId, message);
    
    // Notify delivery partner
    this.sendToClient(deliveryPartnerId, message);
  }

  // Video submission notifications
  notifyVideoSubmissionUpdate(submissionId, submissionData, targetUsers = []) {
    const message = {
      type: 'video_submission_update',
      submissionId,
      data: submissionData,
      timestamp: new Date().toISOString()
    };

    if (targetUsers.length > 0) {
      targetUsers.forEach(userId => {
        this.sendToClient(userId, message);
      });
    } else {
      this.sendToRoom(`submission_${submissionId}`, message);
    }
  }

  notifyNewVideoSubmission(submissionData, editorId) {
    const message = {
      type: 'new_video_submission',
      data: submissionData,
      timestamp: new Date().toISOString()
    };

    if (editorId) {
      this.sendToClient(editorId, message);
    } else {
      // Notify all available editors
      this.sendToRoom('editors', message);
    }
  }

  // Enhanced video workflow notifications
  notifyVideoAssignedToEditor(submissionId, editorId, foodPartnerId, submissionData) {
    const message = {
      type: 'video_assigned_to_editor',
      submissionId,
      editorId,
      foodPartnerId,
      data: submissionData,
      timestamp: new Date().toISOString()
    };

    // Notify the assigned editor
    this.sendToClient(editorId, message);
    
    // Notify the food partner
    this.sendToClient(foodPartnerId, message);
  }

  notifyVideoEditProgress(submissionId, editorId, foodPartnerId, progress, status) {
    const message = {
      type: 'video_edit_progress',
      submissionId,
      editorId,
      foodPartnerId,
      progress,
      status,
      timestamp: new Date().toISOString()
    };

    // Notify the food partner about progress
    this.sendToClient(foodPartnerId, message);
  }

  notifyVideoEditCompleted(submissionId, editorId, foodPartnerId, editedVideoData) {
    const { projectTitle, ...editedVideoFields } = editedVideoData || {};
    const message = {
      type: 'video_edit_completed',
      submissionId,
      editorId,
      foodPartnerId,
      projectTitle,
      editedVideo: editedVideoFields,
      timestamp: new Date().toISOString()
    };

    // Notify the food partner that video is ready
    this.sendToClient(foodPartnerId, message);
    
    // Notify the editor about completion
    this.sendToClient(editorId, message);
  }

  notifyVideoDownloaded(submissionId, foodPartnerId, editorId) {
    const message = {
      type: 'video_downloaded',
      submissionId,
      foodPartnerId,
      editorId,
      timestamp: new Date().toISOString()
    };

    // Notify the editor that video was downloaded
    this.sendToClient(editorId, message);
  }

  // Chat/messaging notifications
  notifyNewMessage(conversationId, messageData, targetUsers = []) {
    const message = {
      type: 'new_message',
      conversationId,
      data: messageData,
      timestamp: new Date().toISOString()
    };

    if (targetUsers.length > 0) {
      targetUsers.forEach(userId => {
        this.sendToClient(userId, message);
      });
    } else {
      this.sendToRoom(`conversation_${conversationId}`, message);
    }
  }

  // System notifications
  notifySystemMessage(userId, message, type = 'info') {
    const notification = {
      type: 'system_notification',
      message,
      notificationType: type,
      timestamp: new Date().toISOString()
    };

    this.sendToClient(userId, notification);
  }

  // Cleanup inactive connections
  cleanupInactiveConnections() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    this.clients.forEach((client, userId) => {
      if (now - client.lastPing > timeout) {
        console.log(`Cleaning up inactive connection: ${userId}`);
        client.ws.terminate();
        this.clients.delete(userId);
      }
    });
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.clients.size,
      totalRooms: this.rooms.size,
      connectionsByType: this.getConnectionsByType()
    };
  }

  getConnectionsByType() {
    const stats = {};
    this.clients.forEach((client) => {
      const userType = client.user.userType;
      stats[userType] = (stats[userType] || 0) + 1;
    });
    return stats;
  }

  // Enhanced connection statistics
  getConnectionStats() {
    return {
      ...this.connectionStats,
      activeConnections: this.clients.size,
      connectedUsers: Array.from(this.clients.values()).map(client => ({
        id: client.user.id,
        userType: client.user.userType,
        connectedAt: client.connectedAt || Date.now(),
        lastPing: client.lastPing
      }))
    };
  }

  // Broadcast system message to all connected clients
  broadcastSystemMessage(message) {
    const systemMessage = {
      type: 'system_message',
      message,
      timestamp: new Date().toISOString()
    };

    for (const [userId, client] of this.clients.entries()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(systemMessage));
      }
    }
  }

  // Get active connections by user type
  getConnectionsByUserType(userType) {
    return Array.from(this.clients.values())
      .filter(client => client.user.userType === userType)
      .map(client => client.user.id);
  }

  // Send maintenance notification
  sendMaintenanceNotification(message, scheduledTime = null) {
    const maintenanceMessage = {
      type: 'maintenance_notification',
      message,
      scheduledTime,
      timestamp: new Date().toISOString()
    };

    this.broadcastSystemMessage(maintenanceMessage);
  }

  // Graceful shutdown
  shutdown() {
    console.log('Shutting down WebSocket server...');
    
    // Notify all clients about shutdown
    this.broadcastSystemMessage('Server is shutting down. Please reconnect in a few minutes.');
    
    // Close all connections
    for (const [userId, client] of this.clients.entries()) {
      client.ws.close(1001, 'Server shutdown');
    }
    
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('WebSocket server shutdown complete');
  }
}

// Export singleton instance
module.exports = new WebSocketService();
