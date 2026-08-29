/**
 * 📁 UBICACIÓN: src/app/api/push-notificar/route.js
 * 📅 ACTUALIZADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Endpoint para enviar notificaciones Push Web (VAPID) con web-push:
 *    - Envío a un usuario específico (user_id / userId) o a todos los administradores (rol = 'admin')
 *    - Deduplicación por endpoint (un dispositivo real = 1 notificación)
 *    - Limpieza automática de suscripciones vencidas o desinstaladas (HTTP 410 Gone / 404 Not Found)
 *    - Soporta invocación directa server-side o desde panel administrativo
 */

import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { sanitizeSupabaseUrl, sanitizeSupabaseKey } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Configura VAPID en web-push usando variables de entorno
 */
function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const emailContact = process.env.NEXT_PUBLIC_VAPID_EMAIL || process.env.VAPID_SUBJECT || 'mailto:contacto@panfree.py'

  if (!publicKey || !privateKey) {
    console.warn('⚠️ [Push] Claves VAPID no encontradas en variables de entorno (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)')
    return null
  }

  try {
    const subject = emailContact.startsWith('mailto:') || emailContact.startsWith('http')
      ? emailContact
      : `mailto:${emailContact}`

    webpush.setVapidDetails(subject, publicKey, privateKey)
    return webpush
  } catch (err) {
    console.error('❌ [Push] Error configurando webpush VAPID:', err.message)
    return null
  }
}

/**
 * Obtiene el cliente Supabase con service_role si está disponible
 */
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
    const wp = getWebPush()
    if (!wp) {
      return NextResponse.json({
        success: false,
        warning: 'Servicio Push no configurado: faltan claves VAPID en .env',
        enviadas: 0,
      }, { status: 200 })
    }

    const body = await request.json()
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

    const finalTitle = titulo || title || '🍞 PanFree - Nuevo Pedido'
    const finalBody = cuerpo || mensaje || bodyText || 'Tienes una nueva notificación en el panel'
    const finalUrl = url || url_accion || '/admin/pedidos'
    const finalIcon = icon || '/icons/icon-192x192.png'
    const finalBadge = badge || '/icons/icon-96x96.png'
    const finalTag = tag || `panfree-${Date.now()}`

    const targetUserId = user_id || userId
    const db = getDbClient()

    let subscriptions = []

    // 1. Caso: Enviar a usuario específico
    if (targetUserId) {
      const { data, error } = await db
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', targetUserId)

      if (error) {
        console.error('❌ [Push] Error consultando suscripción del usuario:', error)
        throw error
      }
      subscriptions = data || []
    } 
    // 2. Caso: Enviar a todos los administradores
    else if (sendToAdmins || !targetUserId) {
      // Buscar IDs de administradores en la tabla usuarios
      const { data: adminUsers, error: adminErr } = await db
        .from('usuarios')
        .select('id, auth_user_id')
        .eq('rol', 'admin')

      if (!adminErr && adminUsers && adminUsers.length > 0) {
        const adminAuthIds = adminUsers
          .map(u => u.auth_user_id || u.id)
          .filter(Boolean)

        if (adminAuthIds.length > 0) {
          const { data: adminSubs, error: subsErr } = await db
            .from('push_subscriptions')
            .select('*')
            .in('user_id', adminAuthIds)

          if (!subsErr && adminSubs) {
            subscriptions = adminSubs
          }
        }
      }

      // Si no encontró por usuarios, consultar todas las push_subscriptions disponibles
      if (subscriptions.length === 0) {
        const { data: allSubs } = await db
          .from('push_subscriptions')
          .select('*')
          .limit(50)

        subscriptions = allSubs || []
      }
    }

    if (subscriptions.length === 0) {
      console.log(`ℹ️ [Push] No hay suscripciones activas para ${targetUserId ? `usuario ${targetUserId}` : 'administradores'}.`)
      return NextResponse.json({
        success: true,
        message: 'No hay dispositivos suscritos para recibir la notificación push',
        enviadas: 0,
        total: 0,
      })
    }

    // 3. Deduplicar suscripciones por endpoint (1 dispositivo real = 1 notificación)
    const subsUnicas = Array.from(
      new Map(subscriptions.map(s => [s.endpoint, s])).values()
    )

    console.log(`📨 [Push] Enviando notificación a ${subsUnicas.length} endpoints únicos`)

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

          // Asegurar estructura válida para webpush
          const pushSubscription = {
            endpoint: subData.endpoint || sub.endpoint,
            keys: {
              p256dh: subData.keys?.p256dh || sub.p256dh,
              auth: subData.keys?.auth || sub.auth,
            },
          }

          if (!pushSubscription.endpoint || !pushSubscription.keys?.p256dh || !pushSubscription.keys?.auth) {
            console.warn('⚠️ [Push] Suscripción inválida (faltan keys/endpoint):', sub.id)
            return
          }

          await wp.sendNotification(pushSubscription, payload)
          enviadas++
        } catch (err) {
          console.error(`⚠️ [Push] Error enviando a endpoint (${err.statusCode || err.message}):`, sub.endpoint)
          fallos++

          // Si el endpoint expiró o fue desinstalado (404 Not Found o 410 Gone), marcar para limpieza
          if (err.statusCode === 410 || err.statusCode === 404) {
            endpointsAEliminar.push(sub.endpoint)
          }
        }
      })
    )

    // 4. Limpieza automática de endpoints caducados
    if (endpointsAEliminar.length > 0) {
      console.log(`🧹 [Push] Eliminando ${endpointsAEliminar.length} suscripciones caducadas...`)
      await db
        .from('push_subscriptions')
        .delete()
        .in('endpoint', endpointsAEliminar)
        .catch(err => console.warn('Error en limpieza:', err.message))
    }

    return NextResponse.json({
      success: true,
      enviadas,
      fallos,
      total: subsUnicas.length,
      mensaje: `Notificaciones push enviadas a ${enviadas} de ${subsUnicas.length} dispositivos`,
    })
  } catch (error) {
    console.error('💥 [Push] Error general en /api/push-notificar:', error)
    return NextResponse.json({
      error: error.message || 'Error interno al enviar notificaciones push',
    }, { status: 500 })
  }
}
