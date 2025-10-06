const OrderModel = require('../models/order.model');
const FoodPartnerModel = require('../models/foodPartner.model');
const websocketService = require('../services/websocket.service');

// Create a new order
async function createOrder(req, res) {
    try {
        console.log('Request headers:', req.headers);
        console.log('Request body type:', typeof req.body);
        console.log('Request body keys:', Object.keys(req.body || {}));
        console.log('Order creation request received:', JSON.stringify(req.body, null, 2));
        
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

        // // Log each field individually to see what's missing
        // console.log('Field validation:');
        // console.log('- foodPartnerId:', foodPartnerId);
        // console.log('- customerName:', customerName);
        // console.log('- customerPhone:', customerPhone);
        // console.log('- customerAddress:', JSON.stringify(customerAddress, null, 2));
        // console.log('- items:', JSON.stringify(items, null, 2));
        // console.log('- subtotal:', subtotal);
        // console.log('- deliveryFee:', deliveryFee);
        // console.log('- tax:', tax);
        // console.log('- total:', total);
        // console.log('- paymentMethod:', paymentMethod);
        // console.log('- orderNotes:', orderNotes);

        // console.log('Extracted data:', {
        //     foodPartnerId,
        //     customerName,
        //     customerPhone,
        //     items: items?.length,
        //     subtotal,
        //     total
        // });

        // Validate required fields
        if (!foodPartnerId || !customerName || !customerPhone || !items || !total) {
            console.log('Missing required fields:', {
                foodPartnerId: !!foodPartnerId,
                customerName: !!customerName,
                customerPhone: !!customerPhone,
                items: !!items,
                total: !!total
            });
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

        // Validate ObjectId format
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(foodPartnerId);
        if (!isValidObjectId) {
            console.log('Invalid ObjectId format:', foodPartnerId);
            // If it's not a valid ObjectId, we'll create a default partner
        }

        // Verify food partner exists or create a default one
        console.log('Looking for food partner with ID:', foodPartnerId);
        let foodPartner = await FoodPartnerModel.findById(foodPartnerId);
        
        if (!foodPartner) {
            console.log('Food partner not found for ID:', foodPartnerId);
            
            // Try to find by business name or create a default partner
            const defaultPartner = await FoodPartnerModel.findOne({ email: 'default@restaurant.com' });
            
            if (!defaultPartner) {
                console.log('Creating default food partner...');
                const newDefaultPartner = await FoodPartnerModel.create({
                    businessName: 'Default Restaurant',
                    name: 'Default Owner',
                    email: 'default@restaurant.com',
                    password: 'defaultpassword',
                    address: 'Default Address',
                    phoneNumber: '+91 9876543210',
                    slogan: 'Default Restaurant',
                    totalCustomers: 0,
                    rating: 4.0
                });
                foodPartner = newDefaultPartner;
                console.log('Default food partner created:', foodPartner._id);
            } else {
                foodPartner = defaultPartner;
                console.log('Using existing default food partner:', foodPartner._id);
            }
        } else {
            console.log('Food partner found:', foodPartner.businessName);
        }

        // Generate unique order ID
        const orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

        // Create order
        console.log('Creating order with data:', {
            orderId,
            foodPartnerId,
            customerName,
            items: items.length,
            total
        });
        
        const order = await OrderModel.create({
            orderId,
            foodPartnerId: foodPartner._id, // Use the actual food partner ID
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
        
        console.log('Order created successfully:', order.orderId);

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
        console.error('Error stack:', error.stack);
        
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
        const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled', 'rejected'];
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
        if (status === 'preparing') {
            websocketService.notifyOrderPreparing(
                order._id,
                order.foodPartnerId,
                order.customerName, // Using customer name as ID for now
                order.estimatedTime
            );
        } else if (status === 'ready') {
            websocketService.notifyOrderReady(
                order._id,
                order.foodPartnerId,
                order.customerName,
                {
                    orderId: order.orderId,
                    items: order.items,
                    total: order.total,
                    estimatedTime: order.estimatedTime
                }
            );
        } else if (status === 'completed') {
            websocketService.notifyOrderDelivered(
                order._id,
                null, // deliveryPartnerId - will be set when delivery is assigned
                order.customerName,
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
        const orders = await OrderModel.find({
            $or: [
                { customerName: { $regex: userId, $options: 'i' } },
                { customerPhone: { $regex: userId, $options: 'i' } }
            ]
        })
        .populate('foodPartnerId', 'businessName businessAddress businessPhone')
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

module.exports = {
    createOrder,
    getFoodPartnerOrders,
    updateOrderStatus,
    getOrderById,
    getOrdersByUserId,
    getOrdersByFoodPartnerId,
    getOrderStats
};
