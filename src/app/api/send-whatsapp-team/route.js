/**
 * 📁 UBICACIÓN: src/app/api/send-whatsapp-team/route.js
 * 📅 ACTUALIZADO: 2026-08-25
 * 📌 DESCRIPCIÓN: Envía mensajes y plantillas de WhatsApp al equipo usando WhatsApp Cloud API / Twilio
 * 
 * 🔒 SEGURIDAD: Solo admin (verifica rol en app_metadata o token interno)
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { supabase as supabaseAdmin, sanitizeSupabaseUrl, DEFAULT_SUPABASE_ANON_KEY } from '@/lib/supabase'
import { enviarPlantillaWhatsApp } from '@/lib/whatsapp'
import { WHATSAPP_TEMPLATES } from '@/lib/whatsapp-templates'

export const dynamic = 'force-dynamic'

// ── Validación de esquema ──
const WhatsAppSchema = z.object({
  mensaje: z.string().optional(),
  telefono: z.string().optional(),
  tipo: z.enum(['pedido', 'alerta', 'HELLO_WORLD', 'PEDIDO_CONFIRMADO', 'PEDIDO_LISTO', 'PROMOCION', 'ALERTA_EQUIPO']).default('ALERTA_EQUIPO'),
  template: z.any().optional(),
  datos: z.any().optional()
})

export async function POST(req) {
  try {
    // 1. Verificar autenticación y rol admin o token
    const cookieStore = cookies()
    const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
    const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) || DEFAULT_SUPABASE_ANON_KEY

    const supabaseClient = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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

    // 4. Enviar mediante Plantilla de WhatsApp Cloud API (o Twilio si está activo)
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER

    let envioResultado = null

    if (accountSid && authToken && fromNumber) {
      try {
        const twilioModule = await import('twilio')
        const twilioClient = (twilioModule.default || twilioModule)(accountSid, authToken)
        const res = await twilioClient.messages.create({
          body: validated.mensaje || 'Alerta operativa del sistema PanFree',
          from: `whatsapp:${fromNumber}`,
          to: `whatsapp:${telefono}`,
        })
        envioResultado = { proveedor: 'twilio', sid: res.sid }
        console.log(`✅ WhatsApp enviado vía Twilio a [${telefono}]`)
      } catch (twErr) {
        console.error('[Twilio Error]', twErr.message)
      }
    } else {
      // Usar WhatsApp Cloud API con plantillas
      const templateTipo = validated.tipo === 'alerta' || validated.tipo === 'pedido' ? 'ALERTA_EQUIPO' : validated.tipo
      const datosPlantilla = validated.datos || { titulo: 'Notificación Equipo PanFree', detalle: validated.mensaje }

      envioResultado = await enviarPlantillaWhatsApp({
        telefono,
        tipo: templateTipo,
        template: validated.template,
        args: [datosPlantilla],
        permitirFallback: true
      })
    }

    // 5. Registrar en notificaciones_admin
    const textoResumen = validated.mensaje || `Plantilla ${validated.tipo} enviada a ${telefono}`
    try {
      await supabaseAdmin.from('notificaciones_admin').insert({
        mensaje: `📱 WhatsApp enviado: ${textoResumen.substring(0, 60)}...`,
        leida: false,
      })
    } catch (notifErr) {
      console.warn('[notificaciones_admin] Registro opcional:', notifErr.message)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plantilla de WhatsApp enviada correctamente',
      detalles: envioResultado
    })

  } catch (error) {
    console.error('Error en /api/send-whatsapp-team:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno al enviar WhatsApp' },
      { status: 500 }
    )
  }
}
