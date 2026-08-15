/**
 * 📁 UBICACIÓN: src/app/api/push-suscribir/route.js
 * 📅 ACTUALIZADO: 2026-08-15
 * 📌 DESCRIPCIÓN: Registra cliente para notificaciones push.
 *    CAMBIO CRÍTICO: Usa UPSERT para evitar duplicados atómicamente.
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
    // ✅ UPSERT: INSERT o UPDATE en una sola operación atómica
    // ============================================
    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: session.user.id,
        endpoint: endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id,endpoint'  // 👈 Usa la constraint UNIQUE que agregaste en SQL
      })

    if (upsertError) {
      console.error('Error guardando subscription:', upsertError)
      throw upsertError
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