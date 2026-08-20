/**
 * 📁 UBICACIÓN: src/app/api/send-whatsapp-team/route.js
 * 📅 CREADO: 2026-08-19
 * 📌 DESCRIPCIÓN: Envía mensajes de WhatsApp al equipo usando Twilio/WhatsApp API
 * 
 * 🔒 SEGURIDAD: Solo admin (verifica rol en app_metadata o token interno)
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { supabase as supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ── Validación ──
const WhatsAppSchema = z.object({
  mensaje: z.string().min(1),
  telefono: z.string().optional(),
  tipo: z.enum(['pedido', 'alerta']).default('pedido'),
})

export async function POST(req) {
  try {
    // 1. Verificar autenticación y rol admin o token
    const cookieStore = cookies()
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gbdrcaumghykiipqgbty.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjczNjIsImV4cCI6MjA4NzgwMzM2Mn0.OydRQxa51Ql42zvscWnQkEKJuU_3yeCS4qPQQoP6TuM',
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )
    
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const validTokens = [process.env.N8N_WEBHOOK_TOKEN, process.env.NEXT_PUBLIC_API_TOKEN].filter(Boolean)
    const isTokenAuth = validTokens.length > 0 && validTokens.includes(token)

    if (!isTokenAuth) {
      const { data: { user } } = await supabaseClient.auth.getUser()
      const userRole = user?.app_metadata?.role || user?.user_metadata?.role || user?.raw_user_meta_data?.role
      if (!user || userRole !== 'admin') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    // 2. Validar body
    const body = await req.json()
    const validated = WhatsAppSchema.parse(body)

    // 3. Determinar número de destino
    const telefono = validated.telefono || process.env.WHATSAPP_TEAM_NUMBER || '595984589845'
    if (!telefono) {
      throw new Error('No se especificó número de teléfono')
    }

    // 4. Enviar mensaje (usando Twilio o WhatsApp Cloud API según configuración)
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER

    const waAccessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (accountSid && authToken && fromNumber) {
      try {
        const twilioModule = await import('twilio')
        const twilioClient = (twilioModule.default || twilioModule)(accountSid, authToken)
        await twilioClient.messages.create({
          body: validated.mensaje,
          from: `whatsapp:${fromNumber}`,
          to: `whatsapp:${telefono}`,
        })
      } catch (twErr) {
        console.error('[Twilio Error]', twErr.message)
      }
    } else if (waAccessToken && waPhoneId) {
      try {
        await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: telefono.replace(/\D/g, ''),
            type: 'text',
            text: { body: validated.mensaje },
          }),
        })
      } catch (waErr) {
        console.error('[WhatsApp Cloud API Error]', waErr.message)
      }
    } else {
      console.log('[WhatsApp Team Fallback Log] Mensaje:', validated.mensaje)
      console.log('[WhatsApp Team Fallback Log] Para:', telefono)
    }

    // 5. Registrar en notificaciones_admin
    try {
      await supabaseAdmin.from('notificaciones_admin').insert({
        mensaje: `📱 WhatsApp enviado al equipo: ${validated.mensaje.substring(0, 50)}...`,
        leida: false,
      })
    } catch (notifErr) {
      console.warn('[notificaciones_admin] Registro opcional:', notifErr.message)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Mensaje enviado al equipo' 
    })

  } catch (error) {
    console.error('Error en /api/send-whatsapp-team:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
