/**
 * 📁 UBICACIÓN: src/lib/image-utils.js
 * 📌 DESCRIPCIÓN: Utilidades centrales para validación, resolución y sanitización
 *    de URLs de imágenes de productos y recursos estáticos.
 *    Previene errores 404 de upstream image optimization de Next.js por URLs inválidas o placeholders.
 */

// Mapeo conocido de imágenes reales verificadas en Supabase Storage
export const KNOWN_PRODUCT_STORAGE_IMAGES = {
  'masa-chipa-cruda-500g': 'https://gbdrcaumghykiipqgbty.supabase.co/storage/v1/object/public/productos/productos/1773103970210-ze02jdnrxho.jpg',
  'budin-naranja': 'https://gbdrcaumghykiipqgbty.supabase.co/storage/v1/object/public/productos/productos/1772917706729-bfkqsqwioyq.jpg',
}

/**
 * Verifica si una URL es un placeholder inválido o contiene patrones malformados
 */
export function isInvalidImageUrl(url) {
  if (!url || typeof url !== 'string') return true
  const clean = url.trim()
  if (!clean || clean.length < 5) return true

  // Detectar caracteres de corchete o codificados que indican placeholders
  if (
    clean.includes('[') ||
    clean.includes(']') ||
    clean.includes('%5B') ||
    clean.includes('%5b') ||
    clean.includes('%5D') ||
    clean.includes('%5d')
  ) {
    return true
  }

  // Detectar textos placeholder específicos
  if (
    clean.includes('nombre_real') ||
    clean.includes('public_id_real') ||
    clean.includes('undefined') ||
    clean.includes('null')
  ) {
    return true
  }

  // Detectar URL de Cloudinary con ID no existente que fue movido a Supabase
  if (clean.includes('res.cloudinary.com') && clean.includes('ze02jdnrxho')) {
    return true
  }

  return false
}

/**
 * Resuelve la URL de imagen válida para un producto o string de URL
 */
export function resolveProductImageUrl(productoOrUrl) {
  if (!productoOrUrl) return null

  // Si se pasa directamente una URL en string
  if (typeof productoOrUrl === 'string') {
    if (productoOrUrl.includes('ze02jdnrxho')) {
      return KNOWN_PRODUCT_STORAGE_IMAGES['masa-chipa-cruda-500g']
    }
    return isInvalidImageUrl(productoOrUrl) ? null : productoOrUrl
  }

  const producto = productoOrUrl

  // 1. Revisar si tiene mapeo directo por slug
  if (producto.slug && KNOWN_PRODUCT_STORAGE_IMAGES[producto.slug]) {
    return KNOWN_PRODUCT_STORAGE_IMAGES[producto.slug]
  }

  // 2. Revisar imagen_url principal
  if (producto.imagen_url && typeof producto.imagen_url === 'string') {
    if (producto.imagen_url.includes('ze02jdnrxho')) {
      return KNOWN_PRODUCT_STORAGE_IMAGES['masa-chipa-cruda-500g']
    }
    if (!isInvalidImageUrl(producto.imagen_url)) {
      return producto.imagen_url
    }
  }

  // 3. Revisar array imagenes_urls
  if (Array.isArray(producto.imagenes_urls)) {
    for (const u of producto.imagenes_urls) {
      if (u && typeof u === 'string') {
        if (u.includes('ze02jdnrxho')) {
          return KNOWN_PRODUCT_STORAGE_IMAGES['masa-chipa-cruda-500g']
        }
        if (u.includes('1772917706729-bfkqsqwioyq.jpg')) {
          return KNOWN_PRODUCT_STORAGE_IMAGES['budin-naranja']
        }
        if (!isInvalidImageUrl(u) && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))) {
          return u
        }
      }
    }
  }

  return null
}

/**
 * Normaliza un producto asegurando que sus campos de imagen sean válidos
 */
export function normalizeProduct(producto) {
  if (!producto) return null
  const validImageUrl = resolveProductImageUrl(producto)
  const esDestacado = Boolean(
    producto.is_featured === true ||
    producto.is_featured === 'true' ||
    producto.destacado === true ||
    producto.destacado === 'true'
  )

  const imagenesUrlsValidas = Array.isArray(producto.imagenes_urls)
    ? producto.imagenes_urls
        .map(u => (typeof u === 'string' && u.includes('ze02jdnrxho') ? KNOWN_PRODUCT_STORAGE_IMAGES['masa-chipa-cruda-500g'] : u))
        .filter(u => u && !isInvalidImageUrl(u))
    : []

  return {
    ...producto,
    imagen_url: validImageUrl,
    imagenes_urls: validImageUrl ? [validImageUrl, ...imagenesUrlsValidas.filter(u => u !== validImageUrl)] : imagenesUrlsValidas,
    is_featured: esDestacado,
    destacado: esDestacado,
  }
}
