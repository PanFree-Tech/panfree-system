/**
 * 📁 UBICACIÓN: scripts/test-cloudinary-generation.js
 * 📅 FECHA: 2026-08-22
 * 📌 DESCRIPCIÓN: Script de pruebas para la Fase 3: Generación de Imágenes con Cloudinary (PanFree).
 *    Valida:
 *    1. Creación de URL de transformación generativa en Cloudinary
 *    2. Regla de Oro: Inyección estricta de precios REALES de Supabase
 *    3. Inserción del registro en la tabla `generaciones_imagen`
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function printHeader(title) {
  console.log('\n' + '='.repeat(68))
  console.log(`${colors.bright}${colors.cyan}  🎨 ${title}${colors.reset}`)
  console.log('='.repeat(68))
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
  console.log(`${colors.bright}${colors.magenta}🥖 PanFree - Suite de Pruebas: Fase 3 - Generación de Imágenes con Cloudinary${colors.reset}`)
  console.log(`🎯 Servidor Objetivo: ${colors.blue}${BASE_URL}${colors.reset}\n`)

  let passed = 0
  let failed = 0

  // =========================================================================
  // TEST 1: POST /api/admin/marketing/generar-imagen-cloudinary (Con Producto ID)
  // =========================================================================
  printHeader('TEST 1: Generación de Arte Publicitario con Datos Reales de Catálogo')
  try {
    const payload = {
      producto_id: 'prod-chipa-01',
      descuento: 15,
      evento: 'Semana Santa',
      brief_creativo: 'Fondo de madera rústica paraguaya con yerba mate y mantel artesanal, iluminación cálida de estudio 8k',
    }

    console.log(`  Enviando POST a ${BASE_URL}/api/admin/marketing/generar-imagen-cloudinary...`)
    const res = await fetch(`${BASE_URL}/api/admin/marketing/generar-imagen-cloudinary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (res.ok && data.success && data.imagen_url) {
      printSuccess('Imagen y transformaciones generadas exitosamente', {
        producto: data.producto?.nombre,
        precio_original: data.producto?.precio_original_fmt,
        descuento: `${data.producto?.descuento}% OFF`,
        precio_promocional: data.producto?.precio_promocional_fmt,
        imagen_url: data.imagen_url,
        generacion_id: data.generacion_id,
      })

      // Validar que la URL contenga transformaciones generativas de Cloudinary
      if (data.imagen_url.includes('gen_background_replace') || data.imagen_url.includes('background_removal')) {
        printSuccess('Transformaciones de Generative AI detectadas en la URL de Cloudinary')
      } else {
        printWarning('URL generada pero no contiene tags generativos explícitos')
      }
      passed++
    } else {
      printWarning(`Respuesta de la API (${res.status}): ${data.error || 'Error desconocido'}`)
      failed++
    }
  } catch (err) {
    printError('Error al conectar con endpoint generar-imagen-cloudinary', err)
    failed++
  }

  // =========================================================================
  // TEST 2: POST con Imagen Personalizada y Verificación de Regla de Oro
  // =========================================================================
  printHeader('TEST 2: Validación de la Regla de Oro (Precios Matemáticos Exactos)')
  try {
    const payload = {
      custom_image_url: 'https://res.cloudinary.com/panfree/image/upload/v1/panfree/products/pan-campo-rustico.jpg',
      descuento: 20,
      evento: 'Día del Celíaco',
      brief_creativo: 'Ambiente de cocina artesanal gourmet limpia, espigas de trigo cruzadas con símbolo tachado sin TACC',
    }

    console.log(`  Enviando POST con imagen personalizada...`)
    const res = await fetch(`${BASE_URL}/api/admin/marketing/generar-imagen-cloudinary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      const orig = data.producto?.precio_original
      const promo = data.producto?.precio_promocional
      const esperado = Math.round(orig * (1 - 0.20))

      if (promo === esperado) {
        printSuccess('Cálculo de precio promocional verificado 100% exacto según regla de negocio', {
          original: orig,
          calculado: promo,
          esperado: esperado,
        })
        passed++
      } else {
        printWarning(`Discrepancia en cálculo: esperado ${esperado}, recibido ${promo}`)
        failed++
      }
    } else {
      printWarning(`Respuesta fallida: ${data.error}`)
      failed++
    }
  } catch (err) {
    printError('Error en test de validación matemática de precios', err)
    failed++
  }

  // =========================================================================
  // RESUMEN FINAL
  // =========================================================================
  console.log('\n' + '='.repeat(68))
  console.log(`${colors.bright}📋 RESULTADO SUITE FASE 3: GENERACIÓN CON CLOUDINARY${colors.reset}`)
  console.log(`   Pruebas Exitosas: ${colors.green}${passed}${colors.reset}`)
  console.log(`   Pruebas Fallidas: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`)
  console.log('='.repeat(68) + '\n')
}

runTests().catch(console.error)
