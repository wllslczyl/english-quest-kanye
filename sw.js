/* ===== Kanye English Quest — Service Worker ===== */
var CACHE_NAME = 'kanye-eq-v2';

// All local assets to pre-cache on install
var LOCAL_ASSETS = [
  '/',
  'index.html',
  'style.css',
  'config.js',
  'words.js',
  'questions_beginner.js',
  'questions_intermediate.js',
  'questions_advanced.js',
  'questions_expert.js',
  'questions.js',
  'audio.js',
  'sidebar.js',
  'battle.js',
  'chat.js',
  'review.js',
  'main.js',
  'kirby_kanye.png',
  'manifest.json',
  // Album covers
  '专辑封面/The College Dropout.jpg',
  '专辑封面/Late Registration.jpg',
  '专辑封面/Graduation.jpg',
  '专辑封面/808s & Heartbreak.jpg',
  '专辑封面/My Beautiful Dark Twisted Fantasy.jpg',
  '专辑封面/Yeezus.jpg',
  '专辑封面/ye.jpg',
  '专辑封面/JESUS IS KING.jpg'
];

// Install: pre-cache all local assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Pre-caching ' + LOCAL_ASSETS.length + ' assets...');
      return cache.addAll(LOCAL_ASSETS).catch(function(err) {
        console.warn('[SW] Pre-cache error (some assets may be missing):', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Helper: check if a request URL is a local asset (not external API)
function isLocalAsset(url) {
  // Exclude external APIs
  if (url.indexOf('api.deepseek.com') !== -1) return false;
  // Exclude other external domains
  if (url.indexOf('://') !== -1 && url.indexOf(location.hostname) === -1) return false;
  return true;
}

// Fetch: stale-while-revalidate for local assets, network-only for external
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Always go to network for API calls
  if (url.indexOf('api.deepseek.com') !== -1) return;

  // For local assets: stale-while-revalidate
  // Serve from cache immediately, then update cache from network in background
  if (isLocalAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          var fetchPromise = fetch(event.request).then(function(networkResponse) {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(function() {
            // Network failed, will use cached version
          });
          // Return cached immediately if available, otherwise wait for network
          return cached || fetchPromise;
        });
      })
    );
  }
  // External resources (CDN): go to network
});
