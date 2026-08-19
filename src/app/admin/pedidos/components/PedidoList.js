/**
 * 📁 UBICACIÓN: src/app/admin/pedidos/components/PedidoList.js
 * 📅 ACTUALIZADO: 2026-08-19
 * 📌 DESCRIPCIÓN: Listado de pedidos del panel administrativo.
 *    - Filtros por búsqueda de texto (número, cliente, teléfono, email), estado, pago y entrega
 *    - Renderizado de tarjetas de pedido con badges de estado y método
 *    - Desglose expandible con productos, subtotales, entrega y datos de cliente
 *    - Integración con PedidoActions para transiciones de estado y WhatsApp
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { useState } from 'react'
import {
  ESTADOS,
  CONFIG_ESTADO,
  CONFIG_PAGO,
  formatPYG,
  formatFecha,
  S,
} from '../lib/config'
import PedidoActions from './PedidoActions'

export default function PedidoList({
  pedidos = [],
  loading = false,
  expandido,
  detalles = {},
  cambiando,
  onToggleExpandir,
  onCambiarEstado,
  onCambiarEstadoPago,
  onContactarCliente,
  msgConfirmado,
  msgListo,
}) {
  // Filtros internos de la lista
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroPago, setFiltroPago] = useState('todos')
  const [filtroEntrega, setFiltroEntrega] = useState('todos')

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('todos')
    setFiltroPago('todos')
    setFiltroEntrega('todos')
  }

  const pedidosFiltrados = pedidos.filter((p) => {
    const q = busqueda.trim().toLowerCase()
    const coincideBusqueda =
      !q ||
      p.numero_pedido?.toLowerCase().includes(q) ||
      p.clientes?.nombre_completo?.toLowerCase().includes(q) ||
      p.clientes?.email?.toLowerCase().includes(q) ||
      p.clientes?.telefono?.includes(q)

    const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado
    const coincidePago = filtroPago === 'todos' || p.estado_pago === filtroPago
    const coincideEntrega = filtroEntrega === 'todos' || p.metodo_entrega === filtroEntrega

    return coincideBusqueda && coincideEstado && coincidePago && coincideEntrega
  })

  const hayFiltrosActivos =
    Boolean(busqueda) ||
    filtroEstado !== 'todos' ||
    filtroPago !== 'todos' ||
    filtroEntrega !== 'todos'

  return (
    <div>
      {/* Barra de Filtros */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          style={{ ...S.input, minWidth: '240px', flex: 1 }}
          placeholder="🔍 Buscar por pedido, cliente, email o teléfono…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          style={S.select}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {CONFIG_ESTADO[e]?.label || e}
            </option>
          ))}
        </select>
        <select
          style={S.select}
          value={filtroPago}
          onChange={(e) => setFiltroPago(e.target.value)}
        >
          <option value="todos">Todo pago</option>
          <option value="pendiente">Pago pendiente</option>
          <option value="aprobado">Pago aprobado</option>
          <option value="rechazado">Pago rechazado</option>
          <option value="reembolsado">Pago reembolsado</option>
        </select>
        <select
          style={S.select}
          value={filtroEntrega}
          onChange={(e) => setFiltroEntrega(e.target.value)}
        >
          <option value="todos">Toda entrega</option>
          <option value="delivery">Delivery</option>
          <option value="retiro">Retiro</option>
        </select>
        {hayFiltrosActivos && (
          <button type="button" style={S.btnGris} onClick={limpiarFiltros}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {loading
          ? 'Cargando pedidos…'
          : `${pedidosFiltrados.length} pedido${pedidosFiltrados.length !== 1 ? 's' : ''} encontrado${pedidosFiltrados.length !== 1 ? 's' : ''}`}
      </p>

      {/* Lista de Pedidos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#999' }}>
          ⏳ Cargando pedidos…
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem',
            backgroundColor: '#fff',
            border: '2px dashed #b7996b',
            borderRadius: '8px',
            color: '#777',
          }}
        >
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>📭</p>
          <p style={{ fontWeight: '600', fontSize: '1rem', color: '#334c2b', margin: '0 0 0.25rem' }}>
            No se encontraron pedidos
          </p>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
            {hayFiltrosActivos
              ? 'Probá ajustando o limpiando los filtros seleccionados.'
              : 'Los nuevos pedidos registrados aparecerán aquí.'}
          </p>
        </div>
      ) : (
        pedidosFiltrados.map((pedido) => {
          const cfgEstado = CONFIG_ESTADO[pedido.estado] || {}
          const cfgPago = CONFIG_PAGO[pedido.estado_pago] || {}
          const estaExpandido = expandido === pedido.id
          const itemsDetalle = detalles[pedido.id] || []

          return (
            <div key={pedido.id} style={S.card}>
              {/* Fila principal clickeable */}
              <div
                role="button"
                tabIndex={0}
                style={{
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
                onClick={() => onToggleExpandir(pedido.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onToggleExpandir(pedido.id)
                  }
                }}
              >
                {/* Número y fecha */}
                <div style={{ minWidth: '140px' }}>
                  <div style={{ fontWeight: '800', color: '#334c2b', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                    {pedido.numero_pedido}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.15rem' }}>
                    {formatFecha(pedido.created_at)}
                  </div>
                </div>

                {/* Cliente */}
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontWeight: '600', color: '#334c2b', fontSize: '0.92rem' }}>
                    {pedido.clientes?.nombre_completo || 'Sin nombre'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#888' }}>
                    {pedido.clientes?.telefono || pedido.clientes?.email || '—'}
                  </div>
                </div>

                {/* Badges de estado y método */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={S.badge(cfgEstado)}>{cfgEstado.label || pedido.estado}</span>
                  <span style={S.badge(cfgPago)}>{cfgPago.label || pedido.estado_pago}</span>
                  <span style={S.badge({ bg: '#f5f0ea', text: '#b7996b' })}>
                    {pedido.metodo_entrega === 'delivery' ? '🛵' : '🏪'} {pedido.metodo_entrega}
                  </span>
                  <span style={S.badge({ bg: '#f5f0ea', text: '#b7996b' })}>
                    {pedido.metodo_pago === 'transferencia' ? '🏦' : '💵'} {pedido.metodo_pago || 'efectivo'}
                  </span>
                </div>

                {/* Total */}
                <div
                  style={{
                    fontWeight: '800',
                    color: '#334c2b',
                    fontSize: '1.05rem',
                    textAlign: 'right',
                    minWidth: '120px',
                  }}
                >
                  {formatPYG(pedido.total_final)}
                </div>

                <span style={{ color: '#b7996b', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {estaExpandido ? '▲' : '▼'}
                </span>
              </div>

              {/* Detalle expandido */}
              {estaExpandido && (
                <div
                  style={{
                    borderTop: '1px solid #eee6d9',
                    padding: '1.25rem',
                    backgroundColor: '#fafaf8',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '1.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {/* Items del pedido */}
                    <div>
                      <h4
                        style={{
                          margin: '0 0 0.75rem',
                          color: '#334c2b',
                          fontSize: '0.88rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: '700',
                        }}
                      >
                        📦 Productos
                      </h4>
                      {itemsDetalle.length === 0 ? (
                        <p style={{ color: '#999', fontSize: '0.85rem' }}>⏳ Cargando items…</p>
                      ) : (
                        itemsDetalle.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.88rem',
                              padding: '0.35rem 0',
                              borderBottom: '1px solid #f0ebe4',
                            }}
                          >
                            <span style={{ color: '#334c2b' }}>
                              <strong>{item.cantidad}×</strong> {item.productos?.nombre || 'Producto'}
                              {item.notas && (
                                <span style={{ color: '#888', marginLeft: '0.4rem', fontStyle: 'italic' }}>
                                  ({item.notas})
                                </span>
                              )}
                            </span>
                            <span style={{ fontWeight: '600', color: '#334c2b' }}>
                              {formatPYG(item.subtotal || item.precio_unitario * item.cantidad)}
                            </span>
                          </div>
                        ))
                      )}

                      {/* Subtotales */}
                      <div
                        style={{
                          marginTop: '0.6rem',
                          paddingTop: '0.6rem',
                          borderTop: '2px solid #eee6d9',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                            color: '#666',
                            marginBottom: '0.2rem',
                          }}
                        >
                          <span>Subtotal</span>
                          <span>{formatPYG(pedido.subtotal)}</span>
                        </div>
                        {Number(pedido.entrega_costo) > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.85rem',
                              color: '#666',
                              marginBottom: '0.2rem',
                            }}
                          >
                            <span>Costo de Envío</span>
                            <span>{formatPYG(pedido.entrega_costo)}</span>
                          </div>
                        )}
                        {Number(pedido.descuento) > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.85rem',
                              color: '#2e7d32',
                              marginBottom: '0.2rem',
                            }}
                          >
                            <span>Descuento aplicado</span>
                            <span>-{formatPYG(pedido.descuento)}</span>
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: '800',
                            color: '#334c2b',
                            fontSize: '1rem',
                            marginTop: '0.3rem',
                            paddingTop: '0.3rem',
                            borderTop: '1px dashed #d5c8b5',
                          }}
                        >
                          <span>Total Final</span>
                          <span style={{ color: '#f46e15' }}>{formatPYG(pedido.total_final)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Info entrega y cliente */}
                    <div>
                      <h4
                        style={{
                          margin: '0 0 0.75rem',
                          color: '#334c2b',
                          fontSize: '0.88rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: '700',
                        }}
                      >
                        🛵 Entrega & Cliente
                      </h4>
                      <div style={{ fontSize: '0.88rem', color: '#555', lineHeight: '1.6' }}>
                        <div>
                          <strong>Método de Entrega:</strong>{' '}
                          {pedido.metodo_entrega === 'delivery' ? '🛵 Delivery a domicilio' : '🏪 Retiro en local'}
                        </div>
                        {pedido.entrega_direccion && (
                          <div>
                            <strong>Dirección:</strong> {pedido.entrega_direccion}
                          </div>
                        )}
                        {pedido.entrega_instrucciones && (
                          <div>
                            <strong>Referencia:</strong> {pedido.entrega_instrucciones}
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: '0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px dashed #e2dad0',
                          }}
                        >
                          <strong>Cliente:</strong> {pedido.clientes?.nombre_completo || 'Sin nombre'}
                          <br />
                          {pedido.clientes?.telefono && (
                            <>
                              <strong>Teléfono:</strong> {pedido.clientes.telefono}
                              <br />
                            </>
                          )}
                          {pedido.clientes?.email && (
                            <>
                              <strong>Email:</strong> {pedido.clientes.email}
                              <br />
                            </>
                          )}
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <strong>Forma de Pago:</strong>{' '}
                          {pedido.metodo_pago === 'transferencia' ? '🏦 Transferencia Bancaria' : '💵 Efectivo'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones del Pedido */}
                  <PedidoActions
                    pedido={pedido}
                    cambiando={cambiando}
                    onCambiarEstado={onCambiarEstado}
                    onCambiarEstadoPago={onCambiarEstadoPago}
                    onContactarCliente={onContactarCliente}
                    msgConfirmado={msgConfirmado}
                    msgListo={msgListo}
                  />
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
