/**
 * 📁 UBICACIÓN: src/app/api/webhook-pedido/route.js
 * 📅 CREADO: 2026-08-19
 * 📌 DESCRIPCIÓN: Webhook para que n8n actualice estados de pedidos
 * 
 * 🔒 SEGURIDAD: Usa token para autenticar (N8N_INCOMING_TOKEN)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const WebhookSchema = z.object({
  numero_pedido: z.string(),
  estado: z.enum(['pendiente', 'confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado']),
  notas: z.string().optional(),
})

export async function POST(req) {
  try {
    // 1. Verificar token
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const incomingToken = process.env.N8N_INCOMING_TOKEN

    if (incomingToken && token !== incomingToken) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 2. Validar body
    const body = await req.json()
    const validated = WebhookSchema.parse(body)

    // 3. Actualizar pedido en Supabase
    const updatePayload = { 
      estado: validated.estado,
      updated_at: new Date().toISOString(),
    }
    if (validated.notas) {
      updatePayload.notas = validated.notas
    }

    const { data, error } = await supabase
      .from('pedidos')
      .update(updatePayload)
      .eq('numero_pedido', validated.numero_pedido)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // 4. Registrar notificación
    try {
      await supabase.from('notificaciones_admin').insert({
        mensaje: `🔄 Pedido ${validated.numero_pedido} actualizado a ${validated.estado} (vía webhook)`,
        leida: false,
      })
    } catch (notifErr) {
      console.warn('[notificaciones_admin] Registro opcional:', notifErr.message)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pedido actualizado',
      data 
    })

  } catch (error) {
    console.error('Error en /api/webhook-pedido:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
