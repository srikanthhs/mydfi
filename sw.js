// Offline support: the app opens straight from its saved copy, and a fresh copy is
// fetched in the background; when it differs the page is told so it can offer a refresh.
// Firebase traffic is never touched.
const CACHE = 'field-visits-v17';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
const CDN = ['cdnjs.cloudflare.com'];
const HASHED = /^\/app\.[0-9a-f]+\.(js|css)$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch the page, save it, and drop app.*.js/css files the new page no longer uses
async function refreshPage() {
  const res = await fetch('/', { cache: 'no-cache' });
  if (!res.ok) return { res, changed: false };
  const cache = await caches.open(CACHE);
  const old = await cache.match('/');
  const text = await res.clone().text();
  const changed = !!old && (await old.text()) !== text;
  await cache.put('/', res.clone());
  for (const req of await cache.keys()) {
    const p = new URL(req.url).pathname;
    if (HASHED.test(p) && !text.includes(p)) await cache.delete(req);
  }
  return { res, changed };
}

async function tellPagesUpdateReady() {
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  wins.forEach(w => w.postMessage({ type: 'update-ready' }));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pages: saved copy first so it opens instantly on any signal, network refresh behind it
  if (req.mode === 'navigate' && url.origin === location.origin && (url.pathname === '/' || url.pathname === '/index.html')) {
    e.respondWith(caches.match('/').then(hit => {
      const refresh = refreshPage();
      if (hit) {
        e.waitUntil(refresh.then(r => r.changed && tellPagesUpdateReady()).catch(() => {}));
        return hit;
      }
      return refresh.then(r => r.res).catch(() => fetch(req));
    }));
    return;
  }

  // Our own static files and pinned CDN libraries: cache first
  if (url.origin === location.origin || CDN.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});

// Tapping a phone alert opens the app (or brings it forward) at the right place
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const go = e.notification.data && e.notification.data.go;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
    const w = wins[0];
    if (w) return w.focus().then(() => w.postMessage({ type: 'nf-go', go }));
    return self.clients.openWindow('/');
  }));
});
