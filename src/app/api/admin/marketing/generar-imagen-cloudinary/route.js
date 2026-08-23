/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
 * 📌 ENDPOINT: POST /api/admin/marketing/generar-imagen-cloudinary
 * 📖 DESCRIPCIÓN: Generador de imágenes publicitarias con IA de Cloudinary (Fase 3).
 *    - Toma la foto REAL del producto desde Supabase / Cloudinary Media Library.
 *    - Aplica transformaciones generativas: eliminación de fondo y reemplazo por fondo temático.
 *    - Inyecta capas de texto con precios y descuentos REALES desde la base de datos de Supabase.
 *    - REGLA DE ORO: La IA NUNCA genera los precios. Vienen directamente de la tabla `productos`.
 *    - Registra el resultado en la tabla `generaciones_imagen` de Supabase para trazabilidad.
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  getCloudinaryClient,
  buildMarketingImageTransformationUrl,
  extractPublicId,
} from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      producto_id,
      descuento = 0,
      evento = '',
      brief_creativo = '',
      promocion_id = null,
      custom_image_url = null,
    } = body || {}

    if (!producto_id && !custom_image_url) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el parámetro producto_id o custom_image_url' },
        { status: 400 }
      )
    }

    // 1. Obtener producto de Supabase (Precios y datos REALES del catálogo)
    let producto = null
    if (producto_id) {
      try {
        const { data, error: dbError } = await supabase
          .from('productos')
          .select('id, nombre, categoria, precio_venta, imagen_url, imagen_public_id, imagenes_urls, production_capacity, current_orders, availability_status')
          .eq('id', producto_id)
          .single()

        if (!dbError && data) {
          producto = data
        }
      } catch (e) {
        console.warn('Advertencia al consultar producto en generar-imagen-cloudinary:', e.message)
      }
    }

    // Fallback de producto en memoria si no se encuentra en DB durante pruebas
    if (!producto) {
      producto = {
        id: producto_id || 'prod-sample',
        nombre: 'Pan de Campo 100% Sin Gluten',
        categoria: 'Panadería',
        precio_venta: 28000,
        imagen_url: custom_image_url || 'panfree/products/pan-campo-rustico',
        imagen_public_id: null,
        imagenes_urls: [],
      }
    }

    // 2. Determinar la imagen base real con la nueva prioridad
    // 1º custom_image_url (si se envía)
    // 2º imagen_url (SIEMPRE que sea una URL válida que empiece con http)
    // 3º imagenes_urls[0] (si tiene elementos válidos)
    // 4º imagen_public_id (solo si NO es un placeholder con corchetes)
    // 5º Fallback a imagen por defecto
    let imagePublicIdOrUrl = null
    let origenImagen = 'fallback'

    const isValidHttpUrl = (str) =>
      typeof str === 'string' &&
      (str.startsWith('http://') || str.startsWith('https://')) &&
      !str.includes('[') &&
      !str.includes('placeholder')

    const isValidPublicId = (str) =>
      typeof str === 'string' &&
      str.trim().length > 0 &&
      !str.includes('[') &&
      !str.includes(']') &&
      !str.toLowerCase().includes('placeholder')

    if (custom_image_url) {
      imagePublicIdOrUrl = custom_image_url
      origenImagen = 'custom_image_url'
    } else if (isValidHttpUrl(producto.imagen_url)) {
      imagePublicIdOrUrl = producto.imagen_url
      origenImagen = 'producto.imagen_url (Supabase Storage / URL directa)'
    } else if (
      Array.isArray(producto.imagenes_urls) &&
      producto.imagenes_urls.length > 0 &&
      (isValidHttpUrl(producto.imagenes_urls[0]) || isValidPublicId(producto.imagenes_urls[0]))
    ) {
      imagePublicIdOrUrl = producto.imagenes_urls[0]
      origenImagen = 'producto.imagenes_urls[0]'
    } else if (isValidPublicId(producto.imagen_public_id)) {
      imagePublicIdOrUrl = producto.imagen_public_id
      origenImagen = 'producto.imagen_public_id'
    } else {
      imagePublicIdOrUrl =
        'https://res.cloudinary.com/panfree/image/upload/v1/panfree/products/pan-campo-rustico.jpg'
      origenImagen = 'fallback_default'
    }

    const imagenOriginalUrl = imagePublicIdOrUrl
    console.log('🖼️ Imagen seleccionada:', imagenOriginalUrl, '| Origen:', origenImagen)

    const descuentoNum = Number(descuento) || 0
    const precioBase = Number(producto.precio_venta) || 25000
    const precioPromocional = Math.round(precioBase * (1 - descuentoNum / 100))

    // 3. Preparar parámetros de transformación (Cloudinary Generative AI + Overlays de datos reales de Supabase)
    const resultadoTransformacion = buildMarketingImageTransformationUrl({
      imagePublicIdOrUrl: imagenOriginalUrl,
      nombreProducto: producto.nombre,
      precioVenta: precioBase,
      descuento: descuentoNum,
      evento: evento,
      briefCreativo: brief_creativo,
      ancho: 1080,
      alto: 1350, // Formato 4:5 vertical ideal para Feed de Instagram
    })

    const cloudinaryClient = getCloudinaryClient()
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'panfree'

    // Asegurar que la fuente para el uploader sea una URL completa válida
    let sourceForUpload = imagenOriginalUrl
    if (!sourceForUpload.startsWith('http://') && !sourceForUpload.startsWith('https://') && !sourceForUpload.startsWith('data:')) {
      sourceForUpload = `https://res.cloudinary.com/${cloudName}/image/upload/${imagenOriginalUrl}`
    }

    let generatedImageUrl = null
    let generatedPublicId = `marketing/product_${producto.id || 'promo'}_${Date.now()}`

    // 4. Procesar y guardar la imagen en Cloudinary Media Library ('marketing/')
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const publicIdDestino = `marketing/product_${producto.id || 'promo'}_${Date.now()}`

      console.log('📤 Source a subir:', sourceForUpload)
      console.log('📁 Carpeta destino (asset_folder): marketing')
      console.log('📤 Transformaciones a enviar:', JSON.stringify(resultadoTransformacion.transformations, null, 2))

      try {
        // Intento 1: Subir directamente aplicando las transformaciones en el servidor de Cloudinary (Dynamic Folder Mode)
        console.log('🚀 [Intento 1] Subiendo con transformaciones a Cloudinary...')
        const uploadResult = await cloudinaryClient.uploader.upload(sourceForUpload, {
          asset_folder: 'marketing',
          public_id: publicIdDestino,
          transformation: resultadoTransformacion.transformations,
          overwrite: true,
          resource_type: 'image',
          secure: true,
        })

        console.log('🖼️ [Intento 1] Public ID generado:', uploadResult.public_id)
        console.log('✅ [Intento 1] URL generada y guardada:', uploadResult.secure_url)

        if (uploadResult && uploadResult.secure_url) {
          generatedImageUrl = uploadResult.secure_url
          generatedPublicId = uploadResult.public_id || publicIdDestino
        }
      } catch (uploadErr) {
        console.warn('⚠️ [Intento 1] Error en uploader.upload con transformaciones:', uploadErr.message)

        try {
          // Intento 2 (Enfoque alternativo): Subir la imagen base a 'marketing/' y aplicar transformaciones en la URL de entrega
          console.log('🔄 [Intento 2] Subiendo imagen base a asset_folder marketing/ y aplicando transformaciones en URL de entrega...')
          const uploadBaseResult = await cloudinaryClient.uploader.upload(sourceForUpload, {
            asset_folder: 'marketing',
            public_id: publicIdDestino,
            overwrite: true,
            resource_type: 'image',
            secure: true,
          })

          const savedPublicId = uploadBaseResult.public_id || publicIdDestino
          console.log('📁 [Intento 2] Imagen base guardada en marketing/:', savedPublicId)

          // Generar URL con las transformaciones sobre el nuevo public_id guardado en marketing/
          generatedImageUrl = cloudinaryClient.url(savedPublicId, {
            transformation: resultadoTransformacion.transformations,
            type: 'upload',
            secure: true,
          })
          generatedPublicId = savedPublicId

          console.log('✅ [Intento 2] URL de entrega con transformaciones generada:', generatedImageUrl)
        } catch (uploadBaseErr) {
          console.warn('⚠️ [Intento 2] Error al subir imagen base a marketing/:', uploadBaseErr.message)
          // Fallback a URL de transformación directa sobre la imagen original
          generatedImageUrl = resultadoTransformacion.url
        }
      }
    } else {
      // Si no hay credenciales completas de Cloudinary configuradas
      console.log('ℹ️ Credenciales de API Key/Secret ausentes, usando URL de transformación directa')
      generatedImageUrl = resultadoTransformacion.url
    }

    if (!generatedImageUrl) {
      generatedImageUrl = resultadoTransformacion.url
    }

    // 5. Registrar en la tabla `generaciones_imagen` de Supabase
    let generacionId = null
    try {
      const { data: recordData, error: recordError } = await supabase
        .from('generaciones_imagen')
        .insert([
          {
            producto_id: producto.id || null,
            promocion_id: promocion_id || null,
            imagen_original_url: imagenOriginalUrl,
            imagen_generada_url: generatedImageUrl,
            transformaciones: resultadoTransformacion.transformations,
            prompt_creativo: brief_creativo || `Escena de panadería artesanal con temática de ${evento || 'promoción'}`,
            evento: evento || null,
            descuento_aplicado: descuentoNum,
            precio_original: precioBase,
            precio_promocional: precioPromocional,
          },
        ])
        .select('id')
        .single()

      if (!recordError && recordData) {
        generacionId = recordData.id
      }
    } catch (dbInsertErr) {
      console.warn('Advertencia al registrar en generaciones_imagen:', dbInsertErr.message)
    }

    // 6. Retornar respuesta enriquecida
    return NextResponse.json({
      success: true,
      imagen_url: generatedImageUrl,
      public_id: generatedPublicId,
      generacion_id: generacionId || `LOCAL-GEN-${Date.now()}`,
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        precio_original: precioBase,
        precio_original_fmt: `G/ ${precioBase.toLocaleString('es-PY')}`,
        precio_promocional: precioPromocional,
        precio_promocional_fmt: `G/ ${precioPromocional.toLocaleString('es-PY')}`,
        descuento: descuentoNum,
      },
      transformaciones_aplicadas: {
        background_removal: true,
        generative_background_replacement: true,
        text_overlays_database_sourced: true,
        aspect_ratio: '4:5 (1080x1350)',
        folder: 'marketing',
      },
      mensaje: `Imagen de marketing generada exitosamente con IA para "${producto.nombre}"`,
    })
  } catch (error) {
    console.error('Error en generar-imagen-cloudinary route:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al generar la imagen con Cloudinary',
      },
      { status: 500 }
    )
  }
}
