import React, { useEffect, useState, useCallback } from 'react';
import { tasksAPI } from '../services/api';
import toast from 'react-hot-toast';

const statusColor = { todo: '#60a5fa', 'in-progress': '#fbbf24', done: '#6ee7b7' };
const priorityColor = { low: '#64748b', medium: '#fbbf24', high: '#f87171' };

const Badge = ({ value, colorMap }) => (
  <span style={{
    fontSize: 10, padding: '2px 8px', borderRadius: 4,
    background: `${colorMap[value]}20`,
    color: colorMap[value],
    fontFamily: 'Space Mono, monospace',
  }}>
    {value?.toUpperCase()}
  </span>
);

const EMPTY_FORM = {
  title: '', description: '', status: 'todo',
  priority: 'medium', dueDate: '', tags: '',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({});
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: '', priority: '', search: '' });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      params.page = filters.page;
      params.limit = filters.limit;

      const { data } = await tasksAPI.getAll(params);
      setTasks(data.data);
      setMeta(data.meta);
    } catch {
      toast.error('Failed to load tasks');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const openCreate = () => {
    setEditTask(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      tags: (task.tags || []).join(', '),
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      ...(form.dueDate ? { dueDate: new Date(form.dueDate).toISOString() } : {}),
    };
    try {
      if (editTask) {
        await tasksAPI.update(editTask._id, payload);
        toast.success('Task updated');
      } else {
        await tasksAPI.create(payload);
        toast.success('Task created');
      }
      setShowModal(false);
      loadTasks();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const mapped = {};
        data.errors.forEach(e => { mapped[e.field] = e.message; });
        setFormErrors(mapped);
      } else {
        toast.error(data?.message || 'Save failed');
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    setDeleting(id);
    try {
      await tasksAPI.delete(id);
      toast.success('Task deleted');
      loadTasks();
    } catch {
      toast.error('Delete failed');
    }
    setDeleting(null);
  };

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val, page: 1 }));
  };

  const labelStyle = { display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 5, fontFamily: 'Space Mono, monospace' };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>Tasks</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>
            {meta.total ?? 0} total · page {meta.page ?? 1} of {meta.totalPages ?? 1}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '9px 18px', background: '#6ee7b7', color: '#0a0e1a',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
            fontFamily: 'Space Mono, monospace', cursor: 'pointer',
          }}
        >
          + NEW TASK
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search tasks..."
          value={filters.search}
          onChange={e => handleFilterChange('search', e.target.value)}
          style={{ width: 200 }}
        />
        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} style={{ width: 130 }}>
          <option value="">All Status</option>
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)} style={{ width: 130 }}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: '#475569', fontSize: 14, padding: 32, textAlign: 'center' }}>Loading...</div>
      ) : tasks.length === 0 ? (
        <div style={{
          background: '#111827', border: '1px dashed #1e293b',
          borderRadius: 12, padding: 40, textAlign: 'center', color: '#475569',
        }}>
          No tasks found. Create one!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(task => (
            <div key={task._id} style={{
              background: '#111827', border: '1px solid #1e293b',
              borderRadius: 10, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'border-color 0.15s',
            }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#334155'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#1e293b'}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: statusColor[task.status], flexShrink: 0,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </div>
                {task.description && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.description}
                  </div>
                )}
                {task.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {task.tags.map(t => (
                      <span key={t} style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 4,
                        background: '#1e293b', color: '#94a3b8',
                      }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <Badge value={task.status} colorMap={statusColor} />
                <Badge value={task.priority} colorMap={priorityColor} />
                {task.dueDate && (
                  <span style={{
                    fontSize: 10, color: task.isOverdue ? '#f87171' : '#64748b',
                    fontFamily: 'Space Mono, monospace',
                  }}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => openEdit(task)}
                  style={{
                    padding: '5px 10px', background: 'transparent',
                    border: '1px solid #1e293b', borderRadius: 6,
                    color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#6ee7b7'; e.currentTarget.style.color = '#6ee7b7'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task._id)}
                  disabled={deleting === task._id}
                  style={{
                    padding: '5px 10px', background: 'transparent',
                    border: '1px solid #1e293b', borderRadius: 6,
                    color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  {deleting === task._id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p}
              onClick={() => setFilters(prev => ({ ...prev, page: p }))}
              style={{
                width: 32, height: 32, borderRadius: 6, border: '1px solid',
                borderColor: filters.page === p ? '#6ee7b7' : '#1e293b',
                background: filters.page === p ? 'rgba(110,231,183,0.1)' : 'transparent',
                color: filters.page === p ? '#6ee7b7' : '#94a3b8',
                fontSize: 13, cursor: 'pointer',
              }}
            >{p}</button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20,
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{
            background: '#111827', border: '1px solid #1e293b',
            borderRadius: 14, padding: 32, width: '100%', maxWidth: 500,
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: '#6ee7b7', marginBottom: 24 }}>
              {editTask ? '◻ EDIT TASK' : '◻ NEW TASK'}
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>TITLE *</label>
                <input name="title" value={form.title} onChange={handleFormChange} placeholder="Task title"
                  style={formErrors.title ? { borderColor: '#f87171' } : {}} />
                {formErrors.title && <div style={{ color: '#f87171', fontSize: 11, marginTop: 3 }}>{formErrors.title}</div>}
              </div>

              <div>
                <label style={labelStyle}>DESCRIPTION</label>
                <textarea name="description" value={form.description} onChange={handleFormChange}
                  placeholder="Optional description..." rows={3}
                  style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>STATUS</label>
                  <select name="status" value={form.status} onChange={handleFormChange}>
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>PRIORITY</label>
                  <select name="priority" value={form.priority} onChange={handleFormChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>DUE DATE</label>
                <input type="date" name="dueDate" value={form.dueDate} onChange={handleFormChange} />
                {formErrors.dueDate && <div style={{ color: '#f87171', fontSize: 11, marginTop: 3 }}>{formErrors.dueDate}</div>}
              </div>

              <div>
                <label style={labelStyle}>TAGS (comma separated)</label>
                <input name="tags" value={form.tags} onChange={handleFormChange} placeholder="frontend, bug, urgent" />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '10px', background: 'transparent',
                    border: '1px solid #1e293b', borderRadius: 8, color: '#94a3b8',
                    fontSize: 13, cursor: 'pointer',
                  }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{
                    flex: 2, padding: '10px',
                    background: saving ? 'rgba(110,231,183,0.3)' : '#6ee7b7',
                    color: '#0a0e1a', fontWeight: 700, fontSize: 13,
                    border: 'none', borderRadius: 8,
                    fontFamily: 'Space Mono, monospace', cursor: saving ? 'not-allowed' : 'pointer',
                  }}>
                  {saving ? 'SAVING...' : editTask ? 'UPDATE →' : 'CREATE →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
