// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

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
        imagenes_urls: []
      }
    }

    // 2. Determinar la imagen base
    let imageSource = custom_image_url

    if (!imageSource) {
      // Prioridad: imagenes_urls[0] → imagen_public_id → imagen_url
      if (producto.imagenes_urls && producto.imagenes_urls.length > 0 && producto.imagenes_urls[0]) {
        imageSource = producto.imagenes_urls[0]
        console.log('📸 Usando imagen desde imagenes_urls[0]:', imageSource)
      } else if (producto.imagen_public_id && !producto.imagen_public_id.includes('[')) {
        imageSource = producto.imagen_public_id
        console.log('📸 Usando imagen desde imagen_public_id:', imageSource)
      } else if (producto.imagen_url && producto.imagen_url.startsWith('http')) {
        imageSource = producto.imagen_url
        console.log('📸 Usando imagen desde imagen_url (fallback):', imageSource)
      } else {
        imageSource = 'https://res.cloudinary.com/d7simx38/image/upload/v1786629847/productos/gmwx5mwuj0ockucprlwr.jpg'
        console.log('📸 Usando imagen por defecto:', imageSource)
      }
    }

    // 3. Obtener cliente de Cloudinary
    const cloudinary = getCloudinaryClient()

    // 4. Subir la imagen base a Cloudinary (sin transformaciones síncronas para evitar errores de IA)
    const timestamp = Date.now()
    const publicIdDestino = `product_${producto.id}_${timestamp}`
    const folderDestino = 'marketing'

    console.log('📤 Subiendo imagen base a Cloudinary...')
    console.log('📁 Asset folder destino:', folderDestino)
    console.log('🖼️ Public ID:', publicIdDestino)

    const uploadResult = await cloudinary.uploader.upload(imageSource, {
      asset_folder: folderDestino,
      public_id: publicIdDestino,
      overwrite: true,
      resource_type: 'image',
      secure: true
    })

    const finalPublicId = uploadResult.public_id || publicIdDestino
    console.log('✅ Imagen base guardada en Cloudinary:', finalPublicId)

    // 5. Definir transformaciones y generar la URL de entrega (on-the-fly)
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
      { flags: 'layer_apply', gravity: 'south', y: 25 }
    ]

    const generatedImageUrl = cloudinary.url(finalPublicId, {
      transformation: transformations,
      secure: true
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
      precio_promocional: Math.round(Number(producto.precio_venta) * (1 - Number(descuento) / 100))
    }])

    return NextResponse.json({
      success: true,
      imagen_url: generatedImageUrl,
      public_id: finalPublicId,
      mensaje: `✅ Imagen generada y guardada en marketing/`
    })

  } catch (error) {
    console.error('❌ Error en generar-imagen-cloudinary:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar la imagen' },
      { status: 500 }
    )
  }
}
