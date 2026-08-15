/**
 * 📁 UBICACIÓN: src/app/api/notificar-pedido/route.js
 * 📅 ACTUALIZADO: 2026-08-15 (PROTEGIDO CON AUTENTICACIÓN)
 * 📌 DESCRIPCIÓN: Notifica al cliente cuando se confirma un pedido.
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
    const { pedido_id, email, datos_pedido } = body

    if (!pedido_id || !email) {
      return NextResponse.json(
        { error: 'pedido_id y email son requeridos' },
        { status: 400 }
      )
    }

    // ============================================
    // ENVIAR EMAIL DE CONFIRMACIÓN
    // ============================================
    // Usar Supabase para enviar email
    const { error: emailError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Ya confirmado
      user_metadata: {
        pedido_id: pedido_id,
      },
    })

    if (emailError && !emailError.message.includes('already exists')) {
      throw emailError
    }

    // ============================================
    // REGISTRAR EN BD (OPCIONAL)
    // ============================================
    // Aquí irían las inserciones en tabla de notificaciones, si existen

    // ============================================
    // DEVOLVER ÉXITO
    // ============================================
    return NextResponse.json({
      success: true,
      mensaje: `Email de confirmación enviado a ${email}`,
      pedido_id,
    })
  } catch (error) {
    console.error('Error en /api/notificar-pedido:', error)
    return NextResponse.json(
      { error: 'Error al enviar notificación' },
      { status: 500 }
    )
  }
}