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
  if (url.pathname === '/admin' || url.pathname === '/admin/') {
    e.respondWith(new Response('<!DOCTYPE html><html lang=en-IN><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Access Denied</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Calibri,Arial,sans-serif;background:#0a0f1d;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}.card{background:#192233;border:1px solid #334155;border-radius:1rem;padding:3rem 2.5rem;max-width:440px;width:100%;text-align:center}.icon{width:56px;height:56px;border-radius:50%;background:rgba(37,99,235,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;color:#3b82f6}h1{font-size:1.5rem;font-weight:700;margin-bottom:.5rem}p{color:#94a3b8;font-size:.95rem;line-height:1.6;margin-bottom:1.5rem}.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;background:#2563eb;color:#fff;border-radius:.5rem;font-weight:600;font-size:.9rem;text-decoration:none;transition:opacity .2s}.btn:hover{opacity:.9}.note{font-size:.8rem;color:#64748b;margin-top:1.25rem}</style></head><body><div class=card><div class=icon><svg width=26 height=26 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><rect x=3 y=11 width=18 height=11 rx=2 ry=2/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h1>Access Restricted</h1><p>The admin panel is not available at this address. Use /backend to log in.</p><a href=/backend class=btn>Go to /backend</a><div class=note>Mahalaxmi Mobile Center</div></div></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
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
