const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Extract m3u8 / mp4 URLs from a page's HTML/JS
function extractStreamUrls(html) {
  const urls = [];
  // Match .m3u8 URLs
  const m3u8 = [...html.matchAll(/https?:\/\/[^\s"'\\]+\.m3u8[^\s"'\\]*/g)];
  m3u8.forEach(m => urls.push({ url: m[0], type: 'hls' }));
  // Match .mp4 URLs
  const mp4 = [...html.matchAll(/https?:\/\/[^\s"'\\]+\.mp4[^\s"'\\]*/g)];
  mp4.forEach(m => urls.push({ url: m[0], type: 'mp4' }));
  return urls;
}

// Try to resolve a direct stream from vidsrc.icu
async function resolveVidsrcIcu(tmdbId, type = 'movie', season, episode) {
  try {
    const url = type === 'movie'
      ? `https://vidsrc.icu/embed/movie/${tmdbId}`
      : `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}`;

    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(html);

    // Look for iframe src pointing to actual player
    const iframes = [];
    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) iframes.push(src);
    });

    // Extract any stream URLs directly in the page
    const streams = extractStreamUrls(html);

    return { iframes, streams, source: 'vidsrc.icu' };
  } catch (e) {
    return null;
  }
}

// Try to resolve from vidsrc.cc
async function resolveVidsrcCc(tmdbId, type = 'movie', season, episode) {
  try {
    const url = type === 'movie'
      ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
      : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;

    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const streams = extractStreamUrls(html);
    const $ = cheerio.load(html);
    const iframes = [];
    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) iframes.push(src);
    });

    return { iframes, streams, source: 'vidsrc.cc' };
  } catch (e) {
    return null;
  }
}

// Follow an iframe src and try to extract stream from it
async function resolveIframe(iframeSrc) {
  try {
    const base = iframeSrc.startsWith('//') ? 'https:' + iframeSrc : iframeSrc;
    const { data: html } = await axios.get(base, {
      headers: { ...HEADERS, Referer: 'https://vidsrc.icu/' },
      timeout: 10000
    });
    return extractStreamUrls(html);
  } catch {
    return [];
  }
}

// Main resolver — tries multiple sources
async function resolveStream(tmdbId, type = 'movie', season = 1, episode = 1) {
  const results = await Promise.allSettled([
    resolveVidsrcIcu(tmdbId, type, season, episode),
    resolveVidsrcCc(tmdbId, type, season, episode),
  ]);

  const streams = [];

  for (const r of results) {
    if (r.status !== 'fulfilled' || !r.value) continue;
    const { iframes, streams: direct, source } = r.value;

    // Add direct streams found in page
    for (const s of direct) {
      streams.push({ ...s, source });
    }

    // Follow iframes and extract streams
    for (const iframe of iframes.slice(0, 3)) {
      const iframeStreams = await resolveIframe(iframe);
      for (const s of iframeStreams) {
        streams.push({ ...s, source: `${source}/iframe` });
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  return streams.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

module.exports = { resolveStream };
