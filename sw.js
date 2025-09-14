// Enhanced Techkkim Service Worker - sw.js
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'techkkim-enhanced-v1.0';
const STATIC_CACHE = 'techkkim-static-v1.0';
const DYNAMIC_CACHE = 'techkkim-dynamic-v1.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/enhanced-techkkim.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  // Add monastery images
  'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/2a4f375f-04f9-4560-a36d-b544a9f1d6e4.png',
  'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/3eb146d2-9782-4e05-91aa-79f4f2370c19.png',
  'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/95f6e6d0-426a-4d52-8213-ab0a6ba2def0.png',
  'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/0300a514-6c23-471e-b3b0-58218d3f7379.png',
  'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/13a22ef9-e9d3-4399-b008-405cacdb8ac7.png'
];

// Dynamic content patterns to cache
const DYNAMIC_PATTERNS = [
  /\/api\//,
  /\/monastery\//,
  /\/archives\//,
  /\.jpg$|\.png$|\.webp$|\.gif$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🚀 Techkkim Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Techkkim Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.origin === location.origin) {
    // Same origin - use cache first strategy
    event.respondWith(cacheFirstStrategy(request));
  } else if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    // External static assets - use cache first
    event.respondWith(cacheFirstStrategy(request));
  } else if (DYNAMIC_PATTERNS.some(pattern => pattern.test(request.url))) {
    // Dynamic content - use network first
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Other requests - use stale while revalidate
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Cache first strategy - good for static assets
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Cache first failed for:', request.url);
    return getOfflineFallback(request);
  }
}

// Network first strategy - good for dynamic content  
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network first failed for:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || getOfflineFallback(request);
  }
}

// Stale while revalidate - good for frequently updated content
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || networkResponsePromise;
}

// Offline fallback responses
function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return appropriate offline content based on request type
  if (request.destination === 'document') {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Techkkim - Offline</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #800000, #FFC107);
              color: white;
              min-height: 100vh;
              margin: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .offline-container {
              background: rgba(255, 255, 255, 0.1);
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
              backdrop-filter: blur(10px);
            }
            h1 { font-size: 2.5rem; margin-bottom: 1rem; }
            p { font-size: 1.2rem; margin-bottom: 2rem; }
            .monastery-icon { font-size: 4rem; margin-bottom: 2rem; }
            .retry-btn {
              background: #FFC107;
              color: #800000;
              border: none;
              padding: 15px 30px;
              border-radius: 25px;
              font-size: 1.1rem;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            .retry-btn:hover {
              background: #FFD54F;
              transform: scale(1.05);
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="monastery-icon">🏔️</div>
            <h1>Techkkim Offline Mode</h1>
            <p>You're currently offline, but you can still explore cached monastery content!</p>
            <p>🤖 AI features, 📱 AR mode, and 🔴 live streaming require internet connection.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              🔄 Try Again
            </button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (request.destination === 'image') {
    return new Response(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#800000"/>
        <text x="200" y="130" text-anchor="middle" fill="#FFC107" font-size="20" font-family="Arial">
          🏔️ Monastery Image
        </text>
        <text x="200" y="160" text-anchor="middle" fill="white" font-size="16" font-family="Arial">
          Available offline soon
        </text>
        <text x="200" y="190" text-anchor="middle" fill="white" font-size="14" font-family="Arial">
          Techkkim Enhanced
        </text>
      </svg>
    `, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
  
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-monastery-sync') {
    event.waitUntil(syncMonasteryData());
  } else if (event.tag === 'background-chat-sync') {
    event.waitUntil(syncChatMessages());
  }
});

// Sync monastery data when back online
async function syncMonasteryData() {
  try {
    console.log('📡 Syncing monastery data...');
    
    // Get pending data from IndexedDB (would be implemented)
    const pendingVisits = await getPendingVisits();
    
    // Send to server
    for (const visit of pendingVisits) {
      await fetch('/api/monastery-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visit)
      });
    }
    
    console.log('✅ Monastery data synced successfully');
    
    // Notify clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: { synced: pendingVisits.length }
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error syncing monastery data:', error);
  }
}

// Sync chat messages when back online
async function syncChatMessages() {
  try {
    console.log('💬 Syncing chat messages...');
    
    // Implementation would sync offline chat messages
    const pendingMessages = await getPendingChatMessages();
    
    for (const message of pendingMessages) {
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    }
    
    console.log('✅ Chat messages synced');
    
  } catch (error) {
    console.error('❌ Error syncing chat messages:', error);
  }
}

// Push notifications for monastery events
self.addEventListener('push', (event) => {
  console.log('📢 Push notification received');
  
  let notificationData = {
    title: 'Techkkim Monastery Update',
    body: 'New monastery content available!',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: 'monastery-update',
    data: { url: '/' }
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      console.log('Using default notification data');
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: [
        {
          action: 'view',
          title: '👀 View',
          icon: '/icon-72.png'
        },
        {
          action: 'dismiss',
          title: '❌ Dismiss'
        }
      ]
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url.includes(url) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Utility functions (would be implemented with IndexedDB)
async function getPendingVisits() {
  // Mock implementation - would use IndexedDB
  return [];
}

async function getPendingChatMessages() {
  // Mock implementation - would use IndexedDB  
  return [];
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      case 'CACHE_MONASTERY':
        // Cache specific monastery data
        cacheMonasteryData(event.data.monasteryId);
        break;
    }
  }
});

async function cacheMonasteryData(monasteryId) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const urls = [
      `/api/monastery/${monasteryId}`,
      `/api/monastery/${monasteryId}/images`,
      `/api/monastery/${monasteryId}/360-tour`
    ];
    
    await cache.addAll(urls);
    console.log(`✅ Cached monastery data for ID: ${monasteryId}`);
  } catch (error) {
    console.error(`❌ Error caching monastery ${monasteryId}:`, error);
  }
}

console.log('🏔️ Techkkim Enhanced Service Worker loaded successfully!');