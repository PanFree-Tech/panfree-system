/**
 * 📁 UBICACIÓN: scripts/test-marketing-api.js
 * 📅 FECHA: 2026-08-22
 * 📌 DESCRIPCIÓN: Script de verificación integral para la Fase 1 de Seguridad en APIs de Marketing.
 *    Prueba secuencialmente:
 *    1. Generación de contenido con Gemini API (/api/admin/marketing/generar-contenido)
 *    2. Subida de imagen Base64 a Supabase Storage (/api/admin/marketing/upload-image)
 *    3. Programación / Publicación con persistencia (/api/admin/marketing/programar-publicacion)
 *
 * 🚀 EJECUCIÓN:
 *    node scripts/test-marketing-api.js
 *    o con URL personalizada:
 *    TEST_BASE_URL=http://localhost:3000 node scripts/test-marketing-api.js
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

// Mock de imagen en Base64 (PNG 1x1 transparente)
const SAMPLE_BASE64_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function printHeader(title) {
  console.log('\n' + '='.repeat(65))
  console.log(`${colors.bright}${colors.cyan}  🧪 ${title}${colors.reset}`)
  console.log('='.repeat(65))
}

function printSuccess(message, details = null) {
  console.log(`${colors.green}  ✅ ${message}${colors.reset}`)
  if (details) {
    console.log(`     ${colors.reset}${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}`)
  }
}

function printWarning(message, details = null) {
  console.log(`${colors.yellow}  ⚠️ ${message}${colors.reset}`)
  if (details) {
    console.log(`     ${colors.reset}${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}`)
  }
}

function printError(message, error = null) {
  console.log(`${colors.red}  ❌ ${message}${colors.reset}`)
  if (error) {
    console.log(`     ${colors.red}${error?.message || JSON.stringify(error)}${colors.reset}`)
  }
}

async function runTests() {
  console.log(`${colors.bright}🥖 PanFree - Suite de Pruebas de Seguridad en APIs de Marketing${colors.reset}`)
  console.log(`🎯 Servidor Objetivo: ${colors.blue}${BASE_URL}${colors.reset}\n`)

  let testsPassed = 0
  let testsFailed = 0
  let uploadedImageUrl = null

  // =========================================================================
  // TEST 1: POST /api/admin/marketing/generar-contenido
  // =========================================================================
  printHeader('TEST 1: Generar Contenido con IA (Gemini 3.7 Flash)')
  try {
    const payload = {
      producto_id: null,
      descuento: 15,
      evento: 'Semana del Celíaco',
      tono: 'persuasivo',
    }

    console.log(`  Enviando solicitud POST a ${BASE_URL}/api/admin/marketing/generar-contenido...`)
    const res = await fetch(`${BASE_URL}/api/admin/marketing/generar-contenido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      printSuccess('Generación de contenido completada exitosamente', {
        fuente: data.source,
        hook: data.content?.hook,
        hashtags: data.content?.hashtags,
        descuento: `${data.content?.descuento}% OFF`,
      })
      testsPassed++
    } else {
      printWarning(`Respuesta del servidor (${res.status}): ${data.error || 'Error no especificado'}`)
      testsFailed++
    }
  } catch (err) {
    printError('Error al conectar con endpoint generar-contenido', err)
    testsFailed++
  }

  // =========================================================================
  // TEST 2: POST /api/admin/marketing/upload-image
  // =========================================================================
  printHeader('TEST 2: Subida y Persistencia en Supabase Storage (public-images)')
  try {
    const payload = {
      image: SAMPLE_BASE64_IMAGE,
      productId: 'test-product-01',
      fileName: `test_image_${Date.now()}.png`,
    }

    console.log(`  Enviando imagen Base64 a ${BASE_URL}/api/admin/marketing/upload-image...`)
    const res = await fetch(`${BASE_URL}/api/admin/marketing/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (res.ok && data.success && data.url) {
      uploadedImageUrl = data.url
      printSuccess('Imagen subida y URL pública generada con éxito', {
        url: data.url,
        ruta: data.path,
        tamanio_bytes: data.size,
      })
      testsPassed++
    } else {
      printWarning(`No se pudo subir a Supabase Storage: ${data.error || 'Verificar credenciales de Supabase'}`)
      testsFailed++
    }
  } catch (err) {
    printError('Error al conectar con endpoint upload-image', err)
    testsFailed++
  }

  // =========================================================================
  // TEST 3: POST /api/admin/marketing/programar-publicacion
  // =========================================================================
  printHeader('TEST 3: Programar / Publicar con Trazabilidad')
  try {
    const payload = {
      producto_id: null,
      descuento: 15,
      caption: '🍞 ¡Pan de Campo 100% Sin Gluten recién horneado en Encarnación! 🌾🚫 #PanFree #SinTACC',
      imageData: uploadedImageUrl || SAMPLE_BASE64_IMAGE,
      publicar_ahora: false,
      fecha_programada: new Date(Date.now() + 86400000).toISOString(),
    }

    console.log(`  Enviando solicitud POST a ${BASE_URL}/api/admin/marketing/programar-publicacion...`)
    const res = await fetch(`${BASE_URL}/api/admin/marketing/programar-publicacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      printSuccess('Promoción programada y registrada en histórico', {
        programacion_id: data.programacion_id,
        mensaje: data.mensaje,
        imagen_persistida: data.imagen_url,
      })
      testsPassed++
    } else {
      printWarning(`Error al programar publicación: ${data.error}`)
      testsFailed++
    }
  } catch (err) {
    printError('Error al conectar con endpoint programar-publicacion', err)
    testsFailed++
  }

  // =========================================================================
  // RESUMEN FINAL
  // =========================================================================
  console.log('\n' + '='.repeat(65))
  console.log(`${colors.bright}📋 RESULTADO FINAL DE LA SUITE DE PRUEBAS${colors.reset}`)
  console.log(`   Pruebas Aprobadas: ${colors.green}${testsPassed}${colors.reset}`)
  console.log(`   Pruebas con Advertencia/Fallo: ${testsFailed > 0 ? colors.red : colors.green}${testsFailed}${colors.reset}`)
  console.log('='.repeat(65) + '\n')
}

// Ejecutar pruebas
runTests().catch(console.error)
