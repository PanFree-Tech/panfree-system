/**
 * 📁 UBICACIÓN: src/app/api/calcular-delivery/route.js
 * 📅 ACTUALIZADO: 2026-08-17
 * 📌 DESCRIPCIÓN: Calcula el costo de envío según ubicación.
 *    - Verifica token de Supabase
 *    - ✅ AGREGADO: lógica de envío gratis cuando subtotal >= 50000
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const UMBRAL_ENVIO_GRATIS = 50000 // ₲ 50.000

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
        { error: 'No autorizado. Inicia sesión para calcular envío.' },
        { status: 401 }
      )
    }

    // ============================================
    // OBTENER DATOS DEL REQUEST
    // ============================================
    const body = await request.json()
    const { zona, peso = 0, distancia = 0, subtotal = 0 } = body

    if (!zona) {
      return NextResponse.json(
        { error: 'Zona de envío requerida' },
        { status: 400 }
      )
    }

    // ============================================
    // LÓGICA DE CÁLCULO DE DELIVERY
    // ============================================
    const costos = {
      zona1: 15000, // ₲ 15.000
      zona2: 25000, // ₲ 25.000
      zona3: 35000, // ₲ 35.000
      retirar: 0,   // Retiro en tienda
    }

    const costoBase = costos[zona] || 20000

    // Costo adicional por peso (opcional)
    const costoAdicionalPorPeso = peso > 0 ? (peso - 1) * 2000 : 0

    let costoFinal = costoBase + costoAdicionalPorPeso

    // ✅ Si el subtotal supera el umbral, envío gratis
    if (subtotal >= UMBRAL_ENVIO_GRATIS) {
      costoFinal = 0
    }

    // ============================================
    // DEVOLVER RESULTADO
    // ============================================
    return NextResponse.json({
      zona,
      costo: costoFinal,
      costo_base: costoBase,
      costo_adicional_peso: costoAdicionalPorPeso,
      subtotal: subtotal,
      envío_gratis: costoFinal === 0 && subtotal >= UMBRAL_ENVIO_GRATIS,
      tiempo_entrega: '24-48 horas',
      disponible: true,
    })
  } catch (error) {
    console.error('Error en /api/calcular-delivery:', error)
    return NextResponse.json(
      { error: 'Error al calcular envío' },
      { status: 500 }
    )
  }
}