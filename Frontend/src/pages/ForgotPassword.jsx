import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_ENDPOINTS.AUTH}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.message || 'If that email exists, a reset link has been sent');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: { minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { background: '#16213e', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '100%', border: '1px solid #0f3460' },
    title: { color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '8px' },
    subtitle: { color: '#888', fontSize: '14px', marginBottom: '24px' },
    label: { display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase' },
    input: { width: '100%', background: '#0f3460', border: '1px solid #1a4a8a', borderRadius: '8px', padding: '12px 14px', color: '#e0e0e0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '12px', background: '#667eea', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' },
    msg: (ok) => ({ padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', background: ok ? '#1a4731' : '#4a1a1a', color: ok ? '#68d391' : '#fc8181', border: `1px solid ${ok ? '#2f855a' : '#c53030'}` }),
    link: { color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', marginTop: '16px', display: 'block', textAlign: 'center' }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '32px' }}>🍽️</div>
          <div style={{ color: '#667eea', fontWeight: '700', fontSize: '18px' }}>ReelZomato</div>
        </div>
        <h1 style={s.title}>Forgot Password</h1>
        <p style={s.subtitle}>Enter your email and we'll send you a reset link.</p>
        {message && <div style={s.msg(true)}>{message}</div>}
        {error && <div style={s.msg(false)}>{error}</div>}
        {!message && (
          <form onSubmit={handleSubmit}>
            <label style={s.label}>Email Address</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            <button type="submit" style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <button style={s.link} onClick={() => navigate('/login')}>← Back to Login</button>
      </div>
    </div>
  );
};

export default ForgotPassword;
