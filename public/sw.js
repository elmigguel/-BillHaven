/**
 * BillHaven Service Worker
 * Enhanced PWA with offline support, background sync, and push notifications
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `billhaven-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `billhaven-runtime-${CACHE_VERSION}`;

// Static assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
];

// API routes that should always go to network
const NETWORK_ONLY_ROUTES = [
  '/api/',
  'supabase.co',
  'polygonscan.com',
  'wallet',
];

// Cache-first routes (static assets)
const CACHE_FIRST_ROUTES = [
  '/assets/',
  '/icons/',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing BillHaven Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('billhaven-') && name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Network-only for API calls
  if (NETWORK_ONLY_ROUTES.some(route => request.url.includes(route))) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Cache-first for static assets
  if (CACHE_FIRST_ROUTES.some(route => request.url.includes(route))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(staleWhileRevalidate(request));
});

// Network-only strategy
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Network request failed:', request.url);
    return new Response('Network error', { status: 503 });
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache-first failed:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.log('[SW] Fetch failed, serving cached:', request.url);
      return cached;
    });

  return cached || fetchPromise;
}

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  if (event.tag === 'bill-payment') {
    event.waitUntil(syncBillPayments());
  }
});

async function syncBillPayments() {
  // Get queued payments from IndexedDB and retry
  console.log('[SW] Syncing offline bill payments...');
  // Implementation would go here
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let notificationData = {
    title: 'BillHaven',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'billhaven-notification',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Message handler for communicating with the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

console.log('[SW] BillHaven Service Worker loaded');
