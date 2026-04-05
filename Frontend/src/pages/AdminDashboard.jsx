import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchStats = async () => {
    const res = await fetch(`${API_ENDPOINTS.ADMIN}/stats`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok) setStats(data);
  };

  const fetchUsers = async (p = 1) => {
    const res = await fetch(`${API_ENDPOINTS.ADMIN}/users?page=${p}&limit=15`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok) { setUsers(data.users); setTotalPages(data.pages); }
  };

  useEffect(() => {
    Promise.all([fetchStats(), fetchUsers(page)]).finally(() => setLoading(false));
  }, [page]);

  const updateRole = async (userId, role) => {
    const res = await fetch(`${API_ENDPOINTS.ADMIN}/users/${userId}/role`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (res.ok) { setMsg('Role updated'); fetchUsers(page); setTimeout(() => setMsg(''), 3000); }
  };

  const deactivate = async (userId) => {
    if (!confirm('Deactivate this user?')) return;
    const res = await fetch(`${API_ENDPOINTS.ADMIN}/users/${userId}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { setMsg('User deactivated'); fetchUsers(page); setTimeout(() => setMsg(''), 3000); }
  };

  const s = {
    page: { minHeight: '100vh', background: '#1a1a2e', padding: '24px', color: '#e0e0e0' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { color: '#fff', fontSize: '28px', fontWeight: '700' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { background: '#16213e', borderRadius: '12px', padding: '20px', border: '1px solid #0f3460', textAlign: 'center' },
    statNum: { fontSize: '36px', fontWeight: '700', color: '#667eea' },
    statLabel: { color: '#888', fontSize: '14px', marginTop: '4px' },
    table: { width: '100%', borderCollapse: 'collapse', background: '#16213e', borderRadius: '12px', overflow: 'hidden' },
    th: { padding: '12px 16px', textAlign: 'left', background: '#0f3460', color: '#aaa', fontSize: '12px', textTransform: 'uppercase' },
    td: { padding: '12px 16px', borderBottom: '1px solid #0f3460', fontSize: '14px' },
    select: { background: '#0f3460', border: '1px solid #1a4a8a', borderRadius: '6px', padding: '4px 8px', color: '#e0e0e0', fontSize: '13px' },
    btnDanger: { background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' },
    pagination: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' },
    pageBtn: (active) => ({ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: active ? '#667eea' : '#0f3460', color: '#fff' }),
    msg: { padding: '10px 16px', background: '#1a4731', color: '#68d391', borderRadius: '8px', marginBottom: '16px', border: '1px solid #2f855a' }
  };

  if (loading) return <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Admin Dashboard</h1>
        <button onClick={() => navigate('/login')} style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
      </div>

      {msg && <div style={s.msg}>{msg}</div>}

      {stats && (
        <div style={s.statsGrid}>
          {[['Users', stats.users, '👤'], ['Food Partners', stats.foodPartners, '🍽️'], ['Orders', stats.orders, '📦'], ['Reels', stats.reels, '🎬']].map(([label, val, icon]) => (
            <div key={label} style={s.statCard}>
              <div style={{ fontSize: '28px' }}>{icon}</div>
              <div style={s.statNum}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#16213e', borderRadius: '12px', padding: '20px', border: '1px solid #0f3460' }}>
        <h2 style={{ color: '#fff', marginBottom: '16px' }}>Users</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td style={s.td}>{user.fullName}</td>
                  <td style={s.td}>{user.email}</td>
                  <td style={s.td}>
                    <select style={s.select} value={user.role} onChange={e => updateRole(user._id, e.target.value)}>
                      {['user', 'delivery-partner', 'editor', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={s.td}><span style={{ color: user.isActive !== false ? '#68d391' : '#fc8181' }}>{user.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                  <td style={s.td}>
                    {user.isActive !== false && <button style={s.btnDanger} onClick={() => deactivate(user._id)}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={s.pagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} style={s.pageBtn(p === page)} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
