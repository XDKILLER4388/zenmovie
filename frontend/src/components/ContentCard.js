import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ContentCard.css';

export default function ContentCard({ item, type = 'movie' }) {
  const [imgError, setImgError] = useState(false);
  const path = type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`;
  const year = item.release_date || item.first_air_date || item.date;
  const yearStr = year ? new Date(year).getFullYear() : '';

  return (
    <Link to={path} className="card">
      <div className="card__poster">
        {!imgError && item.poster_path ? (
          <img
            src={item.poster_path}
            alt={item.title}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card__poster-fallback">
            <span>{item.title?.[0]}</span>
          </div>
        )}
        <div className="card__overlay">
          <div className="card__play">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div className="card__meta">
            {item.rating > 0 && (
              <span className="card__rating">★ {Number(item.rating).toFixed(1)}</span>
            )}
            {yearStr && <span className="card__year">{yearStr}</span>}
          </div>
        </div>
        <div className="card__type-badge">{type === 'movie' ? 'FILM' : 'SERIES'}</div>
      </div>
      <div className="card__info">
        <h3 className="card__title">{item.title}</h3>
        {item.genres && (
          <p className="card__genres">
            {(Array.isArray(item.genres) ? item.genres : item.genres.split(',')).slice(0, 2).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}
