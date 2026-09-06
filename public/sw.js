// Service Worker for Web Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'เติมไฟกันเถอะ! 🔥',
      body: event.data ? event.data.text() : 'วันนี้คุณยังไม่ได้เช็คอินอารมณ์เลย เข้ามาบันทึกกันเถอะ!',
    };
  }

  const title = data.title || 'เติมไฟกันเถอะ! 🔥';
  const options = {
    body: data.body || 'วันนี้คุณยังไม่ได้เช็คอินอารมณ์เลย เข้ามาบันทึกกันเถอะ!',
    icon: data.icon || 'https://fav.farm/🔥',
    badge: data.badge || 'https://fav.farm/🔥',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/checkin',
    },
    actions: [
      { action: 'checkin', title: 'เช็คอินเลย 📝' },
      { action: 'close', title: 'ไว้ทีหลัง' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/checkin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window tab is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
