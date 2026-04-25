const router = require('express').Router();
const axios = require('axios');

const BASE = () => process.env.TMDB_BASE_URL;
const KEY = () => process.env.TMDB_API_KEY;
const IMG = () => process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

function formatMovie(r) {
  return {
    id: r.id, tmdb_id: r.id, type: 'movie',
    title: r.title, overview: r.overview,
    poster_path: r.poster_path ? `${IMG()}/w300${r.poster_path}` : null,
    backdrop_path: r.backdrop_path ? `${IMG()}/w780${r.backdrop_path}` : null,
    release_date: r.release_date, rating: r.vote_average || 0,
    popularity: r.popularity || 0, genres: []
  };
}

function formatSeries(r) {
  return {
    id: r.id, tmdb_id: r.id, type: 'series',
    title: r.name, overview: r.overview,
    poster_path: r.poster_path ? `${IMG()}/w300${r.poster_path}` : null,
    backdrop_path: r.backdrop_path ? `${IMG()}/w780${r.backdrop_path}` : null,
    first_air_date: r.first_air_date, rating: r.vote_average || 0,
    popularity: r.popularity || 0, genres: []
  };
}

const tmdb = (endpoint, params = {}) =>
  axios.get(`${BASE()}${endpoint}`, { params: { api_key: KEY(), ...params } }).then(r => r.data);

// Movies
router.get('/movies', async (req, res) => {
  try {
    const { page = 1, genre, year, sort = 'popularity.desc' } = req.query;
    const params = { page, sort_by: sort, include_adult: false };
    if (genre) params.with_genres = genre;
    if (year) params.primary_release_year = year;
    const data = await tmdb('/discover/movie', params);
    res.json({ results: data.results.map(formatMovie), total: data.total_results, page: data.page, pages: data.total_pages });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Series
router.get('/series', async (req, res) => {
  try {
    const { page = 1, genre, year, sort = 'popularity.desc' } = req.query;
    const params = { page, sort_by: sort, include_adult: false };
    if (genre) params.with_genres = genre;
    if (year) params.first_air_date_year = year;
    const data = await tmdb('/discover/tv', params);
    res.json({ results: data.results.map(formatSeries), total: data.total_results, page: data.page, pages: data.total_pages });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Trending
router.get('/trending', async (req, res) => {
  try {
    const [movies, series] = await Promise.all([
      tmdb('/trending/movie/week'),
      tmdb('/trending/tv/week')
    ]);
    res.json({
      movies: movies.results.map(formatMovie),
      series: series.results.map(formatSeries)
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Movie detail by TMDb ID
router.get('/movie/:tmdbId', async (req, res) => {
  try {
    const data = await tmdb(`/movie/${req.params.tmdbId}`, { append_to_response: 'videos,credits' });
    const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    res.json({
      ...formatMovie(data),
      runtime: data.runtime,
      tagline: data.tagline,
      imdb_id: data.imdb_id,
      trailer_key: trailer?.key || null,
      genres: data.genres?.map(g => g.name) || [],
      streams: [] // player builds these from tmdb_id
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Series detail by TMDb ID
router.get('/series/:tmdbId', async (req, res) => {
  try {
    const data = await tmdb(`/tv/${req.params.tmdbId}`, { append_to_response: 'videos,credits' });
    const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    res.json({
      ...formatSeries(data),
      tagline: data.tagline,
      trailer_key: trailer?.key || null,
      genres: data.genres?.map(g => g.name) || [],
      total_seasons: data.number_of_seasons,
      total_episodes: data.number_of_episodes,
      status: data.status,
      seasons: (data.seasons || []).filter(s => s.season_number > 0).map(s => ({
        season_number: s.season_number,
        name: s.name,
        episode_count: s.episode_count,
        poster_path: s.poster_path ? `${IMG()}/w300${s.poster_path}` : null
      }))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Episodes for a season
router.get('/series/:tmdbId/season/:season', async (req, res) => {
  try {
    const data = await tmdb(`/tv/${req.params.tmdbId}/season/${req.params.season}`);
    res.json((data.episodes || []).map(ep => ({
      id: `${req.params.tmdbId}-${req.params.season}-${ep.episode_number}`,
      tmdb_id: req.params.tmdbId,
      season_number: ep.season_number,
      episode_number: ep.episode_number,
      title: ep.name,
      overview: ep.overview,
      still_path: ep.still_path ? `${IMG()}/w300${ep.still_path}` : null,
      air_date: ep.air_date,
      rating: ep.vote_average || 0
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Genres
router.get('/genres/movie', async (req, res) => {
  try {
    const data = await tmdb('/genre/movie/list');
    res.json(data.genres);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/genres/tv', async (req, res) => {
  try {
    const data = await tmdb('/genre/tv/list');
    res.json(data.genres);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
