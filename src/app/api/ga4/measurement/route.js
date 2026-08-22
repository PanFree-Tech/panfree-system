/**
 * 📁 UBICACIÓN: src/app/api/ga4/measurement/route.js
 * 📅 CREADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Endpoint Server-Side para Google Analytics 4 Measurement Protocol.
 *    - Permite registrar compras y conversiones directamente desde el servidor (API routes, webhooks, tareas en background).
 *    - 🔒 SEGURIDAD: GA4_API_SECRET permanece estrictamente en el entorno del servidor y nunca se expone al cliente.
 *    - Endpoint oficial: https://www.google-analytics.com/mp/collect
 *    - Modo Debug: Envía a /debug/mp/collect si se pasa { debug: true } para validación de schema en tiempo real.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || 'G-QE8GQS3MSR'
const GA4_API_SECRET = process.env.GA4_API_SECRET

// Schema de validación de ítems de e-commerce
const ItemSchema = z.object({
  item_id: z.string().or(z.number()).transform(v => String(v)),
  item_name: z.string(),
  item_category: z.string().optional(),
  price: z.number().optional().default(0),
  quantity: z.number().optional().default(1),
  currency: z.string().optional().default('PYG'),
})

// Schema del evento
const EventSchema = z.object({
  name: z.string(),
  params: z.record(z.any()).optional().default({}),
})

// Schema general de la petición
const MeasurementPayloadSchema = z.object({
  client_id: z.string().optional(),
  user_id: z.string().optional(),
  events: z.array(EventSchema).min(1),
  user_properties: z.record(z.any()).optional(),
  consent: z.object({
    ad_storage: z.enum(['granted', 'denied']).optional(),
    analytics_storage: z.enum(['granted', 'denied']).optional(),
  }).optional(),
  debug: z.boolean().optional().default(false),
})

/**
 * Genera un client_id pseudo-aleatorio compatible con GA4 si no se provee uno
 */
function generarClientId() {
  const rand = Math.floor(Math.random() * 1000000000)
  const timestamp = Math.floor(Date.now() / 1000)
  return `${rand}.${timestamp}`
}

export async function POST(req) {
  try {
    const body = await req.json()
    const validated = MeasurementPayloadSchema.parse(body)

    const measurementId = GA_MEASUREMENT_ID
    const apiSecret = GA4_API_SECRET

    // Validar configuración de servidor
    if (!measurementId) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_GA_MEASUREMENT_ID no está configurado en el servidor' },
        { status: 500 }
      )
    }

    if (!apiSecret) {
      console.warn('[GA4 Measurement Protocol] Advertencia: GA4_API_SECRET no está configurado en las variables de entorno.')
      return NextResponse.json({
        success: false,
        warning: 'GA4_API_SECRET no está configurado en las variables de entorno del servidor. Agregalo a .env o secretos de hosting.',
        simulated: true,
        received_events: validated.events.length,
      }, { status: 200 })
    }

    const clientId = validated.client_id || generarClientId()
    const isDebug = Boolean(validated.debug)

    // Formatear payload oficial de GA4 Measurement Protocol
    const gaPayload = {
      client_id: clientId,
      events: validated.events,
    }

    if (validated.user_id) {
      gaPayload.user_id = String(validated.user_id)
    }

    if (validated.user_properties) {
      gaPayload.user_properties = validated.user_properties
    }

    if (validated.consent) {
      gaPayload.consent = validated.consent
    }

    const baseUrl = isDebug
      ? 'https://www.google-analytics.com/debug/mp/collect'
      : 'https://www.google-analytics.com/mp/collect'

    const url = `${baseUrl}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`

    const gaResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gaPayload),
    })

    if (isDebug) {
      const debugData = await gaResponse.json()
      return NextResponse.json({
        success: gaResponse.ok,
        status: gaResponse.status,
        debug_validation: debugData,
        events_sent: validated.events.length,
        client_id: clientId,
      })
    }

    if (!gaResponse.ok) {
      const errorText = await gaResponse.text()
      console.error('[GA4 Measurement Protocol] Error de respuesta de Google:', gaResponse.status, errorText)
      return NextResponse.json(
        { error: `Error enviando a GA4: ${gaResponse.statusText}`, details: errorText },
        { status: gaResponse.status }
      )
    }

    // GA4 retorna status 204 No Content en envío regular
    return NextResponse.json({
      success: true,
      message: 'Evento(s) enviados correctamente a GA4 Measurement Protocol',
      events_count: validated.events.length,
      client_id: clientId,
    })

  } catch (error) {
    console.error('[GA4 Measurement Protocol] Error en ejecución:', error)
    return NextResponse.json(
      { error: error.message || 'Error procesando solicitud de Measurement Protocol' },
      { status: 400 }
    )
  }
}
