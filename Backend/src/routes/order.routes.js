const express = require('express');
const orderController = require('../controllers/order.controller');
const paymentController = require('../controllers/payment.controller');
const { authFoodPartnerMiddleware, authUserMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Create order (protected - requires user auth)
router.post('/create', authUserMiddleware, orderController.createOrder);

// Payment routes (protected - requires user auth)
router.post('/create-payment', authUserMiddleware, paymentController.createPaymentOrder);
router.post('/verify-payment', authUserMiddleware, paymentController.verifyPayment);

// Get order statistics (protected) - must come before /:orderId
router.get('/stats', authFoodPartnerMiddleware, orderController.getOrderStats);

// Get orders for food partner (protected) - must come before /:orderId
router.get('/foodpartner', authFoodPartnerMiddleware, orderController.getFoodPartnerOrders);

// Get orders by food partner ID (public endpoint for specific food partner)
router.get('/foodpartner/:foodPartnerId', orderController.getOrdersByFoodPartnerId);

// Get orders by user ID (public endpoint for user order history)
router.get('/user/:userId', orderController.getOrdersByUserId);

// Rate an order (protected - requires user auth) - must come before /:orderId
router.post('/:orderId/rate', authUserMiddleware, orderController.rateOrder);

// Get order by ID (public endpoint for order tracking) - must come last
router.get('/:orderId', orderController.getOrderById);

// Update order status (protected)
router.put('/:orderId/status', authFoodPartnerMiddleware, orderController.updateOrderStatus);

module.exports = router;
