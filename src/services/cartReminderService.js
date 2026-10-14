/**
 * src/services/cartReminderService.js
 * Programa recordatorios para carritos abandonados
 * 
 * Uso:
 *   - scheduleCartReminder(cartData, userId) → programa recordatorio
 *   - cancelCartReminder(userId) → cancela recordatorio programado
 */

import { log, warn, error } from '@/lib/logger'
import { notifyCartAbandoned } from './pushService'

const REMINDER_DELAY = 30 * 60 * 1000 // 30 minutos
const reminders = new Map()

/**
 * Programa un recordatorio para carrito abandonado
 * @param {Object} cartData - { items, total, ... }
 * @param {string} userId - ID del usuario
 */
export function scheduleCartReminder(cartData, userId) {
  // Si ya hay un recordatorio programado, cancelarlo
  if (reminders.has(userId)) {
    clearTimeout(reminders.get(userId))
    reminders.delete(userId)
  }

  // Si el carrito está vacío, no programar
  if (!cartData?.items?.length) {
    logger.log('🛒 Carrito vacío, no se programa recordatorio')
    return
  }

  // Programar nuevo recordatorio
  const timer = setTimeout(() => {
    logger.log('⏰ Enviando recordatorio de carrito abandonado')
    notifyCartAbandoned(cartData)
    reminders.delete(userId)
  }, REMINDER_DELAY)

  reminders.set(userId, timer)
  logger.log(`📅 Recordatorio programado para ${new Date(Date.now() + REMINDER_DELAY).toLocaleTimeString()}`)
}

/**
 * Cancela un recordatorio programado
 * @param {string} userId - ID del usuario
 */
export function cancelCartReminder(userId) {
  if (reminders.has(userId)) {
    clearTimeout(reminders.get(userId))
    reminders.delete(userId)
    logger.log(`❌ Recordatorio cancelado para usuario ${userId}`)
    return true
  }
  return false
}

/**
 * Cancela TODOS los recordatorios (útil para logout)
 */
export function cancelAllReminders() {
  for (const [userId, timer] of reminders) {
    clearTimeout(timer)
    reminders.delete(userId)
  }
  logger.log('🗑️ Todos los recordatorios cancelados')
}