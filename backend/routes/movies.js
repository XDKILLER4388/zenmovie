const router = require('express').Router();
const db = require('../config/db');
const { cacheMiddleware } = require('../config/cache');
const { optionalAuth } = require('../middleware/auth');

const movieSelect = `
  SELECT m.*, GROUP_CONCAT(DISTINCT g.name) as genres
  FROM movies m
  LEFT JOIN movie_genres mg ON m.id = mg.movie_id
  LEFT JOIN genres g ON mg.genre_id = g.id
  WHERE m.is_active = TRUE
`;

router.get('/', cacheMiddleware(1800), async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, year, sort = 'popularity' } = req.query;
    const offset = (page - 1) * limit;
    const sortMap = { popularity: 'popularity DESC', rating: 'rating DESC', newest: 'release_date DESC', title: 'title ASC' };
    const orderBy = sortMap[sort] || 'popularity DESC';

    let where = 'WHERE m.is_active = TRUE';
    const params = [];
    if (genre) { where += ' AND g.name = ?'; params.push(genre); }
    if (year) { where += ' AND YEAR(m.release_date) = ?'; params.push(year); }

    const [rows] = await db.execute(`
      SELECT m.*, GROUP_CONCAT(DISTINCT g.name) as genres
      FROM movies m
      LEFT JOIN movie_genres mg ON m.id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      ${where} GROUP BY m.id ORDER BY m.${orderBy} LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(DISTINCT m.id) as total FROM movies m LEFT JOIN movie_genres mg ON m.id=mg.movie_id LEFT JOIN genres g ON mg.genre_id=g.id ${where}`,
      params
    );

    res.json({ results: rows.map(formatMovie), total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/featured', cacheMiddleware(3600), async (req, res) => {
  try {
    const [rows] = await db.execute(`${movieSelect} AND m.is_featured=TRUE GROUP BY m.id ORDER BY m.popularity DESC LIMIT 5`);
    res.json(rows.map(formatMovie));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/trending', cacheMiddleware(1800), async (req, res) => {
  try {
    const [rows] = await db.execute(`${movieSelect} AND m.is_trending=TRUE GROUP BY m.id ORDER BY m.popularity DESC LIMIT 20`);
    res.json(rows.map(formatMovie));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/top-rated', cacheMiddleware(3600), async (req, res) => {
  try {
    const [rows] = await db.execute(`${movieSelect} GROUP BY m.id ORDER BY m.rating DESC, m.vote_count DESC LIMIT 20`);
    res.json(rows.map(formatMovie));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [[movie]] = await db.execute(`${movieSelect} AND m.id=? GROUP BY m.id`, [req.params.id]);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const [streams] = await db.execute(
      'SELECT * FROM movie_streams WHERE movie_id=? AND is_active=TRUE ORDER BY priority ASC',
      [movie.id]
    );
    const [subtitles] = await db.execute(
      "SELECT * FROM subtitles WHERE content_type='movie' AND content_id=?",
      [movie.id]
    );

    res.json({ ...formatMovie(movie), streams, subtitles });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/recommendations', cacheMiddleware(3600), async (req, res) => {
  try {
    const [[movie]] = await db.execute('SELECT * FROM movies WHERE id=?', [req.params.id]);
    if (!movie) return res.status(404).json({ error: 'Not found' });

    const [rows] = await db.execute(`
      SELECT m.*, GROUP_CONCAT(DISTINCT g.name) as genres,
        COUNT(DISTINCT mg2.genre_id) as shared_genres
      FROM movies m
      LEFT JOIN movie_genres mg ON m.id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      LEFT JOIN movie_genres mg2 ON m.id = mg2.movie_id
        AND mg2.genre_id IN (SELECT genre_id FROM movie_genres WHERE movie_id=?)
      WHERE m.is_active=TRUE AND m.id != ?
      GROUP BY m.id ORDER BY shared_genres DESC, m.popularity DESC LIMIT 12
    `, [req.params.id, req.params.id]);

    res.json(rows.map(formatMovie));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function formatMovie(m) {
  return {
    ...m,
    genres: m.genres ? m.genres.split(',') : []
  };
}

module.exports = router;
