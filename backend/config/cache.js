const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 3600,
  checkperiod: 600,
  useClones: false
});

const cacheMiddleware = (ttl = 3600) => (req, res, next) => {
  const key = `cache_${req.originalUrl}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);
  res.sendResponse = res.json.bind(res);
  res.json = (data) => {
    cache.set(key, data, ttl);
    res.sendResponse(data);
  };
  next();
};

module.exports = { cache, cacheMiddleware };
