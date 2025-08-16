// Service Worker for Claimso PWA
// Provides offline support, caching, and performance optimization

const CACHE_NAME = 'claimso-v1';
const STATIC_CACHE = 'claimso-static-v1';
const DYNAMIC_CACHE = 'claimso-dynamic-v1';
const API_CACHE = 'claimso-api-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/next.svg',
  '/vercel.svg',
  '/file.svg',
  '/globe.svg',
  '/window.svg',
  '/logos/amazon.svg',
  '/logos/apple.svg',
  '/logos/bestbuy.svg',
  '/logos/decluttr.svg',
  '/logos/default.svg',
  '/logos/flipkart.svg',
  '/logos/gazelle.svg',
  '/logos/johnlewis.svg',
  '/logos/mediamarkt.svg',
  '/logos/swappa.svg',
  '/logos/target.svg',
  '/logos/walmart.svg',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/products',
  '/api/warranties',
  '/api/user-connections',
  '/api/analytics',
  '/api/notifications',
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip RSC (React Server Components) requests - let them go through normally
  if (url.searchParams.has('_rsc')) {
    return;
  }

  // Skip auth-related requests completely
  if (url.pathname.startsWith('/auth/') || 
      url.pathname.includes('callback') || 
      url.pathname.includes('error')) {
    return;
  }

  // Skip API requests during development or when they might fail
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/_next/') || url.pathname.includes('.')) {
    // Static assets - cache-first strategy
    event.respondWith(handleStaticRequest(request));
  } else {
    // Page requests - network-first strategy (but only for existing pages)
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network failed for API request', request.url);
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline response for API requests
  return new Response(
    JSON.stringify({ 
      error: 'Offline', 
      message: 'No internet connection. Please check your connection and try again.' 
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset', request.url);
    
    // Return a placeholder for images
    if (request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
      return new Response(
        '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#9ca3af">Image</text></svg>',
        {
          headers: { 'Content-Type': 'image/svg+xml' }
        }
      );
    }
    
    throw error;
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  const url = new URL(request.url);
  
  // List of known existing pages
  const existingPages = [
    '/',
    '/dashboard',
    '/products',
    '/cart',
    '/settings/account',
    '/settings/notifications',
    '/admin/data-dashboard',
    '/share/product'
  ];

  // Check if this is a known page
  const isKnownPage = existingPages.some(page => url.pathname.startsWith(page));
  
  // If it's not a known page, let it fail normally (don't intercept)
  if (!isKnownPage) {
    return fetch(request);
  }

  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network failed for page request', request.url);
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Only return offline page for known pages when offline
  if (!navigator.onLine) {
    return caches.match('/offline.html');
  }
  
  // Let the request fail normally
  throw new Error('Network request failed');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

// Perform background sync
async function performBackgroundSync() {
  try {
    // Get stored offline actions
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await performOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync action', action, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Store offline action
async function storeOfflineAction(action) {
  const db = await openIndexedDB();
  const transaction = db.transaction(['offlineActions'], 'readwrite');
  const store = transaction.objectStore('offlineActions');
  
  await store.add({
    id: Date.now().toString(),
    action,
    timestamp: Date.now()
  });
}

// Get stored offline actions
async function getOfflineActions() {
  const db = await openIndexedDB();
  const transaction = db.transaction(['offlineActions'], 'readonly');
  const store = transaction.objectStore('offlineActions');
  
  return await store.getAll();
}

// Remove offline action
async function removeOfflineAction(id) {
  const db = await openIndexedDB();
  const transaction = db.transaction(['offlineActions'], 'readwrite');
  const store = transaction.objectStore('offlineActions');
  
  await store.delete(id);
}

// Perform offline action
async function performOfflineAction(action) {
  const response = await fetch(action.url, {
    method: action.method,
    headers: action.headers,
    body: action.body
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
}

// Open IndexedDB for offline storage
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ClaimsoOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store for offline actions
      if (!db.objectStoreNames.contains('offlineActions')) {
        const store = db.createObjectStore('offlineActions', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Create object store for cached data
      if (!db.objectStoreNames.contains('cachedData')) {
        const store = db.createObjectStore('cachedData', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Claimso',
    icon: '/logos/default.svg',
    badge: '/logos/default.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/logos/default.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logos/default.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Claimso', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
  
  if (event.data && event.data.type === 'DELETE_CACHE') {
    event.waitUntil(
      caches.delete(event.data.cacheName)
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync triggered', event.tag);
  
  if (event.tag === 'periodic-sync') {
    event.waitUntil(performPeriodicSync());
  }
});

// Perform periodic sync
async function performPeriodicSync() {
  try {
    // Sync data in the background
    await syncUserData();
    await updateCachedData();
  } catch (error) {
    console.error('Service Worker: Periodic sync failed', error);
  }
}

// Sync user data
async function syncUserData() {
  // This would sync user data when connection is available
  console.log('Service Worker: Syncing user data');
}

// Update cached data
async function updateCachedData() {
  // This would update cached data in the background
  console.log('Service Worker: Updating cached data');
}

console.log('Service Worker: Loaded successfully'); 