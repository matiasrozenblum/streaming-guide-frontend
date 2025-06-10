// public/push-sw.js
// Dedicated service worker for push notifications

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
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

    console.log('Showing notification:', { title, options });
    await self.registration.showNotification(title, options);
  })());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  
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

console.log('Push service worker loaded'); 