/**
 * 📁 UBICACIÓN: src/app/api/notificar-pedido/route.js
 * 📅 CREADO: 2026-08-19
 * 📌 DESCRIPCIÓN: Endpoint server-side para notificar nuevos pedidos a n8n
 * 
 * 🔒 SEGURIDAD: 
 * - Usa token secreto (N8N_WEBHOOK_TOKEN / NEXT_PUBLIC_API_TOKEN) para autenticar
 * - No expone N8N_WEBHOOK_URL en el cliente
 * - Validación de inputs con Zod
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

// ── Validación con Zod ──
const PedidoSchema = z.object({
  pedido: z.object({
    numero: z.string(),
    total: z.number(),
    metodoPago: z.string(),
    metodoEntrega: z.string(),
    items: z.array(z.object({
      nombre: z.string(),
      cantidad: z.number(),
      precio: z.number(),
    })),
  }),
  cliente: z.object({
    nombre: z.string(),
    email: z.string().optional().nullable(),
    telefono: z.string(),
    direccion: z.string().optional().nullable(),
  }),
})

export async function POST(req) {
  try {
    // 1. Verificar token de autenticación
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const validTokens = [
      process.env.N8N_WEBHOOK_TOKEN,
      process.env.NEXT_PUBLIC_API_TOKEN,
    ].filter(Boolean)

    if (validTokens.length > 0 && (!token || !validTokens.includes(token))) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 2. Validar body
    const body = await req.json()
    const validated = PedidoSchema.parse(body)

    // 3. Enviar a n8n
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://panfree-bot.app.n8n.cloud/webhook/pedido'
    if (n8nUrl) {
      try {
        const response = await fetch(n8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validated),
        })

        if (!response.ok) {
          console.warn(`[n8n] Respuesta con estado: ${response.status}`)
        }
      } catch (n8nErr) {
        console.error('[n8n] Error conectando con n8n:', n8nErr.message)
      }
    }

    // 4. Registrar en notificaciones_admin
    try {
      await supabase.from('notificaciones_admin').insert({
        mensaje: `📦 Nuevo pedido ${validated.pedido.numero} enviado a n8n`,
        leida: false,
      })
    } catch (notifErr) {
      console.warn('[notificaciones_admin] Registro opcional:', notifErr.message)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pedido notificado a n8n' 
    })

  } catch (error) {
    console.error('Error en /api/notificar-pedido:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
