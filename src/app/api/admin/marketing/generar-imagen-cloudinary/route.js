// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

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

    // 2. Determinar la imagen base
    let imageSource = custom_image_url
    let origenImagen = 'custom_image_url'

    if (!imageSource) {
      if (producto.imagenes_urls && producto.imagenes_urls.length > 0 && producto.imagenes_urls[0]) {
        imageSource = producto.imagenes_urls[0]
        origenImagen = 'imagenes_urls[0]'
      } else if (producto.imagen_public_id && !producto.imagen_public_id.includes('[')) {
        imageSource = producto.imagen_public_id
        origenImagen = 'imagen_public_id'
      } else if (producto.imagen_url && producto.imagen_url.startsWith('http')) {
        imageSource = producto.imagen_url
        origenImagen = 'imagen_url (fallback)'
      } else {
        imageSource = 'https://res.cloudinary.com/d7simx38/image/upload/v1786629847/productos/gmwx5mwuj0ockucprlwr.jpg'
        origenImagen = 'fallback_default'
      }
    }

    console.log('🖼️ Imagen seleccionada:', imageSource, '| Origen:', origenImagen)

    // 3. Preparar el "file" que le pasaremos a Cloudinary.
    //    - Si es una URL http(s) que ya vive en Cloudinary, se la pasamos tal cual
    //      (Cloudinary siempre puede leer sus propias URLs).
    //    - Si es una URL externa (ej. Supabase Storage) o un public_id plano,
    //      la descargamos nosotros primero para evitar el bloqueo de "remote fetch".
    let fileParaSubir = imageSource

    const esUrlDeCloudinary = /^https?:\/\/res\.cloudinary\.com\//.test(imageSource)
    const esUrlHttp = /^https?:\/\//.test(imageSource)

    if (esUrlHttp && !esUrlDeCloudinary) {
      console.log('⬇️ Descargando imagen externa antes de subir (evita restricción de fetch remoto)...')
      fileParaSubir = await descargarComoDataUri(imageSource)
    } else if (!esUrlHttp) {
      // Es un public_id "pelado" (sin http) — construir URL completa de Cloudinary
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      fileParaSubir = `https://res.cloudinary.com/${cloudName}/image/upload/${imageSource}`
    }

    // 4. Obtener cliente de Cloudinary y subir la imagen base
    const cloudinary = getCloudinaryClient()

    const timestamp = Date.now()
    const cleanId = String(producto.id || 'promo').replace(/-/g, '')
    const publicIdDestino = `product_${cleanId}_${timestamp}` // sin prefijo "marketing/" y sin guiones
    const folderDestino = 'marketing'

    console.log('📤 Subiendo imagen base a Cloudinary...')
    console.log('📁 asset_folder destino:', folderDestino)
    console.log('🆔 public_id:', publicIdDestino)

    let uploadResult
    try {
      uploadResult = await cloudinary.uploader.upload(fileParaSubir, {
        asset_folder: folderDestino,
        public_id: publicIdDestino,
        overwrite: true,
        resource_type: 'image',
        secure: true,
      })
    } catch (uploadErr) {
      // Log detallado — Cloudinary suele meter el código real en http_code
      console.error('❌ Error de Cloudinary al subir:', {
        message: uploadErr?.message,
        http_code: uploadErr?.http_code,
        error: uploadErr?.error,
      })
      throw new Error(
        `Cloudinary rechazó la subida (${uploadErr?.http_code || 'sin código'}): ${uploadErr?.message || 'error desconocido'}. ` +
        `Revisá que el dominio de origen esté permitido y que las credenciales correspondan al cloud_name configurado.`
      )
    }

    const finalPublicId = uploadResult.public_id || publicIdDestino
    console.log('✅ Imagen base guardada en Cloudinary:', finalPublicId, '| folder:', uploadResult.asset_folder)

    // 5. Definir transformaciones y generar la URL de entrega (on-the-fly, no hace llamada de red aquí)
    const promptFondo = brief_creativo || `fotografía gastronómica de ${producto.nombre}, mesa rústica, iluminación cálida`

    const transformations = [
      { width: 1080, height: 1350, crop: 'fill', gravity: 'auto' },
      { effect: 'background_removal' },
      { effect: 'gen_background_replace', gen_background_replace: { prompt: promptFondo } },
      { quality: 'auto', fetch_format: 'auto' },
      { overlay: { font_family: 'Arial', font_size: 72, font_weight: 'bold', text: `${descuento}% OFF` }, color: '#FF6B00' },
      { flags: 'layer_apply', gravity: 'north_east', x: 50, y: 50 },
      { overlay: { font_family: 'Arial', font_size: 48, font_weight: 'bold', text: producto.nombre }, color: '#FFFFFF' },
      { flags: 'layer_apply', gravity: 'south', y: 180 },
      { overlay: { font_family: 'Arial', font_size: 34, text: `G/${Number(producto.precio_venta).toLocaleString('es-PY')}` }, color: '#D1D5DB' },
      { flags: 'layer_apply', gravity: 'south', y: 130 },
      { overlay: { font_family: 'Arial', font_size: 54, font_weight: 'bold', text: `G/${Math.round(Number(producto.precio_venta) * (1 - Number(descuento) / 100)).toLocaleString('es-PY')}` }, color: '#FF6B00' },
      { flags: 'layer_apply', gravity: 'south', y: 75 },
      { overlay: { font_family: 'Arial', font_size: 28, font_weight: 'bold', text: 'Pedi en panfree.fit | 100% Sin Gluten' }, color: '#F9FAFB' },
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
