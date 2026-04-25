import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ContentRow from '../components/ContentRow';
import './Detail.css';

export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    Promise.all([
      api.getDiscoverMovie(id),
      api.getMovieRecommendations(id).catch(() => [])
    ]).then(([m, recs]) => {
      setMovie(m);
      setRecommendations(recs);
    }).finally(() => setLoading(false));
  }, [id]);

  const toggleBookmark = async () => {
    if (!user) return toast.error('Sign in to bookmark');
    try {
      if (bookmarked) {
        await api.removeBookmark('movie', id);
        setBookmarked(false);
        toast.success('Removed from watchlist');
      } else {
        await api.addBookmark({ content_type: 'movie', content_id: id });
        setBookmarked(true);
        toast.success('Added to watchlist');
      }
    } catch { toast.error('Failed to update watchlist'); }
  };

  if (loading) return <div className="detail-loading"><div className="skeleton detail-loading__bg" /></div>;
  if (!movie) return <div className="detail-error">Movie not found</div>;

  const genres = Array.isArray(movie.genres) ? movie.genres : (movie.genres?.split(',') || []);
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  return (
    <div className="detail">
      <div className="detail__backdrop">
        {movie.backdrop_path && <img src={movie.backdrop_path} alt="" aria-hidden="true" />}
        <div className="detail__backdrop-gradient" />
      </div>

      <div className="detail__content">
        <div className="detail__poster-col">
          {movie.poster_path && (
            <img src={movie.poster_path} alt={movie.title} className="detail__poster" />
          )}
        </div>

        <div className="detail__info">
          <div className="detail__meta-top">
            {year && <span className="detail__year">{year}</span>}
            {movie.runtime && <span className="detail__runtime">{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
            {movie.rating > 0 && <span className="detail__rating">★ {Number(movie.rating).toFixed(1)}</span>}
          </div>

          <h1 className="detail__title">{movie.title}</h1>

          {movie.tagline && <p className="detail__tagline">"{movie.tagline}"</p>}

          <div className="detail__genres">
            {genres.map(g => <span key={g} className="detail__genre">{g}</span>)}
          </div>

          {movie.overview && <p className="detail__overview">{movie.overview}</p>}

          <div className="detail__actions">
            <Link to={`/watch/movie/${movie.id}`} className="detail__btn detail__btn--play">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>
              Watch Now
            </Link>
            <button onClick={toggleBookmark} className={`detail__btn detail__btn--bookmark ${bookmarked ? 'active' : ''}`}>
              {bookmarked ? '✓ Saved' : '+ Watchlist'}
            </button>
            {movie.trailer_key && (
              <a
                href={`https://www.youtube.com/watch?v=${movie.trailer_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="detail__btn detail__btn--trailer"
              >
                ▷ Trailer
              </a>
            )}
          </div>

          {movie.streams?.length > 0 && (
            <div className="detail__servers">
              <span className="detail__servers-label">Available on:</span>
              {movie.streams.map(s => (
                <span key={s.id} className="detail__server-badge">{s.server_name} · {s.quality}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="detail__recommendations">
          <ContentRow title="You Might Also Like" items={recommendations} type="movie" />
        </div>
      )}
    </div>
  );
}
