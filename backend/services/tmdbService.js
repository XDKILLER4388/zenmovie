const axios = require('axios');

const BASE = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const KEY = process.env.TMDB_API_KEY;
const IMG = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

const tmdb = axios.create({ baseURL: BASE, params: { api_key: KEY } });

const imgUrl = (path, size = 'w500') => path ? `${IMG}/${size}${path}` : null;

const getMovies = async (endpoint, params = {}) => {
  const { data } = await tmdb.get(endpoint, { params });
  return data;
};

module.exports = {
  imgUrl,

  async fetchTrendingMovies(page = 1) {
    return getMovies('/trending/movie/week', { page });
  },

  async fetchPopularMovies(page = 1) {
    return getMovies('/movie/popular', { page });
  },

  async fetchNowPlayingMovies(page = 1) {
    return getMovies('/movie/now_playing', { page });
  },

  async fetchTopRatedMovies(page = 1) {
    return getMovies('/movie/top_rated', { page });
  },

  async fetchMovieDetails(tmdbId) {
    return getMovies(`/movie/${tmdbId}`, {
      append_to_response: 'videos,credits,similar'
    });
  },

  async fetchTrendingSeries(page = 1) {
    return getMovies('/trending/tv/week', { page });
  },

  async fetchPopularSeries(page = 1) {
    return getMovies('/tv/popular', { page });
  },

  async fetchSeriesDetails(tmdbId) {
    return getMovies(`/tv/${tmdbId}`, {
      append_to_response: 'videos,credits,similar'
    });
  },

  async fetchSeasonDetails(tmdbId, seasonNumber) {
    return getMovies(`/tv/${tmdbId}/season/${seasonNumber}`);
  },

  async searchMulti(query, page = 1) {
    return getMovies('/search/multi', { query, page });
  },

  async fetchGenres() {
    const [movies, tv] = await Promise.all([
      getMovies('/genre/movie/list'),
      getMovies('/genre/tv/list')
    ]);
    const all = [...movies.genres, ...tv.genres];
    return [...new Map(all.map(g => [g.id, g])).values()];
  },

  async discoverMovies(params = {}) {
    return getMovies('/discover/movie', { sort_by: 'popularity.desc', ...params });
  },

  async discoverSeries(params = {}) {
    return getMovies('/discover/tv', { sort_by: 'popularity.desc', ...params });
  }
};
