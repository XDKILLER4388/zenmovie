import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroBanner.css';

export default function HeroBanner({ items = [] }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % items.length);
        setFading(false);
      }, 400);
    }, 7000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return <div className="hero hero--empty skeleton" />;

  const item = items[current];
  const type = item.first_air_date ? 'series' : 'movie';
  const year = item.release_date || item.first_air_date;
  const genres = Array.isArray(item.genres) ? item.genres : (item.genres?.split(',') || []);

  return (
    <div className="hero">
      <div className={`hero__bg ${fading ? 'hero__bg--fade' : ''}`}>
        {item.backdrop_path && (
          <img src={item.backdrop_path} alt="" aria-hidden="true" />
        )}
        <div className="hero__gradient" />
        <div className="hero__scanline" />
      </div>

      <div className="hero__content">
        <div className="hero__meta">
          <span className="hero__badge">{type === 'movie' ? '▶ FILM' : '▶ SERIES'}</span>
          {year && <span className="hero__year">{new Date(year).getFullYear()}</span>}
          {item.rating > 0 && <span className="hero__rating">★ {Number(item.rating).toFixed(1)}</span>}
        </div>

        <h1 className="hero__title">{item.title}</h1>

        {genres.length > 0 && (
          <div className="hero__genres">
            {genres.slice(0, 3).map(g => <span key={g} className="hero__genre">{g}</span>)}
          </div>
        )}

        {item.overview && (
          <p className="hero__overview">{item.overview.slice(0, 200)}{item.overview.length > 200 ? '...' : ''}</p>
        )}

        <div className="hero__actions">
          <Link to={`/watch/${type}/${item.id}`} className="hero__btn hero__btn--play">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
            Watch Now
          </Link>
          <Link to={`/${type === 'movie' ? 'movie' : 'series'}/${item.id}`} className="hero__btn hero__btn--info">
            More Info
          </Link>
          {item.trailer_key && (
            <a
              href={`https://www.youtube.com/watch?v=${item.trailer_key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hero__btn hero__btn--trailer"
            >
              ▷ Trailer
            </a>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <div className="hero__dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`hero__dot ${i === current ? 'hero__dot--active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
