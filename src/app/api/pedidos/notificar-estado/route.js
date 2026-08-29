/**
 * 📁 UBICACIÓN: src/app/api/pedidos/notificar-estado/route.js
 * 📅 CREADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Endpoint para disparar notificaciones automáticas por cambio de estado de pedido:
 *    - Envía email transaccional al cliente informando la nueva fase (confirmado, en_produccion, listo, entregado, cancelado)
 *    - Si es 'cancelado', genera alerta interna en notificaciones_admin
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notificarCambioEstadoPedido } from '@/lib/notificaciones'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gbdrcaumghykiipqgbty.supabase.co'

  if (serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey)
  }
  return supabase
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { pedidoId, nuevoEstado, pedido: providedPedido, cliente: providedCliente } = body

    if (!nuevoEstado) {
      return NextResponse.json({ error: 'nuevoEstado es requerido' }, { status: 400 })
    }

    let pedido = providedPedido
    let cliente = providedCliente

    // Si no se pasaron completos los datos del pedido y cliente, buscarlos en la base de datos
    if (!pedido || !cliente) {
      if (!pedidoId) {
        return NextResponse.json({ error: 'pedidoId es requerido si no se envía pedido' }, { status: 400 })
      }

      const db = getSupabaseClient()
      const { data: dbPedido, error: pErr } = await db
        .from('pedidos')
        .select(`
          id, numero_pedido, estado, metodo_entrega, metodo_pago,
          entrega_direccion, entrega_costo, total_final, subtotal,
          created_at, cliente_id,
          clientes (
            id, nombre_completo, email, telefono
          )
        `)
        .eq('id', pedidoId)
        .single()

      if (pErr || !dbPedido) {
        console.error('❌ Error buscando pedido en BD para notificar estado:', pErr?.message)
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
      }

      pedido = dbPedido
      cliente = dbPedido.clientes
    }

    const resultado = await notificarCambioEstadoPedido(pedido, cliente, nuevoEstado)

    return NextResponse.json({
      success: true,
      message: `Notificación de estado '${nuevoEstado}' procesada`,
      resultado,
    })
  } catch (error) {
    console.error('💥 Error en /api/pedidos/notificar-estado:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno al notificar cambio de estado' },
      { status: 500 }
    )
  }
}
