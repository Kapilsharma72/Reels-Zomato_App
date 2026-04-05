import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.AUTH}/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Password reset successfully');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.message || 'Reset failed');
      }
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
    input: { width: '100%', background: '#0f3460', border: '1px solid #1a4a8a', borderRadius: '8px', padding: '12px 14px', color: '#e0e0e0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' },
    btn: { width: '100%', padding: '12px', background: '#667eea', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
    msg: (ok) => ({ padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', background: ok ? '#1a4731' : '#4a1a1a', color: ok ? '#68d391' : '#fc8181', border: `1px solid ${ok ? '#2f855a' : '#c53030'}` })
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '32px' }}>🍽️</div>
          <div style={{ color: '#667eea', fontWeight: '700', fontSize: '18px' }}>ReelZomato</div>
        </div>
        <h1 style={s.title}>Reset Password</h1>
        <p style={s.subtitle}>Enter your new password below.</p>
        {message && <div style={s.msg(true)}>{message}</div>}
        {error && <div style={s.msg(false)}>{error}</div>}
        {!message && (
          <form onSubmit={handleSubmit}>
            <label style={s.label}>New Password</label>
            <input style={s.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required />
            <label style={s.label}>Confirm Password</label>
            <input style={s.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
            <button type="submit" style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
