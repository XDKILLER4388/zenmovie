import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import HeroBanner from '../components/HeroBanner';
import ContentRow from '../components/ContentRow';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const [trending, setTrending] = useState({ movies: [], series: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTrending()
      .then(data => setTrending(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const heroItems = [
    ...trending.movies.slice(0, 3),
    ...trending.series.slice(0, 2)
  ];

  return (
    <main className="home">
      <HeroBanner items={heroItems} />
      <div className="home__content">
        <ContentRow title="Trending Movies" items={trending.movies} type="movie" loading={loading} />
        <ContentRow title="Trending Series" items={trending.series} type="series" loading={loading} />
      </div>
    </main>
  );
}
