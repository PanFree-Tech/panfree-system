/**
 * 📁 UBICACIÓN: src/app/admin/pedidos/components/PedidoActions.js
 * 📅 ACTUALIZADO: 2026-08-19
 * 📌 DESCRIPCIÓN: Botones de acción rápida para un pedido individual:
 *    - Avanzar de estado (ej: pendiente → confirmado → en_produccion → listo → entregado)
 *    - Cancelar pedido
 *    - Confirmar acreditación de transferencia bancaria
 *    - Mensajes automáticos y directos por WhatsApp al cliente
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { Send } from 'lucide-react'
import { CONFIG_ESTADO, S } from '../lib/config'

export default function PedidoActions({
  pedido,
  cambiando,
  onCambiarEstado,
  onCambiarEstadoPago,
  onContactarCliente,
  msgConfirmado,
  msgListo,
}) {
  const cfgEstado = CONFIG_ESTADO[pedido.estado] || {}
  const estaCambiandoEstado = cambiando === pedido.id
  const estaCambiandoPago = cambiando === `${pedido.id}_pago`

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.6rem',
        flexWrap: 'wrap',
        paddingTop: '0.75rem',
        borderTop: '1px solid #eee6d9',
        alignItems: 'center',
      }}
    >
      {/* Avanzar al siguiente estado */}
      {cfgEstado.next && (
        <button
          type="button"
          style={{ ...S.btnVerde, opacity: estaCambiandoEstado ? 0.6 : 1 }}
          disabled={estaCambiandoEstado}
          onClick={() => onCambiarEstado(pedido.id, cfgEstado.next)}
        >
          {estaCambiandoEstado ? '⏳ Actualizando…' : `→ Marcar como ${CONFIG_ESTADO[cfgEstado.next]?.label || cfgEstado.next}`}
        </button>
      )}

      {/* Cancelar pedido (si no está ya entregado o cancelado) */}
      {!['entregado', 'cancelado'].includes(pedido.estado) && (
        <button
          type="button"
          style={{
            backgroundColor: '#fff',
            color: '#c62828',
            border: '2px solid #c62828',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: '600',
            fontSize: '0.85rem',
          }}
          onClick={() => {
            if (window.confirm(`¿Seguro que deseás cancelar el pedido ${pedido.numero_pedido}?`)) {
              onCambiarEstado(pedido.id, 'cancelado')
            }
          }}
        >
          ✕ Cancelar
        </button>
      )}

      {/* Confirmar pago por transferencia */}
      {pedido.estado_pago === 'pendiente' && pedido.metodo_pago === 'transferencia' && (
        <button
          type="button"
          style={{ ...S.btnNaranja, opacity: estaCambiandoPago ? 0.6 : 1 }}
          disabled={estaCambiandoPago}
          onClick={() => onCambiarEstadoPago(pedido.id, 'aprobado')}
        >
          {estaCambiandoPago ? '⏳ Confirmando…' : '🏦 Confirmar pago'}
        </button>
      )}

      {/* WhatsApp: Notificar pedido recibido/confirmado */}
      {pedido.clientes?.telefono && pedido.estado === 'pendiente' && (
        <button
          type="button"
          style={S.btnWA}
          onClick={() => onContactarCliente(pedido, msgConfirmado(pedido))}
        >
          <Send size={14} className="mr-1" style={{ flexShrink: 0 }} />
          Avisar recibido
        </button>
      )}

      {/* WhatsApp: Notificar pedido listo */}
      {pedido.clientes?.telefono && pedido.estado === 'listo' && (
        <button
          type="button"
          style={S.btnWA}
          onClick={() => onContactarCliente(pedido, msgListo(pedido))}
        >
          <Send size={14} className="mr-1" style={{ flexShrink: 0 }} />
          Avisar listo
        </button>
      )}
    </div>
  )
}
