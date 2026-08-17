/**
 * 📁 UBICACIÓN: src/app/checkout/page.js
 * 📅 ACTUALIZADO: 2026-08-17
 * 📌 CAMBIOS:
 *  - ✅ FIX AUDITORÍA CONVERSIÓN: ahora permite comprar como invitado (sin login).
 *  - ✅ FIX VISUAL: botón confirmar naranja, radios verdes.
 *  - ✅ VALIDACIÓN DE TELÉFONO: internacional con feedback en tiempo real.
 *  - ✅ INTEGRACIÓN N8N: Envío de datos del pedido y cliente a webhook de n8n.
 *  - ✅ FIX: captura de error en UPDATE de cliente y console.logs de debug.
 */

'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import {
  PartyPopper,
  ShoppingCart,
  FileText,
  Truck,
  Store,
  MapPin,
  Phone,
  Building2,
  Banknote,
  AlertCircle,
  Search,
  Lock,
  User,
  CheckCircle,
  XCircle,
  CreditCard,
  Sparkles
} from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────────────────
const formatPYG = n => `₲ ${Number(n || 0).toLocaleString('es-PY')}`
const WA_NUMBER = '595984589845'

const DATOS_BANCARIOS = {
  banco:    'Ueno Bank',
  titular:  'Luciana Noelia Da Silva',
  ci:       '8.971.446',
  cuenta:   '619451392',
  moneda:   'Guaraníes (GS)',
  alias:    'CI 8971446',
}

