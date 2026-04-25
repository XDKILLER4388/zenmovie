import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">▶</span>
          <span className="navbar__logo-text">STREAM<span>VAULT</span></span>
        </Link>

        <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/movies" className={location.pathname === '/movies' ? 'active' : ''}>Movies</Link>
          <Link to="/series" className={location.pathname === '/series' ? 'active' : ''}>Series</Link>
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        </div>

        <div className="navbar__actions">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="navbar__search-form">
              <input
                ref={searchRef}
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search movies, series..."
                className="navbar__search-input"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="navbar__icon-btn">✕</button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="navbar__icon-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          )}

          {user ? (
            <div className="navbar__user">
              <Link to="/profile" className="navbar__avatar">{user.username[0].toUpperCase()}</Link>
              <button onClick={logout} className="navbar__logout">Sign Out</button>
            </div>
          ) : (
            <div className="navbar__auth">
              <Link to="/login" className="navbar__btn navbar__btn--ghost">Sign In</Link>
              <Link to="/register" className="navbar__btn navbar__btn--solid">Join Free</Link>
            </div>
          )}

          <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
