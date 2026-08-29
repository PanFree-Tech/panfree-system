/**
 * 📁 UBICACIÓN: src/lib/notificaciones.js
 * 📅 CREADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Servicio centralizado de notificaciones internas y transaccionales para PanFree.
 *    - Notificaciones para el panel de administración (tabla notificaciones_admin)
 *    - Correos transaccionales a clientes (Confirmación de compra, cambios de estado de pedidos)
 *    - Alertas críticas a administradores (Nuevos pedidos, stock bajo, cancelaciones)
 *    - Integración no bloqueante y tolerante a fallos.
 */

import { supabase } from './supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendEmail, DEFAULT_ADMIN_EMAIL } from './resend'
import {
  templateConfirmacionCompra,
  templateCambioEstadoPedido,
  templateAlertaAdminNuevoPedido,
  templateAlertaStockBajo,
} from './email-templates'
import { enviarPlantillaWhatsApp } from './whatsapp'

/**
 * Obtiene el cliente Supabase adecuado (usa service_role si está disponible en entorno server)
 */
function getSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gbdrcaumghykiipqgbty.supabase.co'

  if (typeof window === 'undefined' && serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey)
  }
  return supabase
}

/**
 * Inserta una nueva notificación interna en la tabla `notificaciones_admin`
 * 
 * @param {Object} param
 * @param {'nuevo_pedido'|'cancelacion'|'stock_bajo'|'sistema'} param.tipo
 * @param {string} param.titulo
 * @param {string} param.mensaje
 * @param {string} [param.link]
 * @param {Object} [param.metadata]
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export async function crearNotificacion({ tipo, titulo, mensaje, link = null, metadata = {} }) {
  try {
    const db = getSupabaseClient()
    const payload = {
      tipo,
      titulo,
      mensaje,
      link,
      metadata,
      leido: false,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await db.from('notificaciones_admin').insert([payload]).select().single()

    if (error) {
      console.warn('⚠️ [Notificaciones] Error al insertar en notificaciones_admin:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    console.error('💥 [Notificaciones] Excepción en crearNotificacion:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Obtiene las notificaciones no leídas para el panel de administración
 * 
 * @param {number} [limit=50]
 * @returns {Promise<Array>}
 */
export async function obtenerNotificacionesNoLeidas(limit = 50) {
  try {
    const db = getSupabaseClient()
    const { data, error } = await db
      .from('notificaciones_admin')
      .select('*')
      .eq('leido', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // Fallback por si la columna se llama 'leida'
      const { data: fallbackData } = await db
        .from('notificaciones_admin')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      return fallbackData || []
    }

    return data || []
  } catch (err) {
    console.error('💥 [Notificaciones] Error en obtenerNotificacionesNoLeidas:', err)
    return []
  }
}

/**
 * Marca una notificación específica como leída
 * 
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function marcarNotificacionComoLeida(id) {
  if (!id) return false
  try {
    const db = getSupabaseClient()
    const { error } = await db
      .from('notificaciones_admin')
      .update({ leido: true })
      .eq('id', id)

    if (error) {
      // Intentar compatibilidad con columna 'leida'
      await db.from('notificaciones_admin').update({ leida: true }).eq('id', id)
    }

    return true
  } catch (err) {
    console.error('💥 [Notificaciones] Error en marcarNotificacionComoLeida:', err)
    return false
  }
}

/**
 * Marca todas las notificaciones no leídas como leídas
 * 
 * @returns {Promise<boolean>}
 */
export async function marcarTodasComoLeidas() {
  try {
    const db = getSupabaseClient()
    const { error } = await db
      .from('notificaciones_admin')
      .update({ leido: true })
      .eq('leido', false)

    if (error) {
      await db.from('notificaciones_admin').update({ leida: true }).eq('leida', false)
    }

    return true
  } catch (err) {
    console.error('💥 [Notificaciones] Error en marcarTodasComoLeidas:', err)
    return false
  }
}

