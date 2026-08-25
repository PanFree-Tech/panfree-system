/**
 * 📁 UBICACIÓN: scripts/test-whatsapp.js
 * 📌 DESCRIPCIÓN: Script para verificar el envío de plantillas de WhatsApp Business Cloud API desde la terminal.
 * 🚀 EJECUCIÓN: node scripts/test-whatsapp.js
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

async function runTest() {
  console.log('====================================================')
  console.log('📱 PANFREE - PRUEBA DE PLANTILLAS WHATSAPP CLOUD API')
  console.log('====================================================')

  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0'
  const telefonoDestino = (process.env.WHATSAPP_TEAM_NUMBER || '595984589845').replace(/\D/g, '')
  const plantillaNombre = process.env.TEST_WHATSAPP_TEMPLATE || 'hello_world'
  const idioma = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US'

  if (!token || !phoneId) {
    console.error('❌ ERROR: WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID no configurados.')
    console.log('👉 Define estas variables en tu archivo .env.local')
    process.exit(1)
  }

  console.log(`🔑 Token detectado: ${token.substring(0, 10)}...`)
  console.log(`🆔 Phone Number ID: ${phoneId}`)
  console.log(`🌐 Versión API: ${apiVersion}`)
  console.log(`📋 Plantilla a probar: ${plantillaNombre} (${idioma})`)
  console.log(`📲 Teléfono destino: ${telefonoDestino}`)
  console.log('⏳ Enviando plantilla a Meta Graph API...')

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: telefonoDestino,
    type: 'template',
    template: {
      name: plantillaNombre,
      language: { code: idioma }
    }
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error devuelto por WhatsApp Cloud API:')
      console.error(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('✅ ¡PLANTILLA ENVIADA CON ÉXITO!')
    console.log(`📌 ID del Mensaje:`, data?.messages?.[0]?.id)
    console.log(`📌 Contacto WAMID:`, data?.contacts?.[0]?.wa_id)
    console.log('====================================================')
  } catch (err) {
    console.error('💥 Excepción al conectar con WhatsApp API:', err.message)
    process.exit(1)
  }
}

runTest()
