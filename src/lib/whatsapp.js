/**
 * 📁 src/lib/whatsapp.js
 * 📅 PanFree - Servicio de Envío de Mensajes y Plantillas con WhatsApp Cloud API
 */

import { WHATSAPP_TEMPLATES, obtenerPlantilla } from './whatsapp-templates'

/**
 * Normaliza y valida un número telefónico a formato numérico E.164 (sin '+' ni espacios)
 * @param {string|number} telefono 
 * @returns {string} Teléfono limpio
 */
export function normalizarTelefono(telefono) {
  if (!telefono) return ''
  let limpio = String(telefono).replace(/\D/g, '')
  // Si comienza con 0 (número local Paraguay ej. 0984...), convertir a 595984...
  if (limpio.startsWith('09') && limpio.length === 10) {
    limpio = '595' + limpio.substring(1)
  }
  return limpio
}

/**
 * Envía una plantilla aprobada de WhatsApp Business Cloud API con reintentos y fallback.
 * 
 * @param {Object} options
 * @param {string} options.telefono - Número de teléfono del destinatario
 * @param {string} [options.tipo] - Clave de plantilla (ej: 'PEDIDO_CONFIRMADO', 'PEDIDO_LISTO', 'PROMOCION', 'HELLO_WORLD')
 * @param {Object} [options.template] - Payload de plantilla personalizado (si no se usa 'tipo')
 * @param {Array} [options.args] - Argumentos para generar la plantilla (pedido, cliente, datos)
 * @param {boolean} [options.permitirFallback=true] - Si falla la plantilla con Meta, intentar con 'hello_world'
 * @param {number} [options.timeoutMs=8000] - Tiempo máximo de espera
 * @returns {Promise<{success: boolean, result?: any, templateUsada: string}>}
 */
export async function enviarPlantillaWhatsApp({
  telefono,
  tipo = 'HELLO_WORLD',
  template = null,
  args = [],
  permitirFallback = true,
  timeoutMs = 8000
}) {
  const numeroLimpio = normalizarTelefono(telefono)
  if (!numeroLimpio || numeroLimpio.length < 8) {
    const errorMsg = `Número de teléfono inválido: '${telefono}'`
    console.error(`❌ Error enviando plantilla [${tipo}]: ${errorMsg}`)
    throw new Error(errorMsg)
  }

  const waAccessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0'

  if (!waAccessToken || !waPhoneId) {
    console.warn(`⚠️ [WhatsApp API no configurado] WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID faltantes.`)
    return {
      success: false,
      simulado: true,
      mensaje: 'WhatsApp Cloud API no configurado en variables de entorno'
    }
  }

  let templatePayload = template || obtenerPlantilla(tipo, ...args)
  let nombrePlantilla = templatePayload?.name || 'desconocida'

  async function ejecutarLlamadaAPI(payload) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const endpoint = `https://graph.facebook.com/${apiVersion}/${waPhoneId}/messages`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: numeroLimpio,
          type: 'template',
          template: payload
        }),
        signal: controller.signal
      })

      const data = await res.json()
      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorDesc = data?.error?.message || `HTTP ${res.status}`
        const errorCode = data?.error?.code
        throw { message: errorDesc, code: errorCode, response: data }
      }

      return data
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  try {
    const result = await ejecutarLlamadaAPI(templatePayload)
    console.log(`✅ Plantilla enviada correctamente: [${nombrePlantilla}] a [${numeroLimpio}]`)
    return {
      success: true,
      templateUsada: nombrePlantilla,
      result
    }
  } catch (error) {
    console.error(`❌ Error enviando plantilla [${nombrePlantilla}]:`, error.message || error)

    // Si falló por plantilla no aprobada/no encontrada (Error 100 o similar) y está permitido el fallback
    if (permitirFallback && nombrePlantilla !== 'hello_world') {
      console.warn(`⚠️ Usando plantilla de fallback: hello_world (Motivo: Error en plantilla principal ${nombrePlantilla})`)
      try {
        const fallbackResult = await ejecutarLlamadaAPI(WHATSAPP_TEMPLATES.HELLO_WORLD)
        console.log(`✅ Plantilla enviada correctamente: [hello_world] a [${numeroLimpio}] (como fallback)`)
        return {
          success: true,
          templateUsada: 'hello_world',
          fallbackAplicado: true,
          result: fallbackResult
        }
      } catch (fallbackError) {
        console.error(`❌ Error enviando plantilla [hello_world] de fallback:`, fallbackError.message || fallbackError)
        throw new Error(`Falló plantilla principal (${error.message}) y fallback (${fallbackError.message})`)
      }
    }

    throw new Error(error.message || 'Error al conectar con WhatsApp Business API')
  }
}
