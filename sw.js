// Service Worker — Pizzeria San Carino
// Strategie: Cache-First für App-Shell, Network-First für API

const CACHE_VER   = 'pizzeria-v4';
const SHELL_CACHE = CACHE_VER + '-shell';
const CDN_CACHE   = CACHE_VER + '-cdn';
const API_CACHE   = CACHE_VER + '-api';

const SHELL_ASSETS = [
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

const CDN_HOSTS = [
  'cdn.tailwindcss.com',
  'cdn.sheetjs.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// ── Install: App-Shell cachen ─────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install-Fehler (ignoriert):', err))
  );
});

// ── Activate: Alte Caches löschen ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('pizzeria-') && ![SHELL_CACHE, CDN_CACHE, API_CACHE].includes(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Routing-Strategie ──────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Nur GET-Requests
  if (req.method !== 'GET') return;

  // Anthropic API: immer direkt zum Netzwerk
  if (url.hostname === 'api.anthropic.com') return;

  // Open Food Facts (Barcode-Lookup): direkt Netzwerk
  if (url.hostname.includes('openfoodfacts.org')) return;

  // Externe APIs (localhost:3001): Network-First, 5min Cache-Fallback
  if (url.hostname === 'localhost' && url.port === '3001') {
    event.respondWith(networkFirst(req, API_CACHE, 5 * 60 * 1000));
    return;
  }

  // CDN-Ressourcen (Fonts, Tailwind, SheetJS, html5-qrcode): Cache-First (lang gecacht)
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(cacheFirst(req, CDN_CACHE));
    return;
  }

  // Lokale App-Dateien (JS, CSS): IMMER Network-First — keine veralteten Versionen
  // Bei Offline → Cache als Fallback
  if (url.hostname === 'localhost' && /\.(js|css)$/.test(url.pathname)) {
    event.respondWith(networkFirst(req, SHELL_CACHE, 0)); // maxAgeMs=0 = immer frisch
    return;
  }

  // HTML & Icons: Stale-While-Revalidate (Seite startet schnell, aktualisiert im Hintergrund)
  if (/\.(html|png|ico|webp|svg|json)$/.test(url.pathname) || url.pathname === '/') {
    event.respondWith(staleWhileRevalidate(req, SHELL_CACHE));
    return;
  }
});

// ── Hilfsfunktionen ───────────────────────────────────────────────

// Cache-First: aus Cache, sonst Netzwerk + in Cache speichern
async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch (_) {
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response('Offline - Server nicht erreichbar', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

// Network-First: Netzwerk versuchen, bei Fehler Cache als Fallback
// maxAgeMs=0 → Cache-Fallback immer erlaubt (kein TTL), aber Netzwerk hat Vorrang
async function networkFirst(req, cacheName, maxAgeMs) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      const headers = new Headers(res.headers);
      headers.set('sw-cached-at', Date.now().toString());
      const stored = new Response(await res.clone().blob(), { headers, status: res.status });
      cache.put(req, stored);
    }
    return res;
  } catch (_) {
    // Netzwerk nicht erreichbar → Cache als Fallback
    const cached = await caches.match(req);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
      // maxAgeMs=0 → immer Cache-Fallback erlaubt (offline-Modus)
      if (maxAgeMs === 0 || Date.now() - cachedAt < maxAgeMs) return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale-While-Revalidate: sofort aus Cache, im Hintergrund aktualisieren
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);

  const networkFetch = fetch(req).then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);

  if (cached) return cached;
  const networkRes = await networkFetch;
  if (networkRes) return networkRes;
  const offlinePage = await caches.match('/offline.html');
  return offlinePage || new Response('Offline - Server nicht erreichbar', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// Notification-Klick: App öffnen und zum Tab navigieren
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const tab = event.notification.data?.tab || 'dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'navigate', tab: tab });
          return;
        }
      }
      return clients.openWindow('/index.html');
    })
  );
});