/**
 * Envía el correo de confirmación de compra al cliente
 * 
 * @param {Object} pedido
 * @param {Object} cliente
 * @param {Array} items
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function enviarEmailConfirmacionCliente(pedido, cliente, items = []) {
  const emailCliente = cliente?.email
  const numeroPedido = pedido?.numero_pedido || pedido?.numero || 'N/A'

  if (!emailCliente) {
    console.log(`ℹ️ [Email] Cliente sin correo para pedido #${numeroPedido}. Omitiendo envío.`)
    return { success: false, error: 'Cliente sin email registrado' }
  }

  try {
    const html = templateConfirmacionCompra({ pedido, cliente, items })
    const res = await sendEmail({
      to: emailCliente,
      subject: `🍞 ¡Gracias por tu pedido #${numeroPedido}! - PanFree Sin Gluten`,
      html,
    })

    return res
  } catch (err) {
    console.error(`❌ [Email] Error enviando confirmación a ${emailCliente}:`, err)
    return { success: false, error: err.message }
  }
}

/**
 * Notifica un nuevo pedido en todos los canales internos y transaccionales
 * 
 * @param {Object} pedido
 * @param {Object} cliente
 * @param {Array} items
 * @returns {Promise<{dbResult: any, emailResult: any, waResult: any}>}
 */
export async function notificarNuevoPedido(pedido, cliente, items = []) {
  const numeroPedido = pedido?.numero_pedido || pedido?.numero || 'N/A'
  const total = Number(pedido?.total_final || pedido?.totalFinal || 0).toLocaleString('es-PY')
  const nombreCliente = cliente?.nombre_completo || cliente?.nombre || 'Cliente'

  console.log(`📦 [Notificaciones] Procesando nuevo pedido #${numeroPedido} (${total} ₲)`)

  const promises = []

  // 1. Guardar en base de datos interna (notificaciones_admin)
  const dbPromise = crearNotificacion({
    tipo: 'nuevo_pedido',
    titulo: `📦 Nuevo pedido #${numeroPedido}`,
    mensaje: `${nombreCliente} - Total: ${total} ₲ (${pedido?.metodo_entrega === 'delivery' ? 'Delivery' : 'Retiro'})`,
    link: `/admin/pedidos`,
    metadata: {
      pedido_id: pedido?.id,
      numero_pedido: numeroPedido,
      total: pedido?.total_final,
      metodo_entrega: pedido?.metodo_entrega,
      cliente_nombre: nombreCliente,
    },
  })
  promises.push(dbPromise)

  // 2. Enviar correo a administradores
  const adminEmailsEnv = process.env.ADMIN_EMAILS
  const adminEmails = adminEmailsEnv
    ? adminEmailsEnv.split(',').map((e) => e.trim()).filter(Boolean)
    : [DEFAULT_ADMIN_EMAIL]

  const adminEmailHtml = templateAlertaAdminNuevoPedido({ pedido, cliente, items })
  const emailPromise = sendEmail({
    to: adminEmails,
    subject: `📦 [NUEVO PEDIDO] #${numeroPedido} - ${total} ₲ (${nombreCliente})`,
    html: adminEmailHtml,
  })
  promises.push(emailPromise)

  // 3. Enviar WhatsApp a Admin si está configurado
  const adminWa = process.env.ADMIN_WHATSAPP || process.env.WHATSAPP_TEAM_NUMBER
  let waPromise = Promise.resolve(null)
  if (adminWa) {
    waPromise = enviarPlantillaWhatsApp({
      telefono: adminWa,
      tipo: 'PEDIDO_CONFIRMADO',
      args: [pedido, cliente],
      permitirFallback: true,
    }).catch((err) => {
      console.warn('⚠️ [WhatsApp Admin] Error no bloqueante al notificar a admin:', err.message)
      return { success: false, error: err.message }
    })
    promises.push(waPromise)
  }

  // Ejecución paralela no bloqueante
  const results = await Promise.allSettled(promises)
  return {
    db: results[0]?.status === 'fulfilled' ? results[0].value : null,
    email: results[1]?.status === 'fulfilled' ? results[1].value : null,
    whatsapp: results[2]?.status === 'fulfilled' ? results[2].value : null,
  }
}

