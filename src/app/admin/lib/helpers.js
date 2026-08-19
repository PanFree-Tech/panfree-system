/**
 * 📁 UBICACIÓN: src/app/admin/lib/helpers.js
 * 📅 CREADO: 2026-08-19 (Fase 4 - Sistema Compartido)
 * 📌 DESCRIPCIÓN: Funciones helpers reutilizables para formateo de moneda, peso, fechas,
 *    etiquetas de períodos y semáforos de márgenes en todo el panel administrativo de PanFree.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

// ── Formateo de Moneda (Guaraníes) ───────────────────────────────────────────
export const formatPYG = (n) => `₲ ${Number(n || 0).toLocaleString('es-PY')}`

// ── Formateo de Kilogramos ───────────────────────────────────────────────────
export const formatKG = (n) =>
  `${Number(n || 0).toLocaleString('es-PY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })} kg`

// ── Formateo de Fechas ───────────────────────────────────────────────────────
export const formatFecha = (f) =>
  f
    ? new Date(f).toLocaleString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export const formatFechaCorta = (f) =>
  f
    ? new Date(f).toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—'

// ── Formateo de Períodos (Mes / Año) ─────────────────────────────────────────
export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const labelPeriodo = (periodo) => {
  if (!periodo) return '—'
  const d = new Date(periodo + 'T12:00:00')
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export const hoy = new Date()

export const primerDiaMes = (y, m) => new Date(y, m, 1).toISOString().slice(0, 10)

// ── Colores y Badges según Margen ────────────────────────────────────────────
export const colorMargen = (pct) => {
  const n = Number(pct)
  if (n >= 50) return '#2e7d32'
  if (n >= 40) return '#388e3c'
  if (n >= 20) return '#f46e15'
  return '#c62828'
}

export const badgeMargen = (pct) => {
  const n = Number(pct)
  if (n >= 50) return { text: '✅ Excelente', bg: '#e8f5e9', color: '#2e7d32' }
  if (n >= 40) return { text: '✅ Bueno', bg: '#f1f8e9', color: '#388e3c' }
  if (n >= 20) return { text: '⚠️ Ajustado', bg: '#fff8e1', color: '#f46e15' }
  if (n >= 0) return { text: '🔴 Bajo', bg: '#fdecea', color: '#c62828' }
  return { text: '❌ Pérdida', bg: '#fdecea', color: '#c62828' }
}
