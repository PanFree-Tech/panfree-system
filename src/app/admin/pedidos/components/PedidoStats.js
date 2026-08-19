/**
 * 📁 UBICACIÓN: src/app/admin/pedidos/components/PedidoStats.js
 * 📅 ACTUALIZADO: 2026-08-19
 * 📌 DESCRIPCIÓN: Componente de métricas rápidas del día para el panel de pedidos.
 *    Muestra la cantidad de pedidos de hoy, monto total facturado y pedidos pendientes.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { formatPYG } from '../lib/config'

export default function PedidoStats({ statsHoy }) {
  const { total = 0, monto = 0, pendientes = 0 } = statsHoy || {}

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#eee6d9' }}>{total}</div>
        <div style={{ fontSize: '0.75rem', color: '#b7996b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Pedidos hoy
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#eee6d9' }}>{formatPYG(monto)}</div>
        <div style={{ fontSize: '0.75rem', color: '#b7996b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Facturado hoy
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '1.35rem',
            fontWeight: '800',
            color: pendientes > 0 ? '#f46e15' : '#b7996b',
          }}
        >
          {pendientes}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#b7996b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Pendientes
        </div>
      </div>
    </div>
  )
}
