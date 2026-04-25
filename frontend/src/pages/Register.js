import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Account created! Welcome to StreamVault');
      navigate('/');
    } catch (err) {
      toast.error(err.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__logo"><span>▶</span> STREAMVAULT</div>
        <h1 className="auth__title">Create Account</h1>
        <p className="auth__subtitle">Free forever. No credit card required.</p>

        <form onSubmit={handleSubmit} className="auth__form">
          <div className="auth__field">
            <label className="auth__label">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="auth__input"
              placeholder="cooluser123"
              required minLength={3}
            />
          </div>
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
              placeholder="Min. 6 characters"
              required minLength={6}
            />
          </div>
          <button type="submit" className="auth__submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Join Free'}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
