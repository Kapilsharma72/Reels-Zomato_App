const OrderModel = require('../models/order.model');
const websocketService = require('../services/websocket.service');

// Get available orders for delivery
async function getAvailableOrders(req, res) {
    try {
        const orders = await OrderModel.find({ 
            status: 'ready',
            $or: [
                { deliveryPartner: { $exists: false } },
                { deliveryPartner: null }
            ]
        })
        .populate('foodPartnerId', 'businessName address phoneNumber')
        .sort({ orderTime: -1 })
        .limit(20);

        res.status(200).json({
            success: true,
            message: "Available orders retrieved successfully",
            orders: orders.map(order => ({
                id: order._id,
                orderId: order.orderId,
                foodPartner: order.foodPartnerId,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress,
                items: order.items,
                total: order.total,
                estimatedTime: order.estimatedTime,
                orderTime: order.orderTime,
                orderNotes: order.orderNotes
            }))
        });

    } catch (error) {
        console.error('Error fetching available orders:', error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
}

// Accept an order for delivery
async function acceptOrder(req, res) {
    try {
        const { orderId } = req.params;
        const deliveryPartnerId = req.user._id; // Use _id (ObjectId) not id (string)

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status !== 'ready') {
            return res.status(400).json({ success: false, message: "Order is not ready for delivery" });
        }

        if (order.deliveryPartner) {
            return res.status(400).json({ success: false, message: "Order is already assigned to another delivery partner" });
        }

        order.deliveryPartner = deliveryPartnerId;
        order.status = 'picked_up';
        order.pickedUpAt = new Date();
        await order.save();

        websocketService.notifyOrderPickedUp(
            order._id.toString(),
            deliveryPartnerId.toString(),
            order.customerId ? order.customerId.toString() : null,
            order.foodPartnerId ? order.foodPartnerId.toString() : null
        );

        websocketService.notifyOrderAssigned(
            order._id.toString(),
            deliveryPartnerId.toString(),
            {
                orderId: order.orderId,
                customerName: order.customerName,
                customerAddress: order.customerAddress,
                items: order.items,
                total: order.total,
                foodPartner: order.foodPartnerId
            }
        );

        res.status(200).json({
            success: true,
            message: "Order accepted successfully",
            order: { id: order._id, orderId: order.orderId, status: order.status, pickedUpAt: order.pickedUpAt }
        });

    } catch (error) {
        console.error('Error accepting order:', error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
}

// Update delivery status
async function updateDeliveryStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const deliveryPartnerId = req.user._id; // Use _id (ObjectId)

        const validStatuses = ['picked_up', 'on_the_way', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const order = await OrderModel.findOne({ _id: orderId, deliveryPartner: deliveryPartnerId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
        }

        order.status = status;
        if (status === 'on_the_way') order.onTheWayAt = new Date();
        else if (status === 'delivered') order.deliveredAt = new Date();
        await order.save();

        const customerId = order.customerId ? order.customerId.toString() : null;
        const fpId = order.foodPartnerId ? order.foodPartnerId.toString() : null;
        const dpId = deliveryPartnerId.toString();

        if (status === 'on_the_way') {
            websocketService.notifyOrderOnTheWay(order._id.toString(), dpId, customerId, fpId, order.estimatedTime);
        } else if (status === 'delivered') {
            websocketService.notifyOrderDelivered(order._id.toString(), dpId, customerId, fpId, {
                deliveredAt: order.deliveredAt, total: order.total
            });
        }

        res.status(200).json({
            success: true,
            message: "Delivery status updated successfully",
            order: { id: order._id, orderId: order.orderId, status: order.status, updatedAt: new Date() }
        });

    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
}

// Get delivery partner's assigned orders
async function getDeliveryPartnerOrders(req, res) {
    try {
        const deliveryPartnerId = req.user._id; // Use _id (ObjectId)
        const { status } = req.query;

        const query = { deliveryPartner: deliveryPartnerId };
        if (status) query.status = status;

        const orders = await OrderModel.find(query)
            .populate('foodPartnerId', 'businessName address phoneNumber')
            .sort({ orderTime: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            message: "Delivery orders retrieved successfully",
            orders: orders.map(order => ({
                id: order._id,
                orderId: order.orderId,
                foodPartner: order.foodPartnerId,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress,
                items: order.items,
                total: order.total,
                status: order.status,
                orderTime: order.orderTime,
                pickedUpAt: order.pickedUpAt,
                onTheWayAt: order.onTheWayAt,
                deliveredAt: order.deliveredAt,
                orderNotes: order.orderNotes
            }))
        });

    } catch (error) {
        console.error('Error fetching delivery orders:', error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
}

// Get delivery statistics
async function getDeliveryStats(req, res) {
    try {
        const deliveryPartnerId = req.user._id; // Use _id (ObjectId) for proper MongoDB matching

        const stats = await OrderModel.aggregate([
            { $match: { deliveryPartner: deliveryPartnerId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                    onTheWay: { $sum: { $cond: [{ $eq: ['$status', 'on_the_way'] }, 1, 0] } },
                    pickedUp: { $sum: { $cond: [{ $eq: ['$status', 'picked_up'] }, 1, 0] } },
                    totalEarnings: { $sum: { $multiply: ['$total', 0.1] } }
                }
            }
        ]);

        const result = stats[0] || { total: 0, delivered: 0, onTheWay: 0, pickedUp: 0, totalEarnings: 0 };

        res.status(200).json({
            success: true,
            message: "Delivery statistics retrieved successfully",
            stats: {
                total: result.total,
                delivered: result.delivered,
                onTheWay: result.onTheWay,
                pickedUp: result.pickedUp,
                totalEarnings: Math.round(result.totalEarnings * 100) / 100
            }
        });

    } catch (error) {
        console.error('Error fetching delivery stats:', error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
}

module.exports = {
    getAvailableOrders,
    acceptOrder,
    updateDeliveryStatus,
    getDeliveryPartnerOrders,
    getDeliveryStats
};
