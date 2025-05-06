self.addEventListener('push', evt => {
    const data = evt.data.json();
    self.registration.showNotification(data.title, data.options);
});