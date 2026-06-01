import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminAPI.getUsers({ page, limit: 10, search }),
        adminAPI.getStats(),
      ]);
      setUsers(usersRes.data.data);
      setMeta(usersRes.data.meta);
      setStats(statsRes.data.data);
    } catch {
      toast.error('Failed to load admin data');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search]);

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUser(user._id, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const toggleActive = async (user) => {
    try {
      await adminAPI.updateUser(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete user and all their tasks?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>Admin Panel</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>Manage users and view system metrics</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 28 }}>
          {[
            { label: 'TOTAL USERS', value: stats.users?.total, color: '#6ee7b7' },
            { label: 'ACTIVE', value: stats.users?.active, color: '#60a5fa' },
            { label: 'TOTAL TASKS', value: stats.tasks?.total, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#111827', border: '1px solid #1e293b',
              borderRadius: 10, padding: '16px 18px',
            }}>
              <div style={{ fontSize: 10, color: '#475569', fontFamily: 'Space Mono, monospace', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Space Mono, monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Search users by name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 340 }}
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ color: '#475569', padding: 32, textAlign: 'center' }}>Loading...</div>
      ) : (
        <div style={{
          background: '#111827', border: '1px solid #1e293b',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.5fr 80px 70px 80px 100px',
            padding: '10px 18px',
            background: '#0d1424',
            fontSize: 10, color: '#475569', fontFamily: 'Space Mono, monospace',
            borderBottom: '1px solid #1e293b',
          }}>
            <span>NAME</span><span>EMAIL</span><span>ROLE</span><span>STATUS</span><span>TASKS</span><span>ACTIONS</span>
          </div>

          {users.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 14 }}>No users found</div>
          ) : users.map((user, i) => (
            <div key={user._id} style={{
              display: 'grid', gridTemplateColumns: '1fr 1.5fr 80px 70px 80px 100px',
              padding: '13px 18px', fontSize: 13,
              alignItems: 'center',
              borderBottom: i < users.length - 1 ? '1px solid #0f1825' : 'none',
              transition: 'background 0.1s',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#0d1424'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <span style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                {user.email}
              </span>
              <button onClick={() => toggleRole(user)} style={{
                padding: '2px 8px', borderRadius: 4, border: 'none',
                background: user.role === 'admin' ? 'rgba(251,191,36,0.15)' : 'rgba(110,231,183,0.1)',
                color: user.role === 'admin' ? '#fbbf24' : '#6ee7b7',
                fontSize: 10, fontFamily: 'Space Mono, monospace',
                cursor: 'pointer',
              }}>
                {user.role?.toUpperCase()}
              </button>
              <button onClick={() => toggleActive(user)} style={{
                padding: '2px 8px', borderRadius: 4, border: 'none',
                background: user.isActive ? 'rgba(110,231,183,0.08)' : 'rgba(248,113,113,0.1)',
                color: user.isActive ? '#6ee7b7' : '#f87171',
                fontSize: 10, fontFamily: 'Space Mono, monospace',
                cursor: 'pointer',
              }}>
                {user.isActive ? 'ACTIVE' : 'OFF'}
              </button>
              <span style={{ color: '#475569', fontFamily: 'Space Mono, monospace', fontSize: 12 }}>
                {user.taskCount ?? '—'}
              </span>
              <button onClick={() => deleteUser(user._id)} style={{
                padding: '4px 10px', background: 'transparent',
                border: '1px solid #1e293b', borderRadius: 5,
                color: '#94a3b8', fontSize: 11, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: 32, height: 32, borderRadius: 6, border: '1px solid',
              borderColor: page === p ? '#6ee7b7' : '#1e293b',
              background: page === p ? 'rgba(110,231,183,0.1)' : 'transparent',
              color: page === p ? '#6ee7b7' : '#94a3b8',
              fontSize: 13, cursor: 'pointer',
            }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
