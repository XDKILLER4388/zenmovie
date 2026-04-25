import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import toast from 'react-hot-toast';
import AdminMovies from './AdminMovies';
import AdminUsers from './AdminUsers';
import './Admin.css';

function AdminHome() {
  const [stats, setStats] = useState(null);
  const [syncing, setSyncing] = useState('');

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(() => {});
  }, []);

  const sync = async (type) => {
    setSyncing(type);
    try {
      if (type === 'trending') await api.syncTrending();
      else await api.syncPopular();
      toast.success(`${type} sync complete`);
      const s = await api.getAdminStats();
      setStats(s);
    } catch { toast.error('Sync failed'); }
    finally { setSyncing(''); }
  };

  return (
    <div className="admin-home">
      <h2 className="admin-section-title">Dashboard</h2>

      {stats && (
        <div className="admin-stats">
          {[
            { label: 'Movies', value: stats.movies, icon: '🎬' },
            { label: 'Series', value: stats.series, icon: '📺' },
            { label: 'Episodes', value: stats.episodes, icon: '▶' },
            { label: 'Users', value: stats.users, icon: '👤' },
            { label: 'Streams', value: stats.streams, icon: '⚡' },
          ].map(s => (
            <div key={s.label} className="admin-stat-card">
              <span className="admin-stat-icon">{s.icon}</span>
              <span className="admin-stat-value">{s.value?.toLocaleString()}</span>
              <span className="admin-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="admin-actions">
        <h3 className="admin-actions-title">Content Sync</h3>
        <div className="admin-actions-grid">
          <button
            onClick={() => sync('trending')}
            disabled={!!syncing}
            className="admin-action-btn"
          >
            {syncing === 'trending' ? '⟳ Syncing...' : '↻ Sync Trending'}
          </button>
          <button
            onClick={() => sync('popular')}
            disabled={!!syncing}
            className="admin-action-btn"
          >
            {syncing === 'popular' ? '⟳ Syncing...' : '↻ Sync Popular'}
          </button>
        </div>
      </div>

      <div className="admin-fetch">
        <h3 className="admin-actions-title">Fetch by TMDb ID</h3>
        <FetchForm />
      </div>
    </div>
  );
}

function FetchForm() {
  const [tmdbId, setTmdbId] = useState('');
  const [type, setType] = useState('movie');
  const [loading, setLoading] = useState(false);

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!tmdbId) return;
    setLoading(true);
    try {
      if (type === 'movie') await api.fetchMovie(tmdbId);
      else await api.fetchSeries(tmdbId);
      toast.success(`${type} fetched successfully`);
      setTmdbId('');
    } catch { toast.error('Fetch failed'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleFetch} className="admin-fetch-form">
      <select value={type} onChange={e => setType(e.target.value)} className="admin-select">
        <option value="movie">Movie</option>
        <option value="series">Series</option>
      </select>
      <input
        value={tmdbId}
        onChange={e => setTmdbId(e.target.value)}
        placeholder="TMDb ID (e.g. 550)"
        className="admin-input"
      />
      <button type="submit" disabled={loading} className="admin-submit-btn">
        {loading ? 'Fetching...' : 'Fetch'}
      </button>
    </form>
  );
}

export default function AdminDashboard() {
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', exact: true },
    { path: '/admin/movies', label: 'Movies' },
    { path: '/admin/users', label: 'Users' },
  ];

  return (
    <div className="admin">
      <div className="admin__sidebar">
        <div className="admin__sidebar-logo">⚙ ADMIN</div>
        <nav className="admin__nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin__nav-link ${
                item.exact
                  ? location.pathname === item.path ? 'active' : ''
                  : location.pathname.startsWith(item.path) ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link to="/" className="admin__back-link">← Back to Site</Link>
      </div>

      <div className="admin__main">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="movies" element={<AdminMovies />} />
          <Route path="users" element={<AdminUsers />} />
        </Routes>
      </div>
    </div>
  );
}
