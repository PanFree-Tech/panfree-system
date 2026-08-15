/**
 * UBICACION: src/app/layout-client.js
 * OPTIMIZACIONES MOBILE:
 *  - Header con padding reducido en móvil (clase header-inner)
 *  - Logo con clase para ocultar texto en pantallas muy pequeñas
 *  - Botón carrito con área táctil mínima de 44px
 *  - Footer con clase footer-inner para padding responsive
 * CAMBIOS 2026-03-03:
 *  - SVG logos de WhatsApp e Instagram embebidos inline (sin dependencias externas)
 *  - Header: iconos de WhatsApp e Instagram como links de contacto
 *  - Footer: links a WhatsApp e Instagram con logos + texto
 *  - CartSidebar: botón WhatsApp con logo SVG oficial
 * CAMBIOS 2026-03-04:
 *  - Header: integración de useAuth para mostrar "Mi cuenta" o "Ingresar"
 *  - Header: botón de cuenta con clase .header-cuenta-texto para ocultar en móvil (<480px)
 * CAMBIOS 2026-03-07:
 *  - ✅ NUEVO: FloatingCartButton (botón flotante en móvil)
 *  - ✅ NUEVO: SlideCart (carrito deslizable)
 *  - ✅ NUEVO: ToastNotification (notificaciones emergentes)
 * CAMBIOS 2026-08-15:
 *  - ✅ NUEVO: CartInitializer (inicialización del carrito global)
 */
'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { CartProvider, useCart } from '../context/CartContext'
import CartSidebar from '../components/CartSidebar'
import AuthModal from '../components/AuthModal'

// ✅ NUEVO: Componentes del carrito flotante
import FloatingCartButton from '@/components/FloatingCartButton'
import SlideCart from '@/components/SlideCart'
import ToastNotification from '@/components/ToastNotification'

// ============================================
// INICIALIZACIÓN DEL CARRITO GLOBAL
// ============================================
function CartInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (!window.__PANFREE_CART) {
      const listeners = new EventTarget()
      const toastListeners = new EventTarget()
      const STORAGE_KEY = 'panfree_cart_v1'
      const saved = localStorage.getItem(STORAGE_KEY)
      const items = saved ? JSON.parse(saved) : []

      const save = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        listeners.dispatchEvent(new CustomEvent('update'))
      }

      window.__PANFREE_CART = {
        items,
        listeners,
        toastListeners,
        isOpen: false,
        subscribe(fn) { listeners.addEventListener('update', fn) },
        unsubscribe(fn) { listeners.removeEventListener('update', fn) },
        open() {
          window.__PANFREE_CART.isOpen = true
          listeners.dispatchEvent(new CustomEvent('open', { detail: true }))
        },
        close() {
          window.__PANFREE_CART.isOpen = false
          listeners.dispatchEvent(new CustomEvent('close', { detail: false }))
        },
        getItems() { return [...items] },
        getCount() { return items.reduce((s, it) => s + (it.quantity || 1), 0) },
        getTotal() { return items.reduce((s, it) => s + (it.quantity || 1) * (it.price || 0), 0) },
        addItem(product) {
          const idx = items.findIndex((i) => i.id === product.id)
          if (idx >= 0) {
            items[idx].quantity = (items[idx].quantity || 1) + (product.quantity || 1)
          } else {
            items.push({ ...product, quantity: product.quantity || 1 })
          }
          save()
        },
        updateQuantity(id, quantity) {
          const idx = items.findIndex((i) => i.id === id)
          if (idx >= 0) {
            items[idx].quantity = quantity
            if (items[idx].quantity <= 0) items.splice(idx, 1)
            save()
          }
        },
        removeItem(id) {
          const idx = items.findIndex((i) => i.id === id)
          if (idx >= 0) {
            items.splice(idx, 1)
            save()
          }
        },
        clear() {
          items.length = 0
          save()
        },
        showToast(msg) {
          toastListeners.dispatchEvent(new CustomEvent('toast', { detail: msg }))
        },
        onToast(fn) { toastListeners.addEventListener('toast', fn) },
        offToast(fn) { toastListeners.removeEventListener('toast', fn) },
      }
    }
  }, [])

  return null
}

