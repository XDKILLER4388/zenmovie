const router = require('express').Router();
const { resolveStream } = require('../services/streamResolver');
const { cache } = require('../config/cache');
const axios = require('axios');

// Resolve direct stream URLs for a movie/episode
router.get('/resolve', async (req, res) => {
  const { tmdb_id, type = 'movie', season = 1, episode = 1 } = req.query;
  if (!tmdb_id) return res.status(400).json({ error: 'tmdb_id required' });

  const cacheKey = `stream_${type}_${tmdb_id}_${season}_${episode}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const streams = await resolveStream(tmdb_id, type, parseInt(season), parseInt(episode));
    const result = { streams, tmdb_id, type };
    if (streams.length) cache.set(cacheKey, result, 1800); // cache 30min
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// HLS proxy — pipe m3u8 through our server so browser can play it
router.get('/hls', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://vidsrc.icu/',
        'Origin': 'https://vidsrc.icu'
      },
      responseType: 'stream',
      timeout: 15000
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    response.data.pipe(res);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
