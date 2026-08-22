/**
 * 📁 UBICACIÓN: src/app/api/send-email/route.js
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 ENDPOINT: POST /api/send-email
 * 📖 DESCRIPCIÓN: Endpoint para enviar correos electrónicos con Resend y registrar en email_logs.
 *    - Valida los datos recibidos mediante Zod
 *    - Remitente por defecto: contacto@panfree.fit
 *    - Destinatario por defecto para alertas de sistema: system.panfree@gmail.com
 *    - Registra el resultado en la tabla email_logs de Supabase
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail, DEFAULT_FROM_EMAIL, DEFAULT_ADMIN_EMAIL } from '@/lib/resend'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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

    // 3. Registrar en la tabla `email_logs` de Supabase
    let logId = null
    try {
      const { data: logData, error: logError } = await supabase
        .from('email_logs')
        .insert([
          {
            to_email: recipientStr,
            from_email: from,
            subject,
            body_html: html || null,
            body_text: text || null,
            status,
            resend_id: resendId,
            error_message: errorMsg,
            metadata: metadata || {},
          },
        ])
        .select('id')
        .single()

      if (!logError && logData) {
        logId = logData.id
      }
    } catch (dbErr) {
      console.warn('⚠️ [send-email] No se pudo guardar en email_logs (no crítico):', dbErr.message)
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
    console.error('💥 [send-email] Error no controlado:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno al procesar el envío de correo',
      },
      { status: 500 }
    )
  }
}
