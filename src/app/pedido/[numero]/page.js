/**
 * 📁 UBICACIÓN: src/app/pedido/[numero]/page.js
 * 📅 CREADO: 2026-03-12
 * 📌 DESCRIPCIÓN: Tracking público de pedido para el cliente.
 *    - Acceso por número de pedido + verificación de email (seguridad mínima)
 *    - Actualización en tiempo real con Supabase Realtime
 *    - Muestra progreso visual de estados
 *    - Detalle de productos, total, método de entrega y pago
 *    - Sin login requerido (acceso público verificado)
 *
 *    URL: /pedido/PF-2026-0001
 * ⚠️  En caso de modificación significativa, actualizar este comentario.
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

// ── Configuración de estados ──────────────────────────────────────────────────
const ESTADOS = [
  { key: 'pendiente',      label: 'Recibido',       emoji: '📥', desc: 'Tu pedido fue recibido y está esperando confirmación.' },
  { key: 'confirmado',     label: 'Confirmado',      emoji: '✅', desc: 'Confirmamos tu pedido. Pronto comenzamos la preparación.' },
  { key: 'en_produccion',  label: 'En preparación',  emoji: '👩‍🍳', desc: 'Estamos horneando tu pedido con mucho cariño.' },
  { key: 'listo',          label: 'Listo',            emoji: '📦', desc: 'Tu pedido está listo para entregar o retirar.' },
  { key: 'entregado',      label: 'Entregado',        emoji: '🎉', desc: '¡Tu pedido fue entregado! Gracias por elegirnos.' },
]

const ESTADO_CANCELADO = { key: 'cancelado', label: 'Cancelado', emoji: '❌', desc: 'Este pedido fue cancelado. Contactanos por WhatsApp si tenés dudas.' }

const COLORES = {
  pendiente     : { bg: '#fff8e1', text: '#e65100', border: '#ffe082' },
  confirmado    : { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
  en_produccion : { bg: '#e3f2fd', text: '#1565c0', border: '#bbdefb' },
  listo         : { bg: '#f3e5f5', text: '#6a1b9a', border: '#e1bee7' },
  entregado     : { bg: '#e8f5e9', text: '#1b5e20', border: '#a5d6a7' },
  cancelado     : { bg: '#fde8e8', text: '#c62828', border: '#f5c6c6' },
}

const WA_NUM   = '595984589845'
const formatPYG = n => `₲ ${Math.round(Number(n || 0)).toLocaleString('es-PY')}`
const formatFecha = s => {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const S = {
  page  : { minHeight: '100vh', backgroundColor: '#eee6d9', fontFamily: '"Segoe UI", sans-serif', paddingBottom: '3rem' },
  header: { backgroundColor: '#334c2b', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  wrap  : { maxWidth: '680px', margin: '0 auto', padding: '1.25rem 1rem' },
  card  : { backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e8dfd4', marginBottom: '1rem', overflow: 'hidden' },
  head  : { backgroundColor: '#f5f0ea', padding: '0.75rem 1.25rem', fontWeight: '700', color: '#334c2b', fontSize: '0.95rem', borderBottom: '1px solid #e8dfd4' },
  body  : { padding: '1.25rem' },
  label : { display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#555', marginBottom: '0.3rem', marginTop: '0.75rem' },
  input : { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #d4c9bb', borderRadius: '6px', fontSize: '0.92rem', fontFamily: '"Segoe UI", sans-serif', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' },
  fila  : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', fontSize: '0.9rem' },
  alert : (tipo) => {
    const c = { ok: { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' }, err: { bg: '#fde8e8', text: '#c62828', border: '#f5c6c6' }, warn: { bg: '#fff8e1', text: '#e65100', border: '#ffe082' } }[tipo]
    return { padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.88rem', backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }
  },
  btnVerde: { width: '100%', padding: '0.85rem', backgroundColor: '#334c2b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: '"Segoe UI", sans-serif' },
  btnWA  : { display: 'block', width: '100%', padding: '0.75rem', backgroundColor: '#25d366', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'none', textAlign: 'center', fontFamily: '"Segoe UI", sans-serif', marginBottom: '0.5rem' },
}

// ── Barra de progreso de estados ──────────────────────────────────────────────
function BarraEstado({ estadoActual }) {
  if (estadoActual === 'cancelado') {
    return (
      <div style={{ ...S.alert('err'), display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{ESTADO_CANCELADO.emoji}</span>
        <div>
          <div style={{ fontWeight: '700' }}>Pedido cancelado</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{ESTADO_CANCELADO.desc}</div>
        </div>
      </div>
    )
  }

  const idxActual = ESTADOS.findIndex(e => e.key === estadoActual)
  const estadoInfo = ESTADOS[idxActual] || ESTADOS[0]

  return (
    <div>
      {/* Alerta del estado actual */}
      <div style={{ ...S.alert('ok'), display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
        <span style={{ fontSize: '1.75rem' }}>{estadoInfo.emoji}</span>
        <div>
          <div style={{ fontWeight: '800', fontSize: '1rem' }}>{estadoInfo.label}</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.2rem', opacity: 0.85 }}>{estadoInfo.desc}</div>
        </div>
      </div>

      {/* Línea de progreso */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '0.5rem' }}>
        {ESTADOS.map((e, idx) => {
          const completado = idx <= idxActual
          const esActual   = idx === idxActual
          return (
            <div key={e.key} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              {/* Círculo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
                <div style={{
                  width         : esActual ? '36px' : '28px',
                  height        : esActual ? '36px' : '28px',
                  borderRadius  : '50%',
                  backgroundColor: completado ? '#334c2b' : '#e0d8cf',
                  display       : 'flex',
                  alignItems    : 'center',
                  justifyContent: 'center',
                  fontSize      : esActual ? '1rem' : '0.8rem',
                  fontWeight    : '700',
                  color         : completado ? '#fff' : '#999',
                  boxShadow     : esActual ? '0 0 0 3px #b7996b' : 'none',
                  transition    : 'all 0.3s',
                  zIndex        : 1,
                }}>
                  {completado && !esActual ? '✓' : e.emoji}
                </div>
              </div>
              {/* Línea conectora */}
              {idx < ESTADOS.length - 1 && (
                <div style={{
                  flex            : 1,
                  height          : '3px',
                  backgroundColor : idx < idxActual ? '#334c2b' : '#e0d8cf',
                  transition      : 'background-color 0.3s',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
        {ESTADOS.map((e, idx) => (
          <div key={e.key} style={{
            flex      : 1,
            textAlign : 'center',
            fontSize  : '0.68rem',
            color     : idx <= idxActual ? '#334c2b' : '#aaa',
            fontWeight: idx === idxActual ? '700' : '400',
          }}>
            {e.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pantalla de verificación ──────────────────────────────────────────────────
function PantallaVerificacion({ numero, onVerificado }) {
  const [email,       setEmail]       = useState('')
  const [verificando, setVerificando] = useState(false)
  const [error,       setError]       = useState(null)

  async function verificar() {
    if (!email.trim()) { setError('Ingresá tu email.'); return }
    setVerificando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pedidos')
        .select(`
          id, numero_pedido, estado, estado_pago, metodo_entrega, metodo_pago,
          subtotal, total_final, entrega_costo, entrega_direccion, created_at,
          clientes ( nombre_completo, email, telefono )
        `)
        .eq('numero_pedido', numero)
        .single()

      if (err || !data) {
        setError('No encontramos ese número de pedido.')
        return
      }

      // Verificar que el email coincide con el del cliente
      const emailCliente = data.clientes?.email?.toLowerCase()
      if (emailCliente !== email.trim().toLowerCase()) {
        setError('El email no coincide con el pedido. Verificá los datos.')
        return
      }

      onVerificado(data)
    } catch {
      setError('Error al verificar. Intentá de nuevo.')
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.5rem' }}>🍞</a>
        <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>Seguimiento de pedido</h1>
      </div>
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.head}>🔍 Verificar identidad</div>
          <div style={S.body}>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 0 }}>
              Para proteger tu privacidad, confirmá el email con el que realizaste el pedido.
            </p>

            <div style={{ ...S.alert('warn'), marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <span>📦</span>
              <span>Pedido <strong>{numero}</strong></span>
            </div>

            <label style={S.label}>Tu email *</label>
            <input
              style={S.input}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null) }}
              placeholder="ana@email.com"
              autoComplete="email"
              onKeyDown={e => e.key === 'Enter' && verificar()}
            />

            {error && (
              <div style={{ ...S.alert('err'), marginTop: '0.75rem' }}>⚠️ {error}</div>
            )}

            <button
              style={{ ...S.btnVerde, marginTop: '1rem', opacity: verificando ? 0.7 : 1 }}
              onClick={verificar}
              disabled={verificando}
            >
              {verificando ? '⏳ Verificando…' : '🔍 Ver mi pedido'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: '#999' }}>
              ¿Problemas para acceder?{' '}
              <a href={'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent('Hola! Quiero consultar sobre mi pedido ' + numero)}
                style={{ color: '#f46e15', textDecoration: 'none', fontWeight: '600' }}>
                Contactanos por WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pantalla de detalle de pedido ──────────────────────────────────────────────
function DetallePedido({ pedidoInicial, numero }) {
  const [pedido,   setPedido]   = useState(pedidoInicial)
  const [detalles, setDetalles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const channelRef = useRef(null)

  // Cargar detalle de productos
  useEffect(() => {
    async function cargarDetalle() {
      const { data } = await supabase
        .from('detalle_pedido')
        .select('id, cantidad, precio_unitario, subtotal, productos(nombre, imagen_url)')
        .eq('pedido_id', pedido.id)
      setDetalles(data || [])
      setLoading(false)
    }
    cargarDetalle()
  }, [pedido.id])

  // Supabase Realtime: escuchar cambios de estado
  useEffect(() => {
    // Limpiar canal anterior si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`pedido-${pedido.id}`)
      .on(
        'postgres_changes',
        {
          event : 'UPDATE',
          schema: 'public',
          table : 'pedidos',
          filter: `id=eq.${pedido.id}`,
        },
        payload => {
          setPedido(prev => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pedido.id])

  const estadoColor = COLORES[pedido.estado] || COLORES.pendiente

  const msgWA = encodeURIComponent(
    `Hola! Quiero consultar sobre mi pedido *${pedido.numero_pedido}*.\n\nEstado actual: ${pedido.estado}`
  )

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.5rem' }}>🍞</a>
        <div>
          <div style={{ fontWeight: '700', fontSize: '1rem' }}>Seguimiento de pedido</div>
          <div style={{ fontSize: '0.82rem', opacity: 0.8 }}>{pedido.numero_pedido}</div>
        </div>
      </div>

      <div style={S.wrap}>

        {/* Badge Realtime */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#2e7d32' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2e7d32', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Actualización en tiempo real
        </div>

        {/* Progreso */}
        <div style={S.card}>
          <div style={S.head}>Estado del pedido</div>
          <div style={S.body}>
            <BarraEstado estadoActual={pedido.estado} />
          </div>
        </div>

        {/* Info del pedido */}
        <div style={S.card}>
          <div style={S.head}>📋 Detalles del pedido</div>
          <div style={S.body}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>N° Pedido</div>
                <div style={{ fontWeight: '800', color: '#334c2b', fontSize: '1rem' }}>{pedido.numero_pedido}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</div>
                <div style={{ fontWeight: '600', color: '#555', fontSize: '0.88rem' }}>{formatFecha(pedido.created_at)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entrega</div>
                <div style={{ fontWeight: '600', color: '#334c2b' }}>
                  {pedido.metodo_entrega === 'delivery' ? '🛵 Delivery' : '🏪 Retiro en local'}
                </div>
                {pedido.entrega_direccion && (
                  <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '0.2rem' }}>📍 {pedido.entrega_direccion}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pago</div>
                <div style={{ fontWeight: '600', color: '#334c2b' }}>
                  {pedido.metodo_pago === 'transferencia' ? '🏦 Transferencia' : '💵 Efectivo'}
                </div>
                <div style={{
                  display: 'inline-block', marginTop: '0.2rem',
                  fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px',
                  backgroundColor: pedido.estado_pago === 'aprobado' ? '#e8f5e9' : '#fff8e1',
                  color: pedido.estado_pago === 'aprobado' ? '#2e7d32' : '#e65100',
                }}>
                  {pedido.estado_pago === 'aprobado' ? '✓ Confirmado' : '⏳ Pendiente'}
                </div>
              </div>
            </div>

            {/* Productos */}
            <div style={{ borderTop: '1px solid #eee6d9', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              {loading ? (
                <div style={{ color: '#999', fontSize: '0.88rem', textAlign: 'center', padding: '0.75rem 0' }}>
                  Cargando productos...
                </div>
              ) : (
                detalles.map((d, i) => (
                  <div key={d.id} style={{ ...S.fila, borderBottom: i < detalles.length - 1 ? '1px solid #f0ebe4' : 'none', fontSize: '0.88rem' }}>
                    <span style={{ color: '#555' }}>{d.cantidad}× {d.productos?.nombre || '—'}</span>
                    <span style={{ fontWeight: '600' }}>{formatPYG(d.subtotal)}</span>
                  </div>
                ))
              )}

              {/* Totales */}
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid #eee6d9' }}>
                <div style={{ ...S.fila, color: '#666', fontSize: '0.88rem' }}>
                  <span>Subtotal</span><span>{formatPYG(pedido.subtotal)}</span>
                </div>
                {Number(pedido.entrega_costo) > 0 && (
                  <div style={{ ...S.fila, color: '#666', fontSize: '0.88rem' }}>
                    <span>Envío</span><span>{formatPYG(pedido.entrega_costo)}</span>
                  </div>
                )}
                {Number(pedido.entrega_costo) === 0 && pedido.metodo_entrega === 'delivery' && (
                  <div style={{ ...S.fila, color: '#2e7d32', fontSize: '0.88rem' }}>
                    <span>Envío</span><span>🎁 Gratis</span>
                  </div>
                )}
                <div style={{ ...S.fila, fontWeight: '800', fontSize: '1.1rem', color: '#334c2b', marginTop: '0.25rem' }}>
                  <span>TOTAL</span><span>{formatPYG(pedido.total_final)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA WhatsApp */}
        <a
          href={`https://wa.me/${WA_NUM}?text=${msgWA}`}
          target="_blank"
          rel="noopener noreferrer"
          style={S.btnWA}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462z"/>
          </svg>
          Consultar por WhatsApp
        </a>

        <a href="/" style={{ display: 'block', textAlign: 'center', color: '#b7996b', fontSize: '0.88rem', textDecoration: 'none' }}>
          ← Volver a la tienda
        </a>

        {/* CSS para animación del dot Realtime */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
        `}</style>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PaginaSeguimientoPedido({ params }) {
  const numero = params?.numero?.toUpperCase() || ''

  const [verificado, setVerificado] = useState(false)
  const [pedido,     setPedido]     = useState(null)
  const [noExiste,   setNoExiste]   = useState(false)

  // Verificar si el número tiene formato válido PF-YYYY-XXXX
  const formatoValido = /^PF-\d{4}-\d{4}$/.test(numero)

  if (!formatoValido) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <a href="/" style={{ color: '#fff', textDecoration: 'none' }}>🍞</a>
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>Seguimiento de pedido</h1>
        </div>
        <div style={S.wrap}>
          <div style={{ ...S.card, ...S.body }}>
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#c62828' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>❓</div>
              <p style={{ fontWeight: '700' }}>Número de pedido inválido.</p>
              <p style={{ fontSize: '0.88rem', color: '#666' }}>El formato correcto es PF-2026-0001</p>
              <a href="/" style={{ color: '#f46e15', textDecoration: 'none', fontWeight: '600' }}>← Volver a la tienda</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function handleVerificado(data) {
    setPedido(data)
    setVerificado(true)
  }

  if (!verificado) {
    return <PantallaVerificacion numero={numero} onVerificado={handleVerificado} />
  }

  return <DetallePedido pedidoInicial={pedido} numero={numero} />
}