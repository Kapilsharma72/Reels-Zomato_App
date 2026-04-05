const OrderModel = require('../models/order.model');
const FoodPartnerModel = require('../models/foodPartner.model');
const websocketService = require('../services/websocket.service');

// Create a new order
async function createOrder(req, res) {
    try {
        const {
            foodPartnerId,
            customerName,
            customerPhone,
            customerAddress,
            items,
            subtotal,
            deliveryFee,
            tax,
            total,
            paymentMethod,
            orderNotes
        } = req.body;

        // Validate required fields
        if (!foodPartnerId || !customerName || !customerPhone || !items || !total) {
            return res.status(400).json({
                message: "Missing required fields",
                details: {
                    foodPartnerId: !!foodPartnerId,
                    customerName: !!customerName,
                    customerPhone: !!customerPhone,
                    items: !!items,
                    total: !!total
                }
            });
        }

        // Verify food partner exists
        const foodPartner = await FoodPartnerModel.findById(foodPartnerId);
        if (!foodPartner) {
            return res.status(400).json({ message: 'Food partner not found' });
        }

        // Generate unique order ID
        const orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

        // Create order
        const order = await OrderModel.create({
            orderId,
            foodPartnerId: foodPartner._id, // Use the actual food partner ID
            customerId: req.user._id,
            customerName,
            customerPhone,
            customerAddress,
            items,
            subtotal,
            deliveryFee: deliveryFee || 25,
            tax,
            total,
            paymentMethod,
            orderNotes: orderNotes || '',
            status: 'pending',
            estimatedTime: 30
        });

        // Send real-time notification to food partner
        websocketService.notifyNewOrder({
            id: order._id,
            orderId: order.orderId,
            foodPartnerId: order.foodPartnerId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress,
            items: order.items,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            tax: order.tax,
            total: order.total,
            paymentMethod: order.paymentMethod,
            orderNotes: order.orderNotes,
            status: order.status,
            estimatedTime: order.estimatedTime,
            orderTime: order.orderTime
        }, foodPartner._id);

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: {
                id: order._id,
                orderId: order.orderId,
                foodPartnerId: order.foodPartnerId,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress,
                items: order.items,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                tax: order.tax,
                total: order.total,
                paymentMethod: order.paymentMethod,
                orderNotes: order.orderNotes,
                status: order.status,
                estimatedTime: order.estimatedTime,
                orderTime: order.orderTime
            }
        });

    } catch (error) {
        console.error('Error creating order:', error);
        
        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message,
                value: err.value
            }));
            console.error('Validation errors:', validationErrors);
            return res.status(400).json({
                message: "Order validation failed",
                error: validationErrors.map(err => `${err.field}: ${err.message}`).join(', '),
                details: validationErrors
            });
        }
        
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

