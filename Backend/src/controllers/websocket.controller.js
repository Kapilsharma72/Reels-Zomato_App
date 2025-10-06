const websocketService = require('../services/websocket.service');

// Get WebSocket connection statistics
async function getWebSocketStats(req, res) {
    try {
        const stats = websocketService.getConnectionStats();
        
        res.status(200).json({
            success: true,
            message: "WebSocket statistics retrieved successfully",
            stats
        });
    } catch (error) {
        console.error('Error fetching WebSocket stats:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// Get connections by user type
async function getConnectionsByUserType(req, res) {
    try {
        const { userType } = req.params;
        
        if (!userType) {
            return res.status(400).json({
                success: false,
                message: "User type is required"
            });
        }

        const connections = websocketService.getConnectionsByUserType(userType);
        
        res.status(200).json({
            success: true,
            message: `Connections for user type ${userType} retrieved successfully`,
            userType,
            connections,
            count: connections.length
        });
    } catch (error) {
        console.error('Error fetching connections by user type:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// Send system message to all connected clients
async function broadcastSystemMessage(req, res) {
    try {
        const { message, userType } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        if (userType) {
            // Send to specific user type
            const connections = websocketService.getConnectionsByUserType(userType);
            connections.forEach(userId => {
                websocketService.sendToClient(userId, {
                    type: 'system_message',
                    message,
                    timestamp: new Date().toISOString()
                });
            });
        } else {
            // Broadcast to all clients
            websocketService.broadcastSystemMessage(message);
        }
        
        res.status(200).json({
            success: true,
            message: "System message sent successfully",
            target: userType || 'all',
            message
        });
    } catch (error) {
        console.error('Error sending system message:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// Send maintenance notification
async function sendMaintenanceNotification(req, res) {
    try {
        const { message, scheduledTime } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        websocketService.sendMaintenanceNotification(message, scheduledTime);
        
        res.status(200).json({
            success: true,
            message: "Maintenance notification sent successfully",
            message,
            scheduledTime
        });
    } catch (error) {
        console.error('Error sending maintenance notification:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// Test WebSocket connection
async function testWebSocketConnection(req, res) {
    try {
        const { userId, message } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const testMessage = message || 'Test message from server';
        
        websocketService.sendToClient(userId, {
            type: 'test_message',
            message: testMessage,
            timestamp: new Date().toISOString()
        });
        
        res.status(200).json({
            success: true,
            message: "Test message sent successfully",
            userId,
            message: testMessage
        });
    } catch (error) {
        console.error('Error sending test message:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = {
    getWebSocketStats,
    getConnectionsByUserType,
    broadcastSystemMessage,
    sendMaintenanceNotification,
    testWebSocketConnection
};
