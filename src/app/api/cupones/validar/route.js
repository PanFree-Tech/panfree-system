/**
 * 📁 src/app/api/cupones/validar/route.js
 * API para validar cupones desde checkout
 */

import { NextResponse } from 'next/server'
import { validarCupon, calcularDescuento } from '@/lib/cupones'

export async function POST(req) {
  try {
    const body = await req.json()
    const { codigo, clienteId, subtotal } = body

    if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
      return NextResponse.json(
        { valido: false, mensaje: 'Código de cupón requerido' },
        { status: 400 }
      )
    }

    const subtotalNum = Number(subtotal) || 0
    const resultado = await validarCupon(codigo, clienteId, subtotalNum)

    if (!resultado.valido) {
      return NextResponse.json(
        { valido: false, mensaje: resultado.mensaje },
        { status: 200 }
      )
    }

    const descuento = calcularDescuento(resultado.cupon, subtotalNum)

    return NextResponse.json({
      valido: true,
      cupon: resultado.cupon,
      descuento,
      totalConDescuento: Math.max(0, subtotalNum - descuento)
    })

  } catch (error) {
    console.error('Error en /api/cupones/validar:', error)
    return NextResponse.json(
      { valido: false, mensaje: 'Error interno al procesar el cupón' },
      { status: 500 }
    )
  }
}
