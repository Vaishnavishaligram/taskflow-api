import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (tab === 'users') loadUsers(); if (tab === 'tasks') loadTasks(); }, [tab]);

  const loadStats = async () => { try { const { data } = await adminAPI.getStats(); setStats(data.data); } catch (_) {} };
  const loadUsers = async () => { setLoading(true); try { const { data } = await adminAPI.getUsers({ limit: 50 }); setUsers(data.data); } catch (_) {} finally { setLoading(false); } };
  const loadTasks = async () => { setLoading(true); try { const { data } = await adminAPI.getAllTasks({ limit: 50 }); setAllTasks(data.data); } catch (_) {} finally { setLoading(false); } };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await adminAPI.updateUser(userId, { isActive: !isActive });
      setUsers(u => u.map(user => user._id === userId ? { ...user, isActive: !isActive } : user));
      showToast(`User ${isActive ? 'deactivated' : 'activated'}`);
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const promoteUser = async (userId, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      setUsers(u => u.map(user => user._id === userId ? { ...user, role: newRole } : user));
      showToast(`User role changed to ${newRole}`);
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all their tasks?')) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(u => u.filter(user => user._id !== userId));
      showToast('User deleted');
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const tabs = ['stats', 'users', 'tasks'];

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999 }}>
          <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`} style={{ margin: 0, minWidth: 240 }}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Admin Panel ⚡</h1>
        <p className="page-subtitle">Manage users, tasks, and platform settings</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {tabs.map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value accent">{stats.users?.total}</div></div>
            <div className="stat-card"><div className="stat-label">Active Users</div><div className="stat-value success">{stats.users?.active}</div></div>
            <div className="stat-card"><div className="stat-label">Admins</div><div className="stat-value warning">{stats.users?.admins}</div></div>
            <div className="stat-card"><div className="stat-label">Total Tasks</div><div className="stat-value">{stats.tasks?.total}</div></div>
            <div className="stat-card"><div className="stat-label">Tasks Done</div><div className="stat-value success">{stats.tasks?.byStatus?.done || 0}</div></div>
            <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value warning">{stats.tasks?.byStatus?.['in-progress'] || 0}</div></div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div className="section-title">All Users ({users.length})</div>
          {loading ? <div className="spinner" style={{ margin: '20px auto' }} /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td style={{ color: 'var(--text)', fontWeight: 500 }}>{user.name}</td>
                      <td>{user.email}</td>
                      <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-done' : 'badge-todo'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => promoteUser(user._id, user.role)}>
                            {user.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => toggleUserStatus(user._id, user.isActive)}>
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteUser(user._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">No users found</div></div>}
            </div>
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="card">
          <div className="section-title">All Tasks ({allTasks.length})</div>
          {loading ? <div className="spinner" style={{ margin: '20px auto' }} /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Title</th><th>Owner</th><th>Status</th><th>Priority</th><th>Created</th></tr>
                </thead>
                <tbody>
                  {allTasks.map(task => (
                    <tr key={task._id}>
                      <td style={{ color: 'var(--text)', fontWeight: 500 }}>{task.title}</td>
                      <td>{task.owner?.name || 'Unknown'}</td>
                      <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allTasks.length === 0 && <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No tasks found</div></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
