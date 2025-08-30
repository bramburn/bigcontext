/**
 * Service Worker for React Webview
 * Provides offline caching and performance optimization
 */

const CACHE_NAME = 'react-webview-v1';
const STATIC_CACHE_NAME = 'react-static-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/app.js',
  '/app.css',
  '/index.html'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

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
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
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

// Check if request is an API call
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
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

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    console.log('[SW] Fetching API request:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('API not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Offline', message: 'API not available offline' })
    });
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
