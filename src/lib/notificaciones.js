/**
 * 📁 UBICACIÓN: src/lib/notificaciones.js
 * 📅 ACTUALIZADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Servicio centralizado de notificaciones internas, transaccionales y Push Web (VAPID) para PanFree:
 *    - Notificaciones internas para el panel de administración (tabla notificaciones_admin)
 *    - Push Notifications Web (VAPID) para administradores (tabla push_subscriptions)
 *    - Correos transaccionales a clientes y administradores con Resend
 *    - Mensajes por WhatsApp a administradores y clientes
 *    - Integración tolerante a fallos y no bloqueante.
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
import webpush from 'web-push'

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
 * Configura la instancia de webpush con claves VAPID
 */
function getWebPushInstance() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const emailContact = process.env.NEXT_PUBLIC_VAPID_EMAIL || process.env.VAPID_SUBJECT || 'mailto:contacto@panfree.py'

  if (!publicKey || !privateKey) {
    return null
  }

  try {
    const subject = emailContact.startsWith('mailto:') || emailContact.startsWith('http')
      ? emailContact
      : `mailto:${emailContact}`

    webpush.setVapidDetails(subject, publicKey, privateKey)
    return webpush
  } catch (err) {
    console.warn('⚠️ [Push] No se pudo configurar webpush en notificaciones.js:', err.message)
    return null
  }
}

/**
 * Envía una notificación Push Web a un usuario específico
 * 
 * @param {Object} param
 * @param {string} param.userId - ID del usuario (de auth.users o tabla usuarios)
 * @param {string} param.titulo - Título de la notificación
 * @param {string} param.mensaje - Cuerpo del mensaje
 * @param {string} [param.url] - URL de destino al hacer clic (default: '/admin/pedidos')
 * @returns {Promise<{success: boolean, enviadas: number, error?: string}>}
 */
export async function enviarPushAdmin({ userId, titulo, mensaje, url = '/admin/pedidos' }) {
  if (!userId) return { success: false, enviadas: 0, error: 'userId requerido' }

  try {
    const wp = getWebPushInstance()
    if (!wp) {
      console.log('ℹ️ [Push] Claves VAPID no disponibles en el entorno. Omitiendo push.')
      return { success: false, enviadas: 0, error: 'VAPID no configurado' }
    }

    const db = getSupabaseClient()
    const { data: subs, error } = await db
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (error || !subs || subs.length === 0) {
      console.log(`ℹ️ [Push] Usuario ${userId} no tiene suscripciones push activas.`)
      return { success: true, enviadas: 0, message: 'Usuario no suscrito' }
    }

    const payload = JSON.stringify({
      title: titulo,
      body: mensaje,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: {
        url: url || '/admin/pedidos',
        timestamp: Date.now(),
      },
    })

    let enviadas = 0
    const caducados = []

    for (const sub of subs) {
      try {
        const subData = sub.subscription || {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }

        await wp.sendNotification(
          {
            endpoint: subData.endpoint || sub.endpoint,
            keys: {
              p256dh: subData.keys?.p256dh || sub.p256dh,
              auth: subData.keys?.auth || sub.auth,
            },
          },
          payload
        )
        enviadas++
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          caducados.push(sub.endpoint)
        }
      }
    }

    if (caducados.length > 0) {
      await db.from('push_subscriptions').delete().in('endpoint', caducados).catch(() => {})
    }

    return { success: true, enviadas, total: subs.length }
  } catch (err) {
    console.error(`❌ [Push] Error enviando push a admin ${userId}:`, err)
    return { success: false, enviadas: 0, error: err.message }
  }
}

/**
 * Envía una notificación Push Web a TODOS los administradores registrados
 * Obtiene los IDs de los administradores desde la tabla `usuarios` (rol = 'admin')
 * 
 * @param {Object} param
 * @param {string} param.titulo - Título de la notificación
 * @param {string} param.mensaje - Cuerpo del mensaje
 * @param {string} [param.url] - URL de destino al hacer clic (default: '/admin/pedidos')
 * @returns {Promise<{success: boolean, enviadas: number, total: number}>}
 */