// ─── SVG logos oficiales inline ───────────────────────────────────────────────

function IconWhatsApp({ size = 24, color = '#25D366' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"
        fill={color}
      />
    </svg>
  )
}

function IconInstagram({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#FCAF45" />
          <stop offset="50%" stopColor="#F77737" />
          <stop offset="75%" stopColor="#F56040" />
          <stop offset="100%" stopColor="#C13584" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-gradient)" />
      <rect x="6" y="6" width="12" height="12" rx="3" ry="3" fill="none" stroke="#fff" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.5" />
      <circle cx="17" cy="7" r="1.2" fill="#fff" />
    </svg>
  )
}

// ─── Constantes de contacto ────────────────────────────────────────────────────
const WA_URL             = 'https://wa.me/595984589845'
const IG_URL             = 'https://www.instagram.com/panfree.py'
const ENVIO_GRATIS_DESDE = 50000  // ₲ 50.000

// ─── Layout principal ──────────────────────────────────────────────────────────
export default function LayoutClient({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Header />
        <BannerEnvioGratis />
        <main>{children}</main>
        <CartSidebar />
        <AuthModal />
        <Footer />

        {/* ✅ NUEVO: Componentes del carrito flotante */}
        <CartInitializer />
        <FloatingCartButton />
        <SlideCart />
        <ToastNotification />
      </CartProvider>
    </AuthProvider>
  )
}

// ─── Banner envío gratis ───────────────────────────────────────────────────────
function BannerEnvioGratis() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin') || pathname === '/checkout') return null
  return (
    <div style={{
      backgroundColor: '#334c2b', color: '#eee6d9',
      textAlign: 'center', padding: '0.45rem 1rem',
      fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0.3px',
      borderBottom: '2px solid #b7996b',
    }}>
      🎁 <strong>Envío gratis</strong> en compras desde{' '}
      <strong>₲ {ENVIO_GRATIS_DESDE.toLocaleString('es-PY')}</strong>
      {' '}· Encarnación y Gran Encarnación
    </div>
  )
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header() {
  const { cantidadItems, setVisible } = useCart()
  const { usuario, abrirModal }       = useAuth()

  return (
    <header style={{
      backgroundColor: '#eee6d9',
      color: '#334c2b',
      boxShadow: '0 2px 8px rgba(51,76,43,0.15)',
      borderBottom: '3px solid #334c2b',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="header-inner" style={{
        padding: '0.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>

        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', flexShrink: 0 }}>
          <img
            className="header-logo-img"
            src="/images/logo-panfree.svg"
            alt="PanFree"
            width={80} height={80}
            style={{ objectFit: 'contain', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <div className="header-logo-text">
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#334c2b', lineHeight: '1.3' }}>
              Panificados Sin Gluten
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8f9a44', fontStyle: 'italic' }}>
              El placer de volver a comer libremente
            </div>
          </div>
        </a>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          {/* WhatsApp */}
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp" title="WhatsApp"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', borderRadius: '4px', padding: '0.3rem', transition: 'opacity 0.2s' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            <IconWhatsApp size={28} />
          </a>

          {/* Instagram */}
          <a href={IG_URL} target="_blank" rel="noopener noreferrer" aria-label="Seguinos en Instagram" title="Instagram @panfree.py"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', borderRadius: '4px', padding: '0.3rem', transition: 'opacity 0.2s' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            <IconInstagram size={28} />
          </a>

          {/* Separador */}
          <div style={{ width: '1px', height: '28px', backgroundColor: '#b7996b', margin: '0 0.25rem' }} />

          {/* Inicio */}
          <a href="/" style={{ color: '#334c2b', fontWeight: '600', fontSize: '0.95rem', padding: '0.4rem 0.6rem', borderRadius: '4px', textDecoration: 'none', display: 'flex', alignItems: 'center', minHeight: '44px' }}>
            Inicio
          </a>

          {/* Mi Cuenta */}
          {usuario ? (
            <a href="/perfil" title="Mi cuenta"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#334c2b', fontWeight: '600', fontSize: '0.9rem', padding: '0.4rem 0.7rem', borderRadius: '4px', textDecoration: 'none', minHeight: '44px', border: '1px solid #b7996b', backgroundColor: 'rgba(183,153,107,0.12)' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(183,153,107,0.25)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(183,153,107,0.12)'}
            >
              <span style={{ fontSize: '1rem' }}>👤</span>
              <span className="header-cuenta-texto">Mi cuenta</span>
            </a>
          ) : (
            <button onClick={() => abrirModal()} title="Iniciar sesión"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'transparent', color: '#334c2b', fontWeight: '600', fontSize: '0.9rem', padding: '0.4rem 0.7rem', borderRadius: '4px', border: '1px solid #b7996b', cursor: 'pointer', fontFamily: 'inherit', minHeight: '44px' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(183,153,107,0.15)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontSize: '1rem' }}>👤</span>
              <span className="header-cuenta-texto">Ingresar</span>
            </button>
          )}

          {/* Carrito */}
          <button onClick={() => setVisible(true)} aria-label={`Carrito, ${cantidadItems} productos`}
            style={{ backgroundColor: '#334c2b', color: '#eee6d9', border: '2px solid #b7996b', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative', minHeight: '44px', minWidth: '44px' }}
          >
            🛒
            {cantidadItems > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#c62828', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', border: '2px solid #eee6d9' }}>
                {cantidadItems}
              </span>
            )}
          </button>

          {/* Link admin oculto */}
          <a href="/admin/login" style={{ color: 'rgba(51,76,43,0.35)', fontSize: '1.1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', minHeight: '44px', padding: '0 0.3rem' }}>🍀</a>

        </nav>
      </div>
    </header>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ backgroundColor: '#334c2b', color: '#eee6d9', marginTop: '3rem' }}>
      <div className="footer-inner" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Fila principal */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem'
        }}>

          {/* Marca */}
          <div>
            <p style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.4rem' }}>PanFree Encarnación</p>
            <p style={{ color: '#8f9a44', fontSize: '0.85rem', fontStyle: 'italic' }}>
              El placer de volver a comer libremente
            </p>
          </div>

          {/* Contacto */}
          <div>
            <p style={{ fontWeight: '600', fontSize: '0.85rem', color: '#b7996b', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Contacto
            </p>
            <p style={{ color: '#eee6d9', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              📍 Encarnación, Paraguay
            </p>
            <a href="tel:+595984589845" style={{
              color: '#eee6d9', textDecoration: 'none', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              📞 +595 984 589845
            </a>
          </div>

          {/* Redes sociales */}
          <div>
            <p style={{ fontWeight: '600', fontSize: '0.85rem', color: '#b7996b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Seguinos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

              {/* WhatsApp */}
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  color: '#eee6d9', textDecoration: 'none', fontSize: '0.9rem',
                  transition: 'color 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.color = '#25D366'}
                onMouseOut={e => e.currentTarget.style.color = '#eee6d9'}
              >
                <IconWhatsApp size={22} color="#25D366" />
                WhatsApp
              </a>

              {/* Instagram */}
              <a
                href={IG_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  color: '#eee6d9', textDecoration: 'none', fontSize: '0.9rem',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                <IconInstagram size={22} />
                @panfree.py
              </a>

            </div>
          </div>
        </div>

        {/* Línea separadora */}
        <div style={{ borderTop: '1px solid rgba(183,153,107,0.3)', paddingTop: '1rem', textAlign: 'center' }}>
          <p style={{ color: '#8f9a44', fontSize: '0.75rem' }}>
            © 2026 PanFree. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}