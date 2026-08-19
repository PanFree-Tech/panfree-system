/**
 * 📁 UBICACIÓN: src/app/admin/pedidos/lib/config.js
 * 📅 ACTUALIZADO: 2026-08-19 (Fase 4 - Sistema Compartido)
 * 📌 DESCRIPCIÓN: Configuraciones, estados de flujo y re-exportación de estilos/helpers
 *    compartidos para el módulo de Pedidos del panel de administración PanFree.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

import { S, COLORS } from '../../_styles'
import { formatPYG, formatFecha } from '../../lib/helpers'

export { S, COLORS, formatPYG, formatFecha }

export const ESTADOS = [
  'pendiente',
  'confirmado',
  'en_produccion',
  'listo',
  'entregado',
  'cancelado',
]

export const CONFIG_ESTADO = {
  pendiente: { label: 'Pendiente', bg: '#fff3e0', text: '#e65100', next: 'confirmado' },
  confirmado: { label: 'Confirmado', bg: '#e3f2fd', text: '#1565c0', next: 'en_produccion' },
  en_produccion: { label: 'En producción', bg: '#f3e5f5', text: '#6a1b9a', next: 'listo' },
  listo: { label: 'Listo ✓', bg: '#e8f5e9', text: '#2e7d32', next: 'entregado' },
  entregado: { label: 'Entregado', bg: '#e8f5e9', text: '#1b5e20', next: null },
  cancelado: { label: 'Cancelado', bg: '#ffebee', text: '#c62828', next: null },
}

export const CONFIG_PAGO = {
  pendiente: { label: 'Pendiente', bg: '#fff3e0', text: '#e65100' },
  aprobado: { label: 'Aprobado', bg: '#e8f5e9', text: '#2e7d32' },
  rechazado: { label: 'Rechazado', bg: '#ffebee', text: '#c62828' },
  reembolsado: { label: 'Reembolsado', bg: '#f3e5f5', text: '#6a1b9a' },
}

export const WA_NUMBER = '595984589845'
