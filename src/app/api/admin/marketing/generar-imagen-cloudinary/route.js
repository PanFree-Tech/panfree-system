// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

/**
 * Acorta y optimiza el prompt para Cloudinary Generative AI
 * evitando URLs excesivamente largas que causen HTTP 400.
 */
function acortarPrompt(prompt, maxLength = 100) {
  if (!prompt || typeof prompt !== 'string') return 'mesa rustica iluminacion calida'

  // Limpiar caracteres conflictivos para URLs de Cloudinary
  let promptCorto = prompt.replace(/[,/\\#%_]/g, ' ')

  // Eliminar adjetivos y términos redundantes comunes
  const palabrasEliminar = [
    'fotografía', 'fotografia', 'gastronómica', 'gastronomica',
    'apetitoso', 'apetitosa', 'profesional', 'artesanal', 'artesanales',
    'acogedor', 'acogedora', 'elegante', 'alta resolución', 'alta resolucion',
    'textura detallada', 'estilo', 'composición de estudio', 'composicion de estudio',
    'espolvoreado con', 'espolvoreada con', 'paño de lino', 'paño de lino rústico',
    'fondo desenfocado', 'bokeh', 'de una cocina de panadería', 'de una cocina', 'en rodajas'
  ]

  palabrasEliminar.forEach(palabra => {
    promptCorto = promptCorto.replace(new RegExp(palabra, 'gi'), '')
  })

  // Limpiar espacios múltiples
  promptCorto = promptCorto.replace(/\s+/g, ' ').trim()

  // Si sigue superando el límite, cortar en el último espacio
  if (promptCorto.length > maxLength) {
    promptCorto = promptCorto.substring(0, maxLength)
    const lastSpace = promptCorto.lastIndexOf(' ')
    if (lastSpace > 20) {
      promptCorto = promptCorto.substring(0, lastSpace)
    }
  }

  return promptCorto.trim() || 'mesa rustica iluminacion calida'
}

/**
 * Descarga una imagen remota (Supabase, Cloudinary, etc.) y la devuelve
 * como Data URI base64. Esto evita que Cloudinary tenga que "fetchear"
 * la URL él mismo (lo cual puede estar bloqueado por la whitelist de
 * dominios de la cuenta y devolver 403).
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
    const { producto_id, descuento = 0, evento = '', brief_creativo = '', custom_image_url = null } = body || {}

    if (!producto_id && !custom_image_url) {
      return NextResponse.json(
        { success: false, error: 'Se requiere producto_id o custom_image_url' },
        { status: 400 }
      )
    }

    // 0. Diagnóstico de configuración — se ve en los logs de Vercel
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
    // Priorizamos URLs HTTP completas reales (Supabase Storage) sobre public_ids no verificados
    let imageSource = null
    let origenImagen = ''

    if (custom_image_url && custom_image_url.trim()) {
      imageSource = custom_image_url.trim()
      origenImagen = 'custom_image_url'
    } else if (producto.imagen_url && producto.imagen_url.startsWith('http')) {
      // Prioridad 1: La URL completa en Supabase Storage
      imageSource = producto.imagen_url.trim()
      origenImagen = 'imagen_url (Supabase Storage)'
    } else if (producto.imagenes_urls && Array.isArray(producto.imagenes_urls)) {
      // Prioridad 2: Buscar en imagenes_urls alguna que sea URL HTTP
      const httpUrlInArray = producto.imagenes_urls.find(u => typeof u === 'string' && u.startsWith('http'))
      if (httpUrlInArray) {
        imageSource = httpUrlInArray.trim()
        origenImagen = 'imagenes_urls (HTTP)'
      }
    }

    // Prioridad 3: Si no hay URL http, usar imagen_public_id o imagenes_urls[0]
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

    // 3. Función auxiliar para preparar y subir una imagen a Cloudinary
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

    // 4. Subir la imagen base a Cloudinary con auto-recuperación si falla
    console.log('📤 Subiendo imagen base a Cloudinary...')
    console.log('📁 asset_folder destino:', folderDestino)
    console.log('🆔 public_id:', publicIdDestino)

    let uploadResult
    try {
      uploadResult = await subirImagenACloudinary(imageSource)
    } catch (primerError) {
      console.warn('⚠️ Falló la primera opción de imagen base:', primerError?.message)
      
      // Si falló y tenemos imagen_url de Supabase disponible como alternativa, intentamos con ella
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

    // 5. Definir transformaciones y generar la URL de entrega (on-the-fly, no hace llamada de red aquí)
    const promptBruto = brief_creativo || `fotografía gastronómica de ${producto.nombre}, mesa rústica, iluminación cálida`
    const promptFondo = acortarPrompt(promptBruto, 100)
    console.log(`🎨 Prompt de fondo optimizado (${promptFondo.length} caracteres): "${promptFondo}"`)

    const transformations = [
      { width: 1080, height: 1350, crop: 'fill', gravity: 'auto' },
      { effect: `gen_background_replace:prompt_${promptFondo}` },
      { quality: 'auto', fetch_format: 'auto' },
      { overlay: { font_family: 'Arial', font_size: 72, font_weight: 'bold', text: `${descuento}%25 OFF` }, color: 'rgb:FF6B00' },
      { flags: 'layer_apply', gravity: 'north_east', x: 50, y: 50 },
      { overlay: { font_family: 'Arial', font_size: 48, font_weight: 'bold', text: encodeURIComponent(producto.nombre) }, color: 'rgb:FFFFFF' },
      { flags: 'layer_apply', gravity: 'south', y: 180 },
      { overlay: { font_family: 'Arial', font_size: 34, text: `G/${Number(producto.precio_venta).toLocaleString('es-PY')}` }, color: 'rgb:D1D5DB' },
      { flags: 'layer_apply', gravity: 'south', y: 130 },
      { overlay: { font_family: 'Arial', font_size: 54, font_weight: 'bold', text: `G/${Math.round(Number(producto.precio_venta) * (1 - Number(descuento) / 100)).toLocaleString('es-PY')}` }, color: 'rgb:FF6B00' },
      { flags: 'layer_apply', gravity: 'south', y: 75 },
      { overlay: { font_family: 'Arial', font_size: 28, font_weight: 'bold', text: encodeURIComponent('Pedi en panfree.fit | 100% Sin Gluten') }, color: 'rgb:F9FAFB' },
      { flags: 'layer_apply', gravity: 'south', y: 25 },
    ]

    const generatedImageUrl = cloudinary.url(finalPublicId, {
      transformation: transformations,
      secure: true,
    })

    console.log('✅ URL con transformaciones generada:', generatedImageUrl)

    // 6. Guardar registro en Supabase
    await supabase.from('generaciones_imagen').insert([{
      producto_id: producto.id,
      imagen_original_url: imageSource,
      imagen_generada_url: generatedImageUrl,
      transformaciones: transformations,
      prompt_creativo: promptFondo,
      evento: evento || null,
      descuento_aplicado: Number(descuento),
      precio_original: Number(producto.precio_venta),
      precio_promocional: Math.round(Number(producto.precio_venta) * (1 - Number(descuento) / 100)),
    }])

    return NextResponse.json({
      success: true,
      imagen_url: generatedImageUrl,
      public_id: finalPublicId,
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
