// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient } from '@/lib/cloudinary'
import { comprimirPrompt } from '@/lib/prompt-compressor'

export const dynamic = 'force-dynamic'

/**
 * Modelos de IA disponibles en el add-on Image Generation de Cloudinary
 */
const MODELOS_DISPONIBLES = [
  'nano-banana-2',
  'nano-banana-1',
  'flux-2-pro',
  'recraft-v4',
  'gpt-image-2',
  'ideogram-v4-base',
]

/**
 * Genera un prompt descriptivo gastronómico optimizado para text_to_image
 */
function construirPromptGenerativoFondo(promptBase, producto, estiloId = 'nano-banana-2') {
  const nombreProd = producto?.nombre || 'panadería gourmet sin gluten'

  const mapaEstilos = {
    'nano-banana-2': 'A warm gourmet bakery studio background, rustic wooden table surface, soft natural golden morning light, subtle green herbs and flour dust on table, blurred artisan bakery background, 8k professional food photography backdrop, empty space in center for product placement',
    'nano-banana-1': 'Warm wooden table top, rustic bakery environment, golden hour lighting, cozy atmosphere, food photography backdrop',
    'flux-2-pro': 'Ultra-realistic luxury white Italian marble countertop, morning sunbeam through window, soft natural shadows, elegant gourmet bakery scene, pristine food advertising background',
    'recraft-v4': 'Artisan bakery kitchen table, dark rustic wood texture, flour dusting, fresh rosemary and wheat sprigs, warm cozy depth of field, studio food photography background',
    'gpt-image-2': 'Vibrant festive celebration table backdrop, warm party bokeh lights, cheerful gourmet picnic atmosphere, bright and inviting commercial background',
    'ideogram-v4-base': 'Dark moody rustic restaurant table, dramatic warm spotlight, slate stone and charred oak texture, Michelin star food photography studio setting',
    'estudio-madera': 'A warm gourmet bakery studio background, rustic wooden table surface, soft natural golden morning light, subtle green herbs, empty space in center',
    'marmol-lujo': 'Ultra-realistic luxury white Italian marble countertop, morning sunbeam through window, soft natural shadows, elegant bakery scene',
    'desayuno-calido': 'Cozy breakfast table with a ceramic coffee cup and linen napkin, warm morning golden sunlight, blurred cafe background',
    'rustico-artesanal': 'Artisan bakery kitchen table, dark rustic wood texture, flour dusting, fresh wheat sprigs, cozy depth of field',
    'estudio-oscuro': 'Dark moody rustic restaurant table, dramatic warm spotlight, slate stone and charred oak texture',
    'evento-promo': 'Vibrant festive celebration table backdrop, warm party bokeh lights, cheerful gourmet picnic atmosphere',
  }

  const baseEstilo = mapaEstilos[estiloId] || mapaEstilos['nano-banana-2']

  if (promptBase && promptBase.trim().length > 5) {
    return `${promptBase.trim()}, gourmet food photography background for ${nombreProd}, empty center for product placement, high resolution, photorealistic`
  }

  return baseEstilo
}

/**
 * Descarga una imagen remota y la devuelve como Data URI base64
 */
