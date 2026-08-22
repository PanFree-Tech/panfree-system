/**
 * 📁 UBICACIÓN: src/app/api/resend-webhook/route.js
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 ENDPOINT: POST /api/resend-webhook
 * 📖 DESCRIPCIÓN: Receptor de webhooks de eventos de Resend (delivered, bounced, opened, complained).
 *    - Actualiza el estado en la tabla email_logs según el ID del correo.
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const event = await req.json().catch(() => null)

    if (!event || !event.type) {
      return NextResponse.json({ error: 'Payload de webhook inválido' }, { status: 400 })
    }

    const { type, data } = event
    const emailId = data?.email_id

    console.log(`🔔 [Resend Webhook] Evento recibido: "${type}" para email_id: ${emailId}`)

    if (emailId) {
      let newStatus = 'sent'
      if (type === 'email.delivered') newStatus = 'delivered'
      if (type === 'email.bounced') newStatus = 'bounced'
      if (type === 'email.complained') newStatus = 'failed'

      try {
        await supabase
          .from('email_logs')
          .update({
            status: newStatus,
            metadata: {
              ultimo_evento: type,
              fecha_evento: new Date().toISOString(),
              detalles_evento: data,
            },
          })
          .eq('resend_id', emailId)
      } catch (dbErr) {
        console.warn('Advertencia al actualizar email_logs desde webhook:', dbErr.message)
      }
    }

    return NextResponse.json({ success: true, received: true, type })
  } catch (error) {
    console.error('Error en resend-webhook:', error)
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 })
  }
}