// ── Estilos compartidos ───────────────────────────────────────────────────────
const S = {
  page:     { minHeight: '100vh', backgroundColor: '#eee6d9', fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif', paddingBottom: '4rem' },
  hero:     { backgroundColor: '#334c2b', color: '#eee6d9', padding: '1rem 1.5rem', borderBottom: '3px solid #b7996b' },
  main:     { maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1rem' },
  card:     { backgroundColor: '#fff', border: '2px solid #b7996b', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.25rem' },
  head:     { backgroundColor: '#334c2b', color: '#eee6d9', padding: '0.7rem 1.25rem', fontWeight: '700', fontSize: '0.95rem' },
  body:     { padding: '1.25rem' },
  label:    { display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#b7996b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' },
  input:    { width: '100%', padding: '0.65rem 0.9rem', border: '2px solid #ddd', borderRadius: '6px', fontFamily: 'inherit', fontSize: '15px', color: '#333', marginBottom: '0.85rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' },
  inputFocus: { borderColor: '#b7996b' },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' },
  btnVerde: { backgroundColor: '#334c2b', color: '#eee6d9', border: 'none', padding: '1rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '800', fontSize: '1.1rem', width: '100%', minHeight: '52px' },
  btnNaranja: { backgroundColor: '#f46e15', color: '#fff', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '1rem', width: '100%', minHeight: '48px' },
  btnGris:  { backgroundColor: '#eee', color: '#555', border: '1px solid #ccc', padding: '0.65rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.9rem' },
  opcion:   (sel) => ({ border: `2px solid ${sel ? '#334c2b' : '#ddd'}`, borderRadius: '8px', padding: '0.9rem 1rem', cursor: 'pointer', backgroundColor: sel ? '#f5f8f4' : '#fafafa', transition: 'all 0.15s', marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }),
  radio:    (sel) => ({ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '2px', border: `3px solid ${sel ? '#334c2b' : '#ccc'}`, backgroundColor: sel ? '#334c2b' : '#fff', transition: 'all 0.15s' }),
  alert:    { padding: '0.85rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', lineHeight: '1.4' },
  err:      { backgroundColor: '#fdecea', border: '1px solid #f5c6cb', color: '#c62828' },
  ok:       { backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32' },
  info:     { backgroundColor: '#e3f2fd', border: '1px solid #bbdefb', color: '#1565c0' },
  warn:     { backgroundColor: '#fff8e1', border: '1px solid #ffe082', color: '#e65100' },
  fila:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid #f0ebe4', fontSize: '0.92rem' },
}

// ── Validación de teléfono (internacional) ──────────────────────────────
const validarTelefono = (telefono) => {
  const limpio = telefono.replace(/[\s\-\(\)\.]/g, '')
  
  if (/^\+\d{1,3}\d{6,15}$/.test(limpio)) {
    return { valido: true, mensaje: 'Número válido', pais: 'internacional' }
  }
  
  if (/^0\d{6,15}$/.test(limpio) && limpio.length >= 9) {
    return { valido: true, mensaje: 'Número válido', pais: 'local' }
  }
  
  if (/^\d{10,15}$/.test(limpio)) {
    return { valido: true, mensaje: 'Número válido', pais: 'internacional_sin_codigo' }
  }
  
  return { 
    valido: false, 
    mensaje: 'El número no es válido. Incluí el código de país (ej. +595 981 234 567 para Paraguay, +54 9 11 2345 6789 para Argentina)' 
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PANTALLA DE ÉXITO
// ════════════════════════════════════════════════════════════════════════════
function PantallaExito({ pedido }) {
  const esTransferencia = pedido.metodoPago === 'transferencia'

  const itemsTexto = pedido.items
    .map(i => `  • ${i.cantidad}x ${i.nombre} — ${formatPYG(i.precio_venta * i.cantidad)}`)
    .join('\n')

  const msgWA = encodeURIComponent(
    `¡Hola PanFree! 👋 Acabo de hacer un pedido.\n\n` +
    `*N° Pedido:* ${pedido.numeroPedido}\n` +
    `*Entrega:* ${pedido.metodoEntrega === 'delivery' ? `🛵 Delivery → ${pedido.direccion}` : '🏪 Retiro en local'}\n` +
    `*Pago:* ${esTransferencia ? '🏦 Transferencia Ueno Bank' : '💵 Efectivo al entregar'}\n\n` +
    `*Productos:*\n${itemsTexto}\n\n` +
    `*Subtotal:* ${formatPYG(pedido.subtotal)}\n` +
    (pedido.costoDelivery > 0 ? `*Envío:* ${formatPYG(pedido.costoDelivery)}\n` : `*Envío:* Gratis 🎁\n`) +
    `*TOTAL:* ${formatPYG(pedido.totalFinal)}\n\n` +
    (esTransferencia
      ? `Te adjunto el comprobante de transferencia 📎`
      : `Pago en efectivo al recibir ✅`)
  )

  const filasBancarias = [
    ['Banco',      DATOS_BANCARIOS.banco],
    ['Titular',    DATOS_BANCARIOS.titular],
    ['CI',         DATOS_BANCARIOS.ci],
    ['N° Cuenta',  DATOS_BANCARIOS.cuenta],
    ['Moneda',     DATOS_BANCARIOS.moneda],
    ['Alias',      DATOS_BANCARIOS.alias],
    ['Monto',      formatPYG(pedido.totalFinal)],
    ['Referencia', pedido.numeroPedido],
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#eee6d9', fontFamily: '"Segoe UI", sans-serif', paddingBottom: '3rem' }}>
      <div style={{ backgroundColor: '#2e7d32', color: '#fff', padding: '2.5rem 1.5rem', textAlign: 'center', borderBottom: '3px solid #b7996b' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <PartyPopper size={56} color="#fff" />
        </div>
        <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: '800' }}>¡Pedido confirmado!</h1>
        <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', opacity: 0.9 }}>
          Pedido <strong>{pedido.numeroPedido}</strong> · {pedido.nombre}
        </p>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={S.card}>
          <div style={{ ...S.head, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Resumen del pedido
          </div>
          <div style={S.body}>
            {pedido.items.map((item, i) => (
              <div key={i} style={{ ...S.fila, borderBottom: i < pedido.items.length - 1 ? '1px solid #f0ebe4' : 'none' }}>
                <span style={{ color: '#334c2b' }}>{item.cantidad}× {item.nombre}</span>
                <span style={{ fontWeight: '600' }}>{formatPYG(item.precio_venta * item.cantidad)}</span>
              </div>
            ))}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid #eee6d9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                <span>Subtotal</span><span>{formatPYG(pedido.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                <span>Envío</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {pedido.costoDelivery > 0 ? formatPYG(pedido.costoDelivery) : <><Sparkles size={14} color="#2e7d32" /> Gratis</>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.15rem', color: '#334c2b', marginTop: '0.5rem' }}>
                <span>TOTAL</span><span style={{ color: '#f46e15' }}>{formatPYG(pedido.totalFinal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ ...S.head, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={18} /> Datos de entrega
          </div>
          <div style={S.body}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.95rem', color: '#444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <strong>Método:</strong>
                {pedido.metodoEntrega === 'delivery' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Truck size={16} color="#334c2b" /> Delivery a domicilio
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Store size={16} color="#334c2b" /> Retiro en local
                  </span>
                )}
              </div>
              {pedido.metodoEntrega === 'delivery' && pedido.direccion && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <strong>Dirección:</strong> {pedido.direccion}
                </div>
              )}
              {pedido.metodoEntrega === 'retiro' && (
                <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '6px', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700' }}>
                    <MapPin size={16} color="#2e7d32" /> Vení a buscarlo a:
                  </div>
                  <div>Encarnación, Paraguay</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                    <Phone size={14} color="#2e7d32" /> +595 984 589845 — Te avisamos cuando esté listo
                  </div>
                </div>
              )}
              <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <strong>Pago:</strong>
                {esTransferencia ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Building2 size={16} color="#334c2b" /> Transferencia bancaria
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Banknote size={16} color="#334c2b" /> Efectivo al entregar
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {esTransferencia && (
          <div style={{ ...S.card, border: '2px solid #f46e15' }}>
            <div style={{ ...S.head, backgroundColor: '#f46e15', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} /> Datos para la transferencia
            </div>
            <div style={S.body}>
              <div style={{ backgroundColor: '#fff8f4', border: '1px solid #fddcbc', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
                {filasBancarias.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f0dfc8' }}>
                    <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: '600', textTransform: 'uppercase' }}>{k}</span>
                    <span style={{ fontWeight: '700', color: '#334c2b' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ backgroundColor: '#fff3e0', border: '1px solid #ffb74d', borderRadius: '6px', padding: '0.75rem', fontSize: '0.88rem', color: '#e65100', lineHeight: '1.5', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <AlertCircle size={18} color="#e65100" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Usá <strong>{pedido.numeroPedido}</strong> como referencia. Después envianos el comprobante por WhatsApp.</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ ...S.alert, ...S.info, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={16} color="#1565c0" style={{ flexShrink: 0 }} />
          <span>
            Seguí tu pedido en{' '}
            <a href={`/pedido/${pedido.numeroPedido}`} style={{ color: '#1565c0', fontWeight: '700', textDecoration: 'none' }}>
              panfree.fit/pedido/{pedido.numeroPedido}
            </a>
            {' '}— se actualiza en tiempo real.
          </span>
        </div>

        <a
          href={`https://wa.me/${WA_NUMBER}?text=${msgWA}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            backgroundColor: '#25D366', color: '#fff',
            padding: '1rem', borderRadius: '8px',
            fontWeight: '700', fontSize: '1rem', textDecoration: 'none',
            marginBottom: '1rem', minHeight: '52px',
          }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"/></svg>
          {esTransferencia ? 'Enviar comprobante por WhatsApp' : 'Confirmar pedido por WhatsApp'}
        </a>

        <a href="/" style={{ display: 'block', textAlign: 'center', color: '#b7996b', fontSize: '0.9rem', textDecoration: 'none', marginTop: '0.5rem' }}>
          ← Volver a la tienda
        </a>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL DE CHECKOUT
// ════════════════════════════════════════════════════════════════════════════
export default function PaginaCheckout() {
  const router = useRouter()
  const { usuario, loading: authLoading, abrirModal } = useAuth()
  const { carrito, total, vaciarCarrito } = useCart()

  const [datos, setDatos] = useState({
    nombre: '', email: '', telefono: '',
    direccion: '', referencia: '', zona: '',
  })
  const [metodoEntrega, setMetodoEntrega] = useState('retiro')
  const [metodoPago,    setMetodoPago]    = useState('efectivo')
  const [enviando,      setEnviando]      = useState(false)
  const [error,         setError]         = useState(null)
  const [pedidoExito,   setPedidoExito]   = useState(null)
  const [cargandoPerfil, setCargandoPerfil] = useState(false)

  const [errorTelefono, setErrorTelefono] = useState(null)
  const [telefonoValido, setTelefonoValido] = useState(false)

  const [deliveryInfo,    setDeliveryInfo]    = useState(null)
  const [calculandoEnvio, setCalculandoEnvio] = useState(false)
  const [errorDelivery,   setErrorDelivery]   = useState(null)
  const debounceRef = useRef(null)

  const costoDelivery = (() => {
    if (metodoEntrega !== 'delivery') return 0
    if (deliveryInfo?.disponible && deliveryInfo?.costo !== undefined) return deliveryInfo.costo
    return 0
  })()
  const totalFinal = total + costoDelivery
  const items = carrito

  useEffect(() => {
    if (!usuario) return
    setCargandoPerfil(true)
    supabase
      .from('clientes')
      .select('nombre_completo, email, telefono, direccion_calle, direccion_numero, direccion_ciudad')
      .eq('user_id', usuario.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const dir = [data.direccion_calle, data.direccion_numero, data.direccion_ciudad]
            .filter(Boolean).join(', ')
          setDatos(prev => ({
            ...prev,
            nombre:    data.nombre_completo || prev.nombre,
            email:     data.email           || usuario.email || prev.email,
            telefono:  data.telefono        || prev.telefono,
            direccion: dir                  || prev.direccion,
          }))
        } else {
          setDatos(prev => ({ ...prev, email: usuario.email || '' }))
        }
        setCargandoPerfil(false)
      })
  }, [usuario])

  useEffect(() => {
    if (metodoEntrega !== 'delivery') {
      setDeliveryInfo(null)
      setErrorDelivery(null)
      return
    }
    if (!datos.zona) {
      setDeliveryInfo(null)
      setErrorDelivery(null)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setCalculandoEnvio(true)
      setErrorDelivery(null)
      setDeliveryInfo(null)
      try {
        const res = await fetch('/api/calcular-delivery', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ zona: datos.zona, direccion: datos.direccion, subtotal: total }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error calculando delivery')
        setDeliveryInfo(data)
      } catch (err) {
        setErrorDelivery(err.message)
      } finally {
        setCalculandoEnvio(false)
      }
    }, 800)
    return () => clearTimeout(debounceRef.current)
  }, [datos.zona, datos.direccion, metodoEntrega, total])

  function cambiar(campo, valor) {
    setDatos(prev => ({ ...prev, [campo]: valor }))
  }

  const manejarCambioTelefono = (valor) => {
    cambiar('telefono', valor)
    
    if (valor.trim() === '') {
      setErrorTelefono(null)
      setTelefonoValido(false)
      return
    }
    
    const resultado = validarTelefono(valor)
    if (resultado.valido) {
      setErrorTelefono(null)
      setTelefonoValido(true)
    } else {
      setErrorTelefono(resultado.mensaje)
      setTelefonoValido(false)
    }
  }

  async function confirmarPedido() {
    console.log('🚀 confirmarPedido se ejecutó')
    setError(null)

    if (!datos.nombre.trim()) return setError('Ingresá tu nombre completo.')
    if (!datos.email.trim()) return setError('Ingresá tu email para recibir la confirmación.')
    if (!datos.telefono.trim()) return setError('Ingresá tu número de teléfono.')
    if (!telefonoValido && datos.telefono.trim()) {
      const resultado = validarTelefono(datos.telefono)
      return setError(resultado.mensaje)
    }
    if (metodoEntrega === 'delivery') {
      if (!datos.zona) return setError('Seleccioná tu zona de entrega.')
      if (calculandoEnvio) return setError('Esperá mientras calculamos el costo de envío.')
      if (!deliveryInfo?.disponible) return setError('La dirección ingresada está fuera de la zona de delivery.')
    }
    if (items.length === 0) return setError('Tu carrito está vacío.')

    setEnviando(true)
    try {
      console.log('📌 1. Buscando cliente por email:', datos.email.trim())
      let clienteId = null
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', datos.email.trim())
        .maybeSingle()

      if (clienteExistente) {
        console.log('📌 2. Cliente encontrado:', clienteExistente.id)
        clienteId = clienteExistente.id
        const { error: updateError } = await supabase
          .from('clientes')
          .update({
            nombre_completo: datos.nombre.trim(),
            telefono:        datos.telefono.trim() || null,
            user_id:         usuario?.id || null,
            updated_at:      new Date().toISOString(),
          })
          .eq('id', clienteId)
        
        if (updateError) {
          console.error('❌ Error al actualizar cliente:', updateError)
          throw updateError
        }
        console.log('✅ Cliente actualizado:', clienteId)
      } else {
        console.log('📌 2. Cliente no encontrado, creando nuevo...')
        const { data: nuevoCliente, error: errCliente } = await supabase
          .from('clientes')
          .insert({
            nombre_completo: datos.nombre.trim(),
            email:           datos.email.trim(),
            telefono:        datos.telefono.trim() || null,
            user_id:         usuario?.id || null,
            direccion_ciudad: 'Encarnación',
            direccion_provincia: 'Itapúa',
            is_active: true,
          })
          .select('id')
          .single()
        if (errCliente) throw errCliente
        clienteId = nuevoCliente.id
        console.log('✅ Cliente creado:', clienteId)
      }

      const direccionCompleta = metodoEntrega === 'delivery'
        ? [datos.direccion.trim(), datos.referencia.trim()].filter(Boolean).join(' — ')
        : null

      console.log('📌 3. Creando pedido...')
      const { data: pedidoDB, error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id:            clienteId,
          estado:                'pendiente',
          metodo_entrega:        metodoEntrega,
          entrega_direccion:     direccionCompleta,
          entrega_costo:         costoDelivery,
          entrega_distancia_km:  deliveryInfo?.distancia_km   || null,
          entrega_lat:           deliveryInfo?.lat            || null,
          entrega_lng:           deliveryInfo?.lng            || null,
          subtotal:              total,
          total_final:           totalFinal,
          estado_pago:           'pendiente',
          metodo_pago:           metodoPago,
          creado_por:            usuario?.id || null,
        })
        .select('id, numero_pedido')
        .single()
      if (errPedido) {
        console.error('❌ Error al crear pedido:', errPedido)
        throw errPedido
      }

      const numeroPedido = pedidoDB.numero_pedido
      console.log('✅ Pedido creado:', numeroPedido)

      console.log('📌 4. Creando detalle del pedido...')
      const detalles = items.map(item => ({
        pedido_id:       pedidoDB.id,
        producto_id:     item.id,
        cantidad:        item.cantidad,
        precio_unitario: item.precio_venta,
      }))
      const { error: errDetalle } = await supabase
        .from('detalle_pedido')
        .insert(detalles)
      if (errDetalle) throw errDetalle
      console.log('✅ Detalle creado')

      setPedidoExito({
        numeroPedido,
        metodoPago,
        metodoEntrega,
        direccion:    direccionCompleta,
        subtotal:     total,
        costoDelivery,
        totalFinal,
        nombre:       datos.nombre,
        telefono:     datos.telefono,
        items:        [...items],
      })
      vaciarCarrito()

      console.log('📌 5. Enviando a n8n...')
      const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://panfree-bot.app.n8n.cloud/webhook/pedido'
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedido: {
              numero: numeroPedido,
              total: totalFinal,
              metodoPago: metodoPago,
              metodoEntrega: metodoEntrega,
              items: items.map(i => ({
                nombre: i.nombre,
                cantidad: i.cantidad,
                precio: i.precio_venta,
              })),
            },
            cliente: {
              nombre: datos.nombre,
              email: datos.email,
              telefono: datos.telefono,
              direccion: datos.direccion,
            },
          }),
        })
        console.log('✅ Pedido enviado a n8n')
      } catch (err) {
        console.error('❌ Error al enviar a n8n:', err)
      }

    } catch (err) {
      console.error('❌ Error al crear pedido:', err)
      setError('Ocurrió un error al procesar el pedido. Intentá de nuevo o contactanos por WhatsApp.')
    } finally {
      setEnviando(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#334c2b', fontSize: '1.1rem' }}>Cargando…</p>
      </div>
    )
  }

  if (items.length === 0 && !pedidoExito) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <ShoppingCart size={48} color="#334c2b" />
          </div>
          <p style={{ color: '#334c2b', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            Tu carrito está vacío.
          </p>
          <a href="/" style={{ ...S.btnNaranja, display: 'inline-block', padding: '0.75rem 2rem', textDecoration: 'none', borderRadius: '6px' }}>
            Ver productos
          </a>
        </div>
      </div>
    )
  }

  if (pedidoExito) return <PantallaExito pedido={pedidoExito} />

  const esInvitado = !usuario

  return (
    <div style={S.page}>
      <div style={S.hero}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/" style={{ color: '#b7996b', textDecoration: 'none', fontSize: '0.9rem', flexShrink: 0 }}>← Seguir comprando</a>
          <span style={{ color: '#b7996b' }}>|</span>
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>Finalizar compra</h1>
          {esInvitado && (
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#b7996b', backgroundColor: '#eee6d9', padding: '0.2rem 0.7rem', borderRadius: '12px' }}>
              🧑‍🍳 Comprando como invitado
            </span>
          )}
        </div>
      </div>

      <div style={S.main}>
        <div style={S.card}>
          <div style={{ ...S.head, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} /> Tu pedido ({items.length} {items.length === 1 ? 'producto' : 'productos'})
          </div>
          <div style={S.body}>
            {items.map((item, i) => (
              <div key={i} style={{ ...S.fila, borderBottom: i < items.length - 1 ? '1px solid #f0ebe4' : 'none' }}>
                <span style={{ color: '#334c2b', fontSize: '0.93rem' }}>{item.cantidad}× {item.nombre}</span>
                <span style={{ fontWeight: '600', color: '#334c2b', flexShrink: 0, marginLeft: '0.5rem' }}>{formatPYG(item.precio_venta * item.cantidad)}</span>
              </div>
            ))}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid #eee6d9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                <span>Subtotal</span><span>{formatPYG(total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                <span>Envío</span>
                <span style={{ color: costoDelivery === 0 && metodoEntrega === 'delivery' ? '#2e7d32' : '#333' }}>
                  {metodoEntrega === 'retiro'
                    ? '—'
                    : calculandoEnvio
                      ? 'calculando...'
                      : deliveryInfo?.disponible
                        ? (costoDelivery === 0 ? 'Gratis' : formatPYG(costoDelivery))
                        : deliveryInfo?.disponible === false
                          ? 'Fuera de zona'
                          : 'seleccioná una zona'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.15rem', color: '#334c2b', marginTop: '0.5rem' }}>
                <span>Total</span>
                <span style={{ color: '#f46e15' }}>{formatPYG(totalFinal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ ...S.head, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} /> {esInvitado ? 'Tus datos (invitado)' : 'Tus datos'}
          </div>
          <div style={S.body}>
            {cargandoPerfil && (
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Cargando tus datos…</p>
            )}
            <div>
              <label style={S.label}>Nombre completo *</label>
              <input
                style={S.input}
                type="text"
                value={datos.nombre}
                onChange={e => cambiar('nombre', e.target.value)}
                placeholder="Tu nombre y apellido"
                autoComplete="name"
              />
            </div>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Email *</label>
                <input
                  style={S.input}
                  type="email"
                  value={datos.email}
                  onChange={e => cambiar('email', e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label style={S.label}>Teléfono *</label>
                <input
                  style={{
                    ...S.input,
                    borderColor: errorTelefono ? '#c62828' 
                      : telefonoValido ? '#2e7d32' 
                      : '#ddd',
                    backgroundColor: errorTelefono ? '#fff5f5' : '#fff',
                  }}
                  type="tel"
                  value={datos.telefono}
                  onChange={e => manejarCambioTelefono(e.target.value)}
                  placeholder="+595 984 000000"
                  autoComplete="tel"
                />
                {errorTelefono && (
                  <div style={{ 
                    color: '#c62828', 
                    fontSize: '0.8rem', 
                    marginTop: '-0.3rem',
                    marginBottom: '0.5rem',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px'
                  }}>
                    <span>⚠️</span> {errorTelefono}
                  </div>
                )}
                {telefonoValido && datos.telefono && (
                  <div style={{ 
                    color: '#2e7d32', 
                    fontSize: '0.8rem', 
                    marginTop: '-0.3rem',
                    marginBottom: '0.5rem',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px'
                  }}>
                    <span>✅</span> Número válido
                  </div>
                )}
              </div>
            </div>
            {esInvitado && (
              <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.3rem' }}>
                🔒 No necesitás contraseña. Te enviaremos la confirmación de tu pedido a este email.
              </p>
            )}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ ...S.head, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={18} /> Método de entrega
          </div>
          <div style={S.body}>
            <div style={S.opcion(metodoEntrega === 'retiro')} onClick={() => {
              setMetodoEntrega('retiro')
              setDeliveryInfo(null)
              setErrorDelivery(null)
            }}>
              <div style={S.radio(metodoEntrega === 'retiro')} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#334c2b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Store size={16} color="#334c2b" /> Retiro en local — Gratis
                </div>
                <div style={{ fontSize: '0.83rem', color: '#666', marginTop: '0.2rem' }}>
                  Encarnación, Paraguay · Te avisamos cuando esté listo
                </div>
              </div>
            </div>

            <div style={S.opcion(metodoEntrega === 'delivery')} onClick={() => {
              setMetodoEntrega('delivery')
              setDeliveryInfo(null)
              setErrorDelivery(null)
            }}>
              <div style={S.radio(metodoEntrega === 'delivery')} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#334c2b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Truck size={16} color="#334c2b" /> Delivery a domicilio
                  {deliveryInfo?.disponible && (
                    <span style={{ marginLeft: '0.5rem', fontWeight: '600', color: deliveryInfo.costo === 0 ? '#2e7d32' : '#f46e15' }}>
                      — {deliveryInfo.costo === 0 ? 'Gratis' : formatPYG(deliveryInfo.costo)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.83rem', color: '#666', marginTop: '0.2rem' }}>
                  Encarnación y Gran Encarnación · Costo según zona
                </div>
              </div>
            </div>

            {metodoEntrega === 'delivery' && (
              <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid #eee' }}>
                <div>
                  <label style={S.label}>Zona de entrega *</label>
                  <select
                    style={{
                      ...S.input,
                      borderColor: deliveryInfo?.disponible === false ? '#c62828'
                        : deliveryInfo?.disponible === true ? '#2e7d32'
                        : undefined,
                    }}
                    value={datos.zona || ''}
                    onChange={(e) => {
                      cambiar('zona', e.target.value)
                      setDeliveryInfo(null)
                      setErrorDelivery(null)
                    }}
                  >
                    <option value="">Seleccioná tu zona</option>
                    <option value="zona1">📍 Encarnación (Centro y alrededores)</option>
                    <option value="zona2">📍 Gran Encarnación (Cambyretá, Capitán Miranda, San Juan del Paraná)</option>
                  </select>

                  {datos.zona && (
                    <>
                      {calculandoEnvio && (
                        <div style={{ ...S.alert, ...S.info, marginTop: '-0.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MapPin size={16} color="#1565c0" /> Calculando costo de envío…
                        </div>
                      )}
                      {!calculandoEnvio && deliveryInfo?.disponible === true && (
                        <div style={{ ...S.alert, ...S.ok, marginTop: '-0.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle size={16} color="#2e7d32" />
                          <span>
                            {deliveryInfo.mensaje}
                            {deliveryInfo.costo > 0 && <strong> — Envío: {formatPYG(deliveryInfo.costo)}</strong>}
                            {deliveryInfo.costo === 0 && <strong> — ¡Envío gratis! 🎁</strong>}
                          </span>
                        </div>
                      )}
                      {!calculandoEnvio && deliveryInfo?.disponible === false && (
                        <div style={{ ...S.alert, ...S.err, marginTop: '-0.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <XCircle size={16} color="#c62828" /> ❌ No realizamos envíos a esta zona
                        </div>
                      )}
                      {errorDelivery && (
                        <div style={{ ...S.alert, ...S.warn, marginTop: '-0.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <AlertCircle size={16} color="#e65100" /> {errorDelivery}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={S.label}>Dirección completa (opcional)</label>
                  <input
                    style={{ ...S.input, marginBottom: 0 }}
                    type="text"
                    value={datos.direccion}
                    onChange={e => cambiar('direccion', e.target.value)}
                    placeholder="Calle, número, referencia — Ej: Av. García 1234, Villa Alegre"
                  />
                  <small style={{ fontSize: '0.7rem', color: '#999', display: 'block', marginTop: '0.3rem' }}>
                    Esto ayuda al repartidor a encontrarte más fácil
                  </small>
                </div>
                
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={S.label}>Referencias / instrucciones (opcional)</label>
                  <input
                    style={{ ...S.input, marginBottom: 0 }}
                    type="text"
                    value={datos.referencia}
                    onChange={e => cambiar('referencia', e.target.value)}
                    placeholder="Portón azul, timbre 2, dejar con portero…"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ ...S.head, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} /> Método de pago
          </div>
          <div style={S.body}>
            <div style={S.opcion(metodoPago === 'transferencia')} onClick={() => setMetodoPago('transferencia')}>
              <div style={S.radio(metodoPago === 'transferencia')} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#334c2b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building2 size={16} color="#334c2b" /> Transferencia bancaria
                </div>
                <div style={{ fontSize: '0.83rem', color: '#666', marginTop: '0.2rem' }}>
                  Ueno Bank — Confirmamos al recibir el comprobante por WhatsApp
                </div>
              </div>
            </div>

            <div style={S.opcion(metodoPago === 'efectivo')} onClick={() => setMetodoPago('efectivo')}>
              <div style={S.radio(metodoPago === 'efectivo')} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#334c2b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Banknote size={16} color="#334c2b" /> Efectivo al entregar
                </div>
                <div style={{ fontSize: '0.83rem', color: '#666', marginTop: '0.2rem' }}>
                  Pagás cuando recibís · Tener el monto exacto ayuda
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ ...S.alert, ...S.err, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={16} color="#c62828" /> {error}
          </div>
        )}

        <button
          style={{ ...S.btnNaranja, opacity: enviando ? 0.7 : 1, cursor: enviando ? 'not-allowed' : 'pointer', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => confirmarPedido()}
          disabled={enviando}
        >
          {enviando ? (
            'Procesando pedido…'
          ) : (
            <>
              <CheckCircle size={20} />
              <span>Confirmar pedido — {formatPYG(totalFinal)}</span>
            </>
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#999' }}>
          Al confirmar aceptás nuestros <a href="/terminos-y-condiciones" style={{ color: '#b7996b', textDecoration: 'none' }}>términos y condiciones</a>.
        </p>
      </div>
    </div>
  )
}