const router = require('express').Router();
const axios = require('axios');

// Proxy route — serves embed page with redirect blocker injected
router.get('/embed', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');

  const allowed = [
    'moviesapi.club', 'vidlink.pro', 'vidsrc.cc',
    'vidsrc.icu', 'vidsrc.to', 'vidsrc.xyz', 'embed.su'
  ];
  try {
    const parsed = new URL(url);
    if (!allowed.some(d => parsed.hostname.endsWith(d))) {
      return res.status(403).send('Domain not allowed');
    }
  } catch {
    return res.status(400).send('Invalid url');
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Referer': 'https://www.google.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 12000,
      responseType: 'text'
    });

    let html = response.data;

    // Fix relative URLs
    const baseUrl = new URL(url);
    const base = `${baseUrl.protocol}//${baseUrl.host}`;
    if (!html.includes('<base ')) {
      html = html.replace(/<head>/i, `<head><base href="${base}">`);
    }

    // Inject redirect blocker as the VERY FIRST script — before anything else runs
    const blocker = `
<script>
(function() {
  // Block window.open popups
  window.open = function() { return null; };

  // Block top-level redirects — the main attack vector
  try {
    var _top = window.top;
    Object.defineProperty(window, 'top', {
      get: function() { return window; },
      configurable: true
    });
  } catch(e) {}

  // Block location changes
  var _loc = window.location;
  ['href','assign','replace'].forEach(function(prop) {
    try {
      if (prop === 'href') {
        Object.defineProperty(_loc, 'href', {
          set: function(v) {
            try {
              var u = new URL(v, window.location.origin);
              if (u.origin === window.location.origin) {
                window.location.assign(v);
              }
            } catch(e) {}
          },
          get: function() { return _loc.toString(); },
          configurable: true
        });
      }
    } catch(e) {}
  });

  // Block document.location
  try {
    Object.defineProperty(document, 'location', {
      get: function() { return window.location; },
      configurable: true
    });
  } catch(e) {}

  // Intercept all clicks — block external links
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (el && el.href) {
      try {
        var u = new URL(el.href);
        if (u.origin !== window.location.origin) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      } catch(ex) {}
    }
  }, true);
})();
</script>`;

    // Inject blocker right after <head> tag
    html = html.replace(/<head>/i, '<head>' + blocker);

    // Also strip known popup/redirect scripts
    html = html
      .replace(/window\.open\s*\([^)]*\)/g, 'void(0)')
      .replace(/window\.top\.location[^;]*/g, 'void(0)')
      .replace(/top\.location[^;]*/g, 'void(0)')
      .replace(/parent\.location[^;]*/g, 'void(0)')
      .replace(/<meta[^>]*http-equiv\s*=\s*["']refresh["'][^>]*>/gi, '');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  } catch (e) {
    // If proxy fails, return a page that just loads the original URL directly
    res.send(`<!DOCTYPE html><html><head><base href="${url}"></head><body>
      <script>window.location.href = ${JSON.stringify(url)};</script>
    </body></html>`);
  }
});

module.exports = router;
