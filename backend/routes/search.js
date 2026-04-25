const router = require('express').Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const { q, type, genre, year, sort = 'popularity', page = 1, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query too short' });

    const axios = require('axios');
    const BASE = process.env.TMDB_BASE_URL;
    const KEY = process.env.TMDB_API_KEY;
    const IMG = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

    // Search TMDb directly — no DB needed
    const { data } = await axios.get(`${BASE}/search/multi`, {
      params: { api_key: KEY, query: q.trim(), page, include_adult: false }
    });

    const results = (data.results || [])
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .map(r => ({
        id: r.id,
        tmdb_id: r.id,
        type: r.media_type === 'tv' ? 'series' : 'movie',
        title: r.title || r.name,
        overview: r.overview,
        poster_path: r.poster_path ? `${IMG}/w300${r.poster_path}` : null,
        backdrop_path: r.backdrop_path ? `${IMG}/w780${r.backdrop_path}` : null,
        date: r.release_date || r.first_air_date,
        rating: r.vote_average || 0,
        popularity: r.popularity || 0,
        genres: []
      }));

    res.json({ results, total: data.total_results, page: data.page, pages: data.total_pages, query: q });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
