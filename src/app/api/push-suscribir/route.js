/**
 * 📁 UBICACIÓN: src/app/api/push-suscribir/route.js
 * 📅 ACTUALIZADO: 2026-08-15
 * 📌 DESCRIPCIÓN: Registra cliente para notificaciones push.
 *    Ahora verifica duplicados antes de insertar.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    // ============================================
    // VERIFICAR AUTENTICACIÓN
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

    // ============================================
    // OBTENER DATOS DEL REQUEST
    // ============================================
    const body = await request.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Subscription object requerida' },
        { status: 400 }
      )
    }

    const endpoint = subscription.endpoint.trim()

    // ============================================
    // VERIFICAR SI YA EXISTE (PREVENIR DUPLICADOS)
    // ============================================
    const { data: existing, error: selectError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('endpoint', endpoint)
      .limit(1)

    if (selectError) {
      console.error('Error verificando suscripción existente:', selectError)
      throw selectError
    }

    if (existing?.length > 0) {
      // Actualizar claves si cambiaron
      await supabase
        .from('push_subscriptions')
        .update({
          p256dh: subscription.keys?.p256dh || null,
          auth: subscription.keys?.auth || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id)

      return NextResponse.json({
        success: true,
        message: 'Ya suscrito a notificaciones push',
      })
    }

    // ============================================
    // GUARDAR NUEVA SUSCRIPCIÓN
    // ============================================
    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: session.user.id,
        endpoint: endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error guardando subscription:', insertError)
      throw insertError
    }

    // ============================================
    // DEVOLVER ÉXITO
    // ============================================
    return NextResponse.json({
      success: true,
      message: 'Suscripción registrada para notificaciones push',
    })

  } catch (error) {
    console.error('Error en /api/push-suscribir:', error)
    return NextResponse.json(
      { error: 'Error al registrar suscripción' },
      { status: 500 }
    )
  }
}