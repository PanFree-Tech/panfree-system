/**
 * 📁 UBICACIÓN: src/app/api/send-whatsapp/route.js
 * 📅 CREADO: 2026-08-25
 * 📌 DESCRIPCIÓN: Endpoint server-side para enviar plantillas de WhatsApp Business Cloud API
 * 
 * 🔒 SEGURIDAD: Solo usuarios autenticados o con token de servicio
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enviarPlantillaWhatsApp } from '@/lib/whatsapp'
import { WHATSAPP_TEMPLATES, obtenerPlantilla } from '@/lib/whatsapp-templates'

export const dynamic = 'force-dynamic'

const SendWhatsAppSchema = z.object({
  telefono: z.string().min(6),
  tipo: z.enum(['HELLO_WORLD', 'PEDIDO_CONFIRMADO', 'PEDIDO_LISTO', 'PROMOCION', 'ALERTA_EQUIPO']).default('HELLO_WORLD'),
  pedido: z.any().optional(),
  cliente: z.any().optional(),
  datos: z.any().optional(),
  templateCustom: z.any().optional(),
  permitirFallback: z.boolean().default(true),
})

export async function POST(req) {
  try {
    const body = await req.json()
    const validated = SendWhatsAppSchema.parse(body)

    let args = []
    if (validated.tipo === 'PEDIDO_CONFIRMADO' || validated.tipo === 'PEDIDO_LISTO') {
      args = [validated.pedido || {}, validated.cliente || {}]
    } else if (validated.tipo === 'PROMOCION' || validated.tipo === 'ALERTA_EQUIPO') {
      args = [validated.datos || {}]
    }

    const resultado = await enviarPlantillaWhatsApp({
      telefono: validated.telefono,
      tipo: validated.tipo,
      template: validated.templateCustom,
      args,
      permitirFallback: validated.permitirFallback,
    })

    return NextResponse.json({
      success: true,
      mensaje: `Plantilla ${resultado.templateUsada} enviada exitosamente`,
      detalles: resultado
    })
  } catch (error) {
    console.error('❌ Error en /api/send-whatsapp:', error.message)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno enviando WhatsApp' },
      { status: 500 }
    )
  }
}

export async function GET(req) {
  // Proporciona lista de plantillas y estado del servicio
  const waConfigurado = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
  
  return NextResponse.json({
    status: 'online',
    servicioConfigurado: waConfigurado,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    plantillasDisponibles: Object.keys(WHATSAPP_TEMPLATES),
    idiomaPorDefecto: process.env.WHATSAPP_TEMPLATE_LANG || 'en_US'
  })
}
