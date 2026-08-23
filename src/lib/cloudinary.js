/**
 * 📁 UBICACIÓN: src/lib/cloudinary.js
 * 📅 ACTUALIZADO: 2026-08-22 - FASE 3: GENERACIÓN DE IMÁGENES CON CLOUDINARY
 * 📌 DESCRIPCIÓN: Utilidades de servidor para integración con Cloudinary.
 *    - Inicialización segura con variables de entorno del servidor (sin NEXT_PUBLIC_)
 *    - Transformaciones Generativas de IA (background_removal, generative_background_replacement, generative_fill)
 *    - Capas de texto (Overlays) con datos REALES de la base de datos de Supabase (Regla de oro: IA nunca genera precios)
 *    - Subida y almacenamiento persistente en Cloudinary Media Library
 */

import { v2 as cloudinary } from 'cloudinary'

// Configuración perezosa / bajo demanda de Cloudinary
let isConfigured = false

export function getCloudinaryClient() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || 'd7simx38').trim().replace(/^["']|["']$/g, '')
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
    console.warn('Error extrayendo public_id de Cloudinary:', e.message)
  }
  return urlOrId
}

/**
 * Genera la URL con transformaciones generativas y capas de datos reales
 * REGLA DE ORO: Los precios y descuentos provienen 100% de la BD.
 */
export function buildMarketingImageTransformationUrl({
  imagePublicIdOrUrl,
  nombreProducto,
  precioVenta,
  descuento = 0,
  evento = '',
  briefCreativo = '',
  ancho = 1080,
  alto = 1350, // Formato 4:5 ideal para Instagram Feed
}) {
  const client = getCloudinaryClient()
  const publicId = extractPublicId(imagePublicIdOrUrl)

  const precioOriginal = Number(precioVenta) || 28000
  const descuentoNum = Number(descuento) || 0
  const precioPromocional = Math.round(precioOriginal * (1 - descuentoNum / 100))
  const precioOriginalFmt = `G/ ${precioOriginal.toLocaleString('es-PY')}`
  const precioPromoFmt = `G/ ${precioPromocional.toLocaleString('es-PY')}`

  // Prompt temático enriquecido para Instagram
  const mejoras = [
    'fotografía gastronómica profesional',
    'estilo Instagram de alta calidad',
    'composición con regla de tercios',
    'iluminación natural cálida tipo golden hour',
    'fondo con texturas rústicas y elementos decorativos',
    'atmósfera acogedora y artesanal',
    'estilo visual de panadería gourmet',
    'colores cálidos y vibrantes',
    'profundidad de campo suave'
  ]
  const promptBase = briefCreativo || `fotografía gastronómica profesional de ${nombreProducto || 'panadería artesanal sin gluten'}`
  const promptFondo = `${promptBase}, ${mejoras.join(', ')}`
    .replace(/[,/\\#%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Transformaciones secuenciales en Cloudinary
  const transformations = [
    // 1. Redimensionar y ajustar lienzo base (4:5 Feed Instagram)
    {
      width: ancho,
      height: alto,
      crop: 'fill',
      gravity: 'auto',
    },
    // 2. Reemplazo de fondo generativo con prompt enriquecido
    {
      effect: `gen_background_replace:prompt_${promptFondo}`,
    },
    // 3. Mejoras de imagen para estilo visual gastronómico de alta calidad
    { effect: 'brightness:10' },
    { effect: 'contrast:15' },
    { effect: 'saturation:10' },
    { effect: 'vignette' },
    {
      quality: 'auto',
      fetch_format: 'auto',
    },
    // 4. CAPA: Badge / Texto de Descuento (% OFF)
    ...(descuentoNum > 0
      ? [
          {
            color: 'rgb:FF6B00',
            overlay: {
              font_family: 'Montserrat',
              font_size: 72,
              font_weight: 'bold',
              text: `${descuentoNum}%25 OFF`,
            },
          },
          {
            flags: 'layer_apply',
            gravity: 'north_east',
            x: 50,
            y: 50,
          },
        ]
      : []),
    // 5. CAPA: Nombre del Producto
    {
      color: 'rgb:FFFFFF',
      overlay: {
        font_family: 'Montserrat',
        font_size: 48,
        font_weight: 'bold',
        text: encodeURIComponent(nombreProducto || 'PanFree Artesanal'),
      },
    },
    {
      flags: 'layer_apply',
      gravity: 'south',
      y: 220,
    },
    // 6. CAPA: Precio Original (tachado si hay descuento)
    ...(descuentoNum > 0
      ? [
          {
            color: 'rgb:D1D5DB',
            overlay: {
              font_family: 'Montserrat',
              font_size: 34,
              text: `G/${precioOriginal.toLocaleString('es-PY')}`,
            },
          },
          {
            flags: 'layer_apply',
            gravity: 'south',
            y: 150,
          },
        ]
      : []),
    // 7. CAPA: Precio Promocional Real
    {
      color: 'rgb:FF6B00',
      overlay: {
        font_family: 'Montserrat',
        font_size: 64,
        font_weight: 'bold',
        text: `G/${precioPromocional.toLocaleString('es-PY')}`,
      },
    },
    {
      flags: 'layer_apply',
      gravity: 'south',
      y: 90,
    },
    // 8. CAPA: Call To Action
    {
      color: 'rgb:F9FAFB',
      overlay: {
        font_family: 'Montserrat',
        font_size: 28,
        font_weight: 'bold',
        text: encodeURIComponent('Pedi en panfree.fit | 100% Sin Gluten'),
      },
    },
    {
      flags: 'layer_apply',
      gravity: 'south',
      y: 25,
    },
  ]

  // Usar siempre type: 'upload' para evitar URLs largas /image/fetch/
  const transformationUrl = client.url(publicId, {
    transformation: transformations,
    type: 'upload',
    secure: true,
  })

  return {
    url: transformationUrl,
    transformations,
    precios: {
      precio_original: precioOriginal,
      precio_original_fmt: precioOriginalFmt,
      precio_promocional: precioPromocional,
      precio_promocional_fmt: precioPromoFmt,
      descuento: Number(descuento),
    },
  }
}

export default cloudinary
