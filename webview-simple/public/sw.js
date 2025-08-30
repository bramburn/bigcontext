/**
 * Service Worker for Simple Svelte Webview
 * Provides offline caching and performance optimization
 */

const CACHE_NAME = 'svelte-webview-v1';
const STATIC_CACHE_NAME = 'svelte-static-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/app.js',
  '/app.css',
  '/index.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip VS Code API calls
  if (url.protocol === 'vscode-webview:' || url.protocol === 'vscode-webview-resource:') {
    return;
  }
  
  // Handle static assets with cache-first strategy
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return pathname.endsWith('.js') || 
         pathname.endsWith('.css') || 
         pathname.endsWith('.html') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.svg');
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('[SW] Fetching and caching:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to handle static asset:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle generic requests with stale-while-revalidate strategy
async function handleGenericRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    // Serve from cache immediately if available
    if (cachedResponse) {
      console.log('[SW] Serving from cache (stale-while-revalidate):', request.url);
      
      // Update cache in background
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then(c => c.put(request, response));
          }
        })
        .catch(() => {
          // Ignore background update failures
        });
      
      return cachedResponse;
    }
    
    // No cache, fetch from network
    console.log('[SW] Fetching from network:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to handle request:', error);
    return new Response('Content not available offline', { status: 503 });
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_URLS':
      handleCacheUrls(payload.urls);
      break;
    case 'CLEAR_CACHE':
      handleClearCache();
      break;
    case 'GET_CACHE_STATUS':
      handleGetCacheStatus(event);
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Cache specific URLs
async function handleCacheUrls(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
    console.log('[SW] Cached URLs:', urls);
  } catch (error) {
    console.error('[SW] Failed to cache URLs:', error);
  }
}

// Clear all caches
async function handleClearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

// Get cache status
async function handleGetCacheStatus(event) {
  try {
    const cacheNames = await caches.keys();
    const status = {
      caches: cacheNames,
      timestamp: Date.now()
    };
    
    event.ports[0].postMessage(status);
  } catch (error) {
    console.error('[SW] Failed to get cache status:', error);
    event.ports[0].postMessage({ error: error.message });
  }
}

console.log('[SW] Service worker script loaded');
