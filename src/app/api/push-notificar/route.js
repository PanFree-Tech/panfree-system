/**
 * 📁 UBICACIÓN: src/app/api/push-notificar/route.js
 * 📅 ACTUALIZADO: 2026-03-06
 * 📌 FIX: Supabase y webpush inicializados dentro de la función (no a nivel módulo)
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export async function POST(request) {
  try {
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Inicializar dentro de la función para evitar error en build
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    webpush.setVapidDetails(
      'mailto:notificaciones@panfree.fit',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )

    const { titulo, cuerpo, url } = await request.json()

    const { data: suscripciones, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (error) throw error
    if (!suscripciones?.length) {
      return NextResponse.json({ ok: true, enviadas: 0, mensaje: 'Sin suscripciones activas' })
    }

    const payload = JSON.stringify({
      title: titulo || '🍞 PanFree',
      body : cuerpo || 'Nuevo pedido recibido',
      icon : '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      url  : url || 'https://panfree.fit/admin',
    })

    const resultados = await Promise.allSettled(
      suscripciones.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    // Limpiar suscripciones expiradas
    const expiradas = resultados
      .map((r, i) => r.status === 'rejected' && r.reason?.statusCode === 410 ? suscripciones[i].endpoint : null)
      .filter(Boolean)

    if (expiradas.length) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expiradas)
    }

    const enviadas = resultados.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ ok: true, enviadas, total: suscripciones.length })

  } catch (err) {
    console.error('Error enviando push:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}