import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import ContentCard from '../components/ContentCard';
import './Browse.css';

export default function SeriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [series, setSeries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const genre = searchParams.get('genre') || '';
  const year = searchParams.get('year') || '';
  const sort = searchParams.get('sort') || 'popularity.desc';

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.discoverSeries({ page: p, genre, year, sort });
      setSeries(p === 1 ? data.results : prev => [...prev, ...data.results]);
      setTotal(data.total);
      setPage(p);
    } finally { setLoading(false); }
  }, [genre, year, sort]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => { api.getTVGenres().then(setGenres).catch(() => {}); }, []);

  const setFilter = (key, val) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set(key, val); else params.delete(key);
    setSearchParams(params);
  };

  return (
    <div className="browse">
      <div className="browse__header">
        <h1 className="browse__title">Series</h1>
        <p className="browse__count">{total.toLocaleString()} titles</p>
      </div>

      <div className="browse__filters">
        <select value={genre} onChange={e => setFilter('genre', e.target.value)} className="filter-select">
          <option value="">All Genres</option>
          {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={year} onChange={e => setFilter('year', e.target.value)} className="filter-select">
          <option value="">All Years</option>
          {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={sort} onChange={e => setFilter('sort', e.target.value)} className="filter-select">
          <option value="popularity.desc">Most Popular</option>
          <option value="vote_average.desc">Top Rated</option>
          <option value="first_air_date.desc">Newest</option>
        </select>
      </div>

      <div className="browse__grid">
        {series.map(s => <ContentCard key={s.id} item={s} type="series" />)}
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="browse__skeleton skeleton" />
        ))}
      </div>

      {series.length < total && !loading && (
        <div className="browse__load-more">
          <button onClick={() => load(page + 1)} className="load-more-btn">Load More</button>
        </div>
      )}
    </div>
  );
}
