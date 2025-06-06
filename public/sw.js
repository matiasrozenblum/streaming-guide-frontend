self.addEventListener('install', event => {
  console.log('Service Worker installing');
  self.skipWaiting(); // Activate the SW immediately
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  event.waitUntil(
    // Take control of all clients immediately
    self.clients.claim()
  );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  event.waitUntil((async () => {
    let payload;
    let notificationData = {};
    
    try {
      if (event.data) {
        payload = event.data.json();
      } else {
        // Fallback for empty push data
        payload = {
          title: 'La Guía del Streaming',
          options: { body: 'Nueva notificación disponible' },
        };
      }
    } catch (err) {
      console.warn('Failed to parse push data as JSON, treating as text:', err);
      // Si no es JSON, lo tratamos como texto simple
      const text = event.data ? event.data.text() : 'Nueva notificación';
      payload = {
        title: 'La Guía del Streaming',
        options: { body: text },
      };
    }

    // Ensure we have the required structure
    if (!payload.title) payload.title = 'La Guía del Streaming';
    if (!payload.options) payload.options = {};
    if (!payload.options.body) payload.options.body = 'Nueva notificación disponible';

    // Add notification options optimized for iOS
    notificationData = {
      icon: '/img/logo.png',
      badge: '/img/logo.png',
      tag: 'streaming-guide-notification',
      renotify: true,
      requireInteraction: true, // Keep notification visible until user interacts
      vibrate: [200, 100, 200], // Vibration pattern
      timestamp: Date.now(),
      // iOS Safari specific
      actions: [
        {
          action: 'view',
          title: 'Ver programación',
          icon: '/img/logo.png'
        }
      ]
    };

    // Merge with any existing options
    const finalOptions = { ...notificationData, ...payload.options };
    
    console.log('Showing notification:', payload.title, finalOptions);
    
    await self.registration.showNotification(payload.title, finalOptions);
  })());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Check if there's already a window/tab open with the target URL
      const targetUrl = '/';
      
      for (const client of clients) {
        if (client.url === self.location.origin + targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});