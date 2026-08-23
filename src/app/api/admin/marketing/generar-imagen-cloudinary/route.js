// src/app/api/admin/marketing/generar-imagen-cloudinary/route.js
import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '@/lib/supabase'
import { getCloudinaryClient } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

/**
 * Genera la imagen COMPLETA con Gemini (text-to-image)
 * Esto reemplaza todo el flujo anterior de Cloudinary.
 */
async function generarImagenConGemini({
  apiKey,
  prompt,
  model = 'gemini-3.1-flash-image',
  aspectRatio = '3:4',
}) {
  if (!apiKey) {
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

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    })

    const imageData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (imageData) {
      return {
        success: true,
        base64Data: imageData,
        mimeType: 'image/png',
        modelUsed: model,
      }
    } else {
      return { success: false, error: 'No se generó imagen' }
    }
  } catch (err) {
    console.error('❌ [Gemini Image] Error:', err)
    return { success: false, error: err.message }
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
    } = body || {}

    if (!producto_id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere producto_id' },
        { status: 400 }
      )
    }

    const geminiApiKey = process.env.GEMINI_API_KEY

    // Obtener producto de Supabase
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
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Construir el prompt para la imagen completa
    const nombreProducto = producto.nombre
    const precioOriginal = Number(producto.precio_venta) || 28000
    const descuentoNum = Number(descuento) || 0
    const precioPromo = Math.round(precioOriginal * (1 - descuentoNum / 100))

    // Prompt profesional para generar la imagen completa
    const promptBase = brief_creativo || 
      `fotografía publicitaria profesional de ${nombreProducto}, panadería sin gluten de alta calidad, estilo Instagram, iluminación de estudio, composición atractiva, fondo elegante y acogedor, 8k, fotorealista, sin texto, sin logotipos, sin marcas de agua`

    // Incluir referencia visual si existe una URL de producto
    let imageReferencePart = ''
    if (producto.imagen_url && producto.imagen_url.startsWith('http')) {
      imageReferencePart = ` Referencia visual del producto: ${producto.imagen_url}`
    }

    const promptFinal = `${promptBase}.${imageReferencePart}`

    console.log('🤖 [Gemini] Generando imagen publicitaria con modelo:', modelo)
    console.log('   Prompt:', promptFinal)

    // Generar la imagen con Gemini
    const geminiResult = await generarImagenConGemini({
      apiKey: geminiApiKey,
      prompt: promptFinal,
      model: modelo,
      aspectRatio: '3:4',
    })

    if (!geminiResult.success) {
      return NextResponse.json(
        { success: false, error: geminiResult.error || 'Error al generar imagen' },
        { status: 500 }
      )
    }

    // Subir la imagen generada a Cloudinary
    const cloudinary = getCloudinaryClient()
    const timestamp = Date.now()
    const cleanId = String(producto.id).replace(/-/g, '')
    const publicIdDestino = `marketing/art_${cleanId}_${timestamp}`

    const dataUri = `data:${geminiResult.mimeType};base64,${geminiResult.base64Data}`
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      public_id: publicIdDestino,
      overwrite: true,
      resource_type: 'image',
      secure: true,
    })

    const generatedImageUrl = uploadResult.secure_url

    // Guardar en Supabase
    await supabase.from('generaciones_imagen').insert([{
      producto_id: producto.id,
      imagen_original_url: producto.imagen_url || null,
      imagen_generada_url: generatedImageUrl,
      transformaciones: [],
      prompt_creativo: promptFinal,
      evento: evento || null,
      descuento_aplicado: descuentoNum,
      precio_original: precioOriginal,
      precio_promocional: precioPromo,
    }])

    return NextResponse.json({
      success: true,
      imagen_url: generatedImageUrl,
      modelo_utilizado: geminiResult.modelUsed || modelo,
      prompt_utilizado: promptFinal,
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        precio_original: precioOriginal,
        precio_original_fmt: `G/ ${precioOriginal.toLocaleString('es-PY')}`,
        precio_promocional: precioPromo,
        precio_promocional_fmt: `G/ ${precioPromo.toLocaleString('es-PY')}`,
        descuento: descuentoNum,
      },
      mensaje: `✅ Imagen publicitaria generada con Gemini (${modelo}) y guardada en Cloudinary.`,
    })

  } catch (error) {
    console.error('❌ Error en generar-imagen-cloudinary:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar la imagen' },
      { status: 500 }
    )
  }
}
