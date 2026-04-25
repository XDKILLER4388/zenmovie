import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ContentCard from '../components/ContentCard';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('history');
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getHistory().catch(() => []),
      api.getBookmarks().catch(() => [])
    ]).then(([h, b]) => {
      setHistory(h);
      setBookmarks(b);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="profile">
      <div className="profile__header">
        <div className="profile__avatar">{user?.username?.[0]?.toUpperCase()}</div>
        <div className="profile__info">
          <h1 className="profile__name">{user?.username}</h1>
          <p className="profile__email">{user?.email}</p>
          {user?.role === 'admin' && <span className="profile__badge">ADMIN</span>}
        </div>
        <button onClick={logout} className="profile__logout">Sign Out</button>
      </div>

      <div className="profile__tabs">
        <button className={`profile__tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Watch History
        </button>
        <button className={`profile__tab ${tab === 'bookmarks' ? 'active' : ''}`} onClick={() => setTab('bookmarks')}>
          My Watchlist
        </button>
      </div>

      <div className="profile__content">
        {loading ? (
          <div className="profile__loading">Loading...</div>
        ) : tab === 'history' ? (
          history.length > 0 ? (
            <div className="profile__grid">
              {history.map(item => (
                <div key={item.id} className="history-item">
                  {item.poster_path && <img src={item.poster_path} alt={item.title} />}
                  <div className="history-item__info">
                    <span className="history-item__title">{item.title}</span>
                    <span className="history-item__type">{item.content_type}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="profile__empty">
              <p>No watch history yet</p>
              <span>Start watching to track your progress</span>
            </div>
          )
        ) : (
          bookmarks.length > 0 ? (
            <div className="browse__grid">
              {bookmarks.map(b => (
                <ContentCard
                  key={b.id}
                  item={{ id: b.content_id, title: b.title, poster_path: b.poster_path, rating: b.rating }}
                  type={b.content_type}
                />
              ))}
            </div>
          ) : (
            <div className="profile__empty">
              <p>Your watchlist is empty</p>
              <span>Add movies and series to watch later</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
