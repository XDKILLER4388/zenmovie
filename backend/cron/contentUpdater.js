const cron = require('node-cron');
const { syncGenres, syncTrending, syncPopular } = require('../services/contentService');

console.log('🕐 Cron jobs initialized');

// Sync genres every 7 days (Sunday midnight)
cron.schedule('0 0 * * 0', async () => {
  console.log('[CRON] Syncing genres...');
  try { await syncGenres(); } catch (e) { console.error('[CRON] Genre sync failed:', e.message); }
});

// Sync trending content every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Syncing trending content...');
  try { await syncTrending(); } catch (e) { console.error('[CRON] Trending sync failed:', e.message); }
});

// Sync popular content daily at 3am
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Syncing popular content...');
  try { await syncPopular(); } catch (e) { console.error('[CRON] Popular sync failed:', e.message); }
});

// Run initial sync on startup
(async () => {
  try {
    await syncGenres();
    await syncTrending();
    await syncPopular();
  } catch (e) {
    console.error('[CRON] Initial sync failed:', e.message);
  }
})();
