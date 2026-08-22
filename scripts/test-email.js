/**
 * 📁 UBICACIÓN: scripts/test-email.js
 * 📌 DESCRIPCIÓN: Script para verificar el envío de correos con Resend desde la terminal.
 * 🚀 EJECUCIÓN: node scripts/test-email.js
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { Resend } = require('resend')

async function runTest() {
  console.log('====================================================')
  console.log('🥖 PANFREE - VERIFICACIÓN DE ENVÍO CON RESEND')
  console.log('====================================================')

  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = 'PanFree <contacto@panfree.fit>'
  const toEmail = process.env.TEST_EMAIL_TO || 'system.panfree@gmail.com'

  if (!apiKey) {
    console.error('❌ ERROR: RESEND_API_KEY no encontrada en .env ni en .env.local')
    console.log('👉 Asegúrate de definir RESEND_API_KEY=re_... en tu archivo .env.local')
    process.exit(1)
  }

  console.log(`🔑 Clave API detectada: ${apiKey.substring(0, 7)}...`)
  console.log(`📤 Remitente: ${fromEmail}`)
  console.log(`📥 Destinatario: ${toEmail}`)
  console.log('⏳ Enviando correo de prueba...')

  const resend = new Resend(apiKey)

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: '🧪 PanFree: Prueba de Envío Directo con Resend',
      html: `
        <div style="font-family: sans-serif; background-color: #f7f4ee; padding: 25px; border-radius: 8px;">
          <h2 style="color: #334c2b;">🥖 PanFree - Notificación de Prueba</h2>
          <p>Este correo confirma que la integración con <strong>Resend</strong> está funcionando correctamente.</p>
          <hr style="border: 0; border-top: 1px solid #e0d8c8; margin: 15px 0;">
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })}</p>
          <p><strong>Dominio:</strong> panfree.fit</p>
          <p><strong>Remitente:</strong> contacto@panfree.fit</p>
        </div>
      `,
    })

    if (error) {
      console.error('❌ Error devuelto por Resend API:', error)
      process.exit(1)
    }

    console.log('✅ ¡CORREO ENVIADO CON ÉXITO!')
    console.log(`📌 ID de Resend: ${data?.id}`)
    console.log('====================================================')
  } catch (err) {
    console.error('💥 Excepción al enviar correo:', err.message)
    process.exit(1)
  }
}

runTest()
