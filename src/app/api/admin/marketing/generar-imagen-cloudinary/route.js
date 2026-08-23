// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient, extractPublicId } from '@/lib/cloudinary'
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
 * Genera un prompt descriptivo gastronómico publicitario para Gemini Image API
 */
function construirPromptGenerativoComercial(promptBase, producto, modeloId = 'gemini-3.1-flash-image') {
  const nombreProd = producto?.nombre || 'Panadería Gourmet 100% Sin Gluten'
  const categoriaProd = producto?.categoria || 'Panadería Artesanal Sin Gluten'

  const mapaEstilos = {
    'gemini-3.1-flash-image': 'A warm commercial food photography advertisement of the artisan gluten-free bakery product shown in the reference image. Placed on a rustic wooden bakery table surface, soft natural golden morning light, delicate flour dust and fresh rosemary herbs around, blurred cozy artisan bakery background, 8k ultra photorealistic food studio lighting, pristine commercial advertisement layout, no text, no words, no signs, no logos',
    'gemini-3.1-flash-lite-image': 'Warm wooden table top, rustic bakery environment, golden hour lighting, cozy atmosphere, commercial food photography advertising shot of the reference bakery product, no text, no labels',
    'gemini-3-pro-image': 'Ultra-realistic luxury white Italian marble countertop, morning sunbeam through window, soft natural shadows, elegant gourmet bakery scene featuring the reference gluten-free product, pristine food advertising background, no text',
    'nano-banana-2': 'A warm commercial food photography advertisement of the artisan gluten-free bakery product shown in the reference image. Placed on a rustic wooden table surface, soft natural golden morning light, subtle flour dust, 8k food studio lighting, no text',
    'nano-banana-1': 'Warm wooden table top, rustic bakery environment, golden hour lighting, cozy atmosphere, food photography of reference product, no text',
    'flux-2-pro': 'Ultra-realistic luxury white Italian marble countertop, morning sunbeam through window, soft natural shadows, elegant gourmet bakery scene, pristine food advertising background, no text',
    'recraft-v4': 'Artisan bakery kitchen table, dark rustic wood texture, flour dusting, fresh rosemary and wheat sprigs, warm cozy depth of field, studio food photography of reference product, no text',
    'gpt-image-2': 'Vibrant festive celebration table backdrop, warm party bokeh lights, cheerful gourmet picnic atmosphere with the reference product, bright and inviting commercial advertising shot, no text',
    'ideogram-v4-base': 'Dark moody rustic restaurant table, dramatic warm spotlight, slate stone and charred oak texture, Michelin star food photography studio setting with reference product, no text',
  }

  const baseEstilo = mapaEstilos[modeloId] || mapaEstilos['gemini-3.1-flash-image']

  if (promptBase && promptBase.trim().length > 5) {
    return `Commercial food photography advertisement of the gluten-free bakery product (${nombreProd}) from the reference image. ${promptBase.trim()}. Soft natural studio lighting, depth of field, high-end culinary presentation, 8k resolution, photorealistic, no text, no typography, no watermarks, no overlay text.`
  }

  return baseEstilo
}

/**
 * Resuelve la URL pública canónica en Cloudinary (carpeta productos/)
 * Prioriza la imagen en Cloudinary por sobre Supabase Storage
 */
function resolverUrlCloudinaryPublica(producto, customImageUrl, cloudName) {
  // 1. Si hay custom_image_url y es de Cloudinary
  if (customImageUrl && customImageUrl.startsWith('http') && customImageUrl.includes('cloudinary.com')) {
    return {
      url: customImageUrl.trim(),
      origen: 'custom_image_url (Cloudinary)',
      publicId: extractPublicId(customImageUrl),
      esCloudinaryDirecto: true,
    }
  }

  // 2. Si el producto tiene imagen_public_id en Cloudinary (ej: "productos/gmwx5mwuj0ockucprlwr" o "gmwx5mwuj0ockucprlwr")
  if (producto?.imagen_public_id && typeof producto.imagen_public_id === 'string' && !producto.imagen_public_id.includes('[')) {
    let cleanId = producto.imagen_public_id.trim()
    // Asegurar que use la carpeta productos/ si no tiene prefijo
    if (!cleanId.includes('/')) {
      cleanId = `productos/${cleanId}`
    }
    return {
      url: `https://res.cloudinary.com/${cloudName}/image/upload/${cleanId}.jpg`,
      origen: 'producto.imagen_public_id (Cloudinary productos/)',
      publicId: cleanId,
      esCloudinaryDirecto: true,
    }
  }

  // 3. Si producto.imagen_url es directamente una URL de Cloudinary
  if (producto?.imagen_url && typeof producto.imagen_url === 'string' && producto.imagen_url.includes('cloudinary.com')) {
    return {
      url: producto.imagen_url.trim(),
      origen: 'producto.imagen_url (Cloudinary)',
      publicId: extractPublicId(producto.imagen_url),
      esCloudinaryDirecto: true,
    }
  }

  // 4. Si producto.imagenes_urls tiene alguna URL de Cloudinary
  if (Array.isArray(producto?.imagenes_urls)) {
    const cldUrl = producto.imagenes_urls.find(u => typeof u === 'string' && u.includes('cloudinary.com'))
    if (cldUrl) {
      return {
        url: cldUrl.trim(),
        origen: 'producto.imagenes_urls (Cloudinary)',
        publicId: extractPublicId(cldUrl),
        esCloudinaryDirecto: true,
      }
    }
  }

  // 5. Si la URL es de Supabase Storage u otro servidor externo
  if (producto?.imagen_url && typeof producto.imagen_url === 'string' && producto.imagen_url.startsWith('http')) {
    return {
      url: producto.imagen_url.trim(),
      origen: 'producto.imagen_url (Supabase Storage - se migrará/asegurará a Cloudinary)',
      publicId: null,
      esCloudinaryDirecto: false,
      isSupabase: true,
    }
  }

  // 6. Fallback oficial a la imagen de producto en Cloudinary de PanFree
  const defaultPublicId = 'productos/gmwx5mwuj0ockucprlwr'
  return {
    url: `https://res.cloudinary.com/${cloudName}/image/upload/${defaultPublicId}.jpg`,
    origen: 'fallback_default (Cloudinary productos/)',
    publicId: defaultPublicId,
    esCloudinaryDirecto: true,
  }
}

/**
 * Verifica que la URL sea pública y descarga los bytes en Base64
 */
async function verificarYDescargarImagenPublica(imageUrl) {
  try {
    console.log(`🔍 [Cloudinary Public Check] Verificando accesibilidad pública: ${imageUrl}`)
    const res = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'PanFree-Marketing-Engine/1.0',
        'Accept': 'image/*,*/*',
      },
    })

    if (!res.ok) {
      console.warn(`⚠️ [Cloudinary Access Warning] Código HTTP ${res.status} al acceder a ${imageUrl}`)
      return {
        esPublica: false,
        status: res.status,
        advertencia: `La imagen en Cloudinary respondió HTTP ${res.status}. Asegúrate de que el 'Access Mode' esté en 'Public' en Cloudinary Media Library.`,
        base64: null,
        mimeType: null,
      }
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await res.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    console.log(`✅ [Cloudinary Public Check] Imagen 100% pública y descargada (${Math.round(base64.length / 1024)} KB, ${contentType})`)
    return {
      esPublica: true,
      status: 200,
      base64,
      mimeType: contentType,
    }
  } catch (err) {
    console.warn(`⚠️ [Cloudinary Access Warning] Error de red al verificar imagen pública: ${err.message}`)
    return {
      esPublica: false,
      status: 0,
      advertencia: `No se pudo conectar a la URL pública de Cloudinary (${err.message}).`,
      base64: null,
      mimeType: null,
    }
  }
}

/**
 * Genera la nueva imagen publicitaria con Gemini (Nano Banana) usando la imagen pública de Cloudinary como referencia
 */
