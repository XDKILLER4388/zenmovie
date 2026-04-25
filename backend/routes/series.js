const router = require('express').Router();
const db = require('../config/db');
const { cacheMiddleware } = require('../config/cache');
const { optionalAuth } = require('../middleware/auth');

const seriesSelect = `
  SELECT s.*, GROUP_CONCAT(DISTINCT g.name) as genres
  FROM series s
  LEFT JOIN series_genres sg ON s.id = sg.series_id
  LEFT JOIN genres g ON sg.genre_id = g.id
  WHERE s.is_active = TRUE
`;

router.get('/', cacheMiddleware(1800), async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, year, sort = 'popularity' } = req.query;
    const offset = (page - 1) * limit;
    const sortMap = { popularity: 'popularity DESC', rating: 'rating DESC', newest: 'first_air_date DESC', title: 'title ASC' };
    const orderBy = sortMap[sort] || 'popularity DESC';

    let where = 'WHERE s.is_active = TRUE';
    const params = [];
    if (genre) { where += ' AND g.name = ?'; params.push(genre); }
    if (year) { where += ' AND YEAR(s.first_air_date) = ?'; params.push(year); }

    const [rows] = await db.execute(`
      SELECT s.*, GROUP_CONCAT(DISTINCT g.name) as genres
      FROM series s
      LEFT JOIN series_genres sg ON s.id = sg.series_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      ${where} GROUP BY s.id ORDER BY s.${orderBy} LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(DISTINCT s.id) as total FROM series s LEFT JOIN series_genres sg ON s.id=sg.series_id LEFT JOIN genres g ON sg.genre_id=g.id ${where}`,
      params
    );

    res.json({ results: rows.map(formatSeries), total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/trending', cacheMiddleware(1800), async (req, res) => {
  try {
    const [rows] = await db.execute(`${seriesSelect} AND s.is_trending=TRUE GROUP BY s.id ORDER BY s.popularity DESC LIMIT 20`);
    res.json(rows.map(formatSeries));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/featured', cacheMiddleware(3600), async (req, res) => {
  try {
    const [rows] = await db.execute(`${seriesSelect} AND s.is_featured=TRUE GROUP BY s.id ORDER BY s.popularity DESC LIMIT 5`);
    res.json(rows.map(formatSeries));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [[series]] = await db.execute(`${seriesSelect} AND s.id=? GROUP BY s.id`, [req.params.id]);
    if (!series) return res.status(404).json({ error: 'Series not found' });

    const [seasons] = await db.execute(
      'SELECT * FROM seasons WHERE series_id=? ORDER BY season_number ASC',
      [series.id]
    );

    res.json({ ...formatSeries(series), seasons });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/seasons/:season/episodes', cacheMiddleware(3600), async (req, res) => {
  try {
    const [episodes] = await db.execute(
      'SELECT * FROM episodes WHERE series_id=? AND season_number=? AND is_active=TRUE ORDER BY episode_number ASC',
      [req.params.id, req.params.season]
    );
    res.json(episodes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/episodes/:episodeId/streams', async (req, res) => {
  try {
    const [streams] = await db.execute(
      'SELECT * FROM episode_streams WHERE episode_id=? AND is_active=TRUE ORDER BY priority ASC',
      [req.params.episodeId]
    );
    const [subtitles] = await db.execute(
      "SELECT * FROM subtitles WHERE content_type='episode' AND content_id=?",
      [req.params.episodeId]
    );
    res.json({ streams, subtitles });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function formatSeries(s) {
  return { ...s, genres: s.genres ? s.genres.split(',') : [] };
}

module.exports = router;
