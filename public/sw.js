// Basic Service Worker for PWA functionality

const CACHE_NAME = 'bill-haven-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Add other static assets here if needed, e.g., '/styles.css', '/script.js'
  // Vite will generate assets with hashes, so a more advanced setup is needed for production.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});