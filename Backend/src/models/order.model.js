const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    foodPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodPartner',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    customerAddress: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        landmark: { type: String },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        type: { type: String, default: 'Home' }
    },
    items: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        description: { type: String }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    deliveryFee: {
        type: Number,
        default: 25
    },
    tax: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['card', 'upi', 'cash', 'wallet', 'cod', 'razorpay']
    },
    orderNotes: {
        type: String,
        default: ''
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pickedUpAt: {
        type: Date
    },
    onTheWayAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled', 'rejected', 'picked_up', 'on_the_way', 'delivered'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    razorpayOrderId: {
        type: String
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String
    },
    estimatedTime: {
        type: Number, // in minutes
        default: 30
    },
    orderTime: {
        type: Date,
        default: Date.now
    },
    completedTime: {
        type: Date
    }
}, {
    timestamps: true
});

// Performance indexes
orderSchema.index({ foodPartnerId: 1, status: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ deliveryPartner: 1, status: 1 });
orderSchema.index({ orderId: 1 }, { unique: true });

const OrderModel = mongoose.model('Order', orderSchema);

module.exports = OrderModel;
