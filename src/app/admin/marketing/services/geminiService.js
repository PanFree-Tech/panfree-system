/**
 * 📁 UBICACIÓN: src/app/admin/marketing/services/geminiService.js
 * 📌 Servicio para generar copy publicitario y captions con Inteligencia Artificial (Gemini).
 */

/**
 * Genera contenido publicitario de Instagram para un producto usando Gemini AI
 * @param {Object} product - Producto seleccionado de la base de datos
 * @param {Object} [options] - Opciones adicionales (tono, formato, etc.)
 * @returns {Promise<{
 *   caption: string,
 *   hashtags: string,
 *   callToAction: string,
 *   hook?: string,
 *   fullPost: string
 * }>}
 */
export const generateInstagramContent = async (product, options = {}) => {
  try {
    const res = await fetch('/api/admin/marketing/generate-caption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: product || {
          nombre: 'Especialidades Artesanales Sin Gluten',
          categoria: 'Panadería y Repostería',
          precio_venta: null,
          descripcion: 'Elaborados 100% libres de gluten con ingredientes premium en Encarnación.',
        },
        tone: options.tone || 'persuasivo',
        format: options.format || 'feed',
      }),
    })

    if (!res.ok) {
      throw new Error(`Error en el servidor: ${res.statusText}`)
    }

    const json = await res.json()
    if (!json.success || !json.data) {
      throw new Error(json.error || 'No se pudo generar el contenido con IA')
    }

    const { hook = '', caption = '', hashtags = '', callToAction = '' } = json.data

    const fullPost = [
      hook,
      caption,
      callToAction ? `\n${callToAction}` : '',
      hashtags ? `\n${hashtags}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    return {
      hook,
      caption,
      hashtags,
      callToAction,
      fullPost: fullPost.trim(),
    }
  } catch (error) {
    console.warn('Fallo en geminiService, aplicando fallback seguro:', error?.message)

    // Fallback de contingencia local
    const pName = product?.nombre || 'Panificados Artesanales Sin Gluten'
    const pPrice = product?.precio_venta
      ? `G/ ${Number(product.precio_venta).toLocaleString('es-PY')}`
      : 'Consultar precio'

    const hook = `✨ ¡Disfrutá lo mejor de ${pName} en Panfree! 🍞❤️`
    const caption = `Hecho con amor y dedicación en cocina 100% libre de gluten.\n\n🏷️ ${pPrice}\n🛵 Envíos en Encarnación y retiro en local.\n⏱️ Pedidos con 24hs de anticipación.`
    const callToAction = '📲 Hacé tu pedido en panfree.fit o por WhatsApp al +595 984 589845'
    const hashtags = '#PanFree #SinGluten #SinTACC #Encarnacion #Paraguay #CeliacosParaguay'

    return {
      hook,
      caption,
      hashtags,
      callToAction,
      fullPost: `${hook}\n\n${caption}\n\n${callToAction}\n\n${hashtags}`,
    }
  }
}
