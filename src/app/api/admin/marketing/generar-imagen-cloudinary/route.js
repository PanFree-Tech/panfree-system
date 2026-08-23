// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient } from '@/lib/cloudinary'
import { comprimirPrompt } from '@/lib/prompt-compressor'

export const dynamic = 'force-dynamic'

/**
 * Estilos temáticos fotográficos gastronómicos para guiar el modelo de Cloudinary AI
 */
const ESTILOS_PROMPT = {
  'estudio-madera': 'rustic wooden bakery table warm golden light herbs',
  'marmol-lujo': 'white marble countertop bright daylight soft shadow elegant bakery',
  'desayuno-calido': 'morning breakfast table coffee cup natural golden sunlight cozy vibe',
  'rustico-artesanal': 'artisan kitchen rustic wood flour dusting warm cozy depth of field',
  'estudio-oscuro': 'dark moody rustic background dramatic warm spotlight gourmet food',
  'evento-promo': 'festive celebration table gourmet party setting warm bokeh lights',
  // Mapeos de compatibilidad con selectores previos
  'nano-banana-2': 'rustic wooden bakery table warm golden lighting gourmet bakery atmosphere',
  'nano-banana-1': 'clean wooden table warm lighting food photography',
  'flux-2-pro': 'hyperrealistic white marble countertop bright studio lighting elegant gourmet setup',
  'recraft-v4': 'artisan kitchen rustic wood flour dusting warm cozy depth of field',
  'gpt-image-2': 'festive celebration table gourmet party setting warm bokeh lights',
  'ideogram-v4-base': 'dark moody rustic background dramatic warm spotlight gourmet food',
}

/**
 * Destila y optimiza el prompt para Cloudinary AI (< 85 caracteres).
 * Limpia stopwords y construye la frase clave que la IA interpreta para el fondo.
 */
