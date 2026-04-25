import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__logo">
          <span>▶</span> STREAMVAULT
        </div>
        <h1 className="auth__title">Sign In</h1>
        <p className="auth__subtitle">Access your free streaming account</p>

        <form onSubmit={handleSubmit} className="auth__form">
          <div className="auth__field">
            <label className="auth__label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="auth__input"
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="auth__field">
            <label className="auth__label">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="auth__input"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="auth__submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth__switch">
          Don't have an account? <Link to="/register">Join Free</Link>
        </p>
      </div>
    </div>
  );
}
