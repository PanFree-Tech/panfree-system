import logger from '@/lib/logger'
import { supabase } from '@/lib/supabase'
/**
 * src/services/pushService.js
 * Servicio centralizado para notificaciones push
 * SOLO para eventos importantes (pedidos, envÆ’‚os, etc.)
 */

// ConfiguraciÆ’‚³n
const THROTTLE_MS = 60000 // 1 minuto entre notificaciones
let lastNotificationTime = 0
let notificationInProgress = false

/**
 * Enviar notificaciÆ’‚³n push
 * @param {Object} data - { title, body, icon, url }
 */
export async function sendPushNotification(data) {
  // 1. Verificar throttling
  const now = Date.now()
  if (notificationInProgress || (now - lastNotificationTime < THROTTLE_MS)) {
    logger.warn('°…¸â‚¬â‚¬¢ NotificaciÆ’‚³n push bloqueada por throttle')
    return { success: false, message: 'Throttled' }
  }

  // 2. Validar datos
  if (!data?.title || !data?.body) {
    logger.warn('¢…¡‚¯‚¸‚ Datos de notificaciÆ’‚³n incompletos')
    return { success: false, message: 'Datos incompletos' }
  }

  // 3. Enviar notificaciÆ’‚³n
  notificationInProgress = true
  lastNotificationTime = now

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/api/push-notificar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        titulo: data.title,
        cuerpo: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        url_accion: data.url || '/',
      }),
    })

    const result = await response.json()
    logger.log(`°…¸â‚¬Å“‚¨ NotificaciÆ’‚³n enviada: ${result.enviadas || 0} enviadas`)
    return result
  } catch (error) {
    logger.error('¢‚…â€™ Error enviando notificaciÆ’‚³n push:', error)
    return { success: false, error: error.message }
  } finally {
    notificationInProgress = false
  }
}

/**
 * NotificaciÆ’‚³n de pedido confirmado
 */
export function notifyOrderConfirmed(orderData) {
  return sendPushNotification({
    title: '¢…â€œâ‚¬¦ â€š‚¡Pedido confirmado!',
    body: `Tu pedido #${orderData.id} ha sido confirmado. EstarÆ’‚¡ listo en 24-48 horas.`,
    url: `/pedido/${orderData.id}`,
  })
}

/**
 * NotificaciÆ’‚³n de pedido enviado
 */
export function notifyOrderShipped(orderData) {
  return sendPushNotification({
    title: '°…¸…¡…¡ â€š‚¡Pedido enviado!',
    body: `Tu pedido #${orderData.id} estÆ’‚¡ en camino. â€š‚¡LlegarÆ’‚¡ pronto!`,
    url: `/pedido/${orderData.id}`,
  })
}

/**
 * NotificaciÆ’‚³n de carrito abandonado (se programa para despuÆ’‚©s de 30 min)
 */
export function notifyCartAbandoned(cartData) {
  if (!cartData?.items?.length) return
  
  const totalItems = cartData.items.length
  const totalPrice = cartData.total

  return sendPushNotification({
    title: '°…¸â‚¬ºâ‚¬â„¢ â€š‚¿Olvidaste algo?',
    body: `Tienes ${totalItems} productos en tu carrito por ¢â‚¬Å¡‚² ${totalPrice.toLocaleString('es-PY')}. â€š‚¡No esperes mÆ’‚¡s!`,
    url: '/carrito',
  })
}