export async function enviarPushATodosLosAdmins({ titulo, mensaje, url = '/admin/pedidos' }) {
  try {
    const wp = getWebPushInstance()
    if (!wp) {
      console.log('ℹ️ [Push] Claves VAPID no disponibles en el entorno. Omitiendo push a admins.')
      return { success: false, enviadas: 0, total: 0, error: 'VAPID no configurado' }
    }

    const db = getSupabaseClient()

    // 1. Obtener IDs de administradores desde la tabla `usuarios` (rol = 'admin')
    let adminUserIds = []
    try {
      const { data: admins, error: adminsError } = await db
        .from('usuarios')
        .select('id, auth_user_id')
        .eq('rol', 'admin')

      if (!adminsError && admins) {
        adminUserIds = admins
          .map((a) => a.auth_user_id || a.id)
          .filter(Boolean)
      }
    } catch (e) {
      console.warn('⚠️ [Push] Error consultando tabla usuarios para admins:', e.message)
    }

    // 2. Buscar suscripciones push de estos administradores (o todas si no hay filtro estricto)
    let query = db.from('push_subscriptions').select('*')
    if (adminUserIds.length > 0) {
      query = query.in('user_id', adminUserIds)
    }

    const { data: subs, error: subsError } = await query

    let subscriptionsToSend = subs || []

    // Fallback: si no encontró por IDs específicos, tomar todas las suscripciones registradas
    if (subscriptionsToSend.length === 0) {
      const { data: allSubs } = await db.from('push_subscriptions').select('*').limit(50)
      subscriptionsToSend = allSubs || []
    }

    if (subscriptionsToSend.length === 0) {
      console.log('ℹ️ [Push] No hay administradores suscritos a Push Notifications Web.')
      return { success: true, enviadas: 0, total: 0 }
    }

    // 3. Deduplicar por endpoint (un dispositivo físico = un envío)
    const subsUnicas = Array.from(
      new Map(subscriptionsToSend.map((s) => [s.endpoint, s])).values()
    )

    const payload = JSON.stringify({
      title: titulo,
      body: mensaje,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: {
        url: url || '/admin/pedidos',
        timestamp: Date.now(),
      },
    })

    let enviadas = 0
    let fallos = 0
    const caducados = []

    await Promise.all(
      subsUnicas.map(async (sub) => {
        try {
          const subData = sub.subscription || {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          }

          await wp.sendNotification(
            {
              endpoint: subData.endpoint || sub.endpoint,
              keys: {
                p256dh: subData.keys?.p256dh || sub.p256dh,
                auth: subData.keys?.auth || sub.auth,
              },
            },
            payload
          )
          enviadas++
        } catch (err) {
          fallos++
          if (err.statusCode === 410 || err.statusCode === 404) {
            caducados.push(sub.endpoint)
          }
        }
      })
    )

    if (caducados.length > 0) {
      await db.from('push_subscriptions').delete().in('endpoint', caducados).catch(() => {})
    }

    console.log(`🔔 [Push] Notificación push enviada a ${enviadas} de ${subsUnicas.length} dispositivos administradores.`)

    return { success: true, enviadas, fallos, total: subsUnicas.length }
  } catch (err) {
    console.error('💥 [Push] Error general enviando push a todos los admins:', err)
    return { success: false, enviadas: 0, total: 0, error: err.message }
  }
}

/**
 * Inserta una nueva notificación interna en la tabla `notificaciones_admin`
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
 * Notifica un nuevo pedido en todos los canales internos y transaccionales:
 * 1. Base de datos interna (notificaciones_admin)
 * 2. Push Notifications Web a administradores (VAPID)
 * 3. Email a administradores (Resend)
 * 4. WhatsApp a administradores (Twilio/Cloud API)
 */
export async function notificarNuevoPedido(pedido, cliente, items = []) {
  const numeroPedido = pedido?.numero_pedido || pedido?.numero || 'N/A'
  const total = Number(pedido?.total_final || pedido?.totalFinal || 0).toLocaleString('es-PY')
  const nombreCliente = cliente?.nombre_completo || cliente?.nombre || 'Cliente'
  const metodoEntrega = pedido?.metodo_entrega === 'delivery' ? 'Delivery' : 'Retiro en local'

  console.log(`📦 [Notificaciones] Procesando nuevo pedido #${numeroPedido} (${total} ₲)`)

  const promises = []

  // 1. Guardar en base de datos interna (notificaciones_admin)
  const dbPromise = crearNotificacion({
    tipo: 'nuevo_pedido',
    titulo: `📦 Nuevo pedido #${numeroPedido}`,
    mensaje: `${nombreCliente} - Total: ${total} ₲ (${metodoEntrega})`,
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

  // 2. Enviar Push Notification Web a TODOS los Administradores
  const pushPromise = enviarPushATodosLosAdmins({
    titulo: `📦 ¡Nuevo pedido #${numeroPedido}!`,
    mensaje: `${nombreCliente} realizó un pedido por ${total} ₲ (${metodoEntrega})`,
    url: `/admin/pedidos`,
  }).catch((err) => {
    console.warn('⚠️ [Push Admin] Error no bloqueante al notificar push a admins:', err.message)
    return { success: false, error: err.message }
  })
  promises.push(pushPromise)

  // 3. Enviar correo a administradores
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

  // 4. Enviar WhatsApp a Admin si está configurado
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
    push: results[1]?.status === 'fulfilled' ? results[1].value : null,
    email: results[2]?.status === 'fulfilled' ? results[2].value : null,
    whatsapp: results[3]?.status === 'fulfilled' ? results[3].value : null,
  }
}

/**
 * Notifica el cambio de estado de un pedido (Correo al cliente y alerta si es cancelación)
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

  // 2. Si el pedido fue cancelado, generar alerta interna y push para el admin
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

    enviarPushATodosLosAdmins({
      titulo: `❌ Pedido #${numeroPedido} cancelado`,
      mensaje: `El pedido de ${nombreCliente} fue cancelado.`,
      url: `/admin/pedidos`,
    }).catch(() => {})
  }

  return { emailResult, dbResult }
}

/**
 * Notifica alerta de stock bajo a los administradores
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

  const pushPromise = enviarPushATodosLosAdmins({
    titulo: `⚠️ Stock bajo: ${nombre}`,
    mensaje: `Quedan ${stockActual} ${unidad} (mínimo: ${stockMinimo})`,
    url: `/admin/insumos`,
  }).catch(() => {})

  const [dbResult, emailResult] = await Promise.allSettled([dbPromise, emailPromise, pushPromise])

  return {
    db: dbResult.status === 'fulfilled' ? dbResult.value : null,
    email: emailResult.status === 'fulfilled' ? emailResult.value : null,
  }
}
