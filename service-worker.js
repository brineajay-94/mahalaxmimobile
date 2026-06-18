var CACHE = 'mahalaxmi-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll([
        '/',
        'index.html',
        'about.html',
        'repairs.html',
        'settings.html',
        '404.html',
        'css/style.css',
        'js/user-app.js',
        'sheets-api.js',
        'manifest.json',
        'assets/logo.png',
        'backend.html',
        'assets/slider0.png',
        'assets/slider1.png',
        'assets/slider2.jpg'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.pathname === '/backend' || url.pathname === '/backend/') {
    e.respondWith(caches.match('backend.html') || fetch('backend.html'));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) {
        return caches.open(CACHE).then(function (c) {
          if (e.request.method === 'GET') c.put(e.request, res.clone());
          return res;
        });
      }).catch(function () {
        return caches.match('404.html');
      });
    })
  );
});
