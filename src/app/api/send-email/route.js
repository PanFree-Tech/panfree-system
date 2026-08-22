/**
 * 📁 UBICACIÓN: src/app/api/send-email/route.js
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 ENDPOINT: POST /api/send-email
 * 📖 DESCRIPCIÓN: Endpoint para enviar correos electrónicos con Resend y registrar en email_logs.
 *    - Valida los datos recibidos mediante Zod
 *    - Remitente por defecto: contacto@panfree.fit
 *    - Destinatario por defecto para alertas de sistema: system.panfree@gmail.com
 *    - Utiliza SUPABASE_SERVICE_ROLE_KEY para registrar en email_logs eludiendo RLS y asegurando
 *      la creación de logs incluso cuando la sesión actual no esté autenticada como el destinatario.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, DEFAULT_FROM_EMAIL, DEFAULT_ADMIN_EMAIL } from '@/lib/resend'
import { sanitizeSupabaseUrl, DEFAULT_SUPABASE_ANON_KEY } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Cliente Supabase con Service Role Key para operaciones de auditoría administrativa
const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
const supabaseServiceKey =
  (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim()) ||
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) ||
  DEFAULT_SUPABASE_ANON_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]).optional().default(DEFAULT_ADMIN_EMAIL),
  subject: z.string().min(1, 'El asunto es obligatorio'),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.string().optional().default(DEFAULT_FROM_EMAIL),
  reply_to: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
}).refine(data => data.html || data.text, {
  message: 'Debe proporcionar al menos el contenido en HTML o texto',
})

export async function POST(req) {
  try {
    const rawBody = await req.json().catch(() => ({}))
    
    // 1. Validar esquema con Zod
    const validationResult = emailSchema.safeParse(rawBody)
    if (!validationResult.success) {
      console.warn('⚠️ [send-email] Validación fallida:', validationResult.error.flatten().fieldErrors)
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de correo inválidos',
          detalles: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { to, subject, html, text, from, reply_to, metadata } = validationResult.data
    const recipientStr = Array.isArray(to) ? to.join(', ') : to

    // 2. Enviar a través del servicio de Resend
    console.log(`📨 [send-email] Iniciando envío de correo hacia: ${recipientStr} | Asunto: "${subject}"`)
    const resendResult = await sendEmail({
      to,
      subject,
      html,
      text,
      from,
      reply_to,
    })

    const status = resendResult.success ? 'sent' : 'failed'
    const resendId = resendResult.id || null
    const errorMsg = resendResult.error || null

    // 3. Registrar en la tabla `email_logs` de Supabase usando el cliente con Service Role
    let logId = null
    try {
      console.log(`📝 [send-email] Insertando registro en email_logs (Estado: ${status}, Resend ID: ${resendId || 'N/A'})...`)
      
      const insertPayload = {
        to_email: recipientStr,
        from_email: from,
        subject,
        body_html: html || null,
        body_text: text || null,
        status,
        resend_id: resendId,
        error_message: errorMsg,
        metadata: {
          ...metadata,
          service_role_used: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          timestamp: new Date().toISOString(),
        },
      }

      const { data: logData, error: logError } = await supabaseAdmin
        .from('email_logs')
        .insert([insertPayload])
        .select('id')
        .single()

      if (logError) {
        console.error('❌ [send-email] Error insertando en email_logs:', {
          code: logError.code,
          message: logError.message,
          details: logError.details,
          hint: logError.hint,
        })
      } else if (logData) {
        logId = logData.id
        console.log(`✅ [send-email] Registro de correo guardado exitosamente en email_logs con ID: ${logId}`)
      }
    } catch (dbErr) {
      console.error('💥 [send-email] Excepción al interactuar con email_logs:', {
        message: dbErr?.message || dbErr,
        stack: dbErr?.stack,
      })
    }

    if (!resendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: resendResult.error || 'Error al procesar el envío de correo',
          log_id: logId,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: resendId,
      log_id: logId,
      to: recipientStr,
      from,
      subject,
      simulated: !!resendResult.simulated,
      message: resendResult.simulated ? resendResult.message : 'Correo enviado exitosamente con Resend',
    })
  } catch (error) {
    console.error('💥 [send-email] Error no controlado en POST handler:', {
      message: error?.message || error,
      stack: error?.stack,
    })
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno al procesar el envío de correo',
      },
      { status: 500 }
    )
  }
}
