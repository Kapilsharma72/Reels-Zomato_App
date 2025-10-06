const express = require('express');
const router = express.Router();
const websocketController = require('../controllers/websocket.controller');

// Get WebSocket connection statistics
router.get('/stats', websocketController.getWebSocketStats);

// Get connections by user type
router.get('/connections/:userType', websocketController.getConnectionsByUserType);

// Send system message to all connected clients
router.post('/broadcast', websocketController.broadcastSystemMessage);

// Send maintenance notification
router.post('/maintenance', websocketController.sendMaintenanceNotification);

// Test WebSocket connection
router.post('/test', websocketController.testWebSocketConnection);

module.exports = router;
