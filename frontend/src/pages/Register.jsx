import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = [];
    if (!form.name.trim()) e.push('Name is required');
    if (!form.email) e.push('Email is required');
    if (form.password.length < 8) e.push('Password must be at least 8 characters');
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.push('Password must contain uppercase, lowercase, and a number');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setLoading(true);
    setErrors([]);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const apiErrs = err.response?.data?.errors;
      setErrors(apiErrs ? apiErrs.map(e => e.message) : [err.response?.data?.message || 'Registration failed']);
    } finally {
      setLoading(false);
    }
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Task<span>Flow</span></div>
        <p className="auth-subtitle">Create your account to get started</p>

        {errors.length > 0 && (
          <div className="alert alert-error">
            {errors.length === 1 ? errors[0] : <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={form.password} onChange={set('password')} placeholder="Min 8 chars, uppercase + number" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
