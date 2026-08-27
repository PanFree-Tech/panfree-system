/**
 * 📁 src/lib/cupones.js
 * Sistema de validación y aplicación de cupones
 */

import { supabase } from './supabase'

/**
 * Valida un código de cupón
 * @param {string} codigo
 * @param {string|null} clienteId
 * @param {number} montoCompra
 * @returns {Promise<{valido: boolean, mensaje?: string, cupon?: object}>}
 */
export async function validarCupon(codigo, clienteId = null, montoCompra = 0) {
  try {
    if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
      return { valido: false, mensaje: 'Código no proporcionado' }
    }

    const { data: cupon, error } = await supabase
      .from('cupones_descuento')
      .select('*')
      .eq('codigo', codigo.toUpperCase().trim())
      .eq('activo', true)
      .single()

    if (error || !cupon) {
      return { valido: false, mensaje: 'Código de cupón inválido o inactivo' }
    }

    // Verificar expiración
    if (cupon.fecha_expiracion && new Date() > new Date(cupon.fecha_expiracion)) {
      return { valido: false, mensaje: 'El código de cupón ha expirado' }
    }

    // Verificar límite total de usos
    if (cupon.limite_usos_total && (cupon.usos_actuales || 0) >= cupon.limite_usos_total) {
      return { valido: false, mensaje: 'El código de cupón ha alcanzado su límite de usos' }
    }

    // Verificar monto mínimo de compra
    const montoMinimo = Number(cupon.monto_minimo_compra || 0)
    if (montoCompra < montoMinimo) {
      return { 
        valido: false, 
        mensaje: `Monto mínimo de compra requerido: ₲ ${montoMinimo.toLocaleString('es-PY')}` 
      }
    }

    // Verificar límite por cliente
    if (clienteId && cupon.limite_por_cliente) {
      const { data: usos, error: usosError } = await supabase
        .from('cupones_canjeados')
        .select('id')
        .eq('cupon_id', cupon.id)
        .eq('cliente_id', clienteId)

      if (!usosError && usos && usos.length >= cupon.limite_por_cliente) {
        return { valido: false, mensaje: 'Ya has alcanzado el límite de uso para este cupón' }
      }
    }

    return { valido: true, cupon }
  } catch (error) {
    console.error('Error validando cupón:', error)
    return { valido: false, mensaje: 'Error al validar el cupón' }
  }
}

/**
 * Calcula el descuento aplicable
 * @param {object} cupon
 * @param {number} subtotal
 * @returns {number} Monto a descontar
 */
export function calcularDescuento(cupon, subtotal) {
  if (!cupon || subtotal <= 0) return 0

  if (cupon.tipo_descuento === 'porcentaje') {
    const porcentaje = Number(cupon.valor_descuento) || 0
    return Math.min(subtotal, Math.round((subtotal * porcentaje) / 100))
  }

  const montoFijo = Number(cupon.valor_descuento) || 0
  return Math.min(montoFijo, subtotal)
}

/**
 * Registra el uso de un cupón y actualiza su contador de usos
 * @param {string} cuponId
 * @param {string} clienteId
 * @param {string} pedidoId
 * @param {number} descuento
 */
export async function registrarUsoCupon(cuponId, clienteId, pedidoId, descuento) {
  try {
    const { data, error } = await supabase
      .from('cupones_canjeados')
      .insert({
        cupon_id: cuponId,
        cliente_id: clienteId,
        pedido_id: pedidoId || null,
        descuento_obtenido: Number(descuento) || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error registrando canje de cupón:', error)
      throw error
    }

    // Incrementar usos_actuales
    const { data: cuponActual } = await supabase
      .from('cupones_descuento')
      .select('usos_actuales')
      .eq('id', cuponId)
      .single()

    const nuevosUsos = (cuponActual?.usos_actuales || 0) + 1
    await supabase
      .from('cupones_descuento')
      .update({ usos_actuales: nuevosUsos })
      .eq('id', cuponId)

    return data
  } catch (err) {
    console.error('Error en registrarUsoCupon:', err)
    throw err
  }
}