async function descargarComoDataUri(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen fuente (${res.status} ${res.statusText}): ${url}`)
  }
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const arrayBuffer = await res.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  return `data:${contentType};base64,${base64}`
}

/**
 * Genera un fondo nuevo con la API de Image Generation de Cloudinary (text_to_image)
 */
async function generarFondoConTextToImage({ cloudName, apiKey, apiSecret, prompt, model, publicId }) {
  const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
  const endpoint = `https://api.cloudinary.com/v2/generate/${cloudName}/text_to_image`

  console.log(`🚀 [text_to_image] Llamando a API de Image Generation de Cloudinary...`)
  console.log(`   Endpoint: ${endpoint}`)
  console.log(`   Modelo: ${model}`)
  console.log(`   Prompt: "${prompt}"`)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        model: model || 'nano-banana-2',
        aspect_ratio: '4:5',
        asset_folder: 'marketing/backgrounds',
        public_id: publicId,
      }),
    })

    const responseText = await res.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { raw: responseText }
    }

    if (!res.ok) {
      console.warn(`⚠️ [text_to_image] Respuesta HTTP ${res.status}:`, data)
      return { success: false, error: data?.error?.message || data?.message || responseText, status: res.status }
    }

    console.log(`✅ [text_to_image] Fondo generado con éxito en Cloudinary:`, data.public_id || publicId)
    return {
      success: true,
      public_id: data.public_id || `marketing/backgrounds/${publicId}`,
      secure_url: data.secure_url,
      data,
    }
  } catch (err) {
    console.error('❌ [text_to_image] Error de red o ejecución:', err)
    return { success: false, error: err?.message || 'Error de conexión' }
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      producto_id,
      descuento = 0,
      evento = '',
      brief_creativo = '',
      custom_image_url = null,
      modelo = 'nano-banana-2',
      estilo = null,
    } = body || {}

    if (!producto_id && !custom_image_url) {
      return NextResponse.json(
        { success: false, error: 'Se requiere producto_id o custom_image_url' },
        { status: 400 }
      )
    }

    const modeloSeleccionado = modelo || estilo || 'nano-banana-2'
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'd7simx38'
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    console.log(`🎨 [${new Date().toISOString()}] Inicio Estrategia 2 Pasos (Background Removal + Image Generation)`)
    console.log(`   Modelo: ${modeloSeleccionado}`)

    // 0. Diagnóstico de credenciales
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: 'Credenciales de Cloudinary incompletas en variables de entorno' },
        { status: 500 }
      )
    }

    // 1. Obtener producto de Supabase
    let producto = null
    if (producto_id) {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, categoria, precio_venta, imagen_url, imagen_public_id, imagenes_urls')
        .eq('id', producto_id)
        .single()

      if (!error && data) producto = data
    }

    if (!producto) {
      producto = {
        id: producto_id || 'prod-sample',
        nombre: 'Pan de Campo 100% Sin Gluten',
        categoria: 'Panadería',
        precio_venta: 28000,
        imagen_url: null,
        imagen_public_id: null,
        imagenes_urls: [],
      }
    }

    // 2. Determinar la imagen base del producto
    let imageSource = null
    let origenImagen = ''

    if (custom_image_url && custom_image_url.trim()) {
      imageSource = custom_image_url.trim()
      origenImagen = 'custom_image_url'
    } else if (producto.imagen_url && producto.imagen_url.startsWith('http')) {
      imageSource = producto.imagen_url.trim()
      origenImagen = 'imagen_url (Supabase Storage)'
    } else if (producto.imagenes_urls && Array.isArray(producto.imagenes_urls)) {
      const httpUrlInArray = producto.imagenes_urls.find(u => typeof u === 'string' && u.startsWith('http'))
      if (httpUrlInArray) {
        imageSource = httpUrlInArray.trim()
        origenImagen = 'imagenes_urls (HTTP)'
      }
    }

    if (!imageSource) {
      if (producto.imagen_public_id && typeof producto.imagen_public_id === 'string' && !producto.imagen_public_id.includes('[')) {
        imageSource = producto.imagen_public_id.trim()
        origenImagen = 'imagen_public_id (Cloudinary)'
      } else if (producto.imagenes_urls && producto.imagenes_urls.length > 0 && producto.imagenes_urls[0]) {
        imageSource = String(producto.imagenes_urls[0]).trim()
        origenImagen = 'imagenes_urls[0]'
      } else {
        imageSource = 'https://res.cloudinary.com/d7simx38/image/upload/v1786629847/productos/gmwx5mwuj0ockucprlwr.jpg'
        origenImagen = 'fallback_default'
      }
    }

    console.log('🖼️ [Paso 1] Imagen de producto seleccionada:', imageSource, '| Origen:', origenImagen)

    const cloudinary = getCloudinaryClient()
    const timestamp = Date.now()
    const cleanId = String(producto.id || 'promo').replace(/-/g, '')
    const productPublicId = `prod_cutout_${cleanId}_${timestamp}`
    const bgPublicId = `bg_gen_${cleanId}_${timestamp}`

    // =========================================================================
    // PASO 1: Subir imagen del producto y aplicar background_removal (Pixelz/AI)
    // =========================================================================
    console.log('✂️ [Paso 1] Subiendo producto a Cloudinary con background_removal (Pixelz)...')
    let fileParaSubir = imageSource
    const esUrlDeCloudinary = /^https?:\/\/res\.cloudinary\.com\//.test(imageSource)
    const esUrlHttp = /^https?:\/\//.test(imageSource)

    if (esUrlHttp && !esUrlDeCloudinary) {
      fileParaSubir = await descargarComoDataUri(imageSource)
    } else if (!esUrlHttp) {
      fileParaSubir = `https://res.cloudinary.com/${cloudName}/image/upload/${imageSource}`
    }

    const productUploadResult = await cloudinary.uploader.upload(fileParaSubir, {
      asset_folder: 'marketing/products',
      public_id: productPublicId,
      background_removal: 'pixelz',
      overwrite: true,
      resource_type: 'image',
      secure: true,
    })

    const finalProductPublicId = productUploadResult.public_id || productPublicId
    console.log('✅ [Paso 1] Producto procesado y guardado:', finalProductPublicId)

    // =========================================================================
    // PASO 2: Generar fondo nuevo con API text_to_image de Image Generation
    // =========================================================================
    const promptBase = brief_creativo || `fotografía gastronómica profesional de ${producto.nombre}`
    const promptComprimido = await comprimirPrompt(promptBase, { ratio: 0.7, maxTokens: 80 })
    const promptGenerativo = construirPromptGenerativoFondo(promptComprimido, producto, modeloSeleccionado)

    console.log(`🎨 [Paso 2] Generando fondo con Image Generation (${modeloSeleccionado})...`)
    const bgResult = await generarFondoConTextToImage({
      cloudName,
      apiKey,
      apiSecret,
      prompt: promptGenerativo,
      model: modeloSeleccionado,
      publicId: bgPublicId,
    })

    let baseCanvasId = finalProductPublicId
    let usandoFondoGenerado = false

    if (bgResult.success && bgResult.public_id) {
      baseCanvasId = bgResult.public_id
      usandoFondoGenerado = true
      console.log('✅ [Paso 2] Fondo generado listo para composición:', baseCanvasId)
    } else {
      console.warn('⚠️ [Paso 2] No se pudo generar fondo via text_to_image API, utilizando composición con canvas estilizado:', bgResult.error)
    }

    // =========================================================================
    // PASO 3: Combinar Producto + Fondo Generado + Overlays Publicitarios
    // =========================================================================
    console.log('🎯 [Paso 3] Ensamblando arte publicitario con overlays y layer_apply...')
    const precioOriginalNum = Number(producto.precio_venta) || 28000
    const descuentoNum = Number(descuento) || 0
    const precioPromoNum = Math.round(precioOriginalNum * (1 - descuentoNum / 100))

    // Formatear el publicId del producto para overlay en Cloudinary (reemplazar / por :)
    const overlayProductTag = finalProductPublicId.replace(/\//g, ':')

    let transformations = []

    if (usandoFondoGenerado) {
      // Si el lienzo base es el fondo generado con IA:
      transformations = [
        // Canvas Instagram Portrait 4:5
        { width: 1080, height: 1350, crop: 'fill', gravity: 'center' },

        // 1. Overlay del producto sin fondo en el centro
        {
          overlay: overlayProductTag,
          width: 780,
          crop: 'fit',
          effect: 'background_removal',
        },
        { flags: 'layer_apply', gravity: 'center', y: -70 },

        // 2. Realces fotográficos
        { effect: 'brightness:5' },
        { effect: 'contrast:12' },
        { effect: 'saturation:14' },
        { effect: 'sharpen:80' },
        { effect: 'vignette:18' },
        { quality: 'auto:best', fetch_format: 'auto' },

        // 3. Badge de Descuento
        ...(descuentoNum > 0
          ? [
              {
                overlay: {
                  font_family: 'Montserrat',
                  font_size: 72,
                  font_weight: 'bold',
                  text: `${descuentoNum}%25 OFF`,
                },
                color: 'rgb:FF6B00',
              },
              { flags: 'layer_apply', gravity: 'north_east', x: 50, y: 50 },
            ]
          : []),

        // 4. Nombre del producto
        {
          overlay: {
            font_family: 'Montserrat',
            font_size: 48,
            font_weight: 'bold',
            text: encodeURIComponent(producto.nombre),
          },
          color: 'rgb:FFFFFF',
        },
        { flags: 'layer_apply', gravity: 'south', y: 220 },

        // 5. Precio original tachado
        ...(descuentoNum > 0
          ? [
              {
                overlay: {
                  font_family: 'Montserrat',
                  font_size: 34,
                  text: `G/${precioOriginalNum.toLocaleString('es-PY')}`,
                },
                color: 'rgb:D1D5DB',
              },
              { flags: 'layer_apply', gravity: 'south', y: 150 },
            ]
          : []),

        // 6. Precio promocional destacado
        {
          overlay: {
            font_family: 'Montserrat',
            font_size: 64,
            font_weight: 'bold',
            text: `G/${precioPromoNum.toLocaleString('es-PY')}`,
          },
          color: 'rgb:FF6B00',
        },
        { flags: 'layer_apply', gravity: 'south', y: 90 },

        // 7. CTA de cierre
        {
          overlay: {
            font_family: 'Montserrat',
            font_size: 28,
            font_weight: 'bold',
            text: encodeURIComponent('Pedi en panfree.fit | 100% Sin Gluten'),
          },
          color: 'rgb:F9FAFB',
        },
        { flags: 'layer_apply', gravity: 'south', y: 25 },
      ]
    } else {
      // Fallback: Canvas directo con corte del producto y capas
      transformations = [
        { width: 1080, height: 1350, crop: 'pad', background: 'gen_fill:prompt_rustic_bakery_table_warm_lighting', gravity: 'center' },
        { effect: 'brightness:6' },
        { effect: 'contrast:15' },
        { effect: 'saturation:14' },
        { effect: 'sharpen:80' },
        { effect: 'vignette:20' },
        { quality: 'auto:best', fetch_format: 'auto' },

        ...(descuentoNum > 0
          ? [
              {
                overlay: {
                  font_family: 'Montserrat',
                  font_size: 72,
                  font_weight: 'bold',
                  text: `${descuentoNum}%25 OFF`,
                },
                color: 'rgb:FF6B00',
              },
              { flags: 'layer_apply', gravity: 'north_east', x: 50, y: 50 },
            ]
          : []),

        {
          overlay: {
            font_family: 'Montserrat',
            font_size: 48,
            font_weight: 'bold',
            text: encodeURIComponent(producto.nombre),
          },
          color: 'rgb:FFFFFF',
        },
        { flags: 'layer_apply', gravity: 'south', y: 220 },

        ...(descuentoNum > 0
          ? [
              {
                overlay: {
                  font_family: 'Montserrat',
                  font_size: 34,
                  text: `G/${precioOriginalNum.toLocaleString('es-PY')}`,
                },
                color: 'rgb:D1D5DB',
              },
              { flags: 'layer_apply', gravity: 'south', y: 150 },
            ]
          : []),

        {
          overlay: {
            font_family: 'Montserrat',
            font_size: 64,
            font_weight: 'bold',
            text: `G/${precioPromoNum.toLocaleString('es-PY')}`,
          },
          color: 'rgb:FF6B00',
        },
        { flags: 'layer_apply', gravity: 'south', y: 90 },

        {
          overlay: {
            font_family: 'Montserrat',
            font_size: 28,
            font_weight: 'bold',
            text: encodeURIComponent('Pedi en panfree.fit | 100% Sin Gluten'),
          },
          color: 'rgb:F9FAFB',
        },
        { flags: 'layer_apply', gravity: 'south', y: 25 },
      ]
    }

    const generatedImageUrl = cloudinary.url(baseCanvasId, {
      transformation: transformations,
      secure: true,
    })

    console.log(`✅ [Paso 3] URL final generada con éxito (${generatedImageUrl.length} car.): ${generatedImageUrl}`)

    // 4. Guardar registro en Supabase
    const { data: dataInsert } = await supabase
      .from('generaciones_imagen')
      .insert([{
        producto_id: producto.id,
        imagen_original_url: imageSource,
        imagen_generada_url: generatedImageUrl,
        transformaciones: transformations,
        prompt_creativo: promptGenerativo,
        evento: evento || null,
        descuento_aplicado: descuentoNum,
        precio_original: precioOriginalNum,
        precio_promocional: precioPromoNum,
      }])
      .select()

    return NextResponse.json({
      success: true,
      imagen_url: generatedImageUrl,
      public_id: baseCanvasId,
      producto_recortado_id: finalProductPublicId,
      fondo_generado_id: bgResult.public_id || null,
      modelo_utilizado: modeloSeleccionado,
      prompt_fondo: promptGenerativo,
      usando_fondo_generado: usandoFondoGenerado,
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        precio_original: precioOriginalNum,
        precio_original_fmt: `G/ ${precioOriginalNum.toLocaleString('es-PY')}`,
        precio_promocional: precioPromoNum,
        precio_promocional_fmt: `G/ ${precioPromoNum.toLocaleString('es-PY')}`,
        descuento: descuentoNum,
      },
      generacion_id: dataInsert?.[0]?.id || null,
      mensaje: `✅ Arte publicitario generado con eliminación de fondo + Image Generation (${modeloSeleccionado})`,
    })
  } catch (error) {
    console.error('❌ Error en generar-imagen-cloudinary:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar la imagen' },
      { status: 500 }
    )
  }
}


