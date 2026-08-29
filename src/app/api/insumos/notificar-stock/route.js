/**
 * 📁 UBICACIÓN: src/app/api/insumos/notificar-stock/route.js
 * 📅 CREADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Endpoint para disparar alertas internas de stock bajo en materias primas.
 */

import { NextResponse } from 'next/server'
import { notificarStockBajo } from '@/lib/notificaciones'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const body = await req.json()
    const { insumo } = body

    if (!insumo || !insumo.nombre) {
      return NextResponse.json({ error: 'Datos de insumo incompletos' }, { status: 400 })
    }

    const resultado = await notificarStockBajo(insumo)

    return NextResponse.json({
      success: true,
      message: `Alerta de stock bajo emitida para ${insumo.nombre}`,
      resultado,
    })
  } catch (error) {
    console.error('💥 Error en /api/insumos/notificar-stock:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno al notificar stock bajo' },
      { status: 500 }
    )
  }
}
