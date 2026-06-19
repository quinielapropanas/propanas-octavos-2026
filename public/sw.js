// ═══════════════════════════════════════════════════════════
// ProPanas 2026 — Service Worker v2
//
// Cache strategies:
//   - API requests:  network-only (never cache, always fresh)
//   - Static assets: cache-first (immutable, long TTL)
//   - HTML pages:    network-first with offline fallback
//   - Flags/fonts:   stale-while-revalidate
//
// Versioning via CACHE_VERSION — bump to invalidate all caches on deploy.
// ═══════════════════════════════════════════════════════════

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `propanas-2026-${CACHE_VERSION}`;
const STATIC_CACHE = `propanas-static-${CACHE_VERSION}`;
const PAGE_CACHE = `propanas-pages-${CACHE_VERSION}`;

const OFFLINE_URL = '/offline.html';

// Core shell — precached on install
const PRECACHE_URLS = [
  '/',
  '/login',
  '/manifest.json',
  OFFLINE_URL,
  '/icon-192.png',
  '/icon-512.png',
  '/apple-icon-180.png',
];

// ─── Install: precache core shell ────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Use { cache: 'reload' } to bypass HTTP cache during install
      await cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      // Activate the new SW immediately
      self.skipWaiting();
    })()
  );
});

// ─── Activate: clean old caches + take control ──────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete caches that don't match current version
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => !key.endsWith(CACHE_VERSION))
          .map(key => caches.delete(key))
      );
      // Enable navigation preload for faster HTML responses
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
      // Take control of all open clients
      await self.clients.claim();
    })()
  );
});

// ─── Fetch: route by request type ────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Non-GET requests → network-only (don't touch cache)
  if (request.method !== 'GET') return;

  // Chrome extensions, data URLs → skip
  if (!url.protocol.startsWith('http')) return;

  // Cross-origin → skip (let browser handle)
  if (url.origin !== self.location.origin) return;

  // API requests → network-only (always fresh, no caching)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'offline', message: 'No hay conexión' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Supabase auth endpoints → network-only
  if (url.pathname.startsWith('/auth/')) return;

  // Static assets (flags, icons, fonts, images) → cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages → network-first with offline fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstHTML(event));
    return;
  }

  // Everything else (JS, CSS) → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// ─── Strategies ──────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 504 });
  }
}

async function networkFirstHTML(event) {
  try {
    // Use navigation preload if available (faster than fetch)
    const preload = await event.preloadResponse;
    if (preload) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(event.request, preload.clone()).catch(() => {});
      return preload;
    }
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(event.request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    // Offline fallback chain: cached page → offline page
    const cached = await caches.match(event.request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        caches.open(cacheName).then(cache => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ─── Helpers ─────────────────────────────────────────────

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/flags/') ||
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/fonts/') ||
    /\.(woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico|gif)$/i.test(pathname)
  );
}

// ─── Message channel (for manual update trigger) ─────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
