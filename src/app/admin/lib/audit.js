/**
 * 📁 UBICACIÓN: src/app/admin/lib/audit.js
 * 📅 CREADO: 2026-08-19 (FASE 6: UX Y MONITOREO)
 * 📌 DESCRIPCIÓN: Sistema de logs de auditoría para acciones del panel administrativo
 */

import { supabase } from '../../../lib/supabase'

export const AUDIT_ACTIONS = {
  // Pedidos
  PEDIDO_CREADO: 'pedido_creado',
  PEDIDO_ACTUALIZADO: 'pedido_actualizado',
  PEDIDO_CANCELADO: 'pedido_cancelado',
  PEDIDO_ESTADO_CAMBIADO: 'pedido_estado_cambiado',
  
  // Productos
  PRODUCTO_CREADO: 'producto_creado',
  PRODUCTO_ACTUALIZADO: 'producto_actualizado',
  PRODUCTO_ELIMINADO: 'producto_eliminado',
  
  // Compras
  COMPRA_CREADA: 'compra_creada',
  COMPRA_RECEPCIONADA: 'compra_recepcionada',
  COMPRA_CANCELADA: 'compra_cancelada',
  
  // Usuarios / Sesión
  USUARIO_LOGIN: 'usuario_login',
  USUARIO_LOGOUT: 'usuario_logout',
}

/**
 * Registra una acción de auditoría en la tabla `logs_auditoria`.
 * Operación no bloqueante y tolerante a fallos.
 * 
 * @param {string} accion - Acción realizada (usar valores de AUDIT_ACTIONS)
 * @param {string|object} detalle - Detalle explicativo o payload de la acción
 * @param {string|null} usuarioId - UUID del usuario (opcional, se detecta automáticamente)
 */
export async function registrarAuditoria(accion, detalle, usuarioId = null) {
  try {
    let userId = usuarioId
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    }

    const ip = typeof window !== 'undefined' ? await obtenerIP() : null
    const userAgent = typeof window !== 'undefined' ? window.navigator?.userAgent : null

    await supabase.from('logs_auditoria').insert({
      accion,
      detalle: typeof detalle === 'string' ? detalle : JSON.stringify(detalle),
      usuario_id: userId,
      ip,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('[Audit Log] Registro opcional de auditoría omitido:', error.message)
  }
}

async function obtenerIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    if (!res.ok) return null
    const data = await res.json()
    return data.ip || null
  } catch {
    return null
  }
}
