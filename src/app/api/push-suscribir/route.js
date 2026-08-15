/**
 * 📁 UBICACIÓN: src/app/api/push-suscribir/route.js
 * 📅 ACTUALIZADO: 2026-08-15 (PROTEGIDO CON AUTENTICACIÓN)
 * 📌 DESCRIPCIÓN: Registra cliente para notificaciones push.
 *    CAMBIO CRÍTICO: Ahora requiere JWT válido.
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

    // ============================================
    // GUARDAR EN BASE DE DATOS
    // ============================================
    // Asumiendo que existe tabla 'push_subscriptions'
    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
        created_at: new Date().toISOString(),
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
      mensaje: 'Suscripción registrada para notificaciones push',
    })
  } catch (error) {
    console.error('Error en /api/push-suscribir:', error)
    return NextResponse.json(
      { error: 'Error al registrar suscripción' },
      { status: 500 }
    )
  }
}