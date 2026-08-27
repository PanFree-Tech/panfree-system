/**
 * 📁 scripts/test-whatsapp.js
 * 📌 Script para probar el envío de plantillas de WhatsApp
 * 
 * Uso: node scripts/test-whatsapp.js
 */

// Cargar variables de entorno desde .env.local
import('dotenv').then((dotenv) => {
  dotenv.config({ path: '.env.local' })
  dotenv.config({ path: '.env' })
})

import { enviarPlantillaWhatsApp } from '../src/lib/whatsapp.js'

const TELEFONO_PRUEBA = process.env.WHATSAPP_TEAM_NUMBER || '595984589845'

console.log('🚀 Iniciando prueba de WhatsApp...\n')
console.log(`📱 Teléfono de prueba: ${TELEFONO_PRUEBA}`)
console.log(`📋 Plantilla a probar: ${process.env.TEST_WHATSAPP_TEMPLATE || 'HELLO_WORLD'}\n`)

async function testWhatsApp() {
  try {
    // 1. Prueba con HELLO_WORLD (la más simple)
    console.log('📤 Enviando plantilla HELLO_WORLD...')
    
    const resultado = await enviarPlantillaWhatsApp({
      telefono: TELEFONO_PRUEBA,
      tipo: 'HELLO_WORLD',
      permitirFallback: true
    })

    console.log('\n✅ ¡PLANTILLA ENVIADA CON ÉXITO!')
    console.log(`📤 Plantilla: ${resultado.templateUsada}`)
    console.log(`📱 Teléfono: ${TELEFONO_PRUEBA}`)
    console.log(`🆔 ID Mensaje: ${resultado.result?.messages?.[0]?.id || 'N/A'}`)
    
    if (resultado.fallbackAplicado) {
      console.log('⚠️ Se usó plantilla de fallback (hello_world)')
    }

    // 2. Si quieres probar con una plantilla específica de jaspers_market
    const templatePersonalizada = process.env.TEST_WHATSAPP_TEMPLATE
    if (templatePersonalizada && templatePersonalizada !== 'HELLO_WORLD') {
      console.log(`\n📤 Probando plantilla personalizada: ${templatePersonalizada}...`)
      
      const resultado2 = await enviarPlantillaWhatsApp({
        telefono: TELEFONO_PRUEBA,
        tipo: templatePersonalizada,
        args: [
          { 
            numero_pedido: 'TEST-1234', 
            total_final: 25000, 
            metodo_entrega: 'delivery' 
          },
          { nombre: 'Cliente Test' }
        ],
        permitirFallback: true
      })

      console.log('\n✅ PLANTILLA PERSONALIZADA ENVIADA')
      console.log(`📤 Plantilla: ${resultado2.templateUsada}`)
      console.log(`🆔 ID Mensaje: ${resultado2.result?.messages?.[0]?.id || 'N/A'}`)
    }

  } catch (error) {
    console.error('\n❌ Error enviando plantilla:')
    console.error(`   ${error.message}`)
    console.log('\n🔍 Posibles causas:')
    console.log('   1. WHATSAPP_ACCESS_TOKEN no está configurado correctamente')
    console.log('   2. WHATSAPP_PHONE_NUMBER_ID no está configurado')
    console.log('   3. La plantilla no está aprobada en Meta Business')
    console.log('   4. El número de teléfono no está en formato E.164 (ej: 595984589845)')
    console.log('\n📋 Revisa tu archivo .env.local con las credenciales correctas.')
  }
}

testWhatsApp()