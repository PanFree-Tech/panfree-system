/**
 * 📁 UBICACIÓN: src/lib/image-utils.js
 * 📌 DESCRIPCIÓN: Utilidades centrales para validación, resolución y sanitización
 *    de URLs de imágenes de productos y recursos estáticos.
 *    Usa directamente las URLs de Cloudinary / base de datos sin mapeos fijos ni bloqueos erróneos.
 *    ✅ AGREGADO: placeholder automático para productos sin imagen.
 */

/**
 * Verifica si una URL es vacía, nula o un string inválido
 */
export function isInvalidImageUrl(url) {
  if (!url || typeof url !== 'string') return true
  const clean = url.trim()
  if (!clean || clean.length < 5 || clean === 'null' || clean === 'undefined') {
    return true
  }
  return false
}

/**
 * Resuelve la URL de imagen válida para un producto o string de URL
 * Usa directamente la columna imagen_url (o imagenes_urls) de la base de datos
 * Si no hay imagen, devuelve el placeholder por defecto
 */
export function resolveProductImageUrl(productoOrUrl) {
  // Placeholder por defecto
  const PLACEHOLDER = '/images/placeholder-product.png'

  if (!productoOrUrl) return PLACEHOLDER

  // Si se pasa directamente una URL en string
  if (typeof productoOrUrl === 'string') {
    const clean = productoOrUrl.trim()
    if (!isInvalidImageUrl(clean)) {
      return clean
    }
    return PLACEHOLDER
  }

  const producto = productoOrUrl

  // 1. Revisar imagen_url principal
  if (producto.imagen_url && typeof producto.imagen_url === 'string') {
    const clean = producto.imagen_url.trim()
    if (!isInvalidImageUrl(clean)) {
      return clean
    }
  }

  // 2. Revisar array imagenes_urls
  if (Array.isArray(producto.imagenes_urls) && producto.imagenes_urls.length > 0) {
    for (const u of producto.imagenes_urls) {
      if (u && typeof u === 'string') {
        const clean = u.trim()
        if (!isInvalidImageUrl(clean)) {
          return clean
        }
      }
    }
  }

  // 3. Si no hay imagen válida, devolver placeholder
  return PLACEHOLDER
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
        .filter(u => typeof u === 'string' && !isInvalidImageUrl(u))
        .map(u => u.trim())
    : []

  return {
    ...producto,
    imagen_url: validImageUrl,
    imagenes_urls: validImageUrl
      ? [validImageUrl, ...imagenesUrlsValidas.filter(u => u !== validImageUrl)]
      : imagenesUrlsValidas,
    is_featured: esDestacado,
    destacado: esDestacado,
  }
}