import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const mapped = {};
        data.errors.forEach(e => { mapped[e.field] = e.message; });
        setErrors(mapped);
      } else {
        toast.error(data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...(errors[field] ? { borderColor: '#f87171' } : {}),
  });

  const labelStyle = {
    display: 'block', fontSize: 12, color: '#94a3b8',
    marginBottom: 6, fontFamily: 'Space Mono, monospace',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0e1a', padding: 20,
    }}>
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(#6ee7b7 1px, transparent 1px), linear-gradient(90deg, #6ee7b7 1px, transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{
        width: '100%', maxWidth: 420,
        background: '#111827', border: '1px solid #1e293b',
        borderRadius: 16, padding: '40px 36px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', color: '#6ee7b7', fontSize: 24, marginBottom: 6 }}>
            ◈ TaskFlow
          </div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>Create your account</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>FULL NAME</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="John Doe" style={inputStyle('name')} />
            {errors.name && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
          </div>

          <div>
            <label style={labelStyle}>EMAIL</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com" style={inputStyle('email')} />
            {errors.email && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
          </div>

          <div>
            <label style={labelStyle}>PASSWORD</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="Min 6 chars, 1 number" style={inputStyle('password')} />
            {errors.password && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
          </div>

          <div>
            <label style={labelStyle}>ROLE</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="user">User</option>
              <option value="admin">Admin (Dev only)</option>
            </select>
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 8, padding: '12px',
              background: loading ? 'rgba(110,231,183,0.3)' : '#6ee7b7',
              color: '#0a0e1a', fontWeight: 700, fontSize: 14,
              border: 'none', borderRadius: 8,
              fontFamily: 'Space Mono, monospace',
              transition: 'all 0.2s',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT →'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#475569' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#6ee7b7' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
