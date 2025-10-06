const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authUserMiddleware);

// Get available orders for delivery
router.get('/available-orders', deliveryController.getAvailableOrders);

// Accept an order for delivery
router.post('/accept-order/:orderId', deliveryController.acceptOrder);

// Update delivery status
router.put('/update-status/:orderId', deliveryController.updateDeliveryStatus);

// Get delivery partner's orders
router.get('/my-orders', deliveryController.getDeliveryPartnerOrders);

// Get delivery statistics
router.get('/stats', deliveryController.getDeliveryStats);

module.exports = router;
