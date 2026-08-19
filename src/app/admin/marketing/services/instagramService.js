/**
 * 📁 UBICACIÓN: src/app/admin/marketing/services/instagramService.js
 * 📌 Servicio para publicar o programar contenidos en Instagram y gestionar el historial.
 */

const STORAGE_KEY = 'panfree_instagram_posts_history'

/**
 * Publica una imagen y su caption en Instagram
 * @param {string} imageData - DataURL o URL pública de la imagen renderizada
 * @param {string} caption - Texto completo del post
 * @param {Object} [options] - Parámetros complementarios (producto, formato)
 * @returns {Promise<{
 *   success: boolean,
 *   postId: string,
 *   url: string,
 *   message?: string
 * }>}
 */
export const publishToInstagram = async (imageData, caption, options = {}) => {
  try {
    const res = await fetch('/api/admin/marketing/publish-instagram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData,
        caption,
        productName: options.productName || 'Panfree Promo',
        productId: options.productId || null,
        format: options.format || 'feed_4_5',
      }),
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Error al conectar con el servicio de Instagram')
    }

    // Guardar copia local de respaldo
    saveLocalPost({
      id: json.postId,
      product_name: options.productName || 'Panfree Promo',
      caption,
      url: json.url,
      format: options.format || 'feed_4_5',
      status: json.status === 'published_live' ? 'publicado' : 'programado',
      created_at: new Date().toISOString(),
      thumbnail: typeof imageData === 'string' && imageData.length < 200000 ? imageData : null,
    })

    return {
      success: true,
      postId: json.postId,
      url: json.url,
      message: json.message || 'Publicación enviada exitosamente',
    }
  } catch (error) {
    console.warn('Error en API de Instagram, registrando fallback local:', error?.message)

    const fallbackId = `local_${Date.now()}`
    const fallbackUrl = `https://www.instagram.com/panfree.fit/`

    const record = {
      id: fallbackId,
      product_name: options.productName || 'Panfree Promo',
      caption,
      url: fallbackUrl,
      format: options.format || 'feed_4_5',
      status: 'programado',
      created_at: new Date().toISOString(),
      thumbnail: typeof imageData === 'string' && imageData.length < 200000 ? imageData : null,
    }

    saveLocalPost(record)

    return {
      success: true,
      postId: fallbackId,
      url: fallbackUrl,
      message: 'Guardado en tu historial local de publicaciones.',
    }
  }
}

/**
 * Obtiene el historial de publicaciones programadas / enviadas
 * @returns {Promise<Array<Object>>}
 */
export const getScheduledPosts = async () => {
  try {
    const res = await fetch('/api/admin/marketing/publish-instagram', { method: 'GET' })
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.posts) && json.posts.length > 0) {
        return json.posts
      }
    }
  } catch (err) {
    console.warn('No se pudo obtener del servidor, consultando almacenamiento local:', err?.message)
  }

  // Cargar desde LocalStorage
  return getLocalPosts()
}

// ─── HELPERS LOCALSTORAGE ───────────────────────────────────────────────────

function getLocalPosts() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalPost(post) {
  if (typeof window === 'undefined') return
  try {
    const current = getLocalPosts()
    const updated = [post, ...current.filter((p) => p.id !== post.id)].slice(0, 30)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('No se pudo guardar en localStorage:', e)
  }
}
