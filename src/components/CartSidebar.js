/**
 * UBICACION: src/components/CartSidebar.js
 * ACTUALIZADO: 2026-03-03
 * CAMBIOS:
 *  - Botón principal: "Finalizar compra" → /checkout
 *  - Botón secundario: WhatsApp (mantiene flujo anterior como alternativa)
 *  - Si no está autenticado al hacer checkout → abre modal de login primero
 *  - Post-login redirige a /checkout automáticamente
 */
'use client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const WHATSAPP_NUMERO = '595984589845'

function IconWhatsApp({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function CartSidebar() {
  const { carrito, visible, setVisible, eliminarDelCarrito, actualizarCantidad, total, vaciarCarrito } = useCart()
  const { estaAutenticado, abrirModal, usuario } = useAuth()

  const formatPYG = n => `₲ ${Number(n).toLocaleString('es-PY')}`

  // ── Ir al checkout (CTA principal) ───────────────────────────────────────
  function irAlCheckout() {
    if (!estaAutenticado) {
      abrirModal(() => {
        setVisible(false)
        window.location.href = '/checkout'
      })
      return
    }
    setVisible(false)
    window.location.href = '/checkout'
  }

  // ── WhatsApp (opción alternativa) ────────────────────────────────────────
  function confirmarPorWhatsApp() {
    if (carrito.length === 0) return
    if (!estaAutenticado) {
      abrirModal(() => confirmarPorWhatsApp())
      return
    }
    const nombre = usuario?.user_metadata?.nombre || usuario?.email || 'Cliente'
    const lineas = carrito.map(item =>
      `• ${item.nombre} x${item.cantidad} — ${formatPYG(item.subtotal)}`
    ).join('\n')
    const mensaje =
      `¡Hola PanFree! 🍞 Quiero realizar el siguiente pedido:\n\n` +
      `${lineas}\n\n` +
      `*TOTAL: ${formatPYG(total)}*\n\n` +
      `Nombre: ${nombre}\n` +
      `Email: ${usuario?.email || ''}\n\n` +
      `Por favor confirmame disponibilidad y método de entrega. ¡Gracias!`
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer')
  }

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setVisible(false)}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 200, cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      />

      {/* Panel lateral */}
      <div
        className="cart-sidebar"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: '420px',
          backgroundColor: '#fff', zIndex: 201,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(51,76,43,0.2)',
          borderLeft: '3px solid #b7996b',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#334c2b', color: '#eee6d9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '3px solid #b7996b',
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>🛒 Tu Carrito</h2>
          <button
            onClick={() => setVisible(false)}
            aria-label="Cerrar carrito"
            style={{
              background: 'none', border: 'none', color: '#eee6d9',
              fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1,
              minWidth: '44px', minHeight: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Lista de items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', WebkitOverflowScrolling: 'touch' }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#999' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛒</p>
              <p style={{ fontSize: '1rem' }}>Tu carrito está vacío</p>
              <button
                onClick={() => setVisible(false)}
                style={{
                  marginTop: '1rem', backgroundColor: '#f46e15', color: '#fff',
                  border: 'none', padding: '0.65rem 1.25rem', borderRadius: '4px',
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.9rem',
                }}
              >
                Ver productos
              </button>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} style={{
                display: 'flex', gap: '0.75rem', padding: '0.75rem 0',
                borderBottom: '1px solid #eee6d9', alignItems: 'center',
              }}>
                {/* Imagen o placeholder */}
                <div style={{
                  width: '52px', height: '52px', flexShrink: 0,
                  borderRadius: '4px', overflow: 'hidden',
                  backgroundColor: '#f5f0ea', border: '1px solid #e0d5c5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.imagen_url
                    ? <img src={item.imagen_url} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                    : <span style={{ fontSize: '1.5rem' }}>🍞</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#334c2b', fontSize: '0.9rem', lineHeight: '1.3' }}>
                    {item.nombre}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', color: '#f46e15', fontWeight: 700, fontSize: '0.95rem' }}>
                    {formatPYG(item.subtotal)}
                  </p>
                  <p style={{ margin: '0.1rem 0 0', color: '#999', fontSize: '0.78rem' }}>
                    {formatPYG(item.precio_venta)} c/u
                  </p>
                </div>

                {/* Controles cantidad */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                  <button
                    onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                    aria-label="Reducir cantidad"
                    style={{
                      width: 36, height: 36, border: '2px solid #b7996b',
                      borderRadius: 4, cursor: 'pointer', background: '#f9f5f0',
                      fontWeight: 700, fontSize: '1.1rem', color: '#334c2b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >−</button>
                  <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600, fontSize: '1rem', color: '#334c2b' }}>
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    aria-label="Aumentar cantidad"
                    style={{
                      width: 36, height: 36, border: '2px solid #b7996b',
                      borderRadius: 4, cursor: 'pointer', background: '#f9f5f0',
                      fontWeight: 700, fontSize: '1.1rem', color: '#334c2b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >+</button>
                  <button
                    onClick={() => eliminarDelCarrito(item.id)}
                    aria-label="Eliminar producto"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#c62828', fontSize: '1.1rem',
                      minWidth: '36px', minHeight: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >🗑</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con total y botones */}
        {carrito.length > 0 && (
          <div style={{
            padding: '1rem 1.25rem',
            borderTop: '2px solid #b7996b',
            backgroundColor: '#f9f5f0',
            flexShrink: 0,
          }}>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, color: '#334c2b', fontSize: '1rem' }}>Total</span>
              <span style={{ fontWeight: 800, color: '#334c2b', fontSize: '1.3rem' }}>
                {formatPYG(total)}
              </span>
            </div>

            {/* CTA principal: Finalizar compra */}
            <button
              onClick={irAlCheckout}
              style={{
                width: '100%', padding: '0.9rem 1rem',
                backgroundColor: '#f46e15', color: '#fff',
                border: 'none', borderRadius: '4px',
                cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: '800', fontSize: '1.05rem',
                marginBottom: '0.6rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              ✅ Finalizar compra
            </button>

            {/* Secundario: WhatsApp */}
            <button
              onClick={confirmarPorWhatsApp}
              style={{
                width: '100%', padding: '0.7rem 1rem',
                backgroundColor: '#25D366', color: '#fff',
                border: 'none', borderRadius: '4px',
                cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: '700', fontSize: '0.9rem',
                marginBottom: '0.6rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              <IconWhatsApp size={18} /> Consultar por WhatsApp
            </button>

            {/* Vaciar carrito */}
            <button
              onClick={vaciarCarrito}
              style={{
                width: '100%', padding: '0.5rem',
                background: 'none', border: 'none',
                color: '#999', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.82rem',
                textDecoration: 'underline',
              }}
            >
              Vaciar carrito
            </button>

          </div>
        )}
      </div>
    </>
  )
}