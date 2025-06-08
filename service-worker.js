// service-worker.js
// Custom service worker that combines PWA functionality with push notifications

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

// Precache and route handling
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Handle navigation requests
const handler = createHandlerBoundToURL('/');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

// Add runtime caching
registerRoute(
  /^https?.*/,
  new NetworkFirst({
    cacheName: 'offlineCache',
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}`;
        },
      },
    ],
  }),
  'GET'
);

// Push notification handling
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
      icon: payload.options?.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
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

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(self.clients.claim());
});

console.log('Custom PWA + Push service worker loaded'); 