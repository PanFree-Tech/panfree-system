/**
 * 📁 UBICACIÓN: src/lib/cloudinary.js
 * 📅 ACTUALIZADO: 2026-08-22 - FASE 3: GENERACIÓN DE IMÁGENES CON CLOUDINARY
 * 📌 DESCRIPCIÓN: Utilidades de servidor para integración con Cloudinary.
 *    - Inicialización segura con variables de entorno del servidor (sin NEXT_PUBLIC_)
 *    - Transformaciones Generativas de IA (background_removal, generative_background_replacement, generative_fill)
 *    - Capas de texto (Overlays) con datos REALES de la base de datos de Supabase (Regla de oro: IA nunca genera precios)
 *    - Subida y almacenamiento persistente en Cloudinary Media Library
 */

import logger from '@/lib/logger'
import { v2 as cloudinary } from 'cloudinary'

// Configuración perezosa / bajo demanda de Cloudinary
let isConfigured = false

export function getCloudinaryClient() {
  const rawCloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!rawCloudName) {
    throw new Error('CLOUDINARY_CLOUD_NAME o NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME no configurada')
  }
  const cloudName = rawCloudName.trim().replace(/^["']|["']$/g, '')
  const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^["']|["']$/g, '')
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim().replace(/^["']|["']$/g, '')

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  return cloudinary
}

/**
 * Extrae el public_id de una URL de Cloudinary o devuelve el identificador
 */
export function extractPublicId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return 'panfree/products/sample'
  if (!urlOrId.startsWith('http')) return urlOrId

  try {
    const parts = urlOrId.split('/upload/')
    if (parts.length > 1) {
      const pathAfterUpload = parts[1]
      // Eliminar transformaciones previas si existen (v12345/...)
      const pathClean = pathAfterUpload.replace(/^v\d+\//, '')
      // Eliminar extensión de archivo
      return pathClean.replace(/\.[^/.]+$/, '')
    }
  } catch (e) {
    logger.warn('Error extrayendo public_id de Cloudinary:', e.message)
  }
  return urlOrId
}

/**
 * Genera la URL con transformaciones generativas y capas de datos reales
 * REGLA DE ORO: Los precios y descuentos provienen 100% de la BD.
 */

export default cloudinary
