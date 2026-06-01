import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import TaskModal from '../components/TaskModal';

const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>{status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
);
const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
);

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, stats, loading, error, meta, fetchTasks, fetchStats, createTask, updateTask, deleteTask } = useTasks();
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    const params = { page: filters.page, limit: 8 };
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.search) params.search = filters.search;
    fetchTasks(params);
  }, [filters, fetchTasks]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleCreate = async (data) => {
    await createTask(data);
    fetchStats();
    showToast('Task created successfully!');
  };

  const handleUpdate = async (data) => {
    await updateTask(modal._id, data);
    fetchStats();
    showToast('Task updated!');
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    fetchStats();
    setDeleteConfirm(null);
    showToast('Task deleted', 'error');
  };

  const setFilter = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value, page: 1 }));

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999 }}>
          <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`} style={{ margin: 0, minWidth: 240 }}>
            {toast.msg}
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's what's on your plate today</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value accent">{stats.total ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">To Do</div>
            <div className="stat-value">{stats.todo ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value warning">{stats.inProgress ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value success">{stats.done ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">High Priority</div>
            <div className="stat-value danger">{stats.high ?? 0}</div>
          </div>
        </div>
      )}

      <div className="tasks-toolbar">
        <input className="form-input search-input" placeholder="🔍 Search tasks..." value={filters.search} onChange={setFilter('search')} />
        <select className="form-input form-select filter-select" value={filters.status} onChange={setFilter('status')}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="form-input form-select filter-select" value={filters.priority} onChange={setFilter('priority')}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ New Task</button>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No tasks found</div>
          <p>Create your first task to get started!</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('create')}>Create Task</button>
        </div>
      ) : (
        <>
          {tasks.map((task) => (
            <div key={task._id} className="task-card">
              <div className="task-info">
                <div className="task-title">{task.title}</div>
                {task.description && <div className="task-desc">{task.description}</div>}
                <div className="task-meta">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && (
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {task.tags?.map(tag => (
                    <span key={tag} style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="task-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(task)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(task._id)}>Delete</button>
              </div>
            </div>
          ))}

          {meta.pages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>‹</button>
              {Array.from({ length: meta.pages }, (_, i) => (
                <button key={i + 1} className={`page-btn ${filters.page === i + 1 ? 'active' : ''}`} onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}>{i + 1}</button>
              ))}
              <button className="page-btn" disabled={filters.page >= meta.pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>›</button>
            </div>
          )}
        </>
      )}

      {modal && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={modal === 'create' ? handleCreate : handleUpdate}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Delete Task?</h2></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text2)', marginBottom: 24 }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
