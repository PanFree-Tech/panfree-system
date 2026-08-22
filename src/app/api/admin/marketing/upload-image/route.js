/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/upload-image/route.js
 * 📌 ENDPOINT: POST /api/admin/marketing/upload-image
 * 📖 DESCRIPCIÓN: Sube una imagen en formato Base64 a Supabase Storage (bucket 'public-images')
 *    y devuelve la URL pública persistente para ser utilizada en publicaciones de Instagram y archivo histórico.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeSupabaseUrl, DEFAULT_SUPABASE_ANON_KEY } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
// Preferir service role key para operaciones administrativas en Storage, con fallback seguro a anon key
const supabaseKey =
  (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim()) ||
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) ||
  DEFAULT_SUPABASE_ANON_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export async function POST(req) {
  try {
    const body = await req.json()
    const { image, productId = 'promo', fileName } = body || {}

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Se requiere el parámetro image en formato Base64 o Data URL' },
        { status: 400 }
      )
    }

    // 1. Detectar tipo MIME (image/png, image/jpeg, image/webp) si viene como Data URL
    let mimeType = 'image/jpeg'
    const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/)
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1]
    }

    // Determinar extensión del archivo
    let ext = 'jpg'
    if (mimeType.includes('png')) ext = 'png'
    else if (mimeType.includes('webp')) ext = 'webp'

    // 2. Limpiar Base64 y convertir a Buffer binario
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // 3. Generar nombre de archivo único y seguro
    const sanitizedFileName = fileName
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `product_${productId}_${Date.now()}.${ext}`

    const filePath = `marketing/${sanitizedFileName}`

    // 4. Subir a Supabase Storage bucket 'public-images'
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('public-images')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error al subir a Supabase Storage:', uploadError)
      return NextResponse.json(
        {
          success: false,
          error: `Error al subir imagen a Supabase Storage: ${uploadError.message}`,
        },
        { status: 500 }
      )
    }

    // 5. Obtener URL pública persistente
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('public-images')
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData?.publicUrl

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      bucket: 'public-images',
      size: buffer.length,
      mimeType: mimeType,
    })
  } catch (error) {
    console.error('Error en upload-image route:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error inesperado al procesar la imagen' },
      { status: 500 }
    )
  }
}
