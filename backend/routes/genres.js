const router = require('express').Router();
const db = require('../config/db');
const { cacheMiddleware } = require('../config/cache');

router.get('/', cacheMiddleware(86400), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM genres ORDER BY name ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
