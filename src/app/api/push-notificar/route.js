/**
 * src/app/api/push-notificar/route.js
 *
 * AUD-010: auth obligatoria, sin fallback a difusion general.
 */

import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { sanitizeSupabaseUrl, sanitizeSupabaseKey } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(value) {
  if (!value || typeof value !== 'string') return false
  return UUID_REGEX.test(value.trim())
}

function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const emailContact = process.env.NEXT_PUBLIC_VAPID_EMAIL || process.env.VAPID_SUBJECT || 'mailto:contacto@panfree.fit'

  if (!publicKey || !privateKey) {
    logger.warn('[Push] Claves VAPID no encontradas en variables de entorno')
    return null
  }

  try {
    const subject = emailContact.startsWith('mailto:') || emailContact.startsWith('http')
      ? emailContact
      : `mailto:${emailContact}`

    webpush.setVapidDetails(subject, publicKey, privateKey)
    return webpush
  } catch (err) {
    logger.error('[Push] Error configurando webpush VAPID:', err.message)
    return null
  }
}

function getDbClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
  const anonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)

  if (serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey)
  }
  return createSupabaseClient(supabaseUrl, anonKey)
}

export async function POST(request) {
  try {
    // AUD-010: auth obligatoria antes de cualquier operacion
    const auth = await requireAuth(request, { requireAdmin: true })
    if (!auth.ok) return auth.response

    const wp = getWebPush()
    if (!wp) {
      return NextResponse.json({
        success: false,
        warning: 'Servicio Push no configurado: faltan claves VAPID en Vercel',
        enviadas: 0,
      }, { status: 200 })
    }

    let body = {}
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Cuerpo de solicitud JSON invalido' }, { status: 400 })
    }

    const {
      titulo,
      title,
      cuerpo,
      mensaje,
      body: bodyText,
      url,
      url_accion,
      user_id,
      userId,
      sendToAdmins,
      tag,
      icon,
      badge,
    } = body

    const finalTitle = titulo || title || 'PanFree - Nuevo Pedido'
    const finalBody = cuerpo || mensaje || bodyText || 'Tienes una nueva notificacion en el panel'
    const finalUrl = url || url_accion || '/admin/pedidos'
    const finalIcon = icon || '/icons/icon-192x192.png'
    const finalBadge = badge || '/icons/icon-96x96.png'
    const finalTag = tag || `panfree-${Date.now()}`

    const rawUserId = user_id || userId
    const targetUserId = typeof rawUserId === 'string' ? rawUserId.trim() : null

    const db = getDbClient()
    let subscriptions = []

    // 1. Caso: Enviar a un usuario especifico
    if (targetUserId) {
      if (!isValidUUID(targetUserId)) {
        return NextResponse.json({
          success: false,
          error: `El ID de usuario "${targetUserId}" no es un UUID valido.`,
          recibido: targetUserId,
        }, { status: 400 })
      }

      const { data, error } = await db
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', targetUserId)

      if (error) {
        return NextResponse.json({
          success: false,
          error: `Error consultando la base de datos: ${error.message}`,
        }, { status: 500 })
      }

      subscriptions = data || []
    }
    // 2. Caso: Enviar a administradores (AUD-010: sin fallback a difusion)
    else if (sendToAdmins === true) {
      let adminAuthIds = []

      try {
        const { data: adminUsers, error: adminErr } = await db
          .from('usuarios')
          .select('id, auth_user_id')
          .eq('rol', 'admin')

        if (!adminErr && adminUsers && adminUsers.length > 0) {
          adminAuthIds = adminUsers
            .map(u => u.auth_user_id || u.id)
            .filter(id => isValidUUID(id))
        }
      } catch (adminQueryErr) {
        logger.warn('[Push] Error consultando tabla usuarios:', adminQueryErr.message)
      }

      if (adminAuthIds.length > 0) {
        const { data: adminSubs, error: subsErr } = await db
          .from('push_subscriptions')
          .select('*')
          .in('user_id', adminAuthIds)

        if (!subsErr && adminSubs && adminSubs.length > 0) {
          subscriptions = adminSubs
        }
      }
    }
    else {
      return NextResponse.json({
        success: false,
        error: 'Debe especificar user_id o sendToAdmins=true',
      }, { status: 400 })
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay dispositivos suscritos para recibir la notificacion push',
        enviadas: 0,
        total: 0,
      })
    }

    // 3. Deduplicar suscripciones por endpoint
    const subsUnicas = Array.from(
      new Map(subscriptions.map(s => [s.endpoint, s])).values()
    )

    logger.log(`[Push] Enviando notificacion a ${subsUnicas.length} endpoints unicos`)

    const payload = JSON.stringify({
      title: finalTitle,
      body: finalBody,
      icon: finalIcon,
      badge: finalBadge,
      tag: finalTag,
      data: {
        url: finalUrl,
        timestamp: Date.now(),
      },
    })

    let enviadas = 0
    let fallos = 0
    const endpointsAEliminar = []

    await Promise.all(
      subsUnicas.map(async (sub) => {
        try {
          const subData = sub.subscription || {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }

          const pushSubscription = {
            endpoint: subData.endpoint || sub.endpoint,
            keys: {
              p256dh: subData.keys?.p256dh || sub.p256dh,
              auth: subData.keys?.auth || sub.auth,
            },
          }

          if (!pushSubscription.endpoint || !pushSubscription.keys?.p256dh || !pushSubscription.keys?.auth) {
            fallos++
            return
          }

          await wp.sendNotification(pushSubscription, payload)
          enviadas++
        } catch (err) {
          logger.error(`[Push] Error enviando a endpoint (${err.statusCode || err.message})`)
          fallos++
          if (err.statusCode === 410 || err.statusCode === 404) {
            endpointsAEliminar.push(sub.endpoint)
          }
        }
      })
    )

    // 4. Limpieza automatica de endpoints caducados
    if (endpointsAEliminar.length > 0) {
      logger.log(`[Push] Eliminando ${endpointsAEliminar.length} suscripciones caducadas...`)
      try {
        await db
          .from('push_subscriptions')
          .delete()
          .in('endpoint', endpointsAEliminar)
      } catch (err) {
        logger.warn('Error en limpieza de suscripciones:', err.message)
      }
    }

    return NextResponse.json({
      success: true,
      enviadas,
      fallos,
      total: subsUnicas.length,
      mensaje: `Notificaciones push enviadas a ${enviadas} de ${subsUnicas.length} dispositivos`,
    })
  } catch (error) {
    logger.error('[Push] Error general en /api/push-notificar:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno al enviar notificaciones push',
    }, { status: 500 })
  }
}