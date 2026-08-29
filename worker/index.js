/**
 * 📁 UBICACIÓN: worker/index.js
 * 📅 ACTUALIZADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Custom Service Worker para next-pwa (PanFree Push Notifications Web VAPID).
 *    next-pwa empaqueta automáticamente este código junto con Workbox en producción.
 */

'use strict'

const DEFAULT_NOTIFICATION_TITLE = '🍞 PanFree - Nuevo Pedido'
const DEFAULT_NOTIFICATION_URL = '/admin/pedidos'
const DEFAULT_ICON = '/icons/icon-192x192.png'
const DEFAULT_BADGE = '/icons/icon-96x96.png'

// ── 1. Recepción de Notificaciones Push en segundo plano ──
self.addEventListener('push', function (event) {
  console.log('[PanFree Worker] Push recibido')

  let payload = {}

  if (event.data) {
    try {
      payload = event.data.json()
    } catch (e) {
      payload = {
        title: DEFAULT_NOTIFICATION_TITLE,
        body: event.data.text() || 'Tienes un nuevo pedido pendiente en PanFree.',
      }
    }
  } else {
    payload = {
      title: DEFAULT_NOTIFICATION_TITLE,
      body: 'Tienes una nueva notificación de PanFree.',
    }
  }

  const title = payload.title || payload.titulo || DEFAULT_NOTIFICATION_TITLE
  const body = payload.body || payload.cuerpo || payload.mensaje || 'Nuevo pedido recibido en la panadería.'
  const url = payload.data?.url || payload.url || payload.url_accion || DEFAULT_NOTIFICATION_URL
  const icon = payload.icon || payload.icono || DEFAULT_ICON
  const badge = payload.badge || DEFAULT_BADGE
  const tag = payload.tag || `panfree-push-${Date.now()}`

  const options = {
    body: body,
    icon: icon,
    badge: badge,
    tag: tag,
    data: {
      url: url,
      timestamp: Date.now(),
      ...payload.data,
    },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    renotify: true,
    actions: [
      {
        action: 'open_orders',
        title: '📦 Ver Pedidos',
      },
      {
        action: 'close',
        title: 'Cerrar',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── 2. Clic en Notificación ──
self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const targetPath = event.notification.data?.url || DEFAULT_NOTIFICATION_URL
  const urlToOpen = new URL(targetPath, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url && client.url.includes('/admin') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen)
          }
          return client.focus()
        }
      }

      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen)
          }
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})
