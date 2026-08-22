/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/test-email/route.js
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 ENDPOINT: GET & POST /api/admin/marketing/test-email
 * 📖 DESCRIPCIÓN: Endpoint para probar el envío de correos con Resend a system.panfree@gmail.com
 */

import { NextResponse } from 'next/server'
import { sendEmail, DEFAULT_ADMIN_EMAIL, DEFAULT_FROM_EMAIL } from '@/lib/resend'
import { templatePruebaSistema } from '@/lib/email-templates'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function handleTestEmail(req) {
  try {
    const url = new URL(req.url)
    const destinatario = url.searchParams.get('to') || DEFAULT_ADMIN_EMAIL

    const htmlContent = templatePruebaSistema({
      fecha: new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' }),
      detalles: `Prueba de conectividad ejecutada desde el endpoint administrativo de PanFree.`,
    })

    const resultado = await sendEmail({
      to: destinatario,
      subject: '🧪 PanFree: Verificación de Servicio de Correo Resend',
      html: htmlContent,
      from: DEFAULT_FROM_EMAIL,
    })

    // Registrar en tabla `email_logs`
    try {
      await supabase.from('email_logs').insert([
        {
          to_email: destinatario,
          from_email: DEFAULT_FROM_EMAIL,
          subject: '🧪 PanFree: Verificación de Servicio de Correo Resend',
          body_html: htmlContent,
          status: resultado.success ? 'sent' : 'failed',
          resend_id: resultado.id || null,
          error_message: resultado.error || null,
          metadata: { origen: 'test-email-endpoint', fecha: new Date().toISOString() },
        },
      ])
    } catch (e) {
      console.warn('Advertencia al registrar en email_logs desde test-email:', e.message)
    }

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: resultado.error || 'Fallo en el envío de correo de prueba',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: `Correo de prueba enviado exitosamente a ${destinatario}`,
      id: resultado.id,
      simulated: !!resultado.simulated,
      from: DEFAULT_FROM_EMAIL,
      to: destinatario,
    })
  } catch (error) {
    console.error('Error en test-email route:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno al procesar la prueba de correo',
      },
      { status: 500 }
    )
  }
}

export async function GET(req) {
  return handleTestEmail(req)
}

export async function POST(req) {
  return handleTestEmail(req)
}
