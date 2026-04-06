// Service Worker — Pizzeria San Carino
// Strategie: Cache-First für App-Shell, Network-First für API

const CACHE_VER   = 'pizzeria-v1';
const SHELL_CACHE = CACHE_VER + '-shell';
const CDN_CACHE   = CACHE_VER + '-cdn';
const API_CACHE   = CACHE_VER + '-api';

const SHELL_ASSETS = [
  '/index.html',
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

  // Nur GET-Requests cachen
  if (req.method !== 'GET') return;

  // Anthropic API: immer direkt zum Netzwerk (nicht cachen)
  if (url.hostname === 'api.anthropic.com') return;

  // Lokaler Preisserver (localhost:3001): Network-First, 5min Cache-Fallback
  if (url.hostname === 'localhost' && url.port === '3001') {
    event.respondWith(networkFirst(req, API_CACHE, 5 * 60 * 1000));
    return;
  }

  // CDN-Ressourcen (Fonts, Tailwind, SheetJS): Cache-First
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(cacheFirst(req, CDN_CACHE));
    return;
  }

  // App-Dateien (.html, .js, .json, .png, .ico): Stale-While-Revalidate
  if (/\.(html|js|json|png|ico|webp|svg)$/.test(url.pathname) || url.pathname === '/') {
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
    return new Response('Offline', { status: 503 });
  }
}

// Network-First: Netzwerk versuchen, bei Fehler Cache mit TTL
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
    const cached = await caches.match(req);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
      if (Date.now() - cachedAt < maxAgeMs) return cached;
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

  return cached || (await networkFetch) || new Response('Offline', { status: 503 });
}
