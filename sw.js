const CACHE_NAME = 'zedminds-v2';
const ASSETS = [
  '/',
  '/index.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('Cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Skip Firebase, Groq and external APIs
  if(e.request.url.includes('groq.com') ||
     e.request.url.includes('googleapis.com') ||
     e.request.url.includes('firebase') ||
     e.request.url.includes('gstatic.com') ||
     e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(response => {
        if(response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if(e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
