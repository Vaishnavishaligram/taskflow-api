import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, adminAPI } from '../services/api';

const StatCard = ({ label, value, color = '#6ee7b7', sub }) => (
  <div style={{
    background: '#111827', border: '1px solid #1e293b',
    borderRadius: 12, padding: '20px 24px',
  }}>
    <div style={{ fontSize: 12, color: '#475569', fontFamily: 'Space Mono, monospace', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: 'Space Mono, monospace' }}>{value ?? '—'}</div>
    {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tasksRes] = await Promise.all([
          tasksAPI.getAll({ limit: 5, sort: '-createdAt' }),
        ]);
        setRecentTasks(tasksRes.data.data);

        if (user?.role === 'admin') {
          const [statsRes, adminRes] = await Promise.all([
            tasksAPI.getStats(),
            adminAPI.getStats(),
          ]);
          setStats(statsRes.data.data);
          setAdminStats(adminRes.data.data);
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [user]);

  const statusColor = { todo: '#60a5fa', 'in-progress': '#fbbf24', done: '#6ee7b7' };
  const priorityColor = { low: '#64748b', medium: '#fbbf24', high: '#f87171' };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'Space Mono, monospace', color: '#f1f5f9' }}>
          Welcome, {user?.name?.split(' ')[0]} ↗
        </h1>
        <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          {' · '}
          <span style={{
            color: user?.role === 'admin' ? '#fbbf24' : '#6ee7b7',
            fontFamily: 'Space Mono, monospace', fontSize: 11,
          }}>
            {user?.role?.toUpperCase()}
          </span>
        </p>
      </div>

      {/* Admin Stats */}
      {user?.role === 'admin' && adminStats && (
        <>
          <div style={{ marginBottom: 12, fontSize: 11, color: '#475569', fontFamily: 'Space Mono, monospace' }}>
            SYSTEM OVERVIEW
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
            <StatCard label="TOTAL USERS" value={adminStats.users?.total} />
            <StatCard label="ACTIVE USERS" value={adminStats.users?.active} color="#60a5fa" />
            <StatCard label="TOTAL TASKS" value={adminStats.tasks?.total} color="#a78bfa" />
            {adminStats.tasks?.byStatus?.map(s => (
              <StatCard key={s._id} label={s._id?.toUpperCase()} value={s.count} color={statusColor[s._id]} />
            ))}
          </div>
        </>
      )}

      {/* Task Stats for admin */}
      {stats && (
        <>
          <div style={{ marginBottom: 12, fontSize: 11, color: '#475569', fontFamily: 'Space Mono, monospace' }}>
            TASK METRICS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
            <StatCard label="TOTAL TASKS" value={stats.totalTasks} />
            <StatCard label="OVERDUE" value={stats.overdueTasks} color="#f87171" />
            {stats.stats?.map(s => (
              <StatCard key={s._id} label={s._id?.toUpperCase()} value={s.count} color={statusColor[s._id]}
                sub={`${s.highPriority} high priority`} />
            ))}
          </div>
        </>
      )}

      {/* Recent Tasks */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#475569', fontFamily: 'Space Mono, monospace' }}>RECENT TASKS</span>
        <Link to="/tasks" style={{ fontSize: 12, color: '#6ee7b7' }}>View all →</Link>
      </div>

      {loading ? (
        <div style={{ color: '#475569', fontSize: 14 }}>Loading...</div>
      ) : recentTasks.length === 0 ? (
        <div style={{
          background: '#111827', border: '1px dashed #1e293b',
          borderRadius: 12, padding: 32, textAlign: 'center',
          color: '#475569', fontSize: 14,
        }}>
          No tasks yet.{' '}
          <Link to="/tasks" style={{ color: '#6ee7b7' }}>Create your first task →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentTasks.map(task => (
            <div key={task._id} style={{
              background: '#111827', border: '1px solid #1e293b',
              borderRadius: 10, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: statusColor[task.status], flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </div>
                {task.dueDate && (
                  <div style={{ fontSize: 11, color: task.isOverdue ? '#f87171' : '#475569', marginTop: 2 }}>
                    Due {new Date(task.dueDate).toLocaleDateString()}
                    {task.isOverdue && ' · OVERDUE'}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                background: `${priorityColor[task.priority]}20`,
                color: priorityColor[task.priority],
                fontFamily: 'Space Mono, monospace', flexShrink: 0,
              }}>
                {task.priority?.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
