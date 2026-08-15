/**
 * src/services/pushService.js
 * Servicio centralizado para notificaciones push
 * SOLO para eventos importantes (pedidos, envíos, etc.)
 */

// Configuración
const THROTTLE_MS = 60000 // 1 minuto entre notificaciones
let lastNotificationTime = 0
let notificationInProgress = false

/**
 * Enviar notificación push
 * @param {Object} data - { title, body, icon, url }
 */
export async function sendPushNotification(data) {
  // 1. Verificar throttling
  const now = Date.now()
  if (notificationInProgress || (now - lastNotificationTime < THROTTLE_MS)) {
    console.warn('🔕 Notificación push bloqueada por throttle')
    return { success: false, message: 'Throttled' }
  }

  // 2. Validar datos
  if (!data?.title || !data?.body) {
    console.warn('⚠️ Datos de notificación incompletos')
    return { success: false, message: 'Datos incompletos' }
  }

  // 3. Enviar notificación
  notificationInProgress = true
  lastNotificationTime = now

  try {
    const response = await fetch('/api/push-notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: data.title,
        cuerpo: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        url_accion: data.url || '/',
      }),
    })

    const result = await response.json()
    console.log(`📨 Notificación enviada: ${result.enviadas || 0} enviadas`)
    return result
  } catch (error) {
    console.error('❌ Error enviando notificación push:', error)
    return { success: false, error: error.message }
  } finally {
    notificationInProgress = false
  }
}

/**
 * Notificación de pedido confirmado
 */
export function notifyOrderConfirmed(orderData) {
  return sendPushNotification({
    title: '✅ ¡Pedido confirmado!',
    body: `Tu pedido #${orderData.id} ha sido confirmado. Estará listo en 24-48 horas.`,
    url: `/pedido/${orderData.id}`,
  })
}

/**
 * Notificación de pedido enviado
 */
export function notifyOrderShipped(orderData) {
  return sendPushNotification({
    title: '🚚 ¡Pedido enviado!',
    body: `Tu pedido #${orderData.id} está en camino. ¡Llegará pronto!`,
    url: `/pedido/${orderData.id}`,
  })
}

/**
 * Notificación de carrito abandonado (se programa para después de 30 min)
 */
export function notifyCartAbandoned(cartData) {
  if (!cartData?.items?.length) return
  
  const totalItems = cartData.items.length
  const totalPrice = cartData.total

  return sendPushNotification({
    title: '🛒 ¿Olvidaste algo?',
    body: `Tienes ${totalItems} productos en tu carrito por ₲ ${totalPrice.toLocaleString('es-PY')}. ¡No esperes más!`,
    url: '/carrito',
  })
}