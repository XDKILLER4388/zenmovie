const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Watch history
router.post('/history', authenticate, async (req, res) => {
  try {
    const { content_type, content_id, progress, duration } = req.body;
    const completed = duration > 0 && progress / duration >= 0.9;
    await db.execute(`
      INSERT INTO watch_history (user_id, content_type, content_id, progress, duration, completed)
      VALUES (?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE progress=VALUES(progress), duration=VALUES(duration),
        completed=VALUES(completed), updated_at=NOW()
    `, [req.user.id, content_type, content_id, progress || 0, duration || 0, completed]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(`
      SELECT wh.*, 
        CASE WHEN wh.content_type='movie' THEN m.title ELSE s.title END as title,
        CASE WHEN wh.content_type='movie' THEN m.poster_path ELSE s.poster_path END as poster_path,
        CASE WHEN wh.content_type='movie' THEN m.backdrop_path ELSE s.backdrop_path END as backdrop_path
      FROM watch_history wh
      LEFT JOIN movies m ON wh.content_type='movie' AND wh.content_id=m.id
      LEFT JOIN series s ON wh.content_type='episode' AND wh.content_id=s.id
      WHERE wh.user_id=?
      ORDER BY wh.updated_at DESC LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), parseInt(offset)]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bookmarks
router.post('/bookmarks', authenticate, async (req, res) => {
  try {
    const { content_type, content_id } = req.body;
    await db.execute(
      'INSERT IGNORE INTO bookmarks (user_id, content_type, content_id) VALUES (?,?,?)',
      [req.user.id, content_type, content_id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/bookmarks/:type/:id', authenticate, async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM bookmarks WHERE user_id=? AND content_type=? AND content_id=?',
      [req.user.id, req.params.type, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/bookmarks', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*,
        CASE WHEN b.content_type='movie' THEN m.title ELSE s.title END as title,
        CASE WHEN b.content_type='movie' THEN m.poster_path ELSE s.poster_path END as poster_path,
        CASE WHEN b.content_type='movie' THEN m.rating ELSE s.rating END as rating
      FROM bookmarks b
      LEFT JOIN movies m ON b.content_type='movie' AND b.content_id=m.id
      LEFT JOIN series s ON b.content_type='series' AND b.content_id=s.id
      WHERE b.user_id=? ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Recommendations based on watch history
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const [history] = await db.execute(
      "SELECT content_id FROM watch_history WHERE user_id=? AND content_type='movie' ORDER BY updated_at DESC LIMIT 10",
      [req.user.id]
    );
    if (!history.length) {
      const [popular] = await db.execute(
        'SELECT m.*, GROUP_CONCAT(DISTINCT g.name) as genres FROM movies m LEFT JOIN movie_genres mg ON m.id=mg.movie_id LEFT JOIN genres g ON mg.genre_id=g.id WHERE m.is_active=TRUE GROUP BY m.id ORDER BY m.popularity DESC LIMIT 12'
      );
      return res.json(popular.map(m => ({ ...m, genres: m.genres?.split(',') || [] })));
    }

    const ids = history.map(h => h.content_id);
    const [rows] = await db.execute(`
      SELECT m.*, GROUP_CONCAT(DISTINCT g.name) as genres,
        COUNT(DISTINCT mg2.genre_id) as score
      FROM movies m
      LEFT JOIN movie_genres mg ON m.id=mg.movie_id
      LEFT JOIN genres g ON mg.genre_id=g.id
      LEFT JOIN movie_genres mg2 ON m.id=mg2.movie_id
        AND mg2.genre_id IN (
          SELECT DISTINCT genre_id FROM movie_genres WHERE movie_id IN (${ids.map(() => '?').join(',')})
        )
      WHERE m.is_active=TRUE AND m.id NOT IN (${ids.map(() => '?').join(',')})
      GROUP BY m.id ORDER BY score DESC, m.popularity DESC LIMIT 12
    `, [...ids, ...ids]);

    res.json(rows.map(m => ({ ...m, genres: m.genres?.split(',') || [] })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
