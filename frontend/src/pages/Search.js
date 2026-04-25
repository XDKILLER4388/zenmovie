import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import ContentCard from '../components/ContentCard';
import './Search.css';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const q = searchParams.get('q') || '';

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    api.search({ q }).then(data => {
      setResults(data.results || []);
    }).catch(() => setResults([])).finally(() => setLoading(false));
  }, [q]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) setSearchParams({ q: query.trim() });
  };

  return (
    <div className="search-page">
      <div className="search-page__header">
        <form onSubmit={handleSubmit} className="search-page__form">
          <div className="search-page__input-wrap">
            <svg className="search-page__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search movies, series, genres..."
              className="search-page__input"
              autoFocus
            />
          </div>
          <button type="submit" className="search-page__submit">Search</button>
        </form>
      </div>

      {q && (
        <div className="search-page__results">
          <div className="search-page__meta">
            {loading ? (
              <span>Searching...</span>
            ) : (
              <span>{results.length} results for "<strong>{q}</strong>"</span>
            )}
          </div>

          <div className="search-page__grid">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="browse__skeleton skeleton" />)
              : results.map(item => (
                  <ContentCard key={`${item.type}-${item.id}`} item={item} type={item.type} />
                ))
            }
          </div>

          {!loading && results.length === 0 && (
            <div className="search-page__empty">
              <div className="search-page__empty-icon">◎</div>
              <p>No results found for "{q}"</p>
              <span>Try different keywords or browse our catalog</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