async function generarImagenConGemini({
  apiKey,
  prompt,
  model = 'gemini-3.1-flash-image',
  aspectRatio = '3:4',
  referenceImageBase64 = null,
  referenceImageMimeType = 'image/jpeg',
}) {
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

  // Construir las partes de contenido (Imagen de referencia + Prompt)
  const parts = []
  if (referenceImageBase64) {
    parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: referenceImageMimeType || 'image/jpeg',
      },
    })
    console.log(`📎 [Gemini Reference Image] Inyectando imagen de referencia de Cloudinary (${Math.round(referenceImageBase64.length / 1024)} KB)`)
  }

  parts.push({
    text: prompt,
  })

  for (const m of uniqueModels) {
    try {
      console.log(`🚀 [Gemini Image API] Generando arte con modelo: ${m}...`)
      console.log(`   Prompt: "${prompt.substring(0, 120)}..."`)
      console.log(`   Aspect Ratio: ${finalAspectRatio}`)
      console.log(`   Tiene imagen de referencia: ${Boolean(referenceImageBase64)}`)

      const response = await ai.models.generateContent({
        model: m,
        contents: {
          parts,
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
            console.log(`✅ [Gemini Image API] Imagen publicitaria generada con éxito usando: ${m}`)
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

    console.log(`🎨 [${new Date().toISOString()}] Inicio Flujo PanFree: Cloudinary (productos/) + Gemini (Referencia) + Cloudinary (marketing/)`)
    console.log(`   Modelo Solicitado: ${modeloSeleccionado}`)

    // 0. Diagnóstico de credenciales
    if (!apiKeyCloudinary || !apiSecretCloudinary) {
      return NextResponse.json(
        { success: false, error: 'Credenciales de Cloudinary incompletas en variables de entorno' },
        { status: 500 }
      )
    }

    const cloudinary = getCloudinaryClient()

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

    // =========================================================================
    // PASO 1 & 2: Resolver imagen en Cloudinary (carpeta productos/) y verificar que sea PÚBLICA
    // =========================================================================
    const infoImagen = resolverUrlCloudinaryPublica(producto, custom_image_url, cloudName)
    let urlImagenReferencia = infoImagen.url
    let publicIdProducto = infoImagen.publicId

    console.log(`📦 [Paso 1] Imagen resuelta: ${urlImagenReferencia} | Origen: ${infoImagen.origen}`)

    // Si la imagen viene de Supabase Storage y no está aún en Cloudinary productos/, la subimos a Cloudinary productos/
    if (infoImagen.isSupabase && !infoImagen.esCloudinaryDirecto) {
      try {
        console.log(`🔄 [Paso 1.1] Subiendo imagen de Supabase a Cloudinary carpeta productos/...`)
        const cleanIdProd = String(producto.id || 'prod').replace(/-/g, '')
        const uploadProdResult = await cloudinary.uploader.upload(infoImagen.url, {
          folder: 'productos',
          public_id: `prod_${cleanIdProd}`,
          overwrite: true,
          resource_type: 'image',
          secure: true,
        })
        urlImagenReferencia = uploadProdResult.secure_url
        publicIdProducto = uploadProdResult.public_id
        console.log(`✅ [Paso 1.1] Imagen disponible en Cloudinary: ${urlImagenReferencia}`)
      } catch (errUploadSupabase) {
        console.warn(`⚠️ [Paso 1.1] No se pudo migrar imagen de Supabase a Cloudinary: ${errUploadSupabase.message}`)
      }
    }

    // Paso 2: Verificar que la URL de Cloudinary sea PÚBLICA y descargar bytes para Gemini
    const checkPublico = await verificarYDescargarImagenPublica(urlImagenReferencia)
    const advertenciaPublica = checkPublico.esPublica ? null : checkPublico.advertencia

    if (!checkPublico.esPublica) {
      console.warn(`⚠️ [Paso 2] ADVERTENCIA: ${checkPublico.advertencia}`)
    }

    // =========================================================================
    // PASO 3 & 4: Gemini (Nano Banana) genera imagen NUEVA con la referencia y el prompt
    // =========================================================================
    const promptBase = brief_creativo || `fotografía publicitaria gastronómica de ${producto.nombre}`
    const promptComprimido = await comprimirPrompt(promptBase, { ratio: 0.7, maxTokens: 80 })
    const promptGenerativo = construirPromptGenerativoComercial(promptComprimido, producto, modeloSeleccionado)

    console.log(`🤖 [Paso 3 & 4] Enviando referencia y prompt a Gemini Image API (${modeloSeleccionado})...`)
    const geminiResult = await generarImagenConGemini({
      apiKey: geminiApiKey,
      prompt: promptGenerativo,
      model: modeloSeleccionado,
      aspectRatio: '3:4',
      referenceImageBase64: checkPublico.base64,
      referenceImageMimeType: checkPublico.mimeType || 'image/jpeg',
    })

    const timestamp = Date.now()
    const cleanId = String(producto.id || 'promo').replace(/-/g, '')
    let marketingPublicId = null
    let usandoFondoGenerado = false
    let modeloEfectivo = modeloSeleccionado
    let baseCanvasId = publicIdProducto || `productos/gmwx5mwuj0ockucprlwr`

    // =========================================================================
    // PASO 5: Guardar imagen generada por Gemini en Cloudinary (carpeta marketing/)
    // =========================================================================
    if (geminiResult.success && geminiResult.base64Data) {
      modeloEfectivo = geminiResult.modelUsed || modeloSeleccionado
      try {
        console.log('☁️ [Paso 5] Guardando la imagen generada por Gemini en Cloudinary (carpeta marketing/)...')
        const dataUriGenerada = `data:${geminiResult.mimeType};base64,${geminiResult.base64Data}`
        const uploadResult = await cloudinary.uploader.upload(dataUriGenerada, {
          folder: 'marketing',
          public_id: `art_${cleanId}_${timestamp}`,
          overwrite: true,
          resource_type: 'image',
          secure: true,
        })

        marketingPublicId = uploadResult.public_id
        baseCanvasId = uploadResult.public_id
        usandoFondoGenerado = true
        console.log(`✅ [Paso 5] Imagen de Gemini guardada exitosamente en Cloudinary: ${marketingPublicId}`)
      } catch (uploadErr) {
        console.warn('⚠️ [Paso 5] Error al subir imagen generada a Cloudinary (carpeta marketing/):', uploadErr.message)
      }
    } else {
      console.warn('⚠️ [Paso 4] No se pudo generar imagen completa con Gemini Image API, activando composición con recorte Pixelz:', geminiResult.error)
    }

    // =========================================================================
    // PASO 6: Overlays Publicitarios con Precios Reales en Guaraníes (Cloudinary)
    // =========================================================================
    console.log('🎯 [Paso 6] Inyectando overlays publicitarios de precios reales y CTA...')
    const precioOriginalNum = Number(producto.precio_venta) || 28000
    const descuentoNum = Number(descuento) || 0
    const precioPromoNum = Math.round(precioOriginalNum * (1 - descuentoNum / 100))

    let transformations = []

    if (usandoFondoGenerado) {
      // Imagen generada por Gemini en carpeta marketing/
      transformations = [
        // 1. Canvas Instagram Portrait 4:5 (1080x1350)
        { width: 1080, height: 1350, crop: 'fill', gravity: 'center' },

        // 2. Realces fotográficos gastronómicos
        { effect: 'brightness:3' },
        { effect: 'contrast:10' },
        { effect: 'saturation:12' },
        { effect: 'sharpen:70' },
        { effect: 'vignette:16' },
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
      // Fallback: Recorte de producto + fondo cálido + overlays
      const overlayProductTag = (publicIdProducto || 'productos/gmwx5mwuj0ockucprlwr').replace(/\//g, ':')

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

    console.log(`✅ [Paso 6] URL publicitaria final generada en Cloudinary (${generatedImageUrl.length} car.): ${generatedImageUrl}`)

    // 7. Guardar registro en Supabase
    const { data: dataInsert } = await supabase
      .from('generaciones_imagen')
      .insert([{
        producto_id: producto.id,
        imagen_original_url: urlImagenReferencia,
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
      imagen_referencia_url: urlImagenReferencia,
      marketing_public_id: marketingPublicId,
      guardado_en_carpeta: 'marketing/',
      es_publica_cloudinary: checkPublico.esPublica,
      advertencia_acceso: advertenciaPublica,
      modelo_utilizado: modeloEfectivo,
      prompt_utilizado: promptGenerativo,
      usando_gemini_generado: usandoFondoGenerado,
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
      mensaje: `✅ Arte publicitario generado: Imagen de referencia (Cloudinary productos/) ➔ Gemini (${modeloEfectivo}) ➔ Guardado en Cloudinary (marketing/) + Overlays`,
    })
  } catch (error) {
    console.error('❌ Error en generar-imagen-cloudinary:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar la imagen' },
      { status: 500 }
    )
  }
}



