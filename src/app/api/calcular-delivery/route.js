/**
 * src/app/api/calcular-delivery/route.js
 * Calcula el costo de envío según ubicación.
 * NO requiere autenticación (el costo depende de la zona, no del usuario).
 */

import logger from '@/lib/logger'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const UMBRAL_ENVIO_GRATIS = 50000 // ₲ 50.000

export async function POST(request) {
  try {
    const body = await request.json()
    const { zona, peso = 0, distancia = 0, subtotal = 0 } = body

    if (!zona) {
      return NextResponse.json(
        { error: 'Zona de envío requerida' },
        { status: 400 }
      )
    }

    const costos = {
      zona1: 15000,
      zona2: 25000,
      zona3: 35000,
      retirar: 0,
    }

    const costoBase = costos[zona] || 20000
    const costoAdicionalPorPeso = peso > 0 ? (peso - 1) * 2000 : 0
    let costoFinal = costoBase + costoAdicionalPorPeso

    if (subtotal >= UMBRAL_ENVIO_GRATIS) {
      costoFinal = 0
    }

    return NextResponse.json({
      zona,
      costo: costoFinal,
      costo_base: costoBase,
      costo_adicional_peso: costoAdicionalPorPeso,
      subtotal: subtotal,
      envio_gratis: costoFinal === 0 && subtotal >= UMBRAL_ENVIO_GRATIS,
      tiempo_entrega: '24-48 horas',
      disponible: true,
    })
  } catch (error) {
    logger.error('Error en /api/calcular-delivery:', error)
    return NextResponse.json(
      { error: 'Error al calcular envío' },
      { status: 500 }
    )
  }
}