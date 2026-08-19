/**
 * 📁 UBICACIÓN: src/app/admin/pedidos/components/PedidoModal.js
 * 📅 ACTUALIZADO: 2026-08-19
 * 📌 DESCRIPCIÓN: Modal Wizard de 4 pasos para crear pedidos manuales (ej: recibidos por WhatsApp):
 *    - Paso 1: Búsqueda o creación rápida de cliente
 *    - Paso 2: Selección de productos con control de cantidades (+ / -) y subtotal en vivo
 *    - Paso 3: Selección de método de entrega (retiro/delivery) y pago (efectivo/transferencia)
 *    - Paso 4: Resumen, validación y guardado transaccional en Supabase (pedidos + detalle_pedido)
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { formatPYG, S } from '../lib/config'
import { AUDIT_ACTIONS, registrarAuditoria } from '../../lib/audit'

export default function PedidoModal({ onCerrar, onCreado }) {
  // ── Pasos del wizard ──────────────────────────────────────────────────────
  // 1: buscar/crear cliente  2: elegir productos  3: entrega y pago  4: confirmar
  const [paso, setPaso] = useState(1)

  // ── Estado cliente ────────────────────────────────────────────────────────
  const [busqCliente, setBusqCliente] = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [clienteNuevo, setClienteNuevo] = useState({ nombre: '', telefono: '', email: '' })
  const [modoNuevo, setModoNuevo] = useState(false)
  const [buscandoCli, setBuscandoCli] = useState(false)

  // ── Estado productos ──────────────────────────────────────────────────────
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([]) // [{ producto, cantidad }]
  const [cargandoProd, setCargandoProd] = useState(false)

  // ── Estado entrega/pago ───────────────────────────────────────────────────
  const [metodoEntrega, setMetodoEntrega] = useState('retiro')
  const [direccion, setDireccion] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')

  // ── Estado guardado ───────────────────────────────────────────────────────
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // Cargar productos activos al llegar al paso 2
  useEffect(() => {
    if (paso === 2 && productos.length === 0) {
      setCargandoProd(true)
      supabase
        .from('productos')
        .select('id, nombre, precio_venta, categoria, imagen_url, is_active')
        .eq('is_active', true)
        .order('categoria')
        .order('nombre')
        .then(({ data, error: err }) => {
          if (!err && data) {
            setProductos(data)
          }
          setCargandoProd(false)
        })
    }
  }, [paso, productos.length])

  // Buscar cliente por teléfono, email o nombre
  async function buscarCliente() {
    if (!busqCliente.trim()) return
    setBuscandoCli(true)
    setClienteEncontrado(null)
    setModoNuevo(false)
    const q = busqCliente.trim()

    try {
      const { data, error: err } = await supabase
        .from('clientes')
        .select('id, nombre_completo, email, telefono, user_id')
        .or(`telefono.ilike.%${q}%,email.ilike.%${q}%,nombre_completo.ilike.%${q}%`)
        .limit(5)

      if (err) throw err

      if (data && data.length > 0) {
        setClienteEncontrado(data[0])
      } else {
        setModoNuevo(true)
        if (/^\d+$/.test(q)) setClienteNuevo((prev) => ({ ...prev, telefono: q }))
        else if (q.includes('@')) setClienteNuevo((prev) => ({ ...prev, email: q }))
        else setClienteNuevo((prev) => ({ ...prev, nombre: q }))
      }
    } catch (err) {
      console.error('[PanFree] Error buscando cliente:', err)
    } finally {
      setBuscandoCli(false)
    }
  }

  // Modificar cantidad en el carrito
  function setCantidad(producto, cantidad) {
    const n = parseInt(cantidad, 10) || 0
    if (n <= 0) {
      setCarrito((prev) => prev.filter((i) => i.producto.id !== producto.id))
    } else {
      setCarrito((prev) => {
        const existe = prev.find((i) => i.producto.id === producto.id)
        if (existe) {
          return prev.map((i) =>
            i.producto.id === producto.id ? { ...i, cantidad: n } : i
          )
        }
        return [...prev, { producto, cantidad: n }]
      })
    }
  }

  function getCantidad(productoId) {
    return carrito.find((i) => i.producto.id === productoId)?.cantidad || 0
  }

  const subtotal = carrito.reduce(
    (s, i) => s + (Number(i.producto.precio_venta) || 0) * i.cantidad,
    0
  )
  const totalFinal = subtotal

  // Guardar pedido manual
  async function guardarPedido() {
    setError(null)
    setGuardando(true)
    try {
      let clienteId = clienteEncontrado?.id

      // Si es cliente nuevo, crearlo primero
      if (!clienteId) {
        if (!clienteNuevo.nombre.trim()) throw new Error('Ingresá el nombre del cliente.')
        if (!clienteNuevo.telefono.trim() && !clienteNuevo.email.trim()) {
          throw new Error('Ingresá al menos un número de teléfono o un email.')
        }

        // Verificar si ya existe por email o teléfono para evitar duplicados
        const orConditions = []
        if (clienteNuevo.telefono.trim()) orConditions.push(`telefono.eq.${clienteNuevo.telefono.trim()}`)
        if (clienteNuevo.email.trim()) orConditions.push(`email.eq.${clienteNuevo.email.trim()}`)

        if (orConditions.length > 0) {
          const { data: existe } = await supabase
            .from('clientes')
            .select('id')
            .or(orConditions.join(','))
            .limit(1)
            .maybeSingle()

          if (existe) {
            clienteId = existe.id
          }
        }

        if (!clienteId) {
          const { data: nuevo, error: errCli } = await supabase
            .from('clientes')
            .insert({
              nombre_completo: clienteNuevo.nombre.trim(),
              telefono: clienteNuevo.telefono.trim() || null,
              email: clienteNuevo.email.trim() || `wa-${Date.now()}@panfree.fit`,
              direccion_ciudad: 'Encarnación',
              direccion_provincia: 'Itapúa',
              is_active: true,
            })
            .select('id')
            .single()

          if (errCli) throw errCli
          clienteId = nuevo.id
        }
      }

      // Crear el pedido
      const direccionCompleta = metodoEntrega === 'delivery' ? direccion.trim() || null : null
      const userRes = await supabase.auth.getUser()

      const { data: pedidoDB, error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: clienteId,
          estado: 'confirmado', // Pedido manual por WA se crea confirmado
          metodo_entrega: metodoEntrega,
          entrega_direccion: direccionCompleta,
          entrega_costo: 0,
          subtotal,
          total_final: totalFinal,
          estado_pago: 'pendiente',
          metodo_pago: metodoPago,
          creado_por: userRes.data?.user?.id || null,
        })
        .select('id, numero_pedido')
        .single()

      if (errPedido) throw errPedido

      // Insertar detalle de productos
      const detalles = carrito.map((i) => ({
        pedido_id: pedidoDB.id,
        producto_id: i.producto.id,
        cantidad: i.cantidad,
        precio_unitario: Number(i.producto.precio_venta),
      }))

      const { error: errDet } = await supabase.from('detalle_pedido').insert(detalles)
      if (errDet) throw errDet

      // --- Notificar a n8n vía server-side API ---
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (process.env.NEXT_PUBLIC_API_TOKEN) {
          headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }

        await fetch('/api/notificar-pedido', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            pedido: {
              numero: pedidoDB.numero_pedido,
              total: Number(totalFinal),
              metodoPago: metodoPago,
              metodoEntrega: metodoEntrega,
              items: carrito.map((i) => ({
                nombre: i.producto.nombre,
                cantidad: Number(i.cantidad),
                precio: Number(i.producto.precio_venta),
              })),
            },
            cliente: {
              nombre: clienteEncontrado?.nombre_completo || clienteNuevo.nombre,
              email: clienteEncontrado?.email || clienteNuevo.email || null,
              telefono: clienteEncontrado?.telefono || clienteNuevo.telefono,
              direccion: metodoEntrega === 'delivery' ? direccionCompleta : null,
            },
          }),
        })
      } catch (errNotif) {
        console.warn('[n8n] Error no bloqueante al notificar pedido:', errNotif)
      }

      // Registrar en logs de auditoría
      await registrarAuditoria(AUDIT_ACTIONS.PEDIDO_CREADO, {
        numero_pedido: pedidoDB.numero_pedido,
        total: Number(totalFinal),
        metodo_entrega: metodoEntrega,
        items_count: carrito.length,
      })

      onCreado(pedidoDB.numero_pedido)
    } catch (err) {
      console.error('[PanFree] Error creando pedido manual:', err)
      setError(err.message || 'Error al crear el pedido. Intentá nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  // Estilos del modal
  const M = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    },
    box: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      width: '100%',
      maxWidth: '620px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      border: '2px solid #b7996b',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    },
    head: {
      backgroundColor: '#334c2b',
      color: '#eee6d9',
      padding: '1rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '3px solid #b7996b',
      flexShrink: 0,
    },
    body: { padding: '1.5rem', overflowY: 'auto', flex: 1 },
    foot: {
      padding: '1rem 1.5rem',
      borderTop: '2px solid #eee6d9',
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'flex-end',
      flexShrink: 0,
      backgroundColor: '#fafaf8',
    },
    label: {
      display: 'block',
      fontSize: '0.78rem',
      fontWeight: '700',
      color: '#b7996b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '0.3rem',
    },
    input: {
      width: '100%',
      padding: '0.65rem 0.9rem',
      border: '2px solid #ddd',
      borderRadius: '6px',
      fontFamily: 'inherit',
      fontSize: '15px',
      color: '#333',
      outline: 'none',
      boxSizing: 'border-box',
      marginBottom: '0.85rem',
    },
    opcion: (sel) => ({
      border: `2px solid ${sel ? '#f46e15' : '#ddd'}`,
      borderRadius: '6px',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      backgroundColor: sel ? '#fff8f4' : '#fafafa',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      transition: 'all 0.15s ease',
    }),
    radio: (sel) => ({
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      flexShrink: 0,
      border: `3px solid ${sel ? '#f46e15' : '#ccc'}`,
      backgroundColor: sel ? '#f46e15' : '#fff',
    }),
  }

  const pasos = ['Cliente', 'Productos', 'Entrega', 'Confirmar']

  return (
    <div
      style={M.overlay}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div style={M.box}>
        {/* Header del modal */}
        <div style={M.head}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.05rem' }}>📲 Nuevo pedido por WhatsApp</div>
            <div style={{ fontSize: '0.78rem', color: '#b7996b', marginTop: '0.2rem' }}>
              Paso {paso} de 4 — {pasos[paso - 1]}
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            style={{
              background: 'none',
              border: 'none',
              color: '#eee6d9',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Barra de progreso */}
        <div style={{ display: 'flex', backgroundColor: '#334c2b' }}>
          {pasos.map((p, i) => (
            <div
              key={p}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: i < paso ? '#f46e15' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Cuerpo del modal */}
        <div style={M.body}>
          {/* ── PASO 1: CLIENTE ────────────────────────────────────────── */}
          {paso === 1 && (
            <div>
              <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 0, marginBottom: '1.25rem' }}>
                Buscá al cliente por teléfono, email o nombre. Si no existe lo creamos al instante.
              </p>

              <label style={M.label}>Buscar cliente</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  style={{ ...M.input, marginBottom: 0, flex: 1 }}
                  placeholder="Teléfono, email o nombre…"
                  value={busqCliente}
                  onChange={(e) => {
                    setBusqCliente(e.target.value)
                    setClienteEncontrado(null)
                    setModoNuevo(false)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && buscarCliente()}
                />
                <button
                  type="button"
                  style={{ ...S.btnVerde, whiteSpace: 'nowrap' }}
                  onClick={buscarCliente}
                  disabled={buscandoCli}
                >
                  {buscandoCli ? '⏳ …' : '🔍 Buscar'}
                </button>
              </div>

              {/* Cliente encontrado */}
              {clienteEncontrado && (
                <div
                  style={{
                    backgroundColor: '#e8f5e9',
                    border: '2px solid #a5d6a7',
                    borderRadius: '6px',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ fontWeight: '700', color: '#2e7d32', marginBottom: '0.25rem' }}>
                    ✅ Cliente encontrado en la base de datos
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#333' }}>
                    <strong>{clienteEncontrado.nombre_completo}</strong>
                    <br />
                    {clienteEncontrado.telefono && <span>📞 {clienteEncontrado.telefono} · </span>}
                    {clienteEncontrado.email && <span>✉️ {clienteEncontrado.email}</span>}
                  </div>
                  <button
                    type="button"
                    style={{ ...S.btnGris, fontSize: '0.78rem', padding: '0.3rem 0.6rem', marginTop: '0.5rem' }}
                    onClick={() => {
                      setClienteEncontrado(null)
                      setBusqCliente('')
                      setModoNuevo(false)
                    }}
                  >
                    Cambiar cliente
                  </button>
                </div>
              )}

              {/* Formulario cliente nuevo */}
              {modoNuevo && !clienteEncontrado && (
                <div
                  style={{
                    backgroundColor: '#fff8f4',
                    border: '2px solid #fddcbc',
                    borderRadius: '6px',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ fontWeight: '700', color: '#e65100', marginBottom: '0.75rem' }}>
                    ➕ Cliente nuevo — completar datos
                  </div>
                  <label style={M.label}>Nombre completo *</label>
                  <input
                    style={M.input}
                    placeholder="Ej: María González"
                    value={clienteNuevo.nombre}
                    onChange={(e) => setClienteNuevo((p) => ({ ...p, nombre: e.target.value }))}
                  />
                  <label style={M.label}>Teléfono</label>
                  <input
                    style={M.input}
                    placeholder="Ej: 595984123456"
                    value={clienteNuevo.telefono}
                    onChange={(e) => setClienteNuevo((p) => ({ ...p, telefono: e.target.value }))}
                  />
                  <label style={M.label}>Email (opcional)</label>
                  <input
                    style={{ ...M.input, marginBottom: 0 }}
                    placeholder="maria@gmail.com"
                    value={clienteNuevo.email}
                    onChange={(e) => setClienteNuevo((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
              )}

              {!clienteEncontrado && !modoNuevo && (
                <p style={{ color: '#999', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>
                  Ingresá el teléfono, email o nombre para buscar al cliente.
                </p>
              )}
            </div>
          )}

          {/* ── PASO 2: PRODUCTOS ──────────────────────────────────────── */}
          {paso === 2 && (
            <div>
              {cargandoProd ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>⏳ Cargando productos…</p>
              ) : (
                <>
                  {/* Resumen del carrito */}
                  {carrito.length > 0 && (
                    <div
                      style={{
                        backgroundColor: '#e8f5e9',
                        border: '1px solid #a5d6a7',
                        borderRadius: '6px',
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                        fontSize: '0.88rem',
                      }}
                    >
                      🛒 <strong>{carrito.length} producto{carrito.length !== 1 ? 's' : ''}</strong> · Subtotal:{' '}
                      <strong style={{ color: '#2e7d32' }}>{formatPYG(subtotal)}</strong>
                    </div>
                  )}

                  {/* Lista de productos disponibles */}
                  {productos.map((prod) => {
                    const cant = getCantidad(prod.id)
                    return (
                      <div
                        key={prod.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.65rem 0',
                          borderBottom: '1px solid #f0ebe4',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#334c2b', fontSize: '0.9rem' }}>
                            {prod.nombre}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#b7996b', fontWeight: '600' }}>
                            {formatPYG(prod.precio_venta)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              border: '2px solid #ddd',
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onClick={() => setCantidad(prod, cant - 1)}
                          >
                            −
                          </button>
                          <span
                            style={{
                              minWidth: '24px',
                              textAlign: 'center',
                              fontWeight: '700',
                              color: cant > 0 ? '#334c2b' : '#ccc',
                            }}
                          >
                            {cant}
                          </span>
                          <button
                            type="button"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              border: '2px solid #334c2b',
                              backgroundColor: '#334c2b',
                              color: '#fff',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onClick={() => setCantidad(prod, cant + 1)}
                          >
                            +
                          </button>
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
              <div
                style={M.opcion(metodoEntrega === 'retiro')}
                onClick={() => setMetodoEntrega('retiro')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMetodoEntrega('retiro')}
              >
                <div style={M.radio(metodoEntrega === 'retiro')} />
                <div>
                  <div style={{ fontWeight: '700', color: '#334c2b' }}>🏪 Retiro en local</div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>El cliente retira personalmente</div>
                </div>
              </div>
              <div
                style={M.opcion(metodoEntrega === 'delivery')}
                onClick={() => setMetodoEntrega('delivery')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMetodoEntrega('delivery')}
              >
                <div style={M.radio(metodoEntrega === 'delivery')} />
                <div>
                  <div style={{ fontWeight: '700', color: '#334c2b' }}>🛵 Delivery a domicilio</div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>Encarnación y Gran Encarnación</div>
                </div>
              </div>

              {metodoEntrega === 'delivery' && (
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <label style={M.label}>Dirección de entrega *</label>
                  <input
                    style={M.input}
                    placeholder="Calle, número, barrio, indicaciones…"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              )}

              <label style={{ ...M.label, marginTop: '1rem' }}>Método de pago</label>
              <div
                style={M.opcion(metodoPago === 'efectivo')}
                onClick={() => setMetodoPago('efectivo')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMetodoPago('efectivo')}
              >
                <div style={M.radio(metodoPago === 'efectivo')} />
                <div>
                  <div style={{ fontWeight: '700', color: '#334c2b' }}>💵 Efectivo contra entrega</div>
                </div>
              </div>
              <div
                style={M.opcion(metodoPago === 'transferencia')}
                onClick={() => setMetodoPago('transferencia')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMetodoPago('transferencia')}
              >
                <div style={M.radio(metodoPago === 'transferencia')} />
                <div>
                  <div style={{ fontWeight: '700', color: '#334c2b' }}>🏦 Transferencia bancaria (SIPAP)</div>
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 4: CONFIRMAR ──────────────────────────────────────── */}
          {paso === 4 && (
            <div>
              <h3 style={{ margin: '0 0 1.25rem', color: '#334c2b', fontSize: '1.1rem' }}>
                Resumen del Pedido Manual
              </h3>

              {/* Cliente */}
              <div
                style={{
                  backgroundColor: '#f5f0ea',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <strong>👤 Cliente:</strong> {clienteEncontrado?.nombre_completo || clienteNuevo.nombre}
                <br />
                {(clienteEncontrado?.telefono || clienteNuevo.telefono) && (
                  <span>📞 {clienteEncontrado?.telefono || clienteNuevo.telefono}</span>
                )}
              </div>

              {/* Productos */}
              <div style={{ marginBottom: '1rem' }}>
                {carrito.map((i) => (
                  <div
                    key={i.producto.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.9rem',
                      padding: '0.35rem 0',
                      borderBottom: '1px solid #f0ebe4',
                    }}
                  >
                    <span style={{ color: '#334c2b' }}>
                      <strong>{i.cantidad}×</strong> {i.producto.nombre}
                    </span>
                    <span style={{ fontWeight: '600' }}>
                      {formatPYG(i.producto.precio_venta * i.cantidad)}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: '800',
                    color: '#334c2b',
                    fontSize: '1.05rem',
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '2px solid #eee6d9',
                  }}
                >
                  <span>Total a cobrar</span>
                  <span style={{ color: '#f46e15' }}>{formatPYG(totalFinal)}</span>
                </div>
              </div>

              {/* Entrega y pago */}
              <div
                style={{
                  backgroundColor: '#f5f0ea',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.7',
                }}
              >
                <div>
                  <strong>Entrega:</strong>{' '}
                  {metodoEntrega === 'retiro' ? '🏪 Retiro en local' : '🛵 Delivery a domicilio'}
                  {metodoEntrega === 'delivery' && direccion ? ` — ${direccion}` : ''}
                </div>
                <div>
                  <strong>Pago:</strong>{' '}
                  {metodoPago === 'efectivo' ? '💵 Efectivo contra entrega' : '🏦 Transferencia bancaria'}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    backgroundColor: '#fdecea',
                    border: '1px solid #f5c6cb',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    marginTop: '1rem',
                    color: '#c62828',
                    fontSize: '0.88rem',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con botones de navegación */}
        <div style={M.foot}>
          {paso > 1 && (
            <button
              type="button"
              style={S.btnGris}
              onClick={() => {
                setPaso((p) => p - 1)
                setError(null)
              }}
            >
              ← Atrás
            </button>
          )}
          <button type="button" style={S.btnGris} onClick={onCerrar}>
            Cancelar
          </button>

          {paso < 4 && (
            <button
              type="button"
              style={{
                ...S.btnVerde,
                opacity:
                  (paso === 1 && !clienteEncontrado && !modoNuevo) ||
                  (paso === 2 && carrito.length === 0)
                    ? 0.5
                    : 1,
              }}
              disabled={
                (paso === 1 && !clienteEncontrado && !modoNuevo) ||
                (paso === 2 && carrito.length === 0)
              }
              onClick={() => setPaso((p) => p + 1)}
            >
              Siguiente →
            </button>
          )}

          {paso === 4 && (
            <button
              type="button"
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
