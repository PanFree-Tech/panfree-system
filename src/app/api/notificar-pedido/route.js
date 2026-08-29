/**
 * 📁 UBICACIÓN: src/app/api/notificar-pedido/route.js
 * 📅 ACTUALIZADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Endpoint server-side integral para procesar notificaciones de pedidos:
 *    - Envío de Email de Confirmación al Cliente con Resend y plantilla transaccional
 *    - Notificación y alertas para administradores (tabla notificaciones_admin, email y WhatsApp)
 *    - Envío no bloqueante a n8n webhook
 * 
 * 🔒 SEGURIDAD:
 * - Validación de inputs con Zod
 * - Tolerante a fallos para no interrumpir la experiencia de compra
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  notificarNuevoPedido,
  enviarEmailConfirmacionCliente,
} from '@/lib/notificaciones'

export const dynamic = 'force-dynamic'

// ── Validación flexible con Zod ──
const PedidoSchema = z.object({
  pedido: z.object({
    id: z.string().optional().nullable(),
    numero: z.string().optional(),
    numero_pedido: z.string().optional(),
    total: z.union([z.number(), z.string()]).optional(),
    total_final: z.union([z.number(), z.string()]).optional(),
    subtotal: z.union([z.number(), z.string()]).optional(),
    descuento_monto: z.union([z.number(), z.string()]).optional(),
    entrega_costo: z.union([z.number(), z.string()]).optional(),
    costoDelivery: z.union([z.number(), z.string()]).optional(),
    metodoPago: z.string().optional(),
    metodo_pago: z.string().optional(),
    metodoEntrega: z.string().optional(),
    metodo_entrega: z.string().optional(),
    direccion: z.string().optional().nullable(),
    entrega_direccion: z.string().optional().nullable(),
    items: z.array(z.any()).optional().default([]),
  }),
  cliente: z.object({
    id: z.string().optional().nullable(),
    nombre: z.string().optional(),
    nombre_completo: z.string().optional(),
    email: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
  }),
})

export async function POST(req) {
  try {
    // 1. Verificar token si está configurado
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const validTokens = [
      process.env.N8N_WEBHOOK_TOKEN,
      process.env.NEXT_PUBLIC_API_TOKEN,
    ].filter(Boolean)

    if (validTokens.length > 0 && token && !validTokens.includes(token)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 2. Validar body
    const body = await req.json()
    const validated = PedidoSchema.parse(body)

    const rawPedido = validated.pedido
    const rawCliente = validated.cliente

    const numeroPedido = rawPedido.numero_pedido || rawPedido.numero || 'N/A'
    const totalFinal = Number(rawPedido.total_final || rawPedido.total || 0)
    const metodoPago = rawPedido.metodo_pago || rawPedido.metodoPago || 'efectivo'
    const metodoEntrega = rawPedido.metodo_entrega || rawPedido.metodoEntrega || 'retiro'
    const direccion = rawPedido.entrega_direccion || rawPedido.direccion || rawCliente.direccion || ''

    const pedidoNormalizado = {
      id: rawPedido.id || null,
      numero_pedido: numeroPedido,
      total_final: totalFinal,
      subtotal: Number(rawPedido.subtotal || totalFinal),
      descuento_monto: Number(rawPedido.descuento_monto || 0),
      entrega_costo: Number(rawPedido.entrega_costo || rawPedido.costoDelivery || 0),
      metodo_pago: metodoPago,
      metodo_entrega: metodoEntrega,
      entrega_direccion: direccion,
      items: rawPedido.items || [],
      created_at: new Date().toISOString(),
    }

    const clienteNormalizado = {
      id: rawCliente.id || null,
      nombre_completo: rawCliente.nombre_completo || rawCliente.nombre || 'Cliente',
      email: rawCliente.email || null,
      telefono: rawCliente.telefono || '',
      direccion,
    }

    const items = rawPedido.items || []

    console.log(`🚀 [API /api/notificar-pedido] Procesando #${numeroPedido} para ${clienteNormalizado.nombre_completo}`)

    // 3. Ejecutar notificaciones transaccionales e internas en paralelo
    const tasks = []

    // 3.1 Email al cliente si tiene correo electrónico
    if (clienteNormalizado.email) {
      tasks.push(
        enviarEmailConfirmacionCliente(pedidoNormalizado, clienteNormalizado, items)
          .catch(err => console.error('❌ Error enviando email de confirmación:', err))
      )
    }

    // 3.2 Alerta y registro interno para administradores
    tasks.push(
      notificarNuevoPedido(pedidoNormalizado, clienteNormalizado, items)
        .catch(err => console.error('❌ Error en notificaciones internas admin:', err))
    )

    // 3.3 Reenvío opcional a n8n si está configurado
    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      tasks.push(
        fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedido: pedidoNormalizado,
            cliente: clienteNormalizado,
          }),
        }).catch(err => console.warn('[n8n Webhook Error]:', err.message))
      )
    }

    await Promise.allSettled(tasks)

    return NextResponse.json({
      success: true,
      message: `Pedido #${numeroPedido} notificado exitosamente por todos los canales`,
    })

  } catch (error) {
    console.error('💥 Error en /api/notificar-pedido:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar notificaciones' },
      { status: 500 }
    )
  }
}

