import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use(config => {
  const token = localStorage.getItem('sv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sv_token');
      localStorage.removeItem('sv_user');
    }
    return Promise.reject(err.response?.data || err);
  }
);

export const api = {
  // Auth
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  getMe: () => client.get('/auth/me'),

  // Movies
  getMovies: (params) => client.get('/movies', { params }),
  getFeaturedMovies: () => client.get('/movies/featured'),
  getTrendingMovies: () => client.get('/movies/trending'),
  getTopRatedMovies: () => client.get('/movies/top-rated'),
  getMovie: (id) => client.get(`/movies/${id}`),
  getMovieRecommendations: (id) => client.get(`/movies/${id}/recommendations`),

  // Series
  getSeries: (params) => client.get('/series', { params }),
  getFeaturedSeries: () => client.get('/series/featured'),
  getTrendingSeries: () => client.get('/series/trending'),
  getSeriesById: (id) => client.get(`/series/${id}`),
  getEpisodes: (id, season) => client.get(`/series/${id}/seasons/${season}/episodes`),
  getEpisodeStreams: (episodeId) => client.get(`/series/episodes/${episodeId}/streams`),

  // Search
  search: (params) => client.get('/search', { params }),

  // Genres
  getGenres: () => client.get('/genres'),

  // User
  addHistory: (data) => client.post('/user/history', data),
  getHistory: (params) => client.get('/user/history', { params }),
  addBookmark: (data) => client.post('/user/bookmarks', data),
  removeBookmark: (type, id) => client.delete(`/user/bookmarks/${type}/${id}`),
  getBookmarks: () => client.get('/user/bookmarks'),
  getRecommendations: () => client.get('/user/recommendations'),

  // Discover (live TMDb - no DB needed, access everything)
  discoverMovies: (params) => client.get('/discover/movies', { params }),
  discoverSeries: (params) => client.get('/discover/series', { params }),
  getTrending: () => client.get('/discover/trending'),
  getDiscoverMovie: (tmdbId) => client.get(`/discover/movie/${tmdbId}`),
  getDiscoverSeries: (tmdbId) => client.get(`/discover/series/${tmdbId}`),
  getDiscoverEpisodes: (tmdbId, season) => client.get(`/discover/series/${tmdbId}/season/${season}`),
  getMovieGenres: () => client.get('/discover/genres/movie'),
  getTVGenres: () => client.get('/discover/genres/tv'),
  getAdminStats: () => client.get('/admin/stats'),
  getAdminMovies: (params) => client.get('/admin/movies', { params }),
  updateMovie: (id, data) => client.put(`/admin/movies/${id}`, data),
  deleteMovie: (id) => client.delete(`/admin/movies/${id}`),
  addStream: (movieId, data) => client.post(`/admin/movies/${movieId}/streams`, data),
  deleteStream: (id) => client.delete(`/admin/streams/${id}`),
  getAdminUsers: () => client.get('/admin/users'),
  updateUser: (id, data) => client.put(`/admin/users/${id}`, data),
  syncTrending: () => client.post('/admin/sync/trending'),
  syncPopular: () => client.post('/admin/sync/popular'),
  fetchMovie: (tmdbId) => client.post(`/admin/fetch/movie/${tmdbId}`),
  fetchSeries: (tmdbId) => client.post(`/admin/fetch/series/${tmdbId}`),
};

export default client;
