const CACHE = 'astrona-v1';
const ASSETS = [
  '/', '/index.html', '/contacts.html', '/chat.html', '/call.html', '/video.html', '/settings.html',
  '/styles.css', '/app.js', '/api.js', '/ws.js', '/rtc.js', '/ui.js',
  '/manifest.json', '/assets/default-avatar.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  e.respondWith(
    caches.match(request).then(res => res || fetch(request))
  );
});

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'Astrona', {
    body: data.body || '',
    icon: '/assets/icons/icon-192.png',
    data
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/contacts.html'));
});
