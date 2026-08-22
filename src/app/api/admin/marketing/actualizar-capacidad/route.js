/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/actualizar-capacidad/route.js
 * 📌 ENDPOINT: POST /api/admin/marketing/actualizar-capacidad
 * 📖 DESCRIPCIÓN: Actualiza la cantidad de pedidos actuales (current_orders) o la capacidad
 *    de producción diaria (production_capacity) de un producto.
 *    Recalcula automáticamente el estado de disponibilidad:
 *    - DISPONIBLE (current_orders < 80% de production_capacity)
 *    - CAPACIDAD LIMITADA (current_orders >= 80% y < 100%)
 *    - CERRADO (current_orders >= 100% de production_capacity)
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Calcula el estado y disponibilidad según la capacidad y pedidos actuales
 */
function calcularEstadoDisponibilidad(capacity, orders) {
  const cap = Math.max(1, Number(capacity) || 10)
  const ord = Math.max(0, Number(orders) || 0)

  if (ord >= cap) {
    return {
      availability_status: 'CERRADO',
      order_available: false,
      production_capacity: cap,
      current_orders: ord,
      remaining_capacity: 0,
      porcentaje_ocupacion: Math.round((ord / cap) * 100),
    }
  }

  if (ord >= cap * 0.8) {
    return {
      availability_status: 'CAPACIDAD LIMITADA',
      order_available: true,
      production_capacity: cap,
      current_orders: ord,
      remaining_capacity: cap - ord,
      porcentaje_ocupacion: Math.round((ord / cap) * 100),
    }
  }

  return {
    availability_status: 'DISPONIBLE',
    order_available: true,
    production_capacity: cap,
    current_orders: ord,
    remaining_capacity: cap - ord,
    porcentaje_ocupacion: Math.round((ord / cap) * 100),
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      producto_id,
      cantidad_pedidos,
      current_orders,
      incremento = 0,
      production_capacity,
      lead_time,
    } = body || {}

    if (!producto_id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el parámetro producto_id' },
        { status: 400 }
      )
    }

    // 1. Obtener producto actual de Supabase
    const { data: productoActual, error: fetchErr } = await supabase
      .from('productos')
      .select('id, nombre, production_capacity, current_orders, lead_time, order_available, availability_status')
      .eq('id', producto_id)
      .single()

    if (fetchErr || !productoActual) {
      return NextResponse.json(
        {
          success: false,
          error: fetchErr?.message || `No se encontró el producto con ID: ${producto_id}`,
        },
        { status: 404 }
      )
    }

    // 2. Determinar nueva capacidad y pedidos
    const nuevaCapacidad =
      production_capacity !== undefined
        ? Number(production_capacity)
        : Number(productoActual.production_capacity || 10)

    let nuevosPedidos = Number(productoActual.current_orders || 0)

    if (cantidad_pedidos !== undefined) {
      nuevosPedidos = Number(cantidad_pedidos)
    } else if (current_orders !== undefined) {
      nuevosPedidos = Number(current_orders)
    } else if (incremento) {
      nuevosPedidos = Math.max(0, nuevosPedidos + Number(incremento))
    }

    const nuevoLeadTime =
      lead_time !== undefined ? Number(lead_time) : Number(productoActual.lead_time || 24)

    // 3. Calcular estado resultante
    const calculo = calcularEstadoDisponibilidad(nuevaCapacidad, nuevosPedidos)

    const updatePayload = {
      production_capacity: calculo.production_capacity,
      current_orders: calculo.current_orders,
      availability_status: calculo.availability_status,
      order_available: calculo.order_available,
      lead_time: nuevoLeadTime,
    }

    // 4. Actualizar en Supabase
    const { data: productoActualizado, error: updateErr } = await supabase
      .from('productos')
      .update(updatePayload)
      .eq('id', producto_id)
      .select('*')
      .single()

    if (updateErr) {
      console.error('Error al actualizar capacidad en Supabase:', updateErr)
      return NextResponse.json(
        {
          success: false,
          error: `Error al actualizar producto: ${updateErr.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: `Capacidad de producción actualizada para "${productoActual.nombre}": Estado ${calculo.availability_status}`,
      producto: {
        id: productoActualizado.id,
        nombre: productoActualizado.nombre,
        categoria: productoActualizado.categoria,
        production_capacity: calculo.production_capacity,
        current_orders: calculo.current_orders,
        remaining_capacity: calculo.remaining_capacity,
        porcentaje_ocupacion: calculo.porcentaje_ocupacion,
        lead_time: nuevoLeadTime,
        availability_status: calculo.availability_status,
        order_available: calculo.order_available,
      },
    })
  } catch (error) {
    console.error('Error en actualizar-capacidad route:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error inesperado al actualizar capacidad' },
      { status: 500 }
    )
  }
}
