import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const s = {
  container: { background: '#1a1a2e', minHeight: '100vh', padding: '24px', color: '#e0e0e0', fontFamily: 'sans-serif' },
  card: { background: '#16213e', borderRadius: '12px', padding: '24px', marginBottom: '20px', border: '1px solid #0f3460' },
  title: { fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#888', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#667eea', marginBottom: '16px', borderBottom: '1px solid #0f3460', paddingBottom: '8px' },
  row: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' },
  field: { display: 'flex', flexDirection: 'column', flex: '1', minWidth: '200px' },
  label: { fontSize: '12px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { background: '#0f3460', border: '1px solid #1a4a8a', borderRadius: '8px', padding: '10px 14px', color: '#e0e0e0', fontSize: '14px', outline: 'none' },
  btn: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnPrimary: { background: '#667eea', color: '#fff' },
  btnDanger: { background: '#e53e3e', color: '#fff', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px' },
  btnSecondary: { background: '#2d3748', color: '#e0e0e0' },
  msg: (ok) => ({ padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', background: ok ? '#1a4731' : '#4a1a1a', color: ok ? '#68d391' : '#fc8181', border: `1px solid ${ok ? '#2f855a' : '#c53030'}` }),
  addressCard: { background: '#0f3460', borderRadius: '8px', padding: '14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  tag: { display: 'inline-block', background: '#667eea22', color: '#667eea', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', marginBottom: '4px' },
};

const ProfileManagement = () => {
  const [profile, setProfile] = useState({ fullName: '', email: '', phoneNumber: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [addrMsg, setAddrMsg] = useState(null);
  const [newAddr, setNewAddr] = useState({ name: '', phone: '', address: '', landmark: '', city: '', pincode: '', type: 'Home' });
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);

  const authUrl = API_ENDPOINTS.AUTH;

  const flash = (setter, ok, text) => {
    setter({ ok, text });
    setTimeout(() => setter(null), 4000);
  };

  useEffect(() => {
    fetch(`${authUrl}/user/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) setProfile({ fullName: d.user.fullName || '', email: d.user.email || '', phoneNumber: d.user.phoneNumber || '' }); })
      .catch(() => {});

    fetch(`${authUrl}/user/addresses`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.addresses) setAddresses(d.addresses); })
      .catch(() => {});
  }, [authUrl]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const r = await fetch(`${authUrl}/user/profile`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const d = await r.json();
      if (r.ok) { flash(setProfileMsg, true, d.message); if (d.user) setProfile(p => ({ ...p, ...d.user })); }
      else flash(setProfileMsg, false, d.message || 'Update failed');
    } catch { flash(setProfileMsg, false, 'Network error'); }
    setProfileLoading(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    try {
      const r = await fetch(`${authUrl}/user/password`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });
      const d = await r.json();
      if (r.ok) { flash(setPwMsg, true, d.message); setPasswords({ currentPassword: '', newPassword: '' }); }
      else flash(setPwMsg, false, d.message || 'Failed');
    } catch { flash(setPwMsg, false, 'Network error'); }
    setPwLoading(false);
  };

  const addAddress = async (e) => {
    e.preventDefault();
    setAddrLoading(true);
    try {
      const r = await fetch(`${authUrl}/user/addresses`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddr),
      });
      const d = await r.json();
      if (r.ok) {
        setAddresses(prev => [...prev, d.address]);
        setNewAddr({ name: '', phone: '', address: '', landmark: '', city: '', pincode: '', type: 'Home' });
        setShowAddrForm(false);
        flash(setAddrMsg, true, 'Address added');
      } else flash(setAddrMsg, false, d.message || 'Failed');
    } catch { flash(setAddrMsg, false, 'Network error'); }
    setAddrLoading(false);
  };

  const deleteAddress = async (id) => {
    try {
      const r = await fetch(`${authUrl}/user/addresses/${id}`, { method: 'DELETE', credentials: 'include' });
      if (r.ok) setAddresses(prev => prev.filter(a => a._id !== id));
      else flash(setAddrMsg, false, 'Delete failed');
    } catch { flash(setAddrMsg, false, 'Network error'); }
  };

  return (
    <div style={s.container}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={s.title}>My Profile</h1>
        <p style={s.subtitle}>Manage your account details and saved addresses</p>

        {/* Profile Info */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Personal Information</div>
          {profileMsg && <div style={s.msg(profileMsg.ok)}>{profileMsg.text}</div>}
          <form onSubmit={saveProfile}>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                <input style={s.input} value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} placeholder="Your name" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input style={s.input} type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
              </div>
            </div>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Phone Number</label>
                <input style={s.input} value={profile.phoneNumber} onChange={e => setProfile(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
            </div>
            <button type="submit" style={{ ...s.btn, ...s.btnPrimary, marginTop: '8px' }} disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Change Password</div>
          {pwMsg && <div style={s.msg(pwMsg.ok)}>{pwMsg.text}</div>}
          <form onSubmit={changePassword}>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Current Password</label>
                <input style={s.input} type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
              </div>
              <div style={s.field}>
                <label style={s.label}>New Password</label>
                <input style={s.input} type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" style={{ ...s.btn, ...s.btnPrimary, marginTop: '8px' }} disabled={pwLoading}>
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Saved Addresses */}
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={s.sectionTitle}>Saved Addresses</div>
            <button style={{ ...s.btn, ...s.btnPrimary, padding: '8px 16px', fontSize: '13px' }} onClick={() => setShowAddrForm(v => !v)}>
              {showAddrForm ? 'Cancel' : '+ Add Address'}
            </button>
          </div>
          {addrMsg && <div style={s.msg(addrMsg.ok)}>{addrMsg.text}</div>}

          {addresses.length === 0 && !showAddrForm && (
            <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No saved addresses yet.</p>
          )}

          {addresses.map(addr => (
            <div key={addr._id} style={s.addressCard}>
              <div>
                <div style={s.tag}>{addr.type}</div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>{addr.name} · {addr.phone}</div>
                <div style={{ fontSize: '13px', color: '#aaa', marginTop: '2px' }}>{addr.address}{addr.landmark ? `, ${addr.landmark}` : ''}</div>
                <div style={{ fontSize: '13px', color: '#aaa' }}>{addr.city} — {addr.pincode}</div>
              </div>
              <button style={s.btnDanger} onClick={() => deleteAddress(addr._id)}>Remove</button>
            </div>
          ))}

          {showAddrForm && (
            <form onSubmit={addAddress} style={{ marginTop: '16px', background: '#0a2040', borderRadius: '8px', padding: '16px' }}>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Name *</label>
                  <input style={s.input} value={newAddr.name} onChange={e => setNewAddr(p => ({ ...p, name: e.target.value }))} placeholder="Recipient name" required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Phone *</label>
                  <input style={s.input} value={newAddr.phone} onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" required />
                </div>
              </div>
              <div style={s.row}>
                <div style={{ ...s.field, minWidth: '100%' }}>
                  <label style={s.label}>Address *</label>
                  <input style={s.input} value={newAddr.address} onChange={e => setNewAddr(p => ({ ...p, address: e.target.value }))} placeholder="Street address" required />
                </div>
              </div>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Landmark</label>
                  <input style={s.input} value={newAddr.landmark} onChange={e => setNewAddr(p => ({ ...p, landmark: e.target.value }))} placeholder="Near..." />
                </div>
                <div style={s.field}>
                  <label style={s.label}>City *</label>
                  <input style={s.input} value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} placeholder="City" required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Pincode *</label>
                  <input style={s.input} value={newAddr.pincode} onChange={e => setNewAddr(p => ({ ...p, pincode: e.target.value }))} placeholder="000000" required />
                </div>
              </div>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Type</label>
                  <select style={s.input} value={newAddr.type} onChange={e => setNewAddr(p => ({ ...p, type: e.target.value }))}>
                    <option>Home</option>
                    <option>Work</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <button type="submit" style={{ ...s.btn, ...s.btnPrimary }} disabled={addrLoading}>
                {addrLoading ? 'Adding...' : 'Add Address'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
