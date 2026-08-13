/**
 * 📁 UBICACIÓN: src/app/admin/pedidos/page.js
 * 📅 ACTUALIZADO: 2026-03-12
 * 📌 DESCRIPCIÓN: Gestión de pedidos de la tienda PanFree.
 *    - Lista todos los pedidos con filtros por estado y método de pago
 *    - Búsqueda por número de pedido o nombre de cliente
 *    - Cambio de estado del pedido (pendiente → confirmado → en_produccion → listo → entregado)
 *    - Vista detalle expandible con items, cliente y datos de entrega
 *    - Botón WhatsApp para contactar al cliente directamente
 *    - Totales del día y pendientes en el header
 *    - ✅ NUEVO: Modal "Nuevo pedido manual" para pedidos recibidos por WhatsApp
 *      Busca cliente por teléfono/email, selecciona productos con cantidades,
 *      elige entrega y pago, guarda en BD igual que un pedido online.
 *    Tablas: pedidos, detalle_pedido, clientes, productos
 *    Columnas verificadas contra BD real 2026-03-03
 */

'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const formatPYG   = n => `₲ ${Number(n || 0).toLocaleString('es-PY')}`
const formatFecha = f => f ? new Date(f).toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const ESTADOS = ['pendiente', 'confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado']

const CONFIG_ESTADO = {
  pendiente:    { label: 'Pendiente',    bg: '#fff3e0', text: '#e65100',  next: 'confirmado'   },
  confirmado:   { label: 'Confirmado',   bg: '#e3f2fd', text: '#1565c0',  next: 'en_produccion'},
  en_produccion:{ label: 'En producción',bg: '#f3e5f5', text: '#6a1b9a',  next: 'listo'        },
  listo:        { label: 'Listo ✓',     bg: '#e8f5e9', text: '#2e7d32',  next: 'entregado'    },
  entregado:    { label: 'Entregado',    bg: '#e8f5e9', text: '#1b5e20',  next: null           },
  cancelado:    { label: 'Cancelado',    bg: '#ffebee', text: '#c62828',  next: null           },
}

const CONFIG_PAGO = {
  pendiente:  { label: 'Pendiente',  bg: '#fff3e0', text: '#e65100' },
  aprobado:   { label: 'Aprobado',   bg: '#e8f5e9', text: '#2e7d32' },
  rechazado:  { label: 'Rechazado',  bg: '#ffebee', text: '#c62828' },
  reembolsado:{ label: 'Reembolsado',bg: '#f3e5f5', text: '#6a1b9a' },
}

const WA_NUMBER = '595984589845'

