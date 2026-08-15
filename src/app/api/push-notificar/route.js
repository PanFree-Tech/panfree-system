/**
 * 📁 UBICACIÓN: src/app/api/push-notificar/route.js
 * 📅 ACTUALIZADO: 2026-08-15
 * 📌 DESCRIPCIÓN: Envía notificaciones push a clientes.
 *    CAMBIO CRÍTICO: DEDUPLICA por endpoint antes de enviar.
 *    Un endpoint = un dispositivo real → 1 notificación por dispositivo.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

// Configurar web-push
webpush.setVapidDetails(
  'mailto:' + (process.env.NEXT_PUBLIC_VAPID_EMAIL || 'contact@panfree.py'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function POST(request) {
  try {
    // ============================================
    // VERIFICAR AUTENTICACIÓN Y PERMISOS (ADMIN ONLY)
    // ============================================
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes estar autenticado.' },
        { status: 401 }
      )
    }

    // Verificar que es admin
    const isAdmin = session.user.user_metadata?.role === 'admin' ||
      session.user.app_metadata?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Solo admins pueden enviar notificaciones.' },
        { status: 403 }
      )
    }

    // ============================================
    // OBTENER DATOS DEL REQUEST
    // ============================================
    const body = await request.json()
    const { titulo, cuerpo, url_accion, user_id } = body

    if (!titulo || !cuerpo) {
      return NextResponse.json(
        { error: 'titulo y cuerpo son requeridos' },
        { status: 400 }
      )
    }

    // ============================================
    // OBTENER SUBSCRIPCIONES
    // ============================================
    let query = supabase.from('push_subscriptions').select('*')

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: subscriptions, error: selectError } = await query

    if (selectError) {
      throw selectError
    }

    // ============================================
    // ✅ DEDUPLICAR POR ENDPOINT (UN ENDPOINT = UN DISPOSITIVO)
    // ============================================
    const subsUnicas = Array.from(
      new Map((subscriptions || []).map(s => [s.endpoint, s])).values()
    )

    console.log(`📨 ${(subscriptions || []).length} filas, ${subsUnicas.length} endpoints únicos`)

    // ============================================
    // ENVIAR NOTIFICACIONES
    // ============================================
    const payload = JSON.stringify({
      title: titulo,
      body: cuerpo,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: {
        url: url_accion || '/',
      },
    })

    let enviadas = 0
    let fallos = 0

    for (const sub of subsUnicas) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
        enviadas++
      } catch (err) {
        console.error('Error enviando notificación:', err)
        fallos++
        // Limpieza automática: si el endpoint ya no existe (410 Gone / 404),
        // borrar la suscripción vencida para no seguir intentando
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          console.log(`🧹 Suscripción eliminada: ${sub.endpoint}`)
        }
      }
    }

    // ============================================
    // DEVOLVER RESULTADO
    // ============================================
    return NextResponse.json({
      success: true,
      enviadas,
      fallos,
      total: subsUnicas.length,
      mensaje: `Notificaciones enviadas a ${enviadas} dispositivos`,
    })

  } catch (error) {
    console.error('Error en /api/push-notificar:', error)
    return NextResponse.json(
      { error: 'Error al enviar notificaciones' },
      { status: 500 }
    )
  }
}