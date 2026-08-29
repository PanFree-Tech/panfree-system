/**
 * 📁 UBICACIÓN: public/sw.js
 * 📅 ACTUALIZADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Service Worker para PanFree (PWA + Push Notifications Web VAPID).
 *    - Ciclo de vida: install, activate (claim clients & skip waiting)
 *    - Recepción de Push: Muestra notificaciones con título, mensaje, badge, ícono y acciones
 *    - Manejo de clics: Abre o enfoca /admin/pedidos o la URL de acción asociada
 */

const CACHE_NAME = 'panfree-cache-v1'
const DEFAULT_NOTIFICATION_TITLE = '🍞 PanFree - Nuevo Pedido'
const DEFAULT_NOTIFICATION_URL = '/admin/pedidos'
const DEFAULT_ICON = '/icons/icon-192x192.png'
const DEFAULT_BADGE = '/icons/icon-96x96.png'

// ── 1. Instalación del Service Worker ──
self.addEventListener('install', (event) => {
  console.log('[PanFree SW] Instalando Service Worker...')
  self.skipWaiting()
})

// ── 2. Activación y control inmediato de clientes ──
self.addEventListener('activate', (event) => {
  console.log('[PanFree SW] Service Worker activado y reclamando clientes.')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name.startsWith('panfree-'))
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// ── 3. Recepción de Notificaciones Push ──
self.addEventListener('push', (event) => {
  console.log('[PanFree SW] Evento Push recibido.')

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
    body,
    icon,
    badge,
    tag,
    data: {
      url,
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

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// ── 4. Clic en la Notificación ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const targetPath = event.notification.data?.url || DEFAULT_NOTIFICATION_URL
  const urlToOpen = new URL(targetPath, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana o pestaña abierta con /admin, enfocarla y navegar
      for (const client of clientList) {
        if (client.url && client.url.includes('/admin') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen)
          }
          return client.focus()
        }
      }

      // Si hay cualquier ventana de la app abierta, enfocarla
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen)
          }
          return client.focus()
        }
      }

      // Si no hay ventana abierta, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})

// ── 5. Cierre de Notificación ──
self.addEventListener('notificationclose', (event) => {
  console.log('[PanFree SW] Notificación cerrada por el usuario:', event.notification.tag)
})
