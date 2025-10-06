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
        enum: ['card', 'upi', 'cash', 'wallet', 'cod']
    },
    orderNotes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled', 'rejected'],
        default: 'pending'
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

const OrderModel = mongoose.model('Order', orderSchema);

module.exports = OrderModel;