const S = {
  page:    { minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: '"Segoe UI", sans-serif' },
  header:  { backgroundColor: '#334c2b', color: '#eee6d9', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #b7996b', flexWrap: 'wrap', gap: '0.75rem' },
  main:    { padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' },
  card:    { backgroundColor: '#fff', border: '2px solid #b7996b', borderRadius: '8px', marginBottom: '1rem' },
  badge:   (cfg) => ({ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '700', backgroundColor: cfg?.bg || '#eee', color: cfg?.text || '#666' }),
  btnVerde:  { backgroundColor: '#334c2b', color: '#eee6d9', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.85rem' },
  btnNaranja:{ backgroundColor: '#f46e15', color: '#fff',    border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.85rem' },
  btnGris:   { backgroundColor: '#666',    color: '#fff',    border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.85rem' },
  btnWA:     { backgroundColor: '#25D366', color: '#fff',    border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' },
  input:     { padding: '0.55rem 0.85rem', border: '2px solid #b7996b', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff' },
  select:    { padding: '0.55rem 0.85rem', border: '2px solid #b7996b', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' },
}

export default function PaginaPedidosAdmin() {
  const router = useRouter()

  const [pedidos,     setPedidos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [expandido,   setExpandido]   = useState(null)
  const [detalles,    setDetalles]    = useState({}) // { pedidoId: [items] }
  const [cambiando,   setCambiando]   = useState(null)
  const [modalPedido, setModalPedido] = useState(false) // ← modal nuevo pedido manual

  // Filtros
  const [busqueda,    setBusqueda]    = useState('')
  const [filtroEstado,setFiltroEstado]= useState('todos')
  const [filtroPago,  setFiltroPago]  = useState('todos')
  const [filtroEntrega,setFiltroEntrega] = useState('todos')

  // Stats del día
  const [statsHoy,    setStatsHoy]    = useState({ total: 0, monto: 0, pendientes: 0 })

  // ── Verificar sesión ─────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/admin/login')
    })
  }, [])

  // ── Cargar pedidos ───────────────────────────────────────────────────────
  const cargarPedidos = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id, numero_pedido, estado, metodo_entrega, metodo_pago,
          entrega_direccion, entrega_costo, entrega_instrucciones,
          subtotal, descuento, total_final, estado_pago,
          fecha_pedido, created_at,
          clientes (
            id, nombre_completo, email, telefono
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      setPedidos(data || [])

      // Stats del día
      const hoy = new Date().toDateString()
      const pedidosHoy = (data || []).filter(p => new Date(p.created_at).toDateString() === hoy)
      setStatsHoy({
        total:      pedidosHoy.length,
        monto:      pedidosHoy.reduce((s, p) => s + Number(p.total_final || 0), 0),
        pendientes: (data || []).filter(p => p.estado === 'pendiente').length,
      })
    } catch (err) {
      console.error('Error cargando pedidos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarPedidos() }, [cargarPedidos])

  // ── Cargar detalle de un pedido ──────────────────────────────────────────
  async function cargarDetalle(pedidoId) {
    if (detalles[pedidoId]) return // ya cargado
    const { data, error } = await supabase
      .from('detalle_pedido')
      .select(`
        id, cantidad, precio_unitario, subtotal, notas,
        productos (id, nombre, imagen_url)
      `)
      .eq('pedido_id', pedidoId)
    if (!error && data) {
      setDetalles(prev => ({ ...prev, [pedidoId]: data }))
    }
  }

  function toggleExpandir(pedidoId) {
    if (expandido === pedidoId) {
      setExpandido(null)
    } else {
      setExpandido(pedidoId)
      cargarDetalle(pedidoId)
    }
  }

  // ── Cambiar estado del pedido ────────────────────────────────────────────
  async function cambiarEstado(pedidoId, nuevoEstado) {
    setCambiando(pedidoId)
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', pedidoId)
      if (error) throw error
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
      // Actualizar stats pendientes
      if (nuevoEstado !== 'pendiente') {
        setStatsHoy(prev => ({ ...prev, pendientes: Math.max(0, prev.pendientes - 1) }))
      }
    } catch (err) {
      console.error('Error cambiando estado:', err)
      alert('Error al cambiar el estado. Intentá de nuevo.')
    } finally {
      setCambiando(null) }
  }

  // ── Cambiar estado de pago ───────────────────────────────────────────────
  async function cambiarEstadoPago(pedidoId, nuevoEstadoPago) {
    setCambiando(pedidoId + '_pago')
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado_pago: nuevoEstadoPago, updated_at: new Date().toISOString() })
        .eq('id', pedidoId)
      if (error) throw error
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado_pago: nuevoEstadoPago } : p))
    } catch (err) {
      console.error('Error cambiando estado pago:', err)
    } finally {
      setCambiando(null)
    }
  }

  // ── WhatsApp al cliente ──────────────────────────────────────────────────
  function contactarCliente(pedido, mensaje) {
    const tel = pedido.clientes?.telefono?.replace(/\D/g, '')
    if (!tel) { alert('El cliente no tiene teléfono registrado.'); return }
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function msgListo(pedido) {
    return `¡Hola ${pedido.clientes?.nombre_completo?.split(' ')[0] || 'cliente'}! 👋\n\nTu pedido *${pedido.numero_pedido}* de PanFree está listo 🎉🍞\n\n${pedido.metodo_entrega === 'retiro' ? '¿Cuándo pasás a retirarlo?' : 'En breve salimos para la entrega. 🛵'}\n\nGracias por elegirnos! ❤️`
  }

  function msgConfirmado(pedido) {
    return `¡Hola ${pedido.clientes?.nombre_completo?.split(' ')[0] || 'cliente'}! 👋\n\nRecibimos tu pedido *${pedido.numero_pedido}* y ya lo estamos preparando 🍞✨\n\nTotal: *${formatPYG(pedido.total_final)}*\n\nCualquier consulta estamos aquí. ¡Gracias!`
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────
  const pedidosFiltrados = pedidos.filter(p => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !q
      || p.numero_pedido?.toLowerCase().includes(q)
      || p.clientes?.nombre_completo?.toLowerCase().includes(q)
      || p.clientes?.email?.toLowerCase().includes(q)
      || p.clientes?.telefono?.includes(q)
    const coincideEstado   = filtroEstado  === 'todos' || p.estado       === filtroEstado
    const coincidePago     = filtroPago    === 'todos' || p.estado_pago  === filtroPago
    const coincideEntrega  = filtroEntrega === 'todos' || p.metodo_entrega === filtroEntrega
    return coincideBusqueda && coincideEstado && coincidePago && coincideEntrega
  })

  return (
    <div style={S.page}>

      {/* Header */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push('/admin')} style={S.btnGris}>← Volver</button>
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>📦 Pedidos</h1>
        </div>

        {/* Stats rápidas */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{statsHoy.total}</div>
            <div style={{ fontSize: '0.75rem', color: '#b7996b' }}>Pedidos hoy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{formatPYG(statsHoy.monto)}</div>
            <div style={{ fontSize: '0.75rem', color: '#b7996b' }}>Facturado hoy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: statsHoy.pendientes > 0 ? '#f46e15' : '#b7996b' }}>
              {statsHoy.pendientes}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#b7996b' }}>Pendientes</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setModalPedido(true)} style={{ ...S.btnNaranja, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📲 Pedido por WA
          </button>
          <button onClick={cargarPedidos} style={S.btnGris}>🔄 Actualizar</button>
        </div>
      </header>

      <main style={S.main}>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            style={{ ...S.input, minWidth: '220px', flex: 1 }}
            placeholder="🔍 Buscar por pedido, cliente, email o teléfono…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select style={S.select} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{CONFIG_ESTADO[e]?.label || e}</option>)}
          </select>
          <select style={S.select} value={filtroPago} onChange={e => setFiltroPago(e.target.value)}>
            <option value="todos">Todo pago</option>
            <option value="pendiente">Pago pendiente</option>
            <option value="aprobado">Pago aprobado</option>
          </select>
          <select style={S.select} value={filtroEntrega} onChange={e => setFiltroEntrega(e.target.value)}>
            <option value="todos">Toda entrega</option>
            <option value="delivery">Delivery</option>
            <option value="retiro">Retiro</option>
          </select>
          {(busqueda || filtroEstado !== 'todos' || filtroPago !== 'todos' || filtroEntrega !== 'todos') && (
            <button style={S.btnGris} onClick={() => { setBusqueda(''); setFiltroEstado('todos'); setFiltroPago('todos'); setFiltroEntrega('todos') }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Contador */}
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {loading ? 'Cargando…' : `${pedidosFiltrados.length} pedido${pedidosFiltrados.length !== 1 ? 's' : ''} encontrado${pedidosFiltrados.length !== 1 ? 's' : ''}`}
        </p>

        {/* Lista de pedidos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Cargando pedidos…</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
            <p style={{ fontSize: '2rem' }}>📭</p>
            <p>No hay pedidos con esos filtros.</p>
          </div>
        ) : (
          pedidosFiltrados.map(pedido => {
            const cfgEstado = CONFIG_ESTADO[pedido.estado] || {}
            const cfgPago   = CONFIG_PAGO[pedido.estado_pago]  || {}
            const estaExpandido = expandido === pedido.id
            const itemsDetalle  = detalles[pedido.id] || []

            return (
              <div key={pedido.id} style={S.card}>

                {/* Fila principal */}
                <div
                  style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                  onClick={() => toggleExpandir(pedido.id)}
                >
                  {/* Número y fecha */}
                  <div style={{ minWidth: '140px' }}>
                    <div style={{ fontWeight: '800', color: '#334c2b', fontSize: '0.95rem' }}>
                      {pedido.numero_pedido}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#999', marginTop: '0.15rem' }}>
                      {formatFecha(pedido.created_at)}
                    </div>
                  </div>

                  {/* Cliente */}
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontWeight: '600', color: '#334c2b', fontSize: '0.9rem' }}>
                      {pedido.clientes?.nombre_completo || 'Sin nombre'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#999' }}>
                      {pedido.clientes?.telefono || pedido.clientes?.email || '—'}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={S.badge(cfgEstado)}>{cfgEstado.label}</span>
                    <span style={S.badge(cfgPago)}>{cfgPago.label || pedido.estado_pago}</span>
                    <span style={{ ...S.badge({ bg: '#f5f0ea', text: '#b7996b' }) }}>
                      {pedido.metodo_entrega === 'delivery' ? '🛵' : '🏪'} {pedido.metodo_entrega}
                    </span>
                    <span style={{ ...S.badge({ bg: '#f5f0ea', text: '#b7996b' }) }}>
                      {pedido.metodo_pago === 'transferencia' ? '🏦' : '💵'} {pedido.metodo_pago || 'efectivo'}
                    </span>
                  </div>

                  {/* Total */}
                  <div style={{ fontWeight: '800', color: '#334c2b', fontSize: '1.05rem', textAlign: 'right', minWidth: '120px' }}>
                    {formatPYG(pedido.total_final)}
                  </div>

                  <span style={{ color: '#b7996b', fontSize: '1rem' }}>{estaExpandido ? '▲' : '▼'}</span>
                </div>

                {/* Detalle expandido */}
                {estaExpandido && (
                  <div style={{ borderTop: '1px solid #eee6d9', padding: '1rem 1.25rem', backgroundColor: '#fafaf8' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>

                      {/* Items del pedido */}
                      <div>
                        <h4 style={{ margin: '0 0 0.75rem', color: '#334c2b', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Productos
                        </h4>
                        {itemsDetalle.length === 0 ? (
                          <p style={{ color: '#999', fontSize: '0.85rem' }}>Cargando items…</p>
                        ) : (
                          itemsDetalle.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '0.3rem 0', borderBottom: '1px solid #f0ebe4' }}>
                              <span style={{ color: '#334c2b' }}>
                                {item.cantidad}× {item.productos?.nombre || 'Producto'}
                                {item.notas && <span style={{ color: '#999', marginLeft: '0.4rem' }}>({item.notas})</span>}
                              </span>
                              <span style={{ fontWeight: '600', color: '#334c2b' }}>{formatPYG(item.subtotal || item.precio_unitario * item.cantidad)}</span>
                            </div>
                          ))
                        )}
                        {/* Subtotales */}
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #eee6d9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginBottom: '0.2rem' }}>
                            <span>Subtotal</span><span>{formatPYG(pedido.subtotal)}</span>
                          </div>
                          {Number(pedido.entrega_costo) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginBottom: '0.2rem' }}>
                              <span>Envío</span><span>{formatPYG(pedido.entrega_costo)}</span>
                            </div>
                          )}
                          {Number(pedido.descuento) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#2e7d32', marginBottom: '0.2rem' }}>
                              <span>Descuento</span><span>-{formatPYG(pedido.descuento)}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#334c2b', fontSize: '0.95rem' }}>
                            <span>Total</span><span>{formatPYG(pedido.total_final)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info entrega y cliente */}
                      <div>
                        <h4 style={{ margin: '0 0 0.75rem', color: '#334c2b', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Entrega
                        </h4>
                        <div style={{ fontSize: '0.88rem', color: '#555', lineHeight: '1.6' }}>
                          <div><strong>Método:</strong> {pedido.metodo_entrega === 'delivery' ? '🛵 Delivery' : '🏪 Retiro'}</div>
                          {pedido.entrega_direccion && <div><strong>Dirección:</strong> {pedido.entrega_direccion}</div>}
                          {pedido.entrega_instrucciones && <div><strong>Referencia:</strong> {pedido.entrega_instrucciones}</div>}
                          <div style={{ marginTop: '0.75rem' }}>
                            <strong>Cliente:</strong> {pedido.clientes?.nombre_completo}<br />
                            {pedido.clientes?.telefono && <><strong>Tel:</strong> {pedido.clientes.telefono}<br /></>}
                            <strong>Email:</strong> {pedido.clientes?.email}
                          </div>
                          <div style={{ marginTop: '0.75rem' }}>
                            <strong>Pago:</strong> {pedido.metodo_pago === 'transferencia' ? '🏦 Transferencia' : '💵 Efectivo'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid #eee6d9' }}>

                      {/* Avanzar estado */}
                      {cfgEstado.next && (
                        <button
                          style={{ ...S.btnVerde, opacity: cambiando === pedido.id ? 0.6 : 1 }}
                          disabled={cambiando === pedido.id}
                          onClick={() => cambiarEstado(pedido.id, cfgEstado.next)}
                        >
                          {cambiando === pedido.id ? '…' : `→ Marcar como ${CONFIG_ESTADO[cfgEstado.next]?.label}`}
                        </button>
                      )}

                      {/* Cancelar (solo si no está entregado/cancelado) */}
                      {!['entregado', 'cancelado'].includes(pedido.estado) && (
                        <button
                          style={{ backgroundColor: '#fff', color: '#c62828', border: '2px solid #c62828', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.85rem' }}
                          onClick={() => { if (confirm(`¿Cancelar el pedido ${pedido.numero_pedido}?`)) cambiarEstado(pedido.id, 'cancelado') }}
                        >
                          ✕ Cancelar
                        </button>
                      )}

                      {/* Confirmar pago */}
                      {pedido.estado_pago === 'pendiente' && pedido.metodo_pago === 'transferencia' && (
                        <button
                          style={{ ...S.btnNaranja, opacity: cambiando === pedido.id + '_pago' ? 0.6 : 1 }}
                          disabled={cambiando === pedido.id + '_pago'}
                          onClick={() => cambiarEstadoPago(pedido.id, 'aprobado')}
                        >
                          🏦 Confirmar pago
                        </button>
                      )}

                      {/* WhatsApp confirmar */}
                      {pedido.clientes?.telefono && pedido.estado === 'pendiente' && (
                        <button style={S.btnWA} onClick={() => contactarCliente(pedido, msgConfirmado(pedido))}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"/></svg>
                          Avisar recibido
                        </button>
                      )}

                      {/* WhatsApp listo */}
                      {pedido.clientes?.telefono && pedido.estado === 'listo' && (
                        <button style={S.btnWA} onClick={() => contactarCliente(pedido, msgListo(pedido))}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"/></svg>
                          Avisar listo
                        </button>
                      )}

                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </main>
      {/* Modal nuevo pedido manual */}
      {modalPedido && (
        <ModalPedidoManual
          onCerrar={() => setModalPedido(false)}
          onCreado={() => { setModalPedido(false); cargarPedidos() }}
        />
      )}

    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL: NUEVO PEDIDO MANUAL (pedidos recibidos por WhatsApp)
// ════════════════════════════════════════════════════════════════════════════
function ModalPedidoManual({ onCerrar, onCreado }) {

  // ── Pasos del wizard ──────────────────────────────────────────────────────
  // 1: buscar/crear cliente  2: elegir productos  3: entrega y pago  4: confirmar
  const [paso, setPaso] = useState(1)

  // ── Estado cliente ────────────────────────────────────────────────────────
  const [busqCliente,   setBusqCliente]   = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState(null) // registro BD
  const [clienteNuevo,  setClienteNuevo]  = useState({ nombre: '', telefono: '', email: '' })
  const [modoNuevo,     setModoNuevo]     = useState(false)
  const [buscandoCli,   setBuscandoCli]   = useState(false)

  // ── Estado productos ──────────────────────────────────────────────────────
  const [productos,   setProductos]   = useState([])
  const [carrito,     setCarrito]     = useState([]) // [{ producto, cantidad }]
  const [cargandoProd, setCargandoProd] = useState(false)

  // ── Estado entrega/pago ───────────────────────────────────────────────────
  const [metodoEntrega, setMetodoEntrega] = useState('retiro')
  const [direccion,     setDireccion]     = useState('')
  const [metodoPago,    setMetodoPago]    = useState('efectivo')

  // ── Estado guardado ───────────────────────────────────────────────────────
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState(null)

  // ── Cargar productos al llegar al paso 2 ─────────────────────────────────
  useEffect(() => {
    if (paso === 2 && productos.length === 0) {
      setCargandoProd(true)
      supabase
        .from('productos')
        .select('id, nombre, precio_venta, categoria, imagen_url, is_active')
        .eq('is_active', true)
        .order('categoria')
        .order('nombre')
        .then(({ data }) => {
          setProductos(data || [])
          setCargandoProd(false)
        })
    }
  }, [paso])

  // ── Buscar cliente ────────────────────────────────────────────────────────
  async function buscarCliente() {
    if (!busqCliente.trim()) return
    setBuscandoCli(true)
    setClienteEncontrado(null)
    setModoNuevo(false)
    const q = busqCliente.trim()
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre_completo, email, telefono, user_id')
      .or(`telefono.ilike.%${q}%,email.ilike.%${q}%,nombre_completo.ilike.%${q}%`)
      .limit(5)
    setBuscandoCli(false)
    if (data && data.length > 0) {
      setClienteEncontrado(data[0])
    } else {
      setModoNuevo(true)
      // Pre-llenar con lo buscado si parece teléfono
      if (/^\d+$/.test(q)) setClienteNuevo(prev => ({ ...prev, telefono: q }))
      else if (q.includes('@')) setClienteNuevo(prev => ({ ...prev, email: q }))
      else setClienteNuevo(prev => ({ ...prev, nombre: q }))
    }
  }

  // ── Carrito ───────────────────────────────────────────────────────────────
  function setCantidad(producto, cantidad) {
    const n = parseInt(cantidad) || 0
    if (n <= 0) {
      setCarrito(prev => prev.filter(i => i.producto.id !== producto.id))
    } else {
      setCarrito(prev => {
        const existe = prev.find(i => i.producto.id === producto.id)
        if (existe) return prev.map(i => i.producto.id === producto.id ? { ...i, cantidad: n } : i)
        return [...prev, { producto, cantidad: n }]
      })
    }
  }

  function getCantidad(productoId) {
    return carrito.find(i => i.producto.id === productoId)?.cantidad || 0
  }

  const subtotal   = carrito.reduce((s, i) => s + i.producto.precio_venta * i.cantidad, 0)
  const totalFinal = subtotal // sin delivery por ahora (pedido manual = precio acordado)

  // ── Guardar pedido ────────────────────────────────────────────────────────
  async function guardarPedido() {
    setError(null)
    setGuardando(true)
    try {
      let clienteId = clienteEncontrado?.id

      // Si es cliente nuevo, crearlo primero
      if (!clienteId) {
        if (!clienteNuevo.nombre.trim()) throw new Error('Ingresá el nombre del cliente.')
        if (!clienteNuevo.telefono.trim() && !clienteNuevo.email.trim())
          throw new Error('Ingresá al menos teléfono o email.')

        // Verificar si ya existe por email/teléfono (race condition)
        const { data: existe } = await supabase
          .from('clientes')
          .select('id')
          .or(`telefono.eq.${clienteNuevo.telefono},email.eq.${clienteNuevo.email}`)
          .limit(1)
          .maybeSingle()

        if (existe) {
          clienteId = existe.id
        } else {
          const { data: nuevo, error: errCli } = await supabase
            .from('clientes')
            .insert({
              nombre_completo:      clienteNuevo.nombre.trim(),
              telefono:             clienteNuevo.telefono.trim() || null,
              email:                clienteNuevo.email.trim() || `wa-${Date.now()}@panfree.fit`,
              direccion_ciudad:     'Encarnación',
              direccion_provincia:  'Itapúa',
              is_active:            true,
            })
            .select('id')
            .single()
          if (errCli) throw errCli
          clienteId = nuevo.id
        }
      }

      // Crear el pedido (numero_pedido lo genera el trigger)
      const direccionCompleta = metodoEntrega === 'delivery' ? direccion.trim() || null : null
      const { data: pedidoDB, error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id:        clienteId,
          estado:            'confirmado', // pedido manual → ya confirmado
          metodo_entrega:    metodoEntrega,
          entrega_direccion: direccionCompleta,
          entrega_costo:     0,
          subtotal,
          total_final:       totalFinal,
          estado_pago:       metodoPago === 'efectivo' ? 'pendiente' : 'pendiente',
          metodo_pago:       metodoPago,
          creado_por:        (await supabase.auth.getUser()).data.user?.id,
        })
        .select('id, numero_pedido')
        .single()
      if (errPedido) throw errPedido

      // Insertar detalle
      const detalles = carrito.map(i => ({
        pedido_id:       pedidoDB.id,
        producto_id:     i.producto.id,
        cantidad:        i.cantidad,
        precio_unitario: i.producto.precio_venta,
      }))
      const { error: errDet } = await supabase.from('detalle_pedido').insert(detalles)
      if (errDet) throw errDet

      onCreado(pedidoDB.numero_pedido)

    } catch (err) {
      console.error('Error creando pedido manual:', err)
      setError(err.message || 'Error al crear el pedido. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // ── Estilos del modal ─────────────────────────────────────────────────────
  const M = {
    overlay: {
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    },
    box: {
      backgroundColor: '#fff', borderRadius: '8px',
      width: '100%', maxWidth: '620px', maxHeight: '90vh',
      display: 'flex', flexDirection: 'column',
      border: '2px solid #b7996b', overflow: 'hidden',
    },
    head: {
      backgroundColor: '#334c2b', color: '#eee6d9',
      padding: '1rem 1.5rem', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '3px solid #b7996b', flexShrink: 0,
    },
    body:  { padding: '1.5rem', overflowY: 'auto', flex: 1 },
    foot:  { padding: '1rem 1.5rem', borderTop: '2px solid #eee6d9', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexShrink: 0, backgroundColor: '#fafaf8' },
    label: { display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#b7996b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' },
    input: { width: '100%', padding: '0.65rem 0.9rem', border: '2px solid #ddd', borderRadius: '6px', fontFamily: 'inherit', fontSize: '15px', color: '#333', outline: 'none', boxSizing: 'border-box', marginBottom: '0.85rem' },
    opcion: (sel) => ({ border: `2px solid ${sel ? '#f46e15' : '#ddd'}`, borderRadius: '6px', padding: '0.75rem 1rem', cursor: 'pointer', backgroundColor: sel ? '#fff8f4' : '#fafafa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }),
    radio:  (sel) => ({ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, border: `3px solid ${sel ? '#f46e15' : '#ccc'}`, backgroundColor: sel ? '#f46e15' : '#fff' }),
  }

  // ── Indicador de pasos ────────────────────────────────────────────────────
  const pasos = ['Cliente', 'Productos', 'Entrega', 'Confirmar']

  return (
    <div style={M.overlay} onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div style={M.box}>

        {/* Header del modal */}
        <div style={M.head}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem' }}>📲 Nuevo pedido por WhatsApp</div>
            <div style={{ fontSize: '0.78rem', color: '#b7996b', marginTop: '0.2rem' }}>
              Paso {paso} de 4 — {pasos[paso - 1]}
            </div>
          </div>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', color: '#eee6d9', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Barra de progreso */}
        <div style={{ display: 'flex', backgroundColor: '#334c2b' }}>
          {pasos.map((p, i) => (
            <div key={i} style={{
              flex: 1, height: '4px',
              backgroundColor: i < paso ? '#f46e15' : 'rgba(255,255,255,0.15)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Cuerpo del modal */}
        <div style={M.body}>

          {/* ── PASO 1: CLIENTE ────────────────────────────────────────── */}
          {paso === 1 && (
            <div>
              <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 0, marginBottom: '1.25rem' }}>
                Buscá al cliente por teléfono, email o nombre. Si no existe lo creamos.
              </p>

              <label style={M.label}>Buscar cliente</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  style={{ ...M.input, marginBottom: 0, flex: 1 }}
                  placeholder="Teléfono, email o nombre…"
                  value={busqCliente}
                  onChange={e => { setBusqCliente(e.target.value); setClienteEncontrado(null); setModoNuevo(false) }}
                  onKeyDown={e => e.key === 'Enter' && buscarCliente()}
                />
                <button
                  style={{ ...S.btnVerde, whiteSpace: 'nowrap' }}
                  onClick={buscarCliente}
                  disabled={buscandoCli}
                >
                  {buscandoCli ? '…' : '🔍 Buscar'}
                </button>
              </div>

              {/* Cliente encontrado */}
              {clienteEncontrado && (
                <div style={{ backgroundColor: '#e8f5e9', border: '2px solid #a5d6a7', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: '700', color: '#2e7d32', marginBottom: '0.25rem' }}>✅ Cliente encontrado</div>
                  <div style={{ fontSize: '0.9rem', color: '#333' }}>
                    <strong>{clienteEncontrado.nombre_completo}</strong><br />
                    {clienteEncontrado.telefono && <span>📞 {clienteEncontrado.telefono} · </span>}
                    {clienteEncontrado.email && <span>✉️ {clienteEncontrado.email}</span>}
                  </div>
                  <button
                    style={{ ...S.btnGris, fontSize: '0.78rem', padding: '0.3rem 0.6rem', marginTop: '0.5rem' }}
                    onClick={() => { setClienteEncontrado(null); setBusqCliente(''); setModoNuevo(false) }}
                  >
                    Cambiar cliente
                  </button>
                </div>
              )}

              {/* Formulario cliente nuevo */}
              {modoNuevo && !clienteEncontrado && (
                <div style={{ backgroundColor: '#fff8f4', border: '2px solid #fddcbc', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: '700', color: '#e65100', marginBottom: '0.75rem' }}>
                    ➕ Cliente nuevo — completar datos
                  </div>
                  <label style={M.label}>Nombre completo *</label>
                  <input style={M.input} placeholder="Juan Pérez" value={clienteNuevo.nombre}
                    onChange={e => setClienteNuevo(p => ({ ...p, nombre: e.target.value }))} />
                  <label style={M.label}>Teléfono</label>
                  <input style={M.input} placeholder="595984000000" value={clienteNuevo.telefono}
                    onChange={e => setClienteNuevo(p => ({ ...p, telefono: e.target.value }))} />
                  <label style={M.label}>Email (opcional)</label>
                  <input style={{ ...M.input, marginBottom: 0 }} placeholder="juan@email.com" value={clienteNuevo.email}
                    onChange={e => setClienteNuevo(p => ({ ...p, email: e.target.value }))} />
                </div>
              )}

              {!clienteEncontrado && !modoNuevo && (
                <p style={{ color: '#999', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>
                  Ingresá el teléfono o nombre para buscar al cliente.
                </p>
              )}
            </div>
          )}

          {/* ── PASO 2: PRODUCTOS ──────────────────────────────────────── */}
          {paso === 2 && (
            <div>
              {cargandoProd ? (
                <p style={{ textAlign: 'center', color: '#999' }}>Cargando productos…</p>
              ) : (
                <>
                  {/* Resumen carrito */}
                  {carrito.length > 0 && (
                    <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
                      🛒 <strong>{carrito.length} producto{carrito.length !== 1 ? 's' : ''}</strong> · Subtotal: <strong>{formatPYG(subtotal)}</strong>
                    </div>
                  )}

                  {/* Lista de productos */}
                  {productos.map(prod => {
                    const cant = getCantidad(prod.id)
                    return (
                      <div key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid #f0ebe4' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#334c2b', fontSize: '0.9rem' }}>{prod.nombre}</div>
                          <div style={{ fontSize: '0.8rem', color: '#b7996b' }}>{formatPYG(prod.precio_venta)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setCantidad(prod, cant - 1)}
                          >−</button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '700', color: cant > 0 ? '#334c2b' : '#ccc' }}>{cant}</span>
                          <button
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #334c2b', backgroundColor: '#334c2b', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setCantidad(prod, cant + 1)}
                          >+</button>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {/* ── PASO 3: ENTREGA Y PAGO ─────────────────────────────────── */}
          {paso === 3 && (
            <div>
              <label style={M.label}>Método de entrega</label>
              <div style={M.opcion(metodoEntrega === 'retiro')} onClick={() => setMetodoEntrega('retiro')}>
                <div style={M.radio(metodoEntrega === 'retiro')} />
                <div>
                  <div style={{ fontWeight: '700', color: '#334c2b' }}>🏪 Retiro en local</div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>El cliente pasa a buscar</div>
                </div>
              </div>
              <div style={M.opcion(metodoEntrega === 'delivery')} onClick={() => setMetodoEntrega('delivery')}>
                <div style={M.radio(metodoEntrega === 'delivery')} />
                <div>
                  <div style={{ fontWeight: '700', color: '#334c2b' }}>🛵 Delivery a domicilio</div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>Encarnación y Gran Encarnación</div>
                </div>
              </div>

              {metodoEntrega === 'delivery' && (
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <label style={M.label}>Dirección de entrega</label>
                  <input
                    style={M.input}
                    placeholder="Calle, número, barrio…"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                  />
                </div>
              )}

              <label style={{ ...M.label, marginTop: '1rem' }}>Método de pago</label>
              <div style={M.opcion(metodoPago === 'efectivo')} onClick={() => setMetodoPago('efectivo')}>
                <div style={M.radio(metodoPago === 'efectivo')} />
                <div>
                  <div style={{ fontWeight: '700', color: '#334c2b' }}>💵 Efectivo al entregar</div>
                </div>
              </div>
              <div style={M.opcion(metodoPago === 'transferencia')} onClick={() => setMetodoPago('transferencia')}>
                <div style={M.radio(metodoPago === 'transferencia')} />
                <div>
                  <div style={{ fontWeight: '700', color: '#334c2b' }}>🏦 Transferencia bancaria</div>
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 4: CONFIRMAR ──────────────────────────────────────── */}
          {paso === 4 && (
            <div>
              <h3 style={{ margin: '0 0 1.25rem', color: '#334c2b' }}>Resumen del pedido</h3>

              {/* Cliente */}
              <div style={{ backgroundColor: '#f5f0ea', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                <strong>👤 Cliente:</strong> {clienteEncontrado?.nombre_completo || clienteNuevo.nombre}<br />
                {(clienteEncontrado?.telefono || clienteNuevo.telefono) && (
                  <span>📞 {clienteEncontrado?.telefono || clienteNuevo.telefono}</span>
                )}
              </div>

              {/* Productos */}
              <div style={{ marginBottom: '1rem' }}>
                {carrito.map(i => (
                  <div key={i.producto.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.3rem 0', borderBottom: '1px solid #f0ebe4' }}>
                    <span style={{ color: '#334c2b' }}>{i.cantidad}× {i.producto.nombre}</span>
                    <span style={{ fontWeight: '600' }}>{formatPYG(i.producto.precio_venta * i.cantidad)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#334c2b', fontSize: '1rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #eee6d9' }}>
                  <span>Total</span>
                  <span style={{ color: '#f46e15' }}>{formatPYG(totalFinal)}</span>
                </div>
              </div>

              {/* Entrega y pago */}
              <div style={{ backgroundColor: '#f5f0ea', borderRadius: '6px', padding: '0.75rem 1rem', fontSize: '0.9rem', lineHeight: '1.7' }}>
                <div><strong>Entrega:</strong> {metodoEntrega === 'retiro' ? '🏪 Retiro en local' : '🛵 Delivery'}{metodoEntrega === 'delivery' && direccion ? ` — ${direccion}` : ''}</div>
                <div><strong>Pago:</strong> {metodoPago === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}</div>
              </div>

              {error && (
                <div style={{ backgroundColor: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '6px', padding: '0.75rem', marginTop: '1rem', color: '#c62828', fontSize: '0.88rem' }}>
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer con botones de navegación */}
        <div style={M.foot}>
          {paso > 1 && (
            <button style={S.btnGris} onClick={() => { setPaso(p => p - 1); setError(null) }}>
              ← Atrás
            </button>
          )}
          <button style={S.btnGris} onClick={onCerrar}>Cancelar</button>

          {paso < 4 && (
            <button
              style={{ ...S.btnVerde, opacity: (
                (paso === 1 && !clienteEncontrado && !modoNuevo) ||
                (paso === 2 && carrito.length === 0)
              ) ? 0.5 : 1 }}
              disabled={
                (paso === 1 && !clienteEncontrado && !modoNuevo) ||
                (paso === 2 && carrito.length === 0)
              }
              onClick={() => setPaso(p => p + 1)}
            >
              Siguiente →
            </button>
          )}

          {paso === 4 && (
            <button
              style={{ ...S.btnNaranja, opacity: guardando ? 0.6 : 1, minWidth: '160px' }}
              disabled={guardando}
              onClick={guardarPedido}
            >
              {guardando ? '⏳ Guardando…' : '✅ Crear pedido'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}