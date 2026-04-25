const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { upsertMovie, upsertSeries, syncTrending, syncPopular, syncGenres } = require('../services/contentService');

router.use(authenticate, requireAdmin);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [[movies]] = await db.execute('SELECT COUNT(*) as count FROM movies WHERE is_active=TRUE');
    const [[series]] = await db.execute('SELECT COUNT(*) as count FROM series WHERE is_active=TRUE');
    const [[episodes]] = await db.execute('SELECT COUNT(*) as count FROM episodes WHERE is_active=TRUE');
    const [[users]] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [[streams]] = await db.execute('SELECT COUNT(*) as count FROM movie_streams WHERE is_active=TRUE');
    res.json({ movies: movies.count, series: series.count, episodes: episodes.count, users: users.count, streams: streams.count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Trigger manual sync
router.post('/sync/trending', async (req, res) => {
  try {
    await syncTrending();
    res.json({ success: true, message: 'Trending sync complete' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sync/popular', async (req, res) => {
  try {
    await syncPopular();
    res.json({ success: true, message: 'Popular sync complete' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sync/genres', async (req, res) => {
  try {
    await syncGenres();
    res.json({ success: true, message: 'Genres sync complete' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Fetch specific content by TMDb ID
router.post('/fetch/movie/:tmdbId', async (req, res) => {
  try {
    const id = await upsertMovie({ id: req.params.tmdbId });
    res.json({ success: true, id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fetch/series/:tmdbId', async (req, res) => {
  try {
    const id = await upsertSeries({ id: req.params.tmdbId });
    res.json({ success: true, id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Movies CRUD
router.get('/movies', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const [rows] = await db.execute('SELECT * FROM movies ORDER BY created_at DESC LIMIT ? OFFSET ?', [parseInt(limit), parseInt(offset)]);
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM movies');
    res.json({ results: rows, total, page: parseInt(page) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/movies/:id', async (req, res) => {
  try {
    const fields = ['title', 'overview', 'is_featured', 'is_trending', 'is_active', 'trailer_key'];
    const updates = fields.filter(f => req.body[f] !== undefined).map(f => `${f}=?`).join(',');
    const values = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
    if (!updates) return res.status(400).json({ error: 'No fields to update' });
    await db.execute(`UPDATE movies SET ${updates} WHERE id=?`, [...values, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/movies/:id', async (req, res) => {
  try {
    await db.execute('UPDATE movies SET is_active=FALSE WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Streams management
router.post('/movies/:id/streams', async (req, res) => {
  try {
    const { server_name, stream_url, quality, language, priority } = req.body;
    const [result] = await db.execute(
      'INSERT INTO movie_streams (movie_id, server_name, stream_url, quality, language, priority) VALUES (?,?,?,?,?,?)',
      [req.params.id, server_name, stream_url, quality || '1080p', language || 'en', priority || 1]
    );
    res.json({ success: true, id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/streams/:id', async (req, res) => {
  try {
    await db.execute('UPDATE movie_streams SET is_active=FALSE WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Users management
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, username, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { role, is_active } = req.body;
    await db.execute('UPDATE users SET role=?, is_active=? WHERE id=?', [role, is_active, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