/**
 * Notifica el cambio de estado de un pedido (Correo al cliente y alerta si es cancelación)
 * 
 * @param {Object} pedido
 * @param {Object} cliente
 * @param {string} nuevoEstado
 * @returns {Promise<{emailResult: any, dbResult: any}>}
 */
export async function notificarCambioEstadoPedido(pedido, cliente, nuevoEstado) {
  const numeroPedido = pedido?.numero_pedido || pedido?.numero || 'N/A'
  const emailCliente = cliente?.email
  const nombreCliente = cliente?.nombre_completo || cliente?.nombre || 'Cliente'

  console.log(`🔄 [Notificaciones] Cambio de estado de pedido #${numeroPedido} → ${nuevoEstado}`)

  let emailResult = null
  let dbResult = null

  // 1. Enviar correo al cliente si tiene email
  if (emailCliente) {
    try {
      const { subject, html } = templateCambioEstadoPedido({
        estado: nuevoEstado,
        pedido,
        cliente,
      })

      emailResult = await sendEmail({
        to: emailCliente,
        subject,
        html,
      })
    } catch (err) {
      console.error(`❌ [Notificaciones] Error enviando email de estado ${nuevoEstado} a ${emailCliente}:`, err)
      emailResult = { success: false, error: err.message }
    }
  }

  // 2. Si el pedido fue cancelado, generar alerta para el admin
  if (nuevoEstado === 'cancelado') {
    dbResult = await crearNotificacion({
      tipo: 'cancelacion',
      titulo: `❌ Pedido #${numeroPedido} cancelado`,
      mensaje: `El pedido de ${nombreCliente} por ${Number(pedido?.total_final || 0).toLocaleString('es-PY')} ₲ fue cancelado.`,
      link: `/admin/pedidos`,
      metadata: {
        pedido_id: pedido?.id,
        numero_pedido: numeroPedido,
        motivo: pedido?.motivo_cancelacion || 'Cancelado desde panel de administración',
      },
    })
  }

  return { emailResult, dbResult }
}

/**
 * Notifica alerta de stock bajo a los administradores
 * 
 * @param {Object} insumo
 * @returns {Promise<{dbResult: any, emailResult: any}>}
 */
export async function notificarStockBajo(insumo) {
  const nombre = insumo?.nombre || 'Insumo'
  const stockActual = insumo?.stock_actual ?? 0
  const stockMinimo = insumo?.stock_minimo ?? 0
  const unidad = insumo?.unidad_medida || 'un.'

  console.log(`⚠️ [Notificaciones] Alerta de stock bajo para ${nombre}: ${stockActual}/${stockMinimo} ${unidad}`)

  const dbPromise = crearNotificacion({
    tipo: 'stock_bajo',
    titulo: `⚠️ Stock bajo: ${nombre}`,
    mensaje: `Quedan ${stockActual} ${unidad} (mínimo establecido: ${stockMinimo} ${unidad})`,
    link: `/admin/insumos`,
    metadata: {
      insumo_id: insumo?.id,
      nombre,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      unidad_medida: unidad,
    },
  })

  const adminEmailsEnv = process.env.ADMIN_EMAILS
  const adminEmails = adminEmailsEnv
    ? adminEmailsEnv.split(',').map((e) => e.trim()).filter(Boolean)
    : [DEFAULT_ADMIN_EMAIL]

  const emailPromise = sendEmail({
    to: adminEmails,
    subject: `⚠️ [STOCK BAJO] ${nombre} (${stockActual} ${unidad} restantes) - PanFree`,
    html: templateAlertaStockBajo({ insumo }),
  })

  const [dbResult, emailResult] = await Promise.allSettled([dbPromise, emailPromise])

  return {
    db: dbResult.status === 'fulfilled' ? dbResult.value : null,
    email: emailResult.status === 'fulfilled' ? emailResult.value : null,
  }
}
