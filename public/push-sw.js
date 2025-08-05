// public/push-sw.js
// Dedicated service worker for push notifications and token refresh

// Token refresh functionality
let refreshInterval = null;

// Function to check and refresh token
async function checkAndRefreshToken() {
  try {
    console.log('[Service Worker] Checking token refresh...');
    
    // Get all clients to find the one with session data
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
      // Try to get session data from the client
      const response = await client.postMessage({
        type: 'GET_SESSION_DATA'
      });
      
      if (response && response.session) {
        const { accessToken, refreshToken } = response.session;
        
        if (accessToken && refreshToken) {
          // Decode JWT to check expiration
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const expiresAt = payload.exp * 1000;
          const now = Date.now();
          
          // Refresh 10 minutes before expiration
          const refreshAt = expiresAt - (10 * 60 * 1000);
          
          if (now >= refreshAt) {
            console.log('[Service Worker] Token needs refresh, calling API...');
            
            const apiResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${refreshToken}`,
                'Content-Type': 'application/json',
              }
            });
            
            if (apiResponse.ok) {
              const data = await apiResponse.json();
              console.log('[Service Worker] Token refresh successful');
              
              // Notify the client about the new tokens
              client.postMessage({
                type: 'TOKEN_REFRESHED',
                tokens: data
              });
            } else {
              console.warn('[Service Worker] Token refresh failed:', apiResponse.status);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[Service Worker] Token refresh error:', error);
  }
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'START_TOKEN_REFRESH') {
    console.log('[Service Worker] Starting token refresh monitoring');
    
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Check every 5 minutes
    refreshInterval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);
    
    // Also check immediately
    checkAndRefreshToken();
  }
  
  if (event.data.type === 'STOP_TOKEN_REFRESH') {
    console.log('[Service Worker] Stopping token refresh monitoring');
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
});

self.addEventListener('push', (event) => {
  
  event.waitUntil((async () => {
    let payload;
    try {
      payload = event.data ? event.data.json() : {};
    } catch (err) {
      console.warn('Failed to parse push data as JSON:', err);
      // If not JSON, treat as text
      const text = event.data ? event.data.text() : 'Nueva notificación';
      payload = {
        title: 'La Guía del Streaming',
        options: { body: text },
      };
    }

    // Set default values
    const title = payload.title || 'La Guía del Streaming';
    const options = {
      body: payload.options?.body || 'Tienes una nueva notificación',
      icon: payload.options?.icon || '/img/logo.png',
      badge: '/img/logo.png',
      tag: payload.options?.tag || 'default',
      data: payload.options?.data || {},
      requireInteraction: false,
      silent: false,
      ...payload.options,
    };

    await self.registration.showNotification(title, options);
  })());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ includeUncontrolled: true, type: 'window' })
      .then((clientList) => {
        // If there's already an open window, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        return clients.openWindow('/');
      })
  );
});

// Handle service worker installation and activation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});