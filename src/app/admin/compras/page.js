/**
 * 📁 UBICACIÓN: src/app/admin/compras/page.js
 * 📅 ACTUALIZADO: 2026-08-19
 * 📌 DESCRIPCIÓN: Gestión completa de órdenes de compra a proveedores en PanFree.
 *    - Lista compras con número, proveedor, fecha, total, estado y estado de pago.
 *    - Modal de visualización detallada con desglose de insumos comprados (botón 👁 Ver).
 *    - Creación de órdenes de compra con múltiples líneas de detalle (detalle_compra).
 *    - AL RECEPCIONAR (estado = 'recepcionada'):
 *        1. Incrementa el stock físico del insumo: stock_actual = stock_actual + cantidad
 *        2. Recalcula el Precio Promedio Ponderado (PPP):
 *           nuevo_ppp = ((stock_anterior * ppp_anterior) + (cantidad * precio_unitario)) / stock_nuevo
 *        3. Actualiza el precio_compra_actual del insumo al precio de esta compra.
 *    - Precios en PYG (₲).
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { S, COLORS } from '../_styles'
import { formatPYG } from '../lib/helpers'
import { AUDIT_ACTIONS, registrarAuditoria } from '../lib/audit'

const ESTADOS_COMPRA = ['pendiente', 'confirmada', 'recepcionada', 'cancelada']
const ESTADOS_PAGO = ['pendiente', 'parcial', 'pagado']

const colorEstado = (e) =>
  ({
    pendiente: COLORS.naranja,
    confirmada: COLORS.azul,
    recepcionada: COLORS.verde,
    cancelada: COLORS.rojo,
  }[e] || COLORS.gris)

const colorPago = (e) =>
  ({
    pendiente: COLORS.naranja,
    parcial: '#ff9800',
    pagado: COLORS.verde,
  }[e] || COLORS.gris)

function generarNumero() {
  const d = new Date()
  const fecha = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = String(Math.floor(Math.random() * 900) + 100)
  return `COMP-${fecha}-${rand}`
}

const FORM_VACIO = {
  numero_compra: '',
  proveedor_id: '',
  estado: 'pendiente',
  estado_pago: 'pendiente',
  metodo_pago: '',
  observaciones: '',
  descuento: 0,
}

const LINEA_VACIA = { insumo_id: '', cantidad: '', precio_unitario: '' }

export default function PaginaCompras() {
  const router = useRouter()
  const [compras, setCompras] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal nueva compra
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [lineas, setLineas] = useState([{ ...LINEA_VACIA }])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [mensajeExito, setMensajeExito] = useState(null)

  // Modal ver detalle
  const [modalVer, setModalVer] = useState(false)
  const [compraSeleccionada, setCompraSeleccionada] = useState(null)
  const [detallesCompra, setDetallesCompra] = useState([])
  const [cargandoDetalles, setCargandoDetalles] = useState(false)
  const [procesandoRecepcion, setProcesandoRecepcion] = useState(false)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [c, p, i] = await Promise.all([
        supabase
          .from('compras')
          .select('*, proveedores(nombre_empresa)')
          .order('fecha_compra', { ascending: false }),
        supabase
          .from('proveedores')
          .select('id, nombre_empresa')
          .eq('is_active', true)
          .order('nombre_empresa'),
        supabase
          .from('insumos')
          .select('id, nombre, unidad_medida, stock_actual, ppp_actual, precio_compra_actual')
          .eq('is_active', true)
          .order('nombre'),
      ])
      setCompras(c.data || [])
      setProveedores(p.data || [])
      setInsumos(i.data || [])
    } catch (err) {
      console.error('[PanFree] Error cargando datos de compras:', err)
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  function abrirNuevo() {
    setForm({ ...FORM_VACIO, numero_compra: generarNumero() })
    setLineas([{ ...LINEA_VACIA }])
    setError(null)
    setModal(true)
  }

  function cambiar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function cambiarLinea(idx, campo, valor) {
    setLineas((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l))
    )
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, { ...LINEA_VACIA }])
  }

  function quitarLinea(idx) {
    if (lineas.length === 1) {
      setLineas([{ ...LINEA_VACIA }])
      return
    }
    setLineas((prev) => prev.filter((_, i) => i !== idx))
  }

  const subtotal = lineas.reduce(
    (s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0),
    0
  )
  const total = Math.max(0, subtotal - (Number(form.descuento) || 0))

  /**
   * Actualiza el stock físico y recalcula el Precio Promedio Ponderado (PPP)
   * de cada insumo incluido en una orden de compra recepcionada.
   */
  async function aplicarStockYPPP(items) {
    const actualizaciones = []

    for (const item of items) {
      if (!item.insumo_id || !item.cantidad || !item.precio_unitario) continue

      // Buscar datos más frescos del insumo
      const { data: insumo, error: errInsumo } = await supabase
        .from('insumos')
        .select('id, nombre, stock_actual, ppp_actual')
        .eq('id', item.insumo_id)
        .single()

      if (errInsumo || !insumo) {
        console.warn(`[PanFree] No se pudo encontrar insumo ${item.insumo_id}:`, errInsumo)
        continue
      }

      const stockActual = Number(insumo.stock_actual) || 0
      const pppActual = Number(insumo.ppp_actual) || 0
      const cantComprada = Number(item.cantidad) || 0
      const precioCompra = Number(item.precio_unitario) || 0

      const nuevoStock = stockActual + cantComprada

      // Fórmula PPP: (Stock_ant * PPP_ant + Cant_nueva * Precio_nuevo) / Stock_nuevo
      let nuevoPPP = precioCompra
      if (nuevoStock > 0) {
        nuevoPPP = Math.round(((stockActual * pppActual) + (cantComprada * precioCompra)) / nuevoStock)
      }

      actualizaciones.push(
        supabase
          .from('insumos')
          .update({
            stock_actual: nuevoStock,
            ppp_actual: nuevoPPP,
            precio_compra_actual: precioCompra,
            updated_at: new Date().toISOString(),
          })
          .eq('id', insumo.id)
      )
    }

    if (actualizaciones.length > 0) {
      await Promise.all(actualizaciones)
    }
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      if (!form.proveedor_id) {
        throw new Error('Seleccioná un proveedor para la compra.')
      }

      const lineasValidas = lineas.filter(
        (l) => l.insumo_id && Number(l.cantidad) > 0 && Number(l.precio_unitario) >= 0
      )

      if (lineasValidas.length === 0) {
        throw new Error('Agregá al menos un insumo con cantidad y precio unitario.')
      }

      const { data: compraData, error: errCompra } = await supabase
        .from('compras')
        .insert({
          ...form,
          subtotal,
          total_final: total,
          descuento: Number(form.descuento) || 0,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (errCompra) throw errCompra

      const detalles = lineasValidas.map((l) => ({
        compra_id: compraData.id,
        insumo_id: l.insumo_id,
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
      }))

      const { error: errDet } = await supabase.from('detalle_compra').insert(detalles)
      if (errDet) throw errDet

      // Si se crea directamente como recepcionada, actualizar stock y PPP
      if (form.estado === 'recepcionada') {
        await aplicarStockYPPP(detalles)
        setMensajeExito('✅ Compra registrada y recepcionada: Stock físico y PPP actualizados con éxito.')
      } else {
        setMensajeExito('✅ Orden de compra registrada correctamente.')
      }

      await registrarAuditoria(AUDIT_ACTIONS.COMPRA_CREADA, {
        compra_id: compraData.id,
        numero_compra: compraData.numero_compra,
        proveedor_id: form.proveedor_id,
        total: Number(total),
        estado: form.estado,
        items_count: lineasValidas.length,
      })

      await cargar()
      setModal(false)
      setTimeout(() => setMensajeExito(null), 5000)
    } catch (err) {
      console.error('[PanFree] Error guardando compra:', err)
      setError(err.message || 'Error al guardar la compra')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(compra, nuevoEstado) {
    if (compra.estado === nuevoEstado) return

    // Si pasa a recepcionada, solicitar confirmación y actualizar stock y PPP
    if (nuevoEstado === 'recepcionada' && compra.estado !== 'recepcionada') {
      const confirmar = window.confirm(
        `¿Confirmar recepción de la orden ${compra.numero_compra}?\nSe incrementará el stock físico y se recalculará el PPP de los insumos.`
      )
      if (!confirmar) return

      try {
        setProcesandoRecepcion(true)

        // Traer detalle de la compra
        const { data: items, error: errDet } = await supabase
          .from('detalle_compra')
          .select('*')
          .eq('compra_id', compra.id)

        if (errDet) throw errDet

        // Actualizar estado de la orden
        const { error: errCompra } = await supabase
          .from('compras')
          .update({
            estado: 'recepcionada',
            updated_at: new Date().toISOString(),
          })
          .eq('id', compra.id)

        if (errCompra) throw errCompra

        // Actualizar stock e insumos
        if (items && items.length > 0) {
          await aplicarStockYPPP(items)
        }

        setMensajeExito(
          `✅ Orden ${compra.numero_compra} recepcionada. Stock y PPP actualizados correctamente.`
        )
        setTimeout(() => setMensajeExito(null), 5000)

        await registrarAuditoria(AUDIT_ACTIONS.COMPRA_RECEPCIONADA, {
          compra_id: compra.id,
          numero_compra: compra.numero_compra,
          items_count: items?.length || 0,
        })

        await cargar()
 
        if (compraSeleccionada && compraSeleccionada.id === compra.id) {
          setCompraSeleccionada((prev) => ({ ...prev, estado: 'recepcionada' }))
        }
      } catch (err) {
        console.error('[PanFree] Error al recepcionar compra:', err)
        alert('Error al recepcionar la compra: ' + err.message)
      } finally {
        setProcesandoRecepcion(false)
      }
      return
    }

    // Para otros estados simplemente actualizar estado
    try {
      await supabase
        .from('compras')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', compra.id)

      await registrarAuditoria(
        nuevoEstado === 'cancelada' ? AUDIT_ACTIONS.COMPRA_CANCELADA : 'compra_estado_cambiado',
        {
          compra_id: compra.id,
          numero_compra: compra.numero_compra,
          estado_anterior: compra.estado,
          nuevo_estado: nuevoEstado,
        }
      )

      await cargar()
      if (compraSeleccionada && compraSeleccionada.id === compra.id) {
        setCompraSeleccionada((prev) => ({ ...prev, estado: nuevoEstado }))
      }
    } catch (err) {
      console.error('[PanFree] Error actualizando estado:', err)
    }
  }

  async function cambiarEstadoPago(compraId, nuevoEstadoPago) {
    try {
      await supabase
        .from('compras')
        .update({ estado_pago: nuevoEstadoPago, updated_at: new Date().toISOString() })
        .eq('id', compraId)

      await cargar()
      if (compraSeleccionada && compraSeleccionada.id === compraId) {
        setCompraSeleccionada((prev) => ({ ...prev, estado_pago: nuevoEstadoPago }))
      }
    } catch (err) {
      console.error('[PanFree] Error actualizando estado de pago:', err)
    }
  }

  // Abrir modal de visualización detallada
  async function abrirVer(compra) {
    setCompraSeleccionada(compra)
    setModalVer(true)
    setCargandoDetalles(true)
    try {
      const { data, error } = await supabase
        .from('detalle_compra')
        .select('*, insumos(nombre, unidad_medida, categoria, ppp_actual)')
        .eq('compra_id', compra.id)

      if (error) throw error
      setDetallesCompra(data || [])
    } catch (err) {
      console.error('[PanFree] Error cargando detalle de compra:', err)
      setDetallesCompra([])
    } finally {
      setCargandoDetalles(false)
    }
  }

  const filtradas = compras.filter((c) => {
    const coincideEstado = filtroEstado === 'todos' || c.estado === filtroEstado
    const termino = busqueda.trim().toLowerCase()
    const coincideBusqueda =
      !termino ||
      c.numero_compra?.toLowerCase().includes(termino) ||
      c.proveedores?.nombre_empresa?.toLowerCase().includes(termino) ||
      c.metodo_pago?.toLowerCase().includes(termino)

    return coincideEstado && coincideBusqueda
  })

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            style={{ ...S.btnGris, padding: '0.4rem 0.8rem' }}
          >
            ← Volver
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>🛒 Compras a Proveedores</h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#b7996b' }}>
              Gestión de insumos, órdenes y cálculo de PPP
            </p>
          </div>
        </div>
        <button type="button" onClick={abrirNuevo} style={S.btnNaranja}>
          + Nueva Compra
        </button>
      </header>

      <main style={S.main}>
        {/* Banner de éxito */}
        {mensajeExito && (
          <div
            style={{
              backgroundColor: '#e8f5e9',
              border: '2px solid #2e7d32',
              borderRadius: '8px',
              padding: '0.9rem 1.2rem',
              marginBottom: '1.5rem',
              color: '#1b5e20',
              fontWeight: '600',
              fontSize: '0.92rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{mensajeExito}</span>
            <button
              type="button"
              onClick={() => setMensajeExito(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#1b5e20' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Barra de Filtros y Búsqueda */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['todos', ...ESTADOS_COMPRA].map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setFiltroEstado(e)}
                style={{
                  ...S.btnVerde,
                  fontSize: '0.82rem',
                  padding: '0.4rem 0.9rem',
                  backgroundColor: filtroEstado === e ? '#334c2b' : '#fff',
                  color: filtroEstado === e ? '#eee6d9' : '#334c2b',
                  border: '1px solid #b7996b',
                  fontWeight: filtroEstado === e ? '700' : '500',
                }}
              >
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ minWidth: '240px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por N° o proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ ...S.input, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Tabla de compras */}
        <div style={{ ...S.card, overflow: 'auto' }}>
          {loading ? (
            <p style={{ padding: '2.5rem', textAlign: 'center', color: '#888', margin: 0 }}>
              ⏳ Cargando compras a proveedores...
            </p>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
              <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📦</p>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: '#334c2b', margin: 0 }}>
                No se encontraron órdenes de compra
              </p>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: '0.5rem 0 1.25rem' }}>
                {busqueda || filtroEstado !== 'todos'
                  ? 'Probá cambiando los filtros o el texto de búsqueda.'
                  : 'Registrá la primera compra a proveedor para actualizar el inventario.'}
              </p>
              <button type="button" onClick={abrirNuevo} style={S.btnNaranja}>
                + Crear primera orden
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
              <thead>
                <tr>
                  {['N° Compra', 'Proveedor', 'Fecha', 'Total', 'Estado', 'Pago', 'Acciones'].map((h) => (
                    <th key={h} style={S.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((c, idx) => (
                  <tr
                    key={c.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#faf7f2',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <td style={S.td}>
                      <strong style={{ color: '#334c2b', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {c.numero_compra}
                      </strong>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontWeight: '600', color: '#444' }}>
                        {c.proveedores?.nombre_empresa || '—'}
                      </span>
                    </td>
                    <td style={S.td}>
                      {c.fecha_compra ? new Date(c.fecha_compra).toLocaleDateString('es-PY') : '—'}
                    </td>
                    <td style={{ ...S.td, fontWeight: '700', color: '#f46e15', fontSize: '0.95rem' }}>
                      {formatPYG(c.total_final)}
                    </td>
                    <td style={S.td}>
                      <select
                        value={c.estado}
                        disabled={procesandoRecepcion}
                        onChange={(e) => cambiarEstado(c, e.target.value)}
                        style={{
                          border: `2px solid ${colorEstado(c.estado)}`,
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          fontFamily: 'inherit',
                          fontSize: '0.82rem',
                          color: colorEstado(c.estado),
                          fontWeight: '700',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        {ESTADOS_COMPRA.map((e) => (
                          <option key={e} value={e}>
                            {e.charAt(0).toUpperCase() + e.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={S.td}>
                      <select
                        value={c.estado_pago || 'pendiente'}
                        onChange={(e) => cambiarEstadoPago(c.id, e.target.value)}
                        style={{
                          border: `1px solid ${colorPago(c.estado_pago)}`,
                          borderRadius: '4px',
                          padding: '0.25rem 0.4rem',
                          fontFamily: 'inherit',
                          fontSize: '0.8rem',
                          color: colorPago(c.estado_pago),
                          fontWeight: '600',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        {ESTADOS_PAGO.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => abrirVer(c)}
                          style={{
                            ...S.btnVerde,
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          👁 Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ── MODAL NUEVA COMPRA ── */}
      {modal && (
        <>
          <div
            onClick={() => setModal(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 300 }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              backgroundColor: '#fff',
              border: '2px solid #b7996b',
              borderRadius: '8px',
              padding: '2rem',
              zIndex: 301,
              width: '95%',
              maxWidth: '800px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ color: '#334c2b', margin: 0, fontSize: '1.3rem' }}>🛒 Nueva Orden de Compra</h2>
              <button
                type="button"
                onClick={() => setModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#888' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: '#fdecea',
                  border: '1px solid #c62828',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#c62828',
                  fontSize: '0.88rem',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={S.label}>N° Compra</label>
                <input
                  style={{ ...S.input, backgroundColor: '#f9f5f0', color: '#666', fontWeight: '600' }}
                  value={form.numero_compra}
                  readOnly
                />
              </div>
              <div>
                <label style={S.label}>Proveedor *</label>
                <select
                  style={S.input}
                  value={form.proveedor_id}
                  onChange={(e) => cambiar('proveedor_id', e.target.value)}
                >
                  <option value="">— Seleccioná un proveedor —</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre_empresa}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Estado de la Orden</label>
                <select
                  style={S.input}
                  value={form.estado}
                  onChange={(e) => cambiar('estado', e.target.value)}
                >
                  {ESTADOS_COMPRA.map((e) => (
                    <option key={e} value={e}>
                      {e.charAt(0).toUpperCase() + e.slice(1)}
                    </option>
                  ))}
                </select>
                {form.estado === 'recepcionada' && (
                  <span style={{ fontSize: '0.75rem', color: '#2e7d32', fontWeight: '600', display: 'block', marginTop: '0.25rem' }}>
                    ℹ️ Se actualizará el stock y se recalculará el PPP automáticamente al guardar.
                  </span>
                )}
              </div>
              <div>
                <label style={S.label}>Estado de Pago</label>
                <select
                  style={S.input}
                  value={form.estado_pago}
                  onChange={(e) => cambiar('estado_pago', e.target.value)}
                >
                  {ESTADOS_PAGO.map((e) => (
                    <option key={e} value={e}>
                      {e.charAt(0).toUpperCase() + e.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Método de Pago</label>
                <input
                  style={S.input}
                  value={form.metodo_pago || ''}
                  onChange={(e) => cambiar('metodo_pago', e.target.value)}
                  placeholder="Transferencia Bancaria, Efectivo, Cheque..."
                />
              </div>
              <div>
                <label style={S.label}>Descuento (₲)</label>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  value={form.descuento || 0}
                  onChange={(e) => cambiar('descuento', e.target.value)}
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={S.label}>Observaciones</label>
                <textarea
                  style={{ ...S.input, minHeight: '60px', resize: 'vertical' }}
                  value={form.observaciones || ''}
                  onChange={(e) => cambiar('observaciones', e.target.value)}
                  placeholder="Detalles sobre entrega, factura o condiciones..."
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <h3 style={{ margin: 0, color: '#334c2b', fontSize: '1rem', fontWeight: '700' }}>
                  📦 Detalle de Insumos
                </h3>
                <button
                  type="button"
                  onClick={agregarLinea}
                  style={{ ...S.btnVerde, padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                >
                  + Agregar Insumo
                </button>
              </div>

              {lineas.map((l, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr auto',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    alignItems: 'end',
                    backgroundColor: '#faf7f2',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #ede4d6',
                  }}
                >
                  <div>
                    <label style={S.label}>Insumo</label>
                    <select
                      style={S.input}
                      value={l.insumo_id}
                      onChange={(e) => cambiarLinea(idx, 'insumo_id', e.target.value)}
                    >
                      <option value="">— Seleccionar insumo —</option>
                      {insumos.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} ({i.unidad_medida}) · Stock: {i.stock_actual} · PPP: {formatPYG(i.ppp_actual)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Cantidad</label>
                    <input
                      style={S.input}
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={l.cantidad}
                      onChange={(e) => cambiarLinea(idx, 'cantidad', e.target.value)}
                      placeholder="Ej. 25"
                    />
                  </div>
                  <div>
                    <label style={S.label}>Precio Unitario (₲)</label>
                    <input
                      style={S.input}
                      type="number"
                      min="0"
                      value={l.precio_unitario}
                      onChange={(e) => cambiarLinea(idx, 'precio_unitario', e.target.value)}
                      placeholder="Ej. 12000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => quitarLinea(idx)}
                    title="Eliminar fila"
                    style={{
                      ...S.btnGris,
                      padding: '0.6rem 0.8rem',
                      backgroundColor: '#c62828',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div
                style={{
                  textAlign: 'right',
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f9f5f0',
                  borderRadius: '6px',
                  border: '1px solid #b7996b',
                }}
              >
                <div style={{ color: '#666', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  Subtotal: <strong>{formatPYG(subtotal)}</strong>
                </div>
                {Number(form.descuento) > 0 && (
                  <div style={{ color: '#2e7d32', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                    Descuento: <strong>- {formatPYG(form.descuento)}</strong>
                  </div>
                )}
                <div style={{ fontSize: '1.2rem', color: '#f46e15', fontWeight: '800' }}>
                  TOTAL FINAL: {formatPYG(total)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModal(false)} style={S.btnGris}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1 }}
              >
                {guardando ? '⏳ Guardando...' : '💾 Registrar Orden de Compra'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL VER DETALLE DE COMPRA ── */}
      {modalVer && compraSeleccionada && (
        <>
          <div
            onClick={() => setModalVer(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 300 }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              backgroundColor: '#fff',
              border: '2px solid #b7996b',
              borderRadius: '8px',
              padding: '2rem',
              zIndex: 301,
              width: '95%',
              maxWidth: '750px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header del modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
                borderBottom: '2px solid #eee6d9',
                paddingBottom: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Orden de Compra
                </span>
                <h2 style={{ color: '#334c2b', margin: '0.2rem 0 0', fontFamily: 'monospace', fontSize: '1.4rem' }}>
                  {compraSeleccionada.numero_compra}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalVer(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' }}
              >
                ✕
              </button>
            </div>

            {/* Metadatos de la orden */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
                backgroundColor: '#fbf9f6',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #ede4d6',
              }}
            >
              <div>
                <span style={{ fontSize: '0.78rem', color: '#777', display: 'block' }}>Proveedor</span>
                <strong style={{ color: '#334c2b', fontSize: '0.95rem' }}>
                  {compraSeleccionada.proveedores?.nombre_empresa || '—'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#777', display: 'block' }}>Fecha de Emisión</span>
                <strong style={{ color: '#333', fontSize: '0.95rem' }}>
                  {compraSeleccionada.fecha_compra
                    ? new Date(compraSeleccionada.fecha_compra).toLocaleDateString('es-PY', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#777', display: 'block' }}>Estado de la Orden</span>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '0.2rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#fff',
                    backgroundColor: colorEstado(compraSeleccionada.estado),
                  }}
                >
                  {compraSeleccionada.estado.toUpperCase()}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#777', display: 'block' }}>Estado de Pago</span>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '0.2rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#fff',
                    backgroundColor: colorPago(compraSeleccionada.estado_pago),
                  }}
                >
                  {(compraSeleccionada.estado_pago || 'pendiente').toUpperCase()}
                </span>
              </div>
              {compraSeleccionada.metodo_pago && (
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#777', display: 'block' }}>Método de Pago</span>
                  <span style={{ color: '#444', fontSize: '0.9rem', fontWeight: '600' }}>
                    {compraSeleccionada.metodo_pago}
                  </span>
                </div>
              )}
              {compraSeleccionada.observaciones && (
                <div style={{ gridColumn: '1/-1' }}>
                  <span style={{ fontSize: '0.78rem', color: '#777', display: 'block' }}>Observaciones</span>
                  <p style={{ margin: '0.2rem 0 0', color: '#444', fontSize: '0.88rem' }}>
                    {compraSeleccionada.observaciones}
                  </p>
                </div>
              )}
            </div>

            {/* Tabla de detalle de insumos */}
            <h3 style={{ color: '#334c2b', fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              📦 Insumos Incluidos
            </h3>

            {cargandoDetalles ? (
              <p style={{ padding: '1.5rem', textAlign: 'center', color: '#888' }}>
                ⏳ Cargando desglose de insumos...
              </p>
            ) : detallesCompra.length === 0 ? (
              <p style={{ padding: '1rem', color: '#888', backgroundColor: '#f9f5f0', borderRadius: '4px' }}>
                No hay líneas de detalle registradas para esta compra.
              </p>
            ) : (
              <div style={{ ...S.card, padding: 0, overflow: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Insumo</th>
                      <th style={{ ...S.th, textAlign: 'center' }}>Cantidad</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detallesCompra.map((d, idx) => {
                      const cant = Number(d.cantidad) || 0
                      const pUnit = Number(d.precio_unitario) || 0
                      const sub = cant * pUnit
                      return (
                        <tr key={d.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#faf7f2' }}>
                          <td style={S.td}>
                            <strong style={{ color: '#334c2b' }}>{d.insumos?.nombre || 'Insumo'}</strong>
                            {d.insumos?.categoria && (
                              <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>
                                {d.insumos.categoria}
                              </span>
                            )}
                          </td>
                          <td style={{ ...S.td, textAlign: 'center', fontWeight: '600' }}>
                            {cant} {d.insumos?.unidad_medida || ''}
                          </td>
                          <td style={{ ...S.td, textAlign: 'right', color: '#666' }}>
                            {formatPYG(pUnit)}
                          </td>
                          <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: '#f46e15' }}>
                            {formatPYG(sub)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Resumen de totales */}
            <div
              style={{
                backgroundColor: '#f9f5f0',
                border: '1px solid #b7996b',
                borderRadius: '6px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ fontSize: '0.9rem', color: '#555' }}>
                Subtotal: <strong>{formatPYG(compraSeleccionada.subtotal)}</strong>
              </div>
              {Number(compraSeleccionada.descuento) > 0 && (
                <div style={{ fontSize: '0.9rem', color: '#2e7d32' }}>
                  Descuento: <strong>- {formatPYG(compraSeleccionada.descuento)}</strong>
                </div>
              )}
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f46e15', marginTop: '0.25rem' }}>
                TOTAL FINAL: {formatPYG(compraSeleccionada.total_final)}
              </div>
            </div>

            {/* Acciones del modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                {compraSeleccionada.estado !== 'recepcionada' && compraSeleccionada.estado !== 'cancelada' && (
                  <button
                    type="button"
                    disabled={procesandoRecepcion}
                    onClick={() => cambiarEstado(compraSeleccionada, 'recepcionada')}
                    style={{
                      ...S.btnVerde,
                      backgroundColor: '#2e7d32',
                      padding: '0.6rem 1.2rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      opacity: procesandoRecepcion ? 0.7 : 1,
                    }}
                  >
                    📦 {procesandoRecepcion ? 'Actualizando stock...' : 'Recepcionar Compra (Actualizar Stock & PPP)'}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setModalVer(false)}
                style={S.btnGris}
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
