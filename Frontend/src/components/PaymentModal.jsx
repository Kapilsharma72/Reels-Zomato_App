import { useState } from 'react';
import { FaTimes, FaLock, FaCreditCard } from 'react-icons/fa';
import orderService from '../services/orderService';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentModal = ({ orderId, amount, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment gateway. Please check your internet connection.');
        setLoading(false);
        return;
      }

      const paymentOrder = await orderService.createPayment(amount, orderId);

      if (!paymentOrder.orderId) {
        setError(paymentOrder.message || 'Failed to initiate payment');
        setLoading(false);
        return;
      }

      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'ReelZomato',
        description: 'Food Order Payment',
        order_id: paymentOrder.orderId,
        handler: async (response) => {
          try {
            await orderService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            onSuccess();
          } catch {
            setError('Payment verification failed. Please contact support.');
          }
        },
        theme: { color: '#FF6B35' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onClose?.();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--primary-glow)',
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--primary)', fontSize: '1rem'
            }}>
              <FaCreditCard />
            </div>
            <h2 style={{ fontSize: '1.1rem' }}>Complete Payment</h2>
          </div>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="modal-body">
          {/* Amount Summary */}
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
            padding: '16px', marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Order Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payment via</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>Razorpay</span>
            </div>
          </div>

          {/* Secure badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: 'var(--success-bg)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 'var(--radius-md)', marginBottom: '16px'
          }}>
            <FaLock style={{ color: 'var(--success)', fontSize: '0.85rem' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
              Secured by Razorpay — UPI, Cards, Wallets supported
            </span>
          </div>

          {error && (
            <div style={{
              background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
              color: 'var(--error)', fontSize: '0.82rem', marginBottom: '16px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              {loading ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                <>Pay ₹{amount}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
