/**
 * 📁 UBICACIÓN: src/lib/resend.js
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Cliente e integrador de envíos de correos transaccionales con Resend SDK.
 *    - Inicialización perezosa (lazy) de la API Key para evitar fallos si no está configurada.
 *    - Remitente oficial: PanFree <contacto@panfree.fit>
 *    - Destinatario por defecto para alertas de sistema: system.panfree@gmail.com
 *    - Registro de auditoría y manejo resiliente de errores.
 */

import { Resend } from 'resend'

export const DEFAULT_FROM_EMAIL = 'PanFree <contacto@panfree.fit>'
export const DEFAULT_ADMIN_EMAIL = 'system.panfree@gmail.com'

let resendClient = null

/**
 * Obtiene la instancia única de Resend con inicialización diferida
 */
export function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('⚠️ [Resend] RESEND_API_KEY no está configurada en las variables de entorno del servidor.')
      return null
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

/**
 * Envía un correo electrónico a través de Resend
 * 
 * @param {Object} options
 * @param {string|string[]} options.to - Destinatario(s)
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.html - Cuerpo del correo en HTML
 * @param {string} [options.text] - Cuerpo opcional en texto plano
 * @param {string} [options.from] - Remitente (por defecto contacto@panfree.fit)
 * @param {string} [options.reply_to] - Responder a
 * @param {Object} [options.headers] - Cabeceras personalizadas
 * @param {Array} [options.attachments] - Archivos adjuntos
 * @returns {Promise<{success: boolean, id?: string, data?: any, error?: string}>}
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM_EMAIL,
  reply_to = 'contacto@panfree.fit',
  headers,
  attachments,
}) {
  const client = getResendClient()
  const recipient = Array.isArray(to) ? to : [to || DEFAULT_ADMIN_EMAIL]

  if (!subject || (!html && !text)) {
    const msg = 'El asunto (subject) y el contenido (html o text) son obligatorios.'
    console.error(`❌ [Resend Error]: ${msg}`)
    return { success: false, error: msg }
  }

  // Si no hay API key configurada, simular envío seguro en entornos de desarrollo
  if (!client) {
    const mockId = `sim_resend_${Date.now()}`
    console.log(`ℹ️ [Resend Simulación]: Envío simulado a ${recipient.join(', ')} | Asunto: "${subject}" (ID: ${mockId})`)
    return {
      success: true,
      id: mockId,
      simulated: true,
      message: 'Correo simulado (RESEND_API_KEY pendiente de configuración en servidor)',
    }
  }

  try {
    console.log(`📨 [Resend] Enviando correo a: ${recipient.join(', ')} | Asunto: "${subject}" | Desde: ${from}`)
    
    const payload = {
      from,
      to: recipient,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      ...(reply_to ? { reply_to } : {}),
      ...(headers ? { headers } : {}),
      ...(attachments ? { attachments } : {}),
    }

    const { data, error } = await client.emails.send(payload)

    if (error) {
      console.error(`❌ [Resend API Error]:`, error)
      return {
        success: false,
        error: error.message || 'Error en Resend API',
        details: error,
      }
    }

    console.log(`✅ [Resend Éxito]: Correo enviado con ID ${data?.id} a ${recipient.join(', ')}`)
    return {
      success: true,
      id: data?.id,
      data,
    }
  } catch (err) {
    console.error(`💥 [Resend Excepción]:`, err?.message || err)
    return {
      success: false,
      error: err?.message || 'Error inesperado al enviar correo con Resend',
    }
  }
}
