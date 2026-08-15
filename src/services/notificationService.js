/**
 * src/services/notificationService.js
 * NOTA: Este archivo ahora solo maneja THROTTLE y DELEGA a pushService.js
 * Las notificaciones push reales están en pushService.js
 */

import { sendPushNotification } from './pushService'

// Re-exportar para compatibilidad con código existente
export { sendPushNotification as sendNotification }

// Para código que espera la API anterior
export default {
  sendNotification: sendPushNotification,
}