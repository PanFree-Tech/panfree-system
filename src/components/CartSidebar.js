'use client'
import React, { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  X,
  PartyPopper,
  ShoppingBag,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'

const WHATSAPP_NUMERO = '595984589845'
const META_ENVIO_GRATIS = 50000

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
  const router = useRouter()
  const { carrito, visible, setVisible, eliminarDelCarrito, actualizarCantidad, total, vaciarCarrito } = useCart()
  const { estaAutenticado, abrirModal, usuario } = useAuth()
  const { removeFromCart } = useAnalytics()

  const formatPYG = (n) => `₲ ${Number(n || 0).toLocaleString('es-PY')}`

  useEffect(() => {
    if (!visible) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setVisible(false)
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, setVisible])

  const irAlCheckout = useCallback(() => {
    console.log('🛒 Navegando a checkout con router.push()')
    if (!estaAutenticado) {
      abrirModal(() => {
        setVisible(false)
        router.push('/checkout')
      })
      return
    }
    setVisible(false)
    router.push('/checkout')
  }, [estaAutenticado, abrirModal, setVisible, router])

  const confirmarPorWhatsApp = useCallback(() => {
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
  }, [carrito, estaAutenticado, abrirModal, usuario, total])

  const manejarEliminar = useCallback((item) => {
    removeFromCart(item, item.cantidad)
    eliminarDelCarrito(item.id)
  }, [removeFromCart, eliminarDelCarrito])

  const manejarDecrementar = useCallback((item) => {
    const nuevaCantidad = item.cantidad - 1
    if (nuevaCantidad < 1) { 
      manejarEliminar(item)
      return 
    }
    removeFromCart(item, 1)
    actualizarCantidad(item.id, nuevaCantidad)
  }, [removeFromCart, actualizarCantidad, manejarEliminar])

  if (!visible) return null

  const faltanteEnvio = Math.max(0, META_ENVIO_GRATIS - total)
  const porcentajeEnvio = Math.min(100, Math.round((total / META_ENVIO_GRATIS) * 100))

  return (
    <>
      <div
        id="cart-drawer-backdrop"
        onClick={() => setVisible(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(51, 76, 43, 0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 200,
          cursor: 'pointer',
          animation: 'fadeIn 0.2s ease-out forwards',
        }}
      />
      <aside
        id="cart-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className="cart-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#ffffff',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-6px 0 24px rgba(51, 76, 43, 0.2)',
          borderLeft: '1px solid #e0d5c5',
        }}
      >
        <div
          style={{
            padding: '1.1rem 1.25rem',
            backgroundColor: '#334c2b',
            color: '#eee6d9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            borderBottom: '2px solid #b7996b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart size={22} color="#eee6d9" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#eee6d9' }}>
              Tu Carrito
            </h2>
          </div>
          <button
            id="cart-close-btn"
            onClick={() => setVisible(false)}
            aria-label="Cerrar carrito"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#eee6d9',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease',
            }}
          >
            <X size={22} />
          </button>
        </div>

        <div
          id="free-shipping-bar-container"
          style={{
            backgroundColor: '#f9f5f0',
            borderBottom: '1px solid #eee6d9',
            padding: '0.85rem 1.25rem',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334c2b' }}>
              {faltanteEnvio > 0 ? (
                <>Te faltan <strong>{formatPYG(faltanteEnvio)}</strong> para <strong>Envío Gratis</strong></>
              ) : (
                <span style={{ color: '#2e7d32', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <PartyPopper size={16} color="#2e7d32" /> ¡Tenés Envío Gratis en tu compra!
                </span>
              )}
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8f9a44' }}>
              {porcentajeEnvio}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '7px',
              backgroundColor: '#e5dec9',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${porcentajeEnvio}%`,
                height: '100%',
                backgroundColor: faltanteEnvio === 0 ? '#2e7d32' : '#8f9a44',
                borderRadius: '4px',
                transition: 'width 0.4s ease, background-color 0.4s ease',
              }}
            />
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#6b7a5a' }}>
            Válido para Encarnación y Gran Encarnación (meta {formatPYG(META_ENVIO_GRATIS)})
          </p>
        </div>

        <div
          id="cart-items-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 1.25rem',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#666' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <ShoppingBag size={48} color="#334c2b" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#334c2b', fontSize: '1.15rem' }}>
                Tu carrito está vacío
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#777', lineHeight: 1.5 }}>
                Descubrí nuestros deliciosos panificados y dulces 100% libres de gluten.
              </p>
              <button
                id="cart-empty-cta"
                onClick={() => setVisible(false)}
                style={{
                  marginTop: '1.5rem',
                  backgroundColor: '#f46e15',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px rgba(244, 110, 21, 0.25)',
                }}
              >
                Ver Catálogo
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {carrito.map((item) => (
                <div
                  key={item.id}
                  id={`cart-item-${item.id}`}
                  style={{
                    display: 'flex',
                    gap: '0.85rem',
                    padding: '0.75rem',
                    backgroundColor: '#fdfbf8',
                    borderRadius: '8px',
                    border: '1px solid #eee6d9',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      flexShrink: 0,
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: '#eee6d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e0d5c5',
                    }}
                  >
                    {item.imagen_url || item.image ? (
                      <img
                        src={item.imagen_url || item.image}
                        alt={item.nombre || item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <ShoppingBag size={24} color="#334c2b" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        color: '#334c2b',
                        fontSize: '0.92rem',
                        lineHeight: '1.3',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.nombre || item.name}
                    </h4>
                    <p style={{ margin: '0.2rem 0 0', color: '#334c2b', fontWeight: 700, fontSize: '0.95rem' }}>
                      {formatPYG(item.subtotal || (item.precio_venta || item.price || 0) * item.cantidad)}
                    </p>
                    <p style={{ margin: '0.1rem 0 0', color: '#888', fontSize: '0.78rem' }}>
                      {formatPYG(item.precio_venta || item.price)}
                      {item.unidad_medida && item.unidad_medida !== 'unidad'
                        ? ` / ${item.unidad_medida}`
                        : ' c/u'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    <button
                      onClick={() => manejarDecrementar(item)}
                      aria-label={`Reducir cantidad de ${item.nombre}`}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #b7996b',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: '#ffffff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#334c2b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        minWidth: '24px',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        color: '#334c2b',
                      }}
                    >
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                      aria-label={`Aumentar cantidad de ${item.nombre}`}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #b7996b',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: '#ffffff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#334c2b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => manejarEliminar(item)}
                      aria-label={`Eliminar ${item.nombre} del carrito`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#c62828',
                        fontSize: '1rem',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '0.15rem',
                      }}
                    >
                      <Trash2 size={16} color="#c62828" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {carrito.length > 0 && (
          <div
            id="cart-drawer-footer"
            style={{
              padding: '1.1rem 1.25rem',
              borderTop: '1px solid #e0d5c5',
              backgroundColor: '#fdfbf8',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: '#334c2b', fontSize: '0.95rem', display: 'block' }}>
                  Subtotal
                </span>
                <span style={{ fontSize: '0.78rem', color: '#777' }}>
                  (Impuestos incluidos)
                </span>
              </div>
              <span style={{ fontWeight: 800, color: '#334c2b', fontSize: '1.35rem' }}>
                {formatPYG(total)}
              </span>
            </div>
            <button
              id="cart-checkout-btn"
              onClick={irAlCheckout}
              style={{
                width: '100%',
                padding: '0.95rem 1.25rem',
                backgroundColor: '#f46e15',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 800,
                fontSize: '1.05rem',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 3px 10px rgba(244, 110, 21, 0.3)',
                transition: 'transform 0.15s ease, background-color 0.2s ease',
              }}
            >
              <CheckCircle size={18} /> Finalizar Compra
            </button>
            <button
              id="cart-whatsapp-btn"
              onClick={confirmarPorWhatsApp}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: '#334c2b',
                border: '2px solid #b7996b',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '0.85rem',
                marginBottom: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.2s ease',
              }}
            >
              <IconWhatsApp size={18} /> Pedir por WhatsApp
            </button>
            <div style={{ textAlign: 'center' }}>
              <button
                id="cart-clear-btn"
                onClick={vaciarCarrito}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textDecoration: 'underline',
                  padding: '0.3rem',
                }}
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}