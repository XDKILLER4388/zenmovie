import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Detail.css';

export default function SeriesDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [series, setSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [activeSeason, setActiveSeason] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.getDiscoverSeries(id).then(s => {
      setSeries(s);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!series) return;
    api.getDiscoverEpisodes(id, activeSeason).then(setEpisodes).catch(() => setEpisodes([]));
  }, [id, series, activeSeason]);

  const toggleBookmark = async () => {
    if (!user) return toast.error('Sign in to bookmark');
    try {
      if (bookmarked) {
        await api.removeBookmark('series', id);
        setBookmarked(false);
        toast.success('Removed from watchlist');
      } else {
        await api.addBookmark({ content_type: 'series', content_id: id });
        setBookmarked(true);
        toast.success('Added to watchlist');
      }
    } catch { toast.error('Failed to update watchlist'); }
  };

  if (loading) return <div className="detail-loading"><div className="skeleton detail-loading__bg" /></div>;
  if (!series) return <div className="detail-error">Series not found</div>;

  const genres = Array.isArray(series.genres) ? series.genres : (series.genres?.split(',') || []);
  const year = series.first_air_date ? new Date(series.first_air_date).getFullYear() : '';

  return (
    <div className="detail">
      <div className="detail__backdrop">
        {series.backdrop_path && <img src={series.backdrop_path} alt="" aria-hidden="true" />}
        <div className="detail__backdrop-gradient" />
      </div>

      <div className="detail__content">
        <div className="detail__poster-col">
          {series.poster_path && (
            <img src={series.poster_path} alt={series.title} className="detail__poster" />
          )}
        </div>

        <div className="detail__info">
          <div className="detail__meta-top">
            {year && <span className="detail__year">{year}</span>}
            <span className="detail__runtime">{series.total_seasons} Season{series.total_seasons !== 1 ? 's' : ''}</span>
            {series.rating > 0 && <span className="detail__rating">★ {Number(series.rating).toFixed(1)}</span>}
            <span className="detail__year" style={{ color: series.status === 'Ended' ? '#666' : '#aaa' }}>
              {series.status}
            </span>
          </div>

          <h1 className="detail__title">{series.title}</h1>
          {series.tagline && <p className="detail__tagline">"{series.tagline}"</p>}

          <div className="detail__genres">
            {genres.map(g => <span key={g} className="detail__genre">{g}</span>)}
          </div>

          {series.overview && <p className="detail__overview">{series.overview}</p>}

          <div className="detail__actions">
            {episodes.length > 0 && (
              <Link
                to={`/watch/episode/${episodes[0].id}`}
                className="detail__btn detail__btn--play"
                onClick={() => sessionStorage.setItem('currentEpisode', JSON.stringify({
                  tmdbId: series.tmdb_id,
                  seriesTitle: series.title,
                  season: episodes[0].season_number,
                  episode: episodes[0].episode_number
                }))}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>
                Watch S1E1
              </Link>
            )}
            <button onClick={toggleBookmark} className={`detail__btn detail__btn--bookmark ${bookmarked ? 'active' : ''}`}>
              {bookmarked ? '✓ Saved' : '+ Watchlist'}
            </button>
            {series.trailer_key && (
              <a
                href={`https://www.youtube.com/watch?v=${series.trailer_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="detail__btn detail__btn--trailer"
              >
                ▷ Trailer
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="detail__seasons">
        <h2 className="detail__seasons-title">Episodes</h2>

        <div className="season-tabs">
          {series.seasons?.map(s => (
            <button
              key={s.season_number}
              className={`season-tab ${activeSeason === s.season_number ? 'active' : ''}`}
              onClick={() => setActiveSeason(s.season_number)}
            >
              Season {s.season_number}
            </button>
          ))}
        </div>

        <div className="episodes-grid">
          {episodes.map(ep => (
            <Link
              key={ep.id}
              to={`/watch/episode/${ep.id}`}
              className="episode-card"
              onClick={() => sessionStorage.setItem('currentEpisode', JSON.stringify({
                tmdbId: series.tmdb_id,
                seriesTitle: series.title,
                season: ep.season_number,
                episode: ep.episode_number
              }))}
            >
              <div className="episode-card__still">
                {ep.still_path
                  ? <img src={ep.still_path} alt={ep.title} loading="lazy" />
                  : <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)' }} />
                }
                <div className="episode-card__play-overlay">
                  <svg viewBox="0 0 24 24" fill="white" width="40" height="40"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              <div className="episode-card__info">
                <div className="episode-card__num">S{String(ep.season_number).padStart(2,'0')} E{String(ep.episode_number).padStart(2,'0')}</div>
                <div className="episode-card__title">{ep.title}</div>
                {ep.overview && <div className="episode-card__overview">{ep.overview}</div>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
