self.addEventListener('push', (event) => {
    event.waitUntil((async () => {
      let payload;
      try {
        payload = event.data.json();
      } catch (err) {
        // Si no es JSON, lo tratamos como texto simple
        const text = event.data.text();
        payload = {
          title: 'La Guía del Streaming',          // un título por defecto
          options: { body: text },
        };
      }

      payload.options.icon = 'img/logo.png';
  
      const { title, options } = payload;
      await self.registration.showNotification(title, options);
    })());
  });