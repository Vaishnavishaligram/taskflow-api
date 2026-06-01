import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const mapped = {};
        data.errors.forEach(e => { mapped[e.field] = e.message; });
        setErrors(mapped);
      } else {
        toast.error(data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0e1a', padding: 20,
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(#6ee7b7 1px, transparent 1px), linear-gradient(90deg, #6ee7b7 1px, transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{
        width: '100%', maxWidth: 420,
        background: '#111827',
        border: '1px solid #1e293b',
        borderRadius: 16, padding: '40px 36px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', color: '#6ee7b7', fontSize: 24, marginBottom: 6 }}>
            ◈ TaskFlow
          </div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>Sign in to your account</div>
        </div>

        {/* Demo credentials hint */}
        <div style={{
          background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 24, fontSize: 12, color: '#60a5fa',
        }}>
          💡 Demo: <strong>admin@test.com</strong> / <strong>admin123</strong> (after seeding)
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontFamily: 'Space Mono, monospace' }}>
              EMAIL
            </label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com"
              style={errors.email ? { borderColor: '#f87171' } : {}}
            />
            {errors.email && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontFamily: 'Space Mono, monospace' }}>
              PASSWORD
            </label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••"
              style={errors.password ? { borderColor: '#f87171' } : {}}
            />
            {errors.password && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
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
            {loading ? 'SIGNING IN...' : 'SIGN IN →'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#475569' }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#6ee7b7' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
