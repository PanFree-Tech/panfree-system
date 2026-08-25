/**
 * 📁 src/lib/whatsapp-templates.js
 * 📅 PanFree WhatsApp Business API - Registro de Plantillas Aprobadas
 * 
 * Plantillas oficiales de Meta Cloud API con soporte para fallback
 * y configuración dinámica de parámetros.
 */

export const WHATSAPP_TEMPLATES = {
  // 1. Plantilla universal de prueba oficial de Meta (sin parámetros obligatorios)
  HELLO_WORLD: {
    name: 'hello_world',
    language: { code: 'en_US' }
  },

  // 2. Confirmación de compra automática (cuando el cliente finaliza pedido)
  PEDIDO_CONFIRMADO: (pedido = {}, cliente = {}) => {
    const nombre = cliente.nombre || cliente.nombre_completo?.split(' ')[0] || 'Cliente'
    const numeroPedido = pedido.numero_pedido || pedido.numeroPedido || 'N/A'
    const total = pedido.total_final || pedido.total || 0
    const totalFormateado = Number(total).toLocaleString('es-PY')
    const metodo = pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Retiro en local'

    return {
      name: process.env.WHATSAPP_TEMPLATE_CONFIRMACION || 'jaspers_market_confirmacion',
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(nombre) },            // {{1}} Nombre del cliente
            { type: 'text', text: String(numeroPedido) },      // {{2}} Número de pedido
            { type: 'text', text: `₲ ${totalFormateado}` },     // {{3}} Total del pedido
            { type: 'text', text: String(metodo) }             // {{4}} Método entrega
          ]
        }
      ]
    }
  },

  // 3. Notificación de pedido listo para entrega o retiro
  PEDIDO_LISTO: (pedido = {}, cliente = {}) => {
    const nombre = cliente.nombre || cliente.nombre_completo?.split(' ')[0] || 'Cliente'
    const numeroPedido = pedido.numero_pedido || pedido.numeroPedido || 'N/A'
    const estadoMensaje = pedido.metodo_entrega === 'retiro' 
      ? 'listo para retirar en nuestro local' 
      : 'en camino a tu domicilio'

    return {
      name: process.env.WHATSAPP_TEMPLATE_LISTO || 'jaspers_market_listo',
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(nombre) },            // {{1}} Nombre del cliente
            { type: 'text', text: String(numeroPedido) },      // {{2}} Número de pedido
            { type: 'text', text: String(estadoMensaje) }      // {{3}} Estado / Instrucción
          ]
        }
      ]
    }
  },

  // 4. Notificaciones de Marketing / Promociones especiales
  PROMOCION: (datos = {}) => {
    const nombre = datos.nombre_cliente || datos.nombre || 'Cliente'
    const descuento = datos.descuento ? `${datos.descuento}%` : 'Especial'
    const codigoPromo = datos.codigo_promo || datos.codigoPromo || 'PANFREE'
    const producto = datos.producto || 'Productos Sin Gluten'

    return {
      name: process.env.WHATSAPP_TEMPLATE_PROMO || 'jaspers_market_promo',
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(nombre) },            // {{1}} Nombre
            { type: 'text', text: String(descuento) },         // {{2}} Descuento
            { type: 'text', text: String(codigoPromo) },       // {{3}} Código
            { type: 'text', text: String(producto) }           // {{4}} Producto destacado
          ]
        }
      ]
    }
  },

  // 5. Alertas internas para el equipo operativo de PanFree
  ALERTA_EQUIPO: (datos = {}) => {
    const titulo = datos.titulo || 'Nueva Alerta PanFree'
    const detalle = datos.detalle || datos.mensaje || 'Revisar panel de administración'

    return {
      name: process.env.WHATSAPP_TEMPLATE_ALERTA || 'jaspers_market_alerta',
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(titulo) },
            { type: 'text', text: String(detalle).substring(0, 100) }
          ]
        }
      ]
    }
  }
}

/**
 * Helper con sistema de fallback robusto para obtener el payload de plantilla
 * @param {string} tipo - 'HELLO_WORLD' | 'PEDIDO_CONFIRMADO' | 'PEDIDO_LISTO' | 'PROMOCION' | 'ALERTA_EQUIPO'
 * @param {...any} args - Argumentos (pedido, cliente, datos)
 * @returns {object} Payload estructurado para WhatsApp Cloud API
 */
export function obtenerPlantilla(tipo, ...args) {
  try {
    if (tipo === 'HELLO_WORLD' || !tipo) {
      return WHATSAPP_TEMPLATES.HELLO_WORLD
    }

    const templateFn = WHATSAPP_TEMPLATES[tipo]
    if (typeof templateFn === 'function') {
      return templateFn(...args)
    }
    if (templateFn && typeof templateFn === 'object') {
      return templateFn
    }

    console.warn(`⚠️ Plantilla '${tipo}' no encontrada. Usando plantilla de fallback: hello_world`)
    return WHATSAPP_TEMPLATES.HELLO_WORLD
  } catch (error) {
    console.warn(`⚠️ Error generando plantilla '${tipo}': ${error.message}. Usando plantilla de fallback: hello_world`)
    return WHATSAPP_TEMPLATES.HELLO_WORLD
  }
}