// Get orders for a specific food partner
async function getFoodPartnerOrders(req, res) {
    try {
        const foodPartnerId = req.foodPartner._id;
        
        const orders = await OrderModel.find({ foodPartnerId })
            .sort({ orderTime: -1 })
            .limit(50); // Limit to last 50 orders

        res.status(200).json({
            message: "Orders retrieved successfully",
            orders: orders.map(order => ({
                id: order._id,
                orderId: order.orderId,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress,
                items: order.items,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                tax: order.tax,
                total: order.total,
                paymentMethod: order.paymentMethod,
                orderNotes: order.orderNotes,
                status: order.status,
                estimatedTime: order.estimatedTime,
                orderTime: order.orderTime,
                completedTime: order.completedTime
            }))
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

// Update order status
async function updateOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const foodPartnerId = req.foodPartner._id;

        // Validate status
        const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled', 'rejected', 'picked_up', 'on_the_way', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        // Find and update order
        const order = await OrderModel.findOneAndUpdate(
            { _id: orderId, foodPartnerId },
            { 
                status,
                completedTime: status === 'completed' ? new Date() : undefined
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Send real-time notification about order status update
        websocketService.notifyOrderUpdate(order._id, {
            id: order._id,
            orderId: order.orderId,
            status: order.status,
            completedTime: order.completedTime,
            foodPartnerId: order.foodPartnerId
        });

        // Send specific notifications based on status
        const customerId = order.customerId ? order.customerId.toString() : null;
        if (status === 'preparing') {
            websocketService.notifyOrderPreparing(
                order._id,
                order.foodPartnerId,
                customerId,
                order.estimatedTime
            );
        } else if (status === 'ready') {
            websocketService.notifyOrderReady(
                order._id,
                order.foodPartnerId,
                customerId,
                {
                    orderId: order.orderId,
                    items: order.items,
                    total: order.total,
                    estimatedTime: order.estimatedTime
                }
            );
        } else if (status === 'picked_up') {
            websocketService.notifyOrderPickedUp(
                order._id,
                order.deliveryPartner ? order.deliveryPartner.toString() : null,
                customerId,
                order.foodPartnerId
            );
        } else if (status === 'on_the_way') {
            websocketService.notifyOrderOnTheWay(
                order._id,
                order.deliveryPartner ? order.deliveryPartner.toString() : null,
                customerId,
                order.foodPartnerId,
                order.estimatedTime
            );
        } else if (status === 'delivered' || status === 'completed') {
            websocketService.notifyOrderDelivered(
                order._id,
                order.deliveryPartner ? order.deliveryPartner.toString() : null,
                customerId,
                order.foodPartnerId,
                {
                    completedTime: order.completedTime,
                    total: order.total
                }
            );
        }

        res.status(200).json({
            message: "Order status updated successfully",
            order: {
                id: order._id,
                orderId: order.orderId,
                status: order.status,
                completedTime: order.completedTime
            }
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

// Get order by ID (public endpoint for order tracking)
async function getOrderById(req, res) {
    try {
        const { orderId } = req.params;
        
        const order = await OrderModel.findOne({ orderId })
            .populate('foodPartnerId', 'businessName businessAddress businessPhone');

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Order retrieved successfully",
            order: {
                id: order._id,
                orderId: order.orderId,
                foodPartner: order.foodPartnerId,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress,
                items: order.items,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                tax: order.tax,
                total: order.total,
                paymentMethod: order.paymentMethod,
                orderNotes: order.orderNotes,
                status: order.status,
                estimatedTime: order.estimatedTime,
                orderTime: order.orderTime,
                completedTime: order.completedTime
            }
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

// Get orders by user ID (public endpoint for user order history)
async function getOrdersByUserId(req, res) {
    try {
        const { userId } = req.params;
        
        // For now, we'll get orders by customer name or phone since we don't have user IDs
        // In a real app, you'd have a proper user system with user IDs
        const orders = await OrderModel.find({ customerId: userId })
            .populate('foodPartnerId', 'businessName')
            .sort({ orderTime: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            message: "Orders retrieved successfully",
            data: orders.map(order => ({
                id: order._id,
                orderId: order.orderId,
                restaurant: order.foodPartnerId?.businessName || 'Restaurant',
                foodPartner: order.foodPartnerId,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress,
                items: order.items,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                tax: order.tax,
                total: order.total,
                totalAmount: order.total,
                paymentMethod: order.paymentMethod,
                orderNotes: order.orderNotes,
                status: order.status,
                estimatedTime: order.estimatedTime,
                orderTime: order.orderTime,
                createdAt: order.orderTime,
                completedTime: order.completedTime
            }))
        });

    } catch (error) {
        console.error('Error fetching orders by user ID:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

// Get orders by food partner ID (public endpoint for specific food partner)
async function getOrdersByFoodPartnerId(req, res) {
    try {
        const { foodPartnerId } = req.params;
        
        const orders = await OrderModel.find({ foodPartnerId })
            .populate('foodPartnerId', 'businessName businessAddress businessPhone')
            .sort({ orderTime: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            message: "Orders retrieved successfully",
            data: orders.map(order => ({
                id: order._id,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress,
                items: order.items,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                tax: order.tax,
                total: order.total,
                status: order.status,
                orderTime: order.orderTime,
                estimatedDeliveryTime: order.estimatedDeliveryTime,
                foodPartner: order.foodPartnerId,
                paymentMethod: order.paymentMethod,
                orderNotes: order.orderNotes
            }))
        });
    } catch (error) {
        console.error('Error fetching orders by food partner ID:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching orders",
            error: error.message
        });
    }
}

// Get order statistics for food partner
async function getOrderStats(req, res) {
    try {
        const foodPartnerId = req.foodPartner._id;

        const stats = await OrderModel.aggregate([
            { $match: { foodPartnerId: foodPartnerId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    preparing: { $sum: { $cond: [{ $eq: ['$status', 'preparing'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    totalRevenue: { $sum: '$total' }
                }
            }
        ]);

        const result = stats[0] || { total: 0, pending: 0, preparing: 0, completed: 0, totalRevenue: 0 };

        res.status(200).json({
            message: "Order statistics retrieved successfully",
            stats: {
                total: result.total,
                pending: result.pending,
                preparing: result.preparing,
                completed: result.completed,
                totalRevenue: result.totalRevenue
            }
        });

    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

async function rateOrder(req, res) {
    try {
        const { orderId } = req.params;
        const { rating, review } = req.body;
        const userId = req.user._id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const order = await OrderModel.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.status !== 'delivered' && order.status !== 'completed') {
            return res.status(403).json({ message: 'Can only rate delivered orders' });
        }

        if (!order.customerId || order.customerId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to rate this order' });
        }

        if (order.rating) {
            return res.status(409).json({ message: 'Order already rated' });
        }

        order.rating = rating;
        order.review = review || '';
        await order.save();

        // Update food partner rolling average rating
        const partner = await FoodPartnerModel.findById(order.foodPartnerId);
        if (partner) {
            const newRating = ((partner.rating * partner.ratingCount) + rating) / (partner.ratingCount + 1);
            await FoodPartnerModel.findByIdAndUpdate(order.foodPartnerId, {
                rating: Math.round(newRating * 10) / 10,
                $inc: { ratingCount: 1 }
            });
        }

        res.json({ message: 'Rating submitted successfully', newPartnerRating: partner ? Math.round(((partner.rating * partner.ratingCount) + rating) / (partner.ratingCount + 1) * 10) / 10 : null });
    } catch (error) {
        console.error('Error rating order:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

module.exports = {
    createOrder,
    getFoodPartnerOrders,
    updateOrderStatus,
    getOrderById,
    getOrdersByUserId,
    getOrdersByFoodPartnerId,
    getOrderStats,
    rateOrder
};
