// Tikky Service Worker v1.0.0
// Liberia - Optimized for low-bandwidth & offline support

const CACHE_NAME = 'tikky-cache-v1';
const API_CACHE_NAME = 'tikky-api-v1';
const STATIC_CACHE_NAME = 'tikky-static-v1';

// Assets to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache (non-sensitive data)
const API_CACHE_ENDPOINTS = [
  '/api/events',
  '/api/polls'
];

// Install event - precache critical assets
self.addEventListener('install', event => {
  console.log('📦 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activated');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('tikky-') && 
                  name !== CACHE_NAME && 
                  name !== API_CACHE_NAME && 
                  name !== STATIC_CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy for API calls
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📴 Network failed, serving from cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API
    return new Response(
      JSON.stringify({ 
        error: 'offline',
        message: 'You are offline. Showing cached data.'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📴 Network failed for static asset:', request.url);
    
    // Return offline image placeholder
    if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return caches.match('/icons/icon-192x192.png');
    }
    
    return new Response('Offline', { status: 408 });
  }
}

// Stale-while-revalidate for HTML pages
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const networkPromise = fetch(request)
    .then(networkResponse => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch(() => null);
  
  return cachedResponse || networkPromise || caches.match('/offline');
}

// Liberia: Bandwidth-aware caching
async function bandwidthAwareFetch(request) {
  // Check if we're on slow connection
  const connection = navigator.connection || 
                     navigator.mozConnection || 
                     navigator.webkitConnection;
  
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.downlink < 0.5
  );

  // On slow connections, prefer cache aggressively
  if (isSlowConnection) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('🐢 Slow connection detected, serving from cache');
      return cachedResponse;
    }
  }

  return fetch(request);
}

// Fetch event - main request handler
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip browser extensions and analytics
  if (url.protocol === 'chrome-extension:' || 
      url.hostname.includes('google-analytics')) {
    return;
  }

  // API requests
  if (url.pathname.startsWith('/api/')) {
    // Only cache public API endpoints
    if (API_CACHE_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
      event.respondWith(networkFirst(event.request));
    } else {
      // Don't cache sensitive API endpoints
      event.respondWith(
        fetch(event.request)
          .catch(() => new Response(
            JSON.stringify({ error: 'Network error' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          ))
      );
    }
    return;
  }
  
  // Static assets (JS, CSS, images)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // HTML pages - stale-while-revalidate
  if (url.pathname.match(/^\/([^\/]*\.html?)?$/)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  // Default - network first
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-votes') {
    console.log('🔄 Background sync: syncing offline votes');
    event.waitUntil(syncOfflineVotes());
  }
  
  if (event.tag === 'sync-payments') {
    console.log('🔄 Background sync: checking pending payments');
    event.waitUntil(checkPendingPayments());
  }
});

// Sync offline votes
async function syncOfflineVotes() {
  const db = await openIndexedDB();
  const offlineVotes = await db.getAll('offlineVotes');
  
  for (const vote of offlineVotes) {
    try {
      const response = await fetch('/api/polls/' + vote.pollId + '/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vote.data)
      });
      
      if (response.ok) {
        await db.delete('offlineVotes', vote.id);
      }
    } catch (error) {
      console.error('Failed to sync vote:', error);
    }
  }
}

// IndexedDB helper for offline storage
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TikkyOfflineDB', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offlineVotes')) {
        db.createObjectStore('offlineVotes', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('offlinePayments')) {
        db.createObjectStore('offlinePayments', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Check pending payments
async function checkPendingPayments() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'CHECK_PENDING_PAYMENTS',
      timestamp: Date.now()
    });
  });
}

// Push notification handler (for Liberia SMS fallback)
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      ticketId: data.ticketId
    },
    actions: [
      { action: 'view', title: 'View Ticket' },
      { action: 'close', title: 'Close' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Tikky', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

console.log('✅ Tikky Service Worker registered');