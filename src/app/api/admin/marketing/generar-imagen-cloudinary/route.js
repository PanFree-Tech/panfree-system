// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient } from '@/lib/cloudinary'
import { comprimirPrompt } from '@/lib/prompt-compressor'

export const dynamic = 'force-dynamic'

/**
 * Mapeo de identificadores de modelo a modelos válidos de Gemini Image API
 */
function mapearModeloGemini(modeloId) {
  const mapa = {
    'gemini-3.1-flash-image': 'gemini-3.1-flash-image',
    'gemini-3.1-flash-image-preview': 'gemini-3.1-flash-image',
    'gemini-3.1-flash-lite-image': 'gemini-3.1-flash-lite-image',
    'gemini-3-pro-image': 'gemini-3-pro-image',
    'nano-banana-2': 'gemini-3.1-flash-image',
    'nano-banana-1': 'gemini-3.1-flash-lite-image',
    'nano-banana-lite': 'gemini-3.1-flash-lite-image',
    'nano-banana-pro': 'gemini-3-pro-image',
    'flux-2-pro': 'gemini-3.1-flash-image',
    'gpt-image-2': 'gemini-3.1-flash-image',
    'recraft-v4': 'gemini-3.1-flash-lite-image',
    'ideogram-v4-base': 'gemini-3.1-flash-image',
  }
  return mapa[modeloId] || process.env.GEMINI_MODEL || 'gemini-3.1-flash-image'
}

/**
 * Genera un prompt descriptivo gastronómico optimizado para Gemini Image API
 */
function construirPromptGenerativoFondo(promptBase, producto, modeloId = 'gemini-3.1-flash-image') {
  const nombreProd = producto?.nombre || 'panadería gourmet sin gluten'

  const mapaEstilos = {
    'gemini-3.1-flash-image': 'A warm gourmet bakery studio background, rustic wooden table surface, soft natural golden morning light, subtle green herbs and flour dust on table, blurred artisan bakery background, 8k professional food photography backdrop, empty space in center for product placement, no text, no labels, clean background',
    'gemini-3.1-flash-lite-image': 'Warm wooden table top, rustic bakery environment, golden hour lighting, cozy atmosphere, food photography backdrop, empty center for product placement, no text',
    'gemini-3-pro-image': 'Ultra-realistic luxury white Italian marble countertop, morning sunbeam through window, soft natural shadows, elegant gourmet bakery scene, pristine food advertising background, empty center, no text',
    'nano-banana-2': 'A warm gourmet bakery studio background, rustic wooden table surface, soft natural golden morning light, subtle green herbs and flour dust on table, blurred artisan bakery background, 8k professional food photography backdrop, empty space in center for product placement, no text',
    'nano-banana-1': 'Warm wooden table top, rustic bakery environment, golden hour lighting, cozy atmosphere, food photography backdrop, empty center, no text',
    'flux-2-pro': 'Ultra-realistic luxury white Italian marble countertop, morning sunbeam through window, soft natural shadows, elegant gourmet bakery scene, pristine food advertising background, no text',
    'recraft-v4': 'Artisan bakery kitchen table, dark rustic wood texture, flour dusting, fresh rosemary and wheat sprigs, warm cozy depth of field, studio food photography background, no text',
    'gpt-image-2': 'Vibrant festive celebration table backdrop, warm party bokeh lights, cheerful gourmet picnic atmosphere, bright and inviting commercial background, empty center, no text',
    'ideogram-v4-base': 'Dark moody rustic restaurant table, dramatic warm spotlight, slate stone and charred oak texture, Michelin star food photography studio setting, empty center, no text',
  }

  const baseEstilo = mapaEstilos[modeloId] || mapaEstilos['gemini-3.1-flash-image']

  if (promptBase && promptBase.trim().length > 5) {
    return `${promptBase.trim()}, commercial food photography studio backdrop for ${nombreProd}, soft natural lighting, depth of field, empty spacious center surface for product placement, ultra photorealistic 8k, no text, no words, no signs, no logos`
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
 * Genera un fondo fotográfico publicitario utilizando Google Gemini Image API (Nano Banana)
 */
async function generarFondoConGemini({ apiKey, prompt, model = 'gemini-3.1-flash-image', aspectRatio = '3:4' }) {
  if (!apiKey) {
    console.warn('⚠️ [Gemini Image API] GEMINI_API_KEY no encontrada en variables de entorno')
    return { success: false, error: 'GEMINI_API_KEY no configurada' }
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })

  const primaryModel = mapearModeloGemini(model)
  const candidateModels = [
    primaryModel,
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-lite-image',
  ]
  const uniqueModels = [...new Set(candidateModels)]

  // Ratios soportados por Gemini: '1:1', '3:4', '4:3', '9:16', '16:9'
  const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9']
  const finalAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '3:4'

  let lastError = null

  for (const m of uniqueModels) {
    try {
      console.log(`🚀 [Gemini Image API] Invocando generación de fondo publicitario...`)
      console.log(`   Modelo: ${m}`)
      console.log(`   Prompt: "${prompt}"`)
      console.log(`   Aspect Ratio: ${finalAspectRatio}`)

      const response = await ai.models.generateContent({
        model: m,
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: finalAspectRatio,
          },
        },
      })

      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            console.log(`✅ [Gemini Image API] Fondo publicitario generado con éxito usando: ${m}`)
            return {
              success: true,
              base64Data: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'image/png',
              modelUsed: m,
            }
          }
        }
      }

      console.warn(`⚠️ [Gemini Image API] No se encontró inlineData en la respuesta de ${m}`)
    } catch (err) {
      lastError = err?.message || String(err)
      console.warn(`⚠️ [Gemini Image API] Error con modelo ${m}:`, lastError)
    }
  }

  return {
    success: false,
    error: lastError || 'Fallo la generación de imagen con Gemini en todos los modelos',
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
      modelo = 'gemini-3.1-flash-image',
      estilo = null,
    } = body || {}

    if (!producto_id && !custom_image_url) {
      return NextResponse.json(
        { success: false, error: 'Se requiere producto_id o custom_image_url' },
        { status: 400 }
      )
    }

    const modeloSeleccionado = modelo || estilo || process.env.GEMINI_MODEL || 'gemini-3.1-flash-image'
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'd7simx38'
    const apiKeyCloudinary = process.env.CLOUDINARY_API_KEY
    const apiSecretCloudinary = process.env.CLOUDINARY_API_SECRET
    const geminiApiKey = process.env.GEMINI_API_KEY

    console.log(`🎨 [${new Date().toISOString()}] Inicio Estrategia PanFree: Recorte Pixelz + Fondo Gemini (Nano Banana) + Overlays Cloudinary`)
    console.log(`   Modelo Solicitado: ${modeloSeleccionado}`)

    // 0. Diagnóstico de credenciales
    if (!apiKeyCloudinary || !apiSecretCloudinary) {
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
    const bgPublicId = `bg_gemini_${cleanId}_${timestamp}`

    // =========================================================================
    // PASO 1: Subir imagen del producto y aplicar background_removal (Pixelz)
    // =========================================================================
    console.log('✂️ [Paso 1] Subiendo producto a Cloudinary con background_removal: pixelz...')
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
    console.log('✅ [Paso 1] Producto recortado y guardado en Cloudinary:', finalProductPublicId)

    // =========================================================================
    // PASO 2: Generar fondo publicitario con Gemini Image API (Nano Banana)
    // =========================================================================
    const promptBase = brief_creativo || `fotografía gastronómica profesional de ${producto.nombre}`
    const promptComprimido = await comprimirPrompt(promptBase, { ratio: 0.7, maxTokens: 80 })
    const promptGenerativo = construirPromptGenerativoFondo(promptComprimido, producto, modeloSeleccionado)

    console.log(`🎨 [Paso 2] Generando fondo con Gemini Image API (${modeloSeleccionado})...`)
    const geminiResult = await generarFondoConGemini({
      apiKey: geminiApiKey,
      prompt: promptGenerativo,
      model: modeloSeleccionado,
      aspectRatio: '3:4',
    })

    let baseCanvasId = finalProductPublicId
    let usandoFondoGenerado = false
    let fondoGeneradoPublicId = null
    let modeloEfectivo = modeloSeleccionado

    if (geminiResult.success && geminiResult.base64Data) {
      modeloEfectivo = geminiResult.modelUsed || modeloSeleccionado
      try {
        console.log('☁️ [Paso 2.1] Subiendo fondo generado por Gemini a Cloudinary Media Library...')
        const dataUriFondo = `data:${geminiResult.mimeType};base64,${geminiResult.base64Data}`
        
        const bgUploadResult = await cloudinary.uploader.upload(dataUriFondo, {
          asset_folder: 'marketing/backgrounds',
          public_id: bgPublicId,
          overwrite: true,
          resource_type: 'image',
          secure: true,
        })

        fondoGeneradoPublicId = bgUploadResult.public_id || bgPublicId
        baseCanvasId = fondoGeneradoPublicId
        usandoFondoGenerado = true
        console.log('✅ [Paso 2.2] Fondo de Gemini disponible en Cloudinary:', fondoGeneradoPublicId)
      } catch (uploadErr) {
        console.warn('⚠️ [Paso 2.2] Error al subir fondo de Gemini a Cloudinary, activando fallback visual:', uploadErr.message)
      }
    } else {
      console.warn('⚠️ [Paso 2] No se pudo generar fondo via Gemini Image API, activando fallback de lienzo:', geminiResult.error)
    }

    // =========================================================================
    // PASO 3: Combinar Producto + Fondo Generado + Overlays Publicitarios
    // =========================================================================
    console.log('🎯 [Paso 3] Ensamblando arte publicitario con overlays de precios reales y layer_apply...')
    const precioOriginalNum = Number(producto.precio_venta) || 28000
    const descuentoNum = Number(descuento) || 0
    const precioPromoNum = Math.round(precioOriginalNum * (1 - descuentoNum / 100))

    // Formatear el publicId del producto para overlay en Cloudinary (reemplazar / por :)
    const overlayProductTag = finalProductPublicId.replace(/\//g, ':')

    let transformations = []

    if (usandoFondoGenerado) {
      // Lienzo base: Fondo fotográfico publicitario generado por Gemini (Nano Banana)
      transformations = [
        // 1. Canvas Instagram Portrait 4:5 (1080x1350)
        { width: 1080, height: 1350, crop: 'fill', gravity: 'center' },

        // 2. Overlay del producto sin fondo en el centro
        {
          overlay: overlayProductTag,
          width: 780,
          crop: 'fit',
          effect: 'background_removal',
        },
        { flags: 'layer_apply', gravity: 'center', y: -70 },

        // 3. Realces fotográficos gastronómicos
        { effect: 'brightness:5' },
        { effect: 'contrast:12' },
        { effect: 'saturation:14' },
        { effect: 'sharpen:80' },
        { effect: 'vignette:18' },
        { quality: 'auto:best', fetch_format: 'auto' },

        // 4. Badge de Descuento
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

        // 5. Nombre del producto
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

        // 6. Precio original tachado
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

        // 7. Precio promocional destacado
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

        // 8. CTA de cierre
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
      // Fallback: Canvas directo con corte del producto (Pixelz) y fondo fotográfico cálido
      transformations = [
        { width: 1080, height: 1350, crop: 'pad', background: 'rgb:241D17', gravity: 'center' },
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
      fondo_generado_id: fondoGeneradoPublicId,
      modelo_utilizado: modeloEfectivo,
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
      mensaje: `✅ Arte publicitario generado: Recorte Pixelz + Fondo Gemini (${modeloEfectivo}) + Overlays Cloudinary`,
    })
  } catch (error) {
    console.error('❌ Error en generar-imagen-cloudinary:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar la imagen' },
      { status: 500 }
    )
  }
}


