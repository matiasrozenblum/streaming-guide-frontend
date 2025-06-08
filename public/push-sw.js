// public/push-sw.js
// Dedicated service worker for push notifications

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload;
    try {
      payload = event.data.json();
    } catch (err) {
      // si no es JSON, lo tratamos como texto
      const text = await event.data.text();
      payload = {
        title: 'La Guía del Streaming',
        options: { body: text },
      };
    }

    // pon aquí tu icono
    payload.options.icon = '/img/logo.png';

    const { title, options } = payload;
    await self.registration.showNotification(title, options);
  })());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
}); 