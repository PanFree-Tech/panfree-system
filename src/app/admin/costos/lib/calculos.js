/**
 * 📁 UBICACIÓN: src/app/admin/costos/lib/calculos.js
 * 📅 ACTUALIZADO: 2026-08-19 (Fase 4 - Sistema Compartido)
 * 📌 DESCRIPCIÓN: Fórmulas de cálculo de márgenes específicos y re-exportación de helpers/estilos
 *    compartidos para el módulo de análisis de Costos y Precios de PanFree.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

import { S, COLORS } from '../../_styles'
import {
  formatPYG,
  formatKG,
  colorMargen,
  badgeMargen,
  labelPeriodo,
  primerDiaMes,
  MESES,
  hoy,
} from '../../lib/helpers'

export {
  S,
  COLORS,
  formatPYG,
  formatKG,
  colorMargen,
  badgeMargen,
  labelPeriodo,
  primerDiaMes,
  MESES,
  hoy,
}

export const FORM_FIJOS_VACIO = {
  periodo: primerDiaMes(hoy.getFullYear(), hoy.getMonth()),
  alquiler: '',
  servicios: '',
  salarios: '',
  depreciacion_equipos: '',
  licencias_software: '',
  marketing: '',
  otros: '',
  notas: '',
}

/**
 * Calcula el costo variable, costo fijo por unidad, costo total y margen real en %
 * @param {object} d - Producto con precios y costos
 * @param {number} costoPorUnidadFijo - Costo fijo prorrateado por unidad producida
 */
export function calcularMargenReal(d, costoPorUnidadFijo = 0) {
  const pv = Number(d.precio_venta || 0)
  const cpu = d.peso_promedio_unidad
    ? Number(d.costo_por_kg || 0) * Number(d.peso_promedio_unidad)
    : Number(d.costo_materia_prima || 0)
  const cTotal = cpu + costoPorUnidadFijo
  const margen = pv > 0 ? ((pv - cTotal) / pv) * 100 : 0
  return {
    costoVariable: cpu,
    costoFijo: costoPorUnidadFijo,
    costoTotal: cTotal,
    margen: margen.toFixed(1),
  }
}
