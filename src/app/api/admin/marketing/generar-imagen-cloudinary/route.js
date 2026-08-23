// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient, extractPublicId } from '@/lib/cloudinary'
import { comprimirPrompt } from '@/lib/prompt-compressor'

export const dynamic = 'force-dynamic'

/**
 * Genera un prompt enriquecido usando Gemini (modelo gratuito gemini-2.5-flash)
 * Analiza la imagen de referencia y el prompt base, devuelve un prompt detallado para fondo.
 */
async function generarPromptConGemini({
  apiKey,
  promptBase,
  referenceImageBase64,
  referenceImageMimeType = 'image/jpeg',
}) {
  if (!apiKey) {
    console.warn('⚠️ [Gemini Prompt] GEMINI_API_KEY no encontrada')
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

  const sistema = `
    Eres un asistente experto en fotografía gastronómica y publicitaria.
    Recibirás una imagen de referencia de un producto de panadería sin gluten.
    Tu tarea es generar un prompt detallado (máximo 100 palabras) para que un motor de IA genere un fondo profesional.
    El prompt debe describir: ambiente, iluminación, texturas, estilo y elementos decorativos.
    Responde ÚNICAMENTE con el prompt, sin introducciones ni explicaciones.
  `

  const parts = []
  if (referenceImageBase64) {
    parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: referenceImageMimeType,
      },
    })
    console.log(`📎 [Gemini Prompt] Imagen de referencia inyectada (${Math.round(referenceImageBase64.length / 1024)} KB)`)
  }
  parts.push({ text: `Prompt base del usuario: "${promptBase}"` })

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: sistema },
          ...parts,
        ],
      },
    })

    const textoGenerado = response?.candidates?.[0]?.content?.parts?.[0]?.text
    if (textoGenerado) {
      console.log('✅ [Gemini Prompt] Prompt enriquecido generado:', textoGenerado)
      return { success: true, prompt: textoGenerado.trim() }
    } else {
      console.warn('⚠️ [Gemini Prompt] No se obtuvo texto en la respuesta')
      return { success: false, error: 'Respuesta sin texto' }
    }
  } catch (err) {
    console.error('❌ [Gemini Prompt] Error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Resuelve la URL pública canónica en Cloudinary (carpeta productos/)
 */
function resolverUrlCloudinaryPublica(producto, customImageUrl, cloudName) {
  if (customImageUrl && customImageUrl.startsWith('http') && customImageUrl.includes('cloudinary.com')) {
    return {
      url: customImageUrl.trim(),
      origen: 'custom_image_url (Cloudinary)',
      publicId: extractPublicId(customImageUrl),
      esCloudinaryDirecto: true,
    }
  }

  if (producto?.imagen_public_id && typeof producto.imagen_public_id === 'string' && !producto.imagen_public_id.includes('[')) {
    let cleanId = producto.imagen_public_id.trim()
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

  if (producto?.imagen_url && typeof producto.imagen_url === 'string' && producto.imagen_url.includes('cloudinary.com')) {
    return {
      url: producto.imagen_url.trim(),
      origen: 'producto.imagen_url (Cloudinary)',
      publicId: extractPublicId(producto.imagen_url),
      esCloudinaryDirecto: true,
    }
  }

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

  if (producto?.imagen_url && typeof producto.imagen_url === 'string' && producto.imagen_url.startsWith('http')) {
    return {
      url: producto.imagen_url.trim(),
      origen: 'producto.imagen_url (Supabase Storage - se migrará/asegurará a Cloudinary)',
      publicId: null,
      esCloudinaryDirecto: false,
      isSupabase: true,
    }
  }

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

    console.log(`✅ [Cloudinary Public Check] Imagen pública y descargada (${Math.round(base64.length / 1024)} KB, ${contentType})`)
    return {
      esPublica: true,
      status: 200,
      base64,
      mimeType: contentType,
    }
  } catch (err) {
    console.warn(`⚠️ [Cloudinary Access Warning] Error de red: ${err.message}`)
    return {
      esPublica: false,
      status: 0,
      advertencia: `No se pudo conectar a la URL pública de Cloudinary (${err.message}).`,
      base64: null,
      mimeType: null,
    }
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
      // modelo se ignora, siempre usamos gemini-2.5-flash para enriquecer
    } = body || {}

    if (!producto_id && !custom_image_url) {
      return NextResponse.json(
        { success: false, error: 'Se requiere producto_id o custom_image_url' },
        { status: 400 }
      )
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'd7simx38'
    const apiKeyCloudinary = process.env.CLOUDINARY_API_KEY
    const apiSecretCloudinary = process.env.CLOUDINARY_API_SECRET
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!apiKeyCloudinary || !apiSecretCloudinary) {
      return NextResponse.json(
        { success: false, error: 'Credenciales de Cloudinary incompletas' },
        { status: 500 }
      )
    }

    const cloudinary = getCloudinaryClient()

    // Obtener producto
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

    // Resolver imagen en Cloudinary
    const infoImagen = resolverUrlCloudinaryPublica(producto, custom_image_url, cloudName)
    let urlImagenReferencia = infoImagen.url
    let publicIdProducto = infoImagen.publicId

    // Migrar desde Supabase si es necesario
    if (infoImagen.isSupabase && !infoImagen.esCloudinaryDirecto) {
      try {
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
      } catch (err) {
        console.warn('⚠️ No se pudo migrar imagen de Supabase:', err.message)
      }
    }

    // Verificar pública y descargar base64
    const checkPublico = await verificarYDescargarImagenPublica(urlImagenReferencia)
    const advertenciaPublica = checkPublico.esPublica ? null : checkPublico.advertencia

    // =========================================================================
    // PASO 1: Gemini enriquece el prompt (gratuito)
    // =========================================================================
    const promptBase = brief_creativo || `fotografía publicitaria gastronómica de ${producto.nombre}`
    const promptComprimido = await comprimirPrompt(promptBase, { ratio: 0.7, maxTokens: 80 })

    console.log('🤖 [Gemini] Generando prompt enriquecido con gemini-2.5-flash...')
    const geminiResult = await generarPromptConGemini({
      apiKey: geminiApiKey,
      promptBase: promptComprimido,
      referenceImageBase64: checkPublico.base64,
      referenceImageMimeType: checkPublico.mimeType,
    })

    let promptEnriquecido = promptComprimido
    if (geminiResult.success && geminiResult.prompt) {
      promptEnriquecido = geminiResult.prompt
      console.log('✅ [Gemini] Prompt enriquecido:', promptEnriquecido)
    } else {
      console.warn('⚠️ [Gemini] No se pudo enriquecer prompt, se usará el original.')
    }

    // =========================================================================
    // PASO 2: Cloudinary genera fondo con gen_fill usando el prompt enriquecido
    // =========================================================================
    const backgroundPrompt = promptEnriquecido
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, '_')
      .substring(0, 100)

    const precioOriginalNum = Number(producto.precio_venta) || 28000
    const descuentoNum = Number(descuento) || 0
    const precioPromoNum = Math.round(precioOriginalNum * (1 - descuentoNum / 100))

    // Overlay del producto (opcional, usa el recorte sin fondo)
    const overlayProductTag = (publicIdProducto || 'productos/gmwx5mwuj0ockucprlwr').replace(/\//g, ':')

    const transformations = [
      // Fondo generado por Cloudinary con gen_fill
      { width: 1080, height: 1350, crop: 'pad', background: `gen_fill:prompt_${backgroundPrompt}`, gravity: 'center' },
      // Efectos
      { effect: 'brightness:5' },
      { effect: 'contrast:12' },
      { effect: 'saturation:14' },
      { effect: 'sharpen:80' },
      { effect: 'vignette:18' },
      { quality: 'auto:best', fetch_format: 'auto' },
      // Producto recortado (opcional)
      {
        overlay: overlayProductTag,
        width: 780,
        crop: 'fit',
      },
      { flags: 'layer_apply', gravity: 'center', y: -70 },
      // Badge de descuento
      ...(descuentoNum > 0 ? [
        { overlay: { font_family: 'Montserrat', font_size: 72, font_weight: 'bold', text: `${descuentoNum}%25 OFF` }, color: 'rgb:FF6B00' },
        { flags: 'layer_apply', gravity: 'north_east', x: 50, y: 50 },
      ] : []),
      // Nombre
      { overlay: { font_family: 'Montserrat', font_size: 48, font_weight: 'bold', text: encodeURIComponent(producto.nombre) }, color: 'rgb:FFFFFF' },
      { flags: 'layer_apply', gravity: 'south', y: 220 },
      // Precio original
      ...(descuentoNum > 0 ? [
        { overlay: { font_family: 'Montserrat', font_size: 34, text: `G/${precioOriginalNum.toLocaleString('es-PY')}` }, color: 'rgb:D1D5DB' },
        { flags: 'layer_apply', gravity: 'south', y: 150 },
      ] : []),
      // Precio promocional
      { overlay: { font_family: 'Montserrat', font_size: 64, font_weight: 'bold', text: `G/${precioPromoNum.toLocaleString('es-PY')}` }, color: 'rgb:FF6B00' },
      { flags: 'layer_apply', gravity: 'south', y: 90 },
      // CTA
      { overlay: { font_family: 'Montserrat', font_size: 28, font_weight: 'bold', text: encodeURIComponent('Pedi en panfree.fit | 100% Sin Gluten') }, color: 'rgb:F9FAFB' },
      { flags: 'layer_apply', gravity: 'south', y: 25 },
    ]

    // Usar la imagen del producto como base
    const baseCanvasId = publicIdProducto || 'productos/gmwx5mwuj0ockucprlwr'
    const generatedImageUrl = cloudinary.url(baseCanvasId, {
      transformation: transformations,
      secure: true,
    })

    // Guardar en Supabase
    const { data: dataInsert } = await supabase
      .from('generaciones_imagen')
      .insert([{
        producto_id: producto.id,
        imagen_original_url: urlImagenReferencia,
        imagen_generada_url: generatedImageUrl,
        transformaciones: transformations,
        prompt_creativo: promptEnriquecido,
        evento: evento || null,
        descuento_aplicado: descuentoNum,
        precio_original: precioOriginalNum,
        precio_promocional: precioPromoNum,
      }])
      .select()

    return NextResponse.json({
      success: true,
      imagen_url: generatedImageUrl,
      modelo_utilizado: 'gemini-2.5-flash (enriquecimiento)',
      prompt_utilizado: promptEnriquecido,
      es_publica_cloudinary: checkPublico.esPublica,
      advertencia_acceso: advertenciaPublica,
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
      mensaje: `✅ Arte generado: Gemini enriquece prompt → Cloudinary gen_fill → overlays. 100% gratuito.`,
    })
  } catch (error) {
    console.error('❌ Error en generar-imagen-cloudinary:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar la imagen' },
      { status: 500 }
    )
  }
}