function destilarPromptFondo(promptBase, producto, estiloId = 'estudio-madera') {
  const nombreProd = producto?.nombre || ''
  const textoOrigen = (promptBase && promptBase.trim().length > 3) ? promptBase : nombreProd

  // 1. Quitar acentos y caracteres especiales para evitar expansión en URL (%C3%AD, etc.)
  let textoLimpio = textoOrigen
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()

  // 2. Eliminar palabras vacías, preposiciones y meta-instrucciones
  const stopWords = [
    'fotografia', 'gastronomica', 'profesional', 'estilo', 'instagram', 'alta', 'calidad',
    'composicion', 'regla', 'de', 'tercios', 'angulo', 'ligeramente', 'cenital', 'profundidad',
    'campo', 'suave', 'atmosfera', 'acogedora', 'artesanal', 'visual', 'panaderia', 'gourmet',
    'colores', 'calidos', 'vibrantes', 'en', 'un', 'una', 'con', 'para', 'del', 'los', 'las',
    'sobre', 'detalles', 'espolvoreado', 'desenfocado', 'bokeh', 'cocina', 'elegante', 'el', 'la'
  ]

  stopWords.forEach((word) => {
    textoLimpio = textoLimpio.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ')
  })

  // 3. Extraer palabras clave del producto (máximo 2 palabras principales)
  const tokens = textoLimpio.split(/\s+/).filter((w) => w.length > 2)
  const sujetoClave = tokens.slice(0, 2).join(' ') || 'bakery food'

  // 4. Modificador de estilo visual seleccionado
  const modificadorEstilo = ESTILOS_PROMPT[estiloId] || ESTILOS_PROMPT['estudio-madera']

  // 5. Construir prompt conciso
  const promptConstruido = `${sujetoClave} ${modificadorEstilo}`

  // 6. Normalizar a guiones bajos y limitar a 80 caracteres para URL segura
  const promptFinal = promptConstruido
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 80)
    .replace(/_+$/, '')

  return promptFinal || 'rustic_wood_bakery_table_warm_golden_light'
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

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      producto_id,
      descuento = 0,
      evento = '',
      brief_creativo = '',
      custom_image_url = null,
      estilo = 'estudio-madera',
      modelo = null,
    } = body || {}

    if (!producto_id && !custom_image_url) {
      return NextResponse.json(
        { success: false, error: 'Se requiere producto_id o custom_image_url' },
        { status: 400 }
      )
    }

    const estiloSeleccionado = estilo || modelo || 'estudio-madera'

    console.log(`🎨 [${new Date().toISOString()}] Estilo/Ambiente de Fondo: ${estiloSeleccionado}`)

    // 0. Diagnóstico de configuración en logs del servidor
    console.log('🔧 [Cloudinary Config Check]', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ presente' : '❌ AUSENTE',
      api_key: process.env.CLOUDINARY_API_KEY ? '✅ presente' : '❌ AUSENTE',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ presente' : '❌ AUSENTE',
    })

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

    // 2. Determinar la imagen base con prioridad inteligente
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

    console.log('🖼️ Imagen seleccionada:', imageSource, '| Origen:', origenImagen)

    // 3. Subir imagen base a Cloudinary
    const cloudinary = getCloudinaryClient()
    const timestamp = Date.now()
    const cleanId = String(producto.id || 'promo').replace(/-/g, '')
    const publicIdDestino = `product_${cleanId}_${timestamp}`
    const folderDestino = 'marketing'

    async function subirImagenACloudinary(source) {
      let fileParaSubir = source
      const esUrlDeCloudinary = /^https?:\/\/res\.cloudinary\.com\//.test(source)
      const esUrlHttp = /^https?:\/\//.test(source)

      if (esUrlHttp && !esUrlDeCloudinary) {
        console.log('⬇️ Descargando imagen externa desde Supabase/remoto antes de subir...')
        fileParaSubir = await descargarComoDataUri(source)
      } else if (!esUrlHttp) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'd7simx38'
        fileParaSubir = `https://res.cloudinary.com/${cloudName}/image/upload/${source}`
      }

      return await cloudinary.uploader.upload(fileParaSubir, {
        asset_folder: folderDestino,
        public_id: publicIdDestino,
        overwrite: true,
        resource_type: 'image',
        secure: true,
      })
    }

    // 4. Subir la imagen base a Cloudinary con auto-recuperación
    console.log('📤 Subiendo imagen base a Cloudinary...')
    let uploadResult
    try {
      uploadResult = await subirImagenACloudinary(imageSource)
    } catch (primerError) {
      console.warn('⚠️ Falló la primera opción de imagen base:', primerError?.message)
      
      if (producto.imagen_url && producto.imagen_url.startsWith('http') && imageSource !== producto.imagen_url) {
        console.log('🔄 Reintentando automáticamente con imagen_url de Supabase:', producto.imagen_url)
        try {
          uploadResult = await subirImagenACloudinary(producto.imagen_url)
          imageSource = producto.imagen_url
        } catch (segundoError) {
          throw new Error(`Error al subir imagen de Supabase: ${segundoError?.message || segundoError}`)
        }
      } else {
        throw primerError
      }
    }

    const finalPublicId = uploadResult.public_id || publicIdDestino
    console.log('✅ Imagen base guardada en Cloudinary:', finalPublicId, '| folder:', uploadResult.asset_folder)

    // 5. Destilar prompt para Cloudinary
    const promptBase = brief_creativo || `fotografía gastronómica profesional de ${producto.nombre}`
    const promptComprimido = await comprimirPrompt(promptBase, { ratio: 0.6, maxTokens: 60 })
    const promptFondo = destilarPromptFondo(promptComprimido, producto, estiloSeleccionado)

    console.log(`🎨 Prompt fondo para Cloudinary: "${promptFondo}"`)

    const precioOriginalNum = Number(producto.precio_venta) || 28000
    const descuentoNum = Number(descuento) || 0
    const precioPromoNum = Math.round(precioOriginalNum * (1 - descuentoNum / 100))

    // 6. Transformaciones estilizadas de alto impacto visual para Instagram
    const transformations = [
      // Formato Instagram Portrait (1080x1350, relación 4:5)
      { width: 1080, height: 1350, crop: 'fill', gravity: 'auto' },

      // Reemplazo generativo canónico oficial de Cloudinary
      { effect: `gen_background_replace:prompt_${promptFondo}` },

      // Post-procesamiento fotográfico profesional: realce de color, contraste, nitidez y viñeta
      { effect: 'brightness:6' },
      { effect: 'contrast:15' },
      { effect: 'saturation:14' },
      { effect: 'sharpen:80' },
      { effect: 'vignette:20' },
      { quality: 'auto:best', fetch_format: 'auto' },

      // Badge de descuento (superior derecha, llamativo en naranja vibrante)
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

      // Nombre del producto con tipografía moderna Montserrat
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

      // Precio original de lista (tachado si hay descuento)
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

      // Precio promocional destacado en naranja PanFree
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

      // Call to action de cierre
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

    const generatedImageUrl = cloudinary.url(finalPublicId, {
      transformation: transformations,
      secure: true,
    })

    console.log(`✅ URL generada (${generatedImageUrl.length} caracteres): ${generatedImageUrl}`)

    // 7. Guardar registro en Supabase
    const { data: dataInsert } = await supabase
      .from('generaciones_imagen')
      .insert([{
        producto_id: producto.id,
        imagen_original_url: imageSource,
        imagen_generada_url: generatedImageUrl,
        transformaciones: transformations,
        prompt_creativo: promptFondo,
        evento: evento || null,
        descuento_aplicado: descuentoNum,
        precio_original: precioOriginalNum,
        precio_promocional: precioPromoNum,
      }])
      .select()

    return NextResponse.json({
      success: true,
      imagen_url: generatedImageUrl,
      public_id: finalPublicId,
      estilo_utilizado: estiloSeleccionado,
      prompt_fondo: promptFondo,
      url_length: generatedImageUrl.length,
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
      mensaje: `✅ Imagen generada y guardada en marketing/`,
    })
  } catch (error) {
    console.error('❌ Error en generar-imagen-cloudinary:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar la imagen' },
      { status: 500 }
    )
  }
}

