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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"
            />
          </svg>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"
            />
          </svg>
          Avisar listo
        </button>
      )}
    </div>
  )
}
