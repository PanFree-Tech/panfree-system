/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/upload-image/route.js
 * 📌 ENDPOINT: POST /api/admin/marketing/upload-image
 * 📖 DESCRIPCIÓN: Sube una imagen en formato Base64 o Data URL directamente a Cloudinary
 *    y devuelve la URL pública persistente y segura (res.cloudinary.com).
 */

import { NextResponse } from 'next/server'
import { getCloudinaryClient } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

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

    const cloudinary = getCloudinaryClient()

    // Normalizar a Data URI si es Base64 plano
    const dataUri = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`

    // Configurar opciones de subida en Cloudinary
    const uploadOptions = {
      folder: 'marketing',
      resource_type: 'image',
    }

    if (fileName) {
      uploadOptions.public_id = fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
    } else if (productId) {
      uploadOptions.public_id = `product_${productId}_${Date.now()}`
    }

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, uploadOptions)

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    })
  } catch (error) {
    console.error('Error en upload-image route (Cloudinary):', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error inesperado al subir a Cloudinary' },
      { status: 500 }
    )
  }
}

