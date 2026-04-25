// StreamVault Service Worker — Ad & Redirect Blocker v2

const AD_DOMAINS = [
  'doubleclick.net', 'googlesyndication.com', 'googletagmanager.com',
  'googletagservices.com', 'google-analytics.com', 'adservice.google.com',
  'adnxs.com', 'adsrvr.org', 'advertising.com', 'adbrite.com',
  'adcolony.com', 'adform.net', 'adhigh.net', 'adition.com',
  'adjuggler.net', 'adkernel.com', 'adlightning.com', 'adloox.com',
  'admixer.net', 'adnium.com', 'adpushup.com', 'adroll.com',
  'ads.yahoo.com', 'adscale.de', 'adskeeper.co.uk', 'adsnative.com',
  'adsonar.com', 'adspirit.de', 'adsterra.com', 'adtech.de',
  'adtelligent.com', 'adtng.com', 'adtrue.com', 'adunity.com',
  'advangelists.com', 'adventori.com', 'adversal.com', 'adverticum.net',
  'advertising.com', 'aef.com', 'affiliateedge.com', 'agkn.com',
  'amazon-adsystem.com', 'amobee.com', 'appnexus.com', 'aralego.com',
  'atdmt.com', 'audienceiq.com', 'audrte.com', 'bidswitch.net',
  'blismedia.com', 'bongacams.com', 'brealtime.com', 'brightroll.com',
  'buysellads.com', 'casalemedia.com', 'cdn.adnxs.com', 'chartbeat.com',
  'clickadu.com', 'clickaine.com', 'clickbooth.com', 'clicksor.com',
  'clksite.com', 'cloudfront-labs.amazonaws.com', 'cmpnet.com',
  'comscore.com', 'contextweb.com', 'conversantmedia.com', 'cpx.to',
  'criteo.com', 'crsspxl.com', 'cxense.com', 'demdex.net',
  'doubleverify.com', 'driftt.com', 'dsp.io', 'dyntrk.com',
  'e-planning.net', 'emxdgt.com', 'everesttech.net', 'exoclick.com',
  'exponential.com', 'extreme-dm.com', 'eyeota.net', 'ezoic.com',
  'facebook.com/tr', 'fam-ad.com', 'flashtalking.com', 'freewheel.tv',
  'fusionads.net', 'gadstrack.com', 'gemius.pl', 'geozo.com',
  'getintent.com', 'gfycat.com', 'gumgum.com', 'highperformancecpm.com',
  'hotjar.com', 'httpool.com', 'iasds01.com', 'id5-sync.com',
  'imonomy.com', 'improvedigital.com', 'indexexchange.com', 'innity.com',
  'insightexpressai.com', 'intellicheck.com', 'intentiq.com',
  'intergi.com', 'ipredictive.com', 'iqm.com', 'juicyads.com',
  'justpremium.com', 'kargo.com', 'kiosked.com', 'krxd.net',
  'lijit.com', 'liveintent.com', 'lkqd.net', 'loopme.com',
  'lotame.com', 'lp4.io', 'lucidmedia.com', 'magnetmail.net',
  'marinsm.com', 'marketo.com', 'media.net', 'mediabong.com',
  'mediafuse.com', 'mediamind.com', 'mediaplex.com', 'mediavoice.com',
  'mgid.com', 'mixpanel.com', 'moatads.com', 'mopub.com',
  'mxptint.net', 'nativo.com', 'netmng.com', 'newrelic.com',
  'nexac.com', 'nielsen.com', 'nuggad.net', 'oath.com',
  'omnitagjs.com', 'omtrdc.net', 'onaudience.com', 'openx.net',
  'openx.org', 'optimizely.com', 'outbrain.com', 'owneriq.net',
  'p-td.com', 'parsely.com', 'pbstck.com', 'permutive.com',
  'pixfuture.com', 'playbuzz.com', 'plista.com', 'popads.net',
  'popcash.net', 'popmyads.com', 'popunder.ru', 'pornhub.com',
  'propellerads.com', 'pubmatic.com', 'pulse360.com', 'quantcast.com',
  'quantserve.com', 'revcontent.com', 'rfihub.com', 'richaudience.com',
  'rlcdn.com', 'roq.ad', 'rtbhouse.com', 'rubiconproject.com',
  'rxhui.com', 's.ad.smaato.net', 'sailthru.com', 'sas.com',
  'scorecardresearch.com', 'segment.com', 'segment.io', 'semasio.net',
  'servedby.flashtalking.com', 'sharethrough.com', 'simpli.fi',
  'sizmek.com', 'skimlinks.com', 'smartadserver.com', 'smartclip.net',
  'smartstream.tv', 'socdm.com', 'sonobi.com', 'sovrn.com',
  'spotxchange.com', 'springserve.com', 'srv.stackadapt.com',
  'stackadapt.com', 'statcounter.com', 'steelhousemedia.com',
  'strikead.com', 'summerhamster.com', 'supersonicads.com',
  'surveymonkey.com', 'synacor.com', 'taboola.com', 'tapad.com',
  'teads.tv', 'telaria.com', 'themoneytizer.com', 'tidaltv.com',
  'tiqcdn.com', 'trafficjunky.net', 'trafficleader.com',
  'trafficstars.com', 'trafmag.com', 'tribalfusion.com', 'triplelift.com',
  'trustarc.com', 'turn.com', 'tvpixel.com', 'tynt.com',
  'undertone.com', 'unrulymedia.com', 'useinsider.com', 'valueclick.com',
  'vertamedia.com', 'vidazoo.com', 'videohub.tv', 'viglink.com',
  'vimeo.com/ads', 'vrtcal.com', 'w55c.net', 'weborama.fr',
  'xaxis.com', 'xhamsternerd.com', 'yandex.ru/ads', 'yieldbot.com',
  'yieldlove.com', 'yieldmo.com', 'yieldoptimizer.com', 'yume.com',
  'zedo.com', 'zeotap.com', 'zonos.com',
  // Popup/redirect specific
  'popunder', 'pop-under', 'popcash', 'popads', 'propellerads',
  'adsterra', 'hilltopads', 'trafficstars', 'juicyads', 'exoclick',
];

const AD_URL_PATTERNS = [
  /\/ads?\//i, /\/adserver/i, /\/adservice/i, /\/popup/i,
  /\/popunder/i, /\/banner/i, /\/tracking/i, /\/pixel/i,
  /\/beacon/i, /\/analytics/i, /\/telemetry/i, /\/fingerprint/i,
];

function isAdRequest(url) {
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    if (AD_DOMAINS.some(d => hostname.includes(d))) return true;
    if (AD_URL_PATTERNS.some(p => p.test(url))) return true;
    return false;
  } catch {
    return false;
  }
}

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  const dest = e.request.destination;

  // Block ad requests — return empty response
  if (isAdRequest(url)) {
    e.respondWith(new Response('', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    }));
    return;
  }

  // Block navigation redirects to external sites coming from iframes
  if (e.request.mode === 'navigate') {
    try {
      const reqUrl = new URL(url);
      const swOrigin = new URL(self.location.href).origin;
      // If it's trying to navigate away from our app, block it
      if (reqUrl.origin !== swOrigin) {
        e.respondWith(new Response('<script>history.back()</script>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }));
        return;
      }
    } catch (_) {}
  }

  // Everything else passes through normally
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 200 })));
});
