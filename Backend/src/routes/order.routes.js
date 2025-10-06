const express = require('express');
const orderController = require('../controllers/order.controller');
const { authFoodPartnerMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Create order (public endpoint - called from frontend)
router.post('/create', orderController.createOrder);

// Get order statistics (protected) - must come before /:orderId
router.get('/stats', authFoodPartnerMiddleware, orderController.getOrderStats);

// Get orders for food partner (protected) - must come before /:orderId
router.get('/foodpartner', authFoodPartnerMiddleware, orderController.getFoodPartnerOrders);

// Get orders by food partner ID (public endpoint for specific food partner)
router.get('/foodpartner/:foodPartnerId', orderController.getOrdersByFoodPartnerId);

// Get orders by user ID (public endpoint for user order history)
router.get('/user/:userId', orderController.getOrdersByUserId);

// Get order by ID (public endpoint for order tracking) - must come last
router.get('/:orderId', orderController.getOrderById);

// Update order status (protected)
router.put('/:orderId/status', authFoodPartnerMiddleware, orderController.updateOrderStatus);

module.exports = router;
