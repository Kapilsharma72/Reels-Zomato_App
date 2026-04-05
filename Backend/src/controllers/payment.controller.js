const OrderModel = require('../models/order.model');
const { instance: razorpay, verifySignature } = require('../services/razorpay.service');

async function createPaymentOrder(req, res) {
  try {
    const { amount, orderId } = req.body;
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }
    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };
    const razorpayOrder = await razorpay.orders.create(options);
    if (orderId) {
      await OrderModel.findByIdAndUpdate(orderId, { razorpayOrderId: razorpayOrder.id });
    }
    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order', error: error.message });
  }
}

async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
    let order = null;
    if (orderId) {
      order = await OrderModel.findByIdAndUpdate(
        orderId,
        { paymentStatus: 'paid', paymentMethod: 'razorpay' },
        { new: true }
      );
    }
    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: order ? { id: order._id, paymentStatus: order.paymentStatus } : null
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

module.exports = { createPaymentOrder, verifyPayment };
