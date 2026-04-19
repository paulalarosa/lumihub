// Push + notification click handlers. Imported into the workbox-generated SW
// via `workbox.importScripts` in vite.config.ts.

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Khaos Kontrol', body: event.data.text() }
  }

  const {
    title = 'Khaos Kontrol',
    body = '',
    icon = '/android-chrome-192x192.png',
    badge = '/android-chrome-192x192.png',
    data = {},
  } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: data.tag || 'khk-notification',
      data,
      vibrate: [100, 50, 100],
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      }),
  )
})
