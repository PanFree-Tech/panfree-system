// supabase/functions/send-whatsapp/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
const WHATSAPP_API_VERSION = Deno.env.get('WHATSAPP_API_VERSION') || 'v18.0'
const WHATSAPP_TEMPLATE_LANG = Deno.env.get('WHATSAPP_TEMPLATE_LANG') || 'en_US'

// Definición de plantillas en Edge Function (compatible con Deno runtime)
const WHATSAPP_TEMPLATES = {
  HELLO_WORLD: {
    name: 'hello_world',
    language: { code: 'en_US' }
  },

  PEDIDO_CONFIRMADO: (pedido: any = {}, cliente: any = {}) => {
    const nombre = cliente.nombre || cliente.nombre_completo?.split(' ')[0] || 'Cliente'
    const numeroPedido = pedido.numero_pedido || pedido.numeroPedido || 'N/A'
    const total = pedido.total_final || pedido.total || 0
    const totalFormateado = Number(total).toLocaleString('es-PY')
    const metodo = pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Retiro en local'

    return {
      name: Deno.env.get('WHATSAPP_TEMPLATE_CONFIRMACION') || 'jaspers_market_confirmacion',
      language: { code: WHATSAPP_TEMPLATE_LANG },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(nombre) },
            { type: 'text', text: String(numeroPedido) },
            { type: 'text', text: `₲ ${totalFormateado}` },
            { type: 'text', text: String(metodo) }
          ]
        }
      ]
    }
  },

  PEDIDO_LISTO: (pedido: any = {}, cliente: any = {}) => {
    const nombre = cliente.nombre || cliente.nombre_completo?.split(' ')[0] || 'Cliente'
    const numeroPedido = pedido.numero_pedido || pedido.numeroPedido || 'N/A'
    const estadoMensaje = pedido.metodo_entrega === 'retiro' 
      ? 'listo para retirar en local' 
      : 'en camino a tu domicilio'

    return {
      name: Deno.env.get('WHATSAPP_TEMPLATE_LISTO') || 'jaspers_market_listo',
      language: { code: WHATSAPP_TEMPLATE_LANG },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(nombre) },
            { type: 'text', text: String(numeroPedido) },
            { type: 'text', text: String(estadoMensaje) }
          ]
        }
      ]
    }
  }
}

function normalizarTelefono(telefono: string | number): string {
  if (!telefono) return ''
  let limpio = String(telefono).replace(/\D/g, '')
  if (limpio.startsWith('09') && limpio.length === 10) {
    limpio = '595' + limpio.substring(1)
  }
  return limpio
}

serve(async (req) => {
  try {
    const bodyData = await req.json()
    const { pedido, cliente, tipo = 'PEDIDO_CONFIRMADO', templateCustom } = bodyData

    const telefonoDestino = normalizarTelefono(cliente?.telefono || bodyData.telefono)
    if (!telefonoDestino) {
      throw new Error('Número de teléfono del cliente no proporcionado o inválido')
    }

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('⚠️ Credenciales de WhatsApp Cloud API no configuradas en Supabase Edge Secrets')
      return new Response(
        JSON.stringify({ success: false, mensaje: 'Credenciales de WhatsApp no configuradas' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Determinar la plantilla a usar
    let plantillaPayload
    let nombrePlantilla = 'hello_world'

    if (templateCustom) {
      plantillaPayload = templateCustom
      nombrePlantilla = templateCustom.name || 'custom'
    } else if (tipo === 'PEDIDO_LISTO') {
      plantillaPayload = WHATSAPP_TEMPLATES.PEDIDO_LISTO(pedido, cliente)
      nombrePlantilla = plantillaPayload.name
    } else if (tipo === 'HELLO_WORLD') {
      plantillaPayload = WHATSAPP_TEMPLATES.HELLO_WORLD
      nombrePlantilla = 'hello_world'
    } else {
      plantillaPayload = WHATSAPP_TEMPLATES.PEDIDO_CONFIRMADO(pedido, cliente)
      nombrePlantilla = plantillaPayload.name
    }

    const enviarWhatsAppAPI = async (payload: any) => {
      const response = await fetch(
        `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: telefonoDestino,
            type: 'template',
            template: payload
          })
        }
      )
      const resJson = await response.json()
      if (!response.ok) {
        throw new Error(resJson?.error?.message || `HTTP Error ${response.status}`)
      }
      return resJson
    }

    let resultado
    let fallbackUsado = false

    try {
      resultado = await enviarWhatsAppAPI(plantillaPayload)
      console.log(`✅ Plantilla enviada correctamente: [${nombrePlantilla}] a [${telefonoDestino}]`)
    } catch (primaryErr: any) {
      console.error(`❌ Error enviando plantilla [${nombrePlantilla}]:`, primaryErr.message)
      
      // Fallback a 'hello_world'
      if (nombrePlantilla !== 'hello_world') {
        console.warn(`⚠️ Usando plantilla de fallback: hello_world (Motivo: fallo en plantilla principal ${nombrePlantilla})`)
        try {
          resultado = await enviarWhatsAppAPI(WHATSAPP_TEMPLATES.HELLO_WORLD)
          fallbackUsado = true
          console.log(`✅ Plantilla enviada correctamente: [hello_world] a [${telefonoDestino}] (fallback)`)
        } catch (fallbackErr: any) {
          console.error(`❌ Error enviando plantilla [hello_world] de fallback:`, fallbackErr.message)
          throw new Error(`Fallo primario (${primaryErr.message}) y fallo fallback (${fallbackErr.message})`)
        }
      } else {
        throw primaryErr
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        plantillaUsada: fallbackUsado ? 'hello_world' : nombrePlantilla,
        fallbackUsado,
        resultado 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('❌ Excepción general en edge function send-whatsapp:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
