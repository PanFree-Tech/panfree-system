import logger from '@/lib/logger'
import { supabase } from '@/lib/supabase'
/**
 * src/services/pushService.js
 * Servicio centralizado para notificaciones push
 * SOLO para eventos importantes (pedidos, envÃƒÆ’Ã‚Âos, etc.)
 */

// ConfiguraciÃƒÆ’Ã‚Â³n
const THROTTLE_MS = 60000 // 1 minuto entre notificaciones
let lastNotificationTime = 0
let notificationInProgress = false

/**
 * Enviar notificaciÃƒÆ’Ã‚Â³n push
 * @param {Object} data - { title, body, icon, url }
 */
export async function sendPushNotification(data) {
  // 1. Verificar throttling
  const now = Date.now()
  if (notificationInProgress || (now - lastNotificationTime < THROTTLE_MS)) {
    logger.warn('ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬Â¢ NotificaciÃƒÆ’Ã‚Â³n push bloqueada por throttle')
    return { success: false, message: 'Throttled' }
  }

  // 2. Validar datos
  if (!data?.title || !data?.body) {
    logger.warn('ÃƒÂ¢Ã…Â¡Ã‚ÂÃƒÂ¯Ã‚Â¸Ã‚Â Datos de notificaciÃƒÆ’Ã‚Â³n incompletos')
    return { success: false, message: 'Datos incompletos' }
  }

  // 3. Enviar notificaciÃƒÆ’Ã‚Â³n
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
    logger.log(`ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¨ NotificaciÃƒÆ’Ã‚Â³n enviada: ${result.enviadas || 0} enviadas`)
    return result
  } catch (error) {
    logger.error('ÃƒÂ¢Ã‚ÂÃ…â€™ Error enviando notificaciÃƒÆ’Ã‚Â³n push:', error)
    return { success: false, error: error.message }
  } finally {
    notificationInProgress = false
  }
}

/**
 * NotificaciÃƒÆ’Ã‚Â³n de pedido confirmado
 */
export function notifyOrderConfirmed(orderData) {
  return sendPushNotification({
    title: 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Ãƒâ€šÃ‚Â¡Pedido confirmado!',
    body: `Tu pedido #${orderData.id} ha sido confirmado. EstarÃƒÆ’Ã‚Â¡ listo en 24-48 horas.`,
    url: `/pedido/${orderData.id}`,
  })
}

/**
 * NotificaciÃƒÆ’Ã‚Â³n de pedido enviado
 */
export function notifyOrderShipped(orderData) {
  return sendPushNotification({
    title: 'ÃƒÂ°Ã…Â¸Ã…Â¡Ã…Â¡ Ãƒâ€šÃ‚Â¡Pedido enviado!',
    body: `Tu pedido #${orderData.id} estÃƒÆ’Ã‚Â¡ en camino. Ãƒâ€šÃ‚Â¡LlegarÃƒÆ’Ã‚Â¡ pronto!`,
    url: `/pedido/${orderData.id}`,
  })
}

/**
 * NotificaciÃƒÆ’Ã‚Â³n de carrito abandonado (se programa para despuÃƒÆ’Ã‚Â©s de 30 min)
 */
export function notifyCartAbandoned(cartData) {
  if (!cartData?.items?.length) return
  
  const totalItems = cartData.items.length
  const totalPrice = cartData.total

  return sendPushNotification({
    title: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ¢â‚¬â„¢ Ãƒâ€šÃ‚Â¿Olvidaste algo?',
    body: `Tienes ${totalItems} productos en tu carrito por ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â² ${totalPrice.toLocaleString('es-PY')}. Ãƒâ€šÃ‚Â¡No esperes mÃƒÆ’Ã‚Â¡s!`,
    url: '/carrito',
  })
}
