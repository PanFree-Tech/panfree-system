/**
UBICACION: src/app/layout-client.js
OPTIMIZACIONES VISUALES Y ESTRUCTURALES:
Unificación de Carrito en un único CartSidebar (eliminado SlideCart y FloatingCartButton duplicados)
Navegación inferior fija en móvil (BottomNav) con 4 accesos: Inicio, Buscar, Carrito, WhatsApp
Regla 60-30-10 estricta en Header y Footer
Header limpio con acceso rápido a catálogo, WhatsApp, usuario y carrito
✅ AGREGADO: enlaces legales en el footer (Política de Privacidad, Eliminar Datos, Términos y Condiciones)
✅ AGREGADO: enlace a Certificado Oficial SIN GLUTEN (DINAPI) en el footer
✅ AGREGADO: enlace a Sobre Nosotros en el footer
*/
'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider, useCart } from '../context/CartContext'
import CartSidebar from '../components/CartSidebar'
import AuthModal from '../components/AuthModal'
import ErrorBoundary from '../components/ErrorBoundary'
import { UserGreeting } from '@/components/UserGreeting'
import BottomNav from '@/components/BottomNav'
import ToastNotification from '@/components/ToastNotification'
// ─── NUEVO: Integración de Google Analytics 4 ───────────────────────────────
import GAScript from '../components/GAScript'
import { useAnalytics } from '../hooks/useAnalytics'
import ClarityScript from '../components/ClarityScript'

// ─── SVG logos oficiales inline ───────────────────────────────────────────────
function IconWhatsApp({ size = 24, color = '#25D366' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.5 07-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247 .218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"
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

// ─── Tracker de páginas vistas (GA4) ────────────────────────────────────────
function AnalyticsPageTracker() {
  const pathname = usePathname()
  const { pageview } = useAnalytics()

  React.useEffect(() => {
    pageview(pathname)
  }, [pathname, pageview])

  return null
}

// ─── Layout principal ──────────────────────────────────────────────────────────
export default function LayoutClient({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        {/* Google Analytics 4 — carga condicionada a consentimiento */}
        <GAScript />
        <AnalyticsPageTracker />
        <ClarityScript />
        <Header />
        <BannerEnvioGratis />
        <ErrorBoundary>
          <main>{children}</main>
        </ErrorBoundary>
        {/* Carrito Unificado */}
        <CartSidebar />
        {/* Modal de autenticación */}
        <AuthModal />
        <Footer />
        {/* Navegación inferior fija en móvil */}
        <BottomNav />
        {/* Notificaciones */}
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
      backgroundColor: '#334c2b',
      color: '#eee6d9',
      textAlign: 'center',
      padding: '0.45rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      letterSpacing: '0.3px',
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
  return (
    <header style={{
      backgroundColor: '#eee6d9',
      color: '#334c2b',
      boxShadow: '0 2px 8px rgba(51,76,43,0.12)',
      borderBottom: '2px solid #b7996b',
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
            width={54} height={54}
            style={{ objectFit: 'contain', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <div className="header-logo-text">
            <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#334c2b', lineHeight: '1.2' }}>
              PanFree
            </div>
            <div style={{ fontSize: '0.78rem', color: '#8f9a44', fontWeight: 600 }}>
              100% Sin Gluten · Encarnación
            </div>
          </div>
        </a>
        {/* Nav Escritorio */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* WhatsApp */}
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp" title="WhatsApp"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', borderRadius: '6px', padding: '0.3rem', transition: 'opacity 0.2s' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            <IconWhatsApp size={26} />
          </a>
          {/* Instagram */}
          <a href={IG_URL} target="_blank" rel="noopener noreferrer" aria-label="Seguinos en Instagram" title="Instagram @panfree.py"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', borderRadius: '6px', padding: '0.3rem', transition: 'opacity 0.2s' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            <IconInstagram size={26} />
          </a>
          {/* Separador */}
          <div style={{ width: '1px', height: '24px', backgroundColor: '#b7996b', margin: '0 0.25rem' }} />
          {/* Inicio */}
          <a href="/" style={{ color: '#334c2b', fontWeight: '700', fontSize: '0.92rem', padding: '0.4rem 0.6rem', borderRadius: '4px', textDecoration: 'none', display: 'flex', alignItems: 'center', minHeight: '44px' }}>
            Catálogo
          </a>
          {/* UserGreeting */}
          <UserGreeting />
          {/* Botón Carrito Header */}
          <button
            onClick={() => setVisible(true)}
            aria-label={`Carrito, ${cantidadItems} productos`}
            style={{
              backgroundColor: '#334c2b',
              color: '#eee6d9',
              border: '1.5px solid #b7996b',
              borderRadius: '6px',
              padding: '0.5rem 0.9rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: '700',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              position: 'relative',
              minHeight: '44px',
              minWidth: '44px',
              transition: 'background-color 0.2s ease',
            }}
          >
            <span>🛒</span>
            <span style={{ display: 'inline' }}>Carrito</span>
            {cantidadItems > 0 && (
              <span style={{
                backgroundColor: '#c62828',
                color: '#ffffff',
                borderRadius: '10px',
                minWidth: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '0 5px',
                marginLeft: '2px',
              }}>
                {cantidadItems}
              </span>
            )}
          </button>
          {/* Link admin sutil */}
          <a
            href="/admin/login"
            aria-label="Panel de administración"
            style={{ color: 'rgba(51,76,43,0.25)', fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', minHeight: '44px', padding: '0 0.2rem' }}
          >
            🍀
          </a>
        </nav>
      </div>
    </header>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ backgroundColor: '#334c2b', color: '#eee6d9', marginTop: '3.5rem', borderTop: '2px solid #b7996b' }}>
      <div className="footer-inner" style={{ padding: '2.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Fila principal */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem'
        }}>
          {/* Marca */}
          <div style={{ maxWidth: '320px' }}>
            <p style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '0.35rem', color: '#eee6d9' }}>
              PanFree Encarnación
            </p>
            <p style={{ color: '#d0c5b4', fontSize: '0.88rem', lineHeight: '1.5' }}>
              El placer de volver a comer libremente. Panificados, dulces y salados 100% artesanales sin gluten.
            </p>
          </div>
          {/* Contacto */}
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#b7996b', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Ubicación & Pedidos
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
            <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#b7996b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Atención Directa
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
                <IconWhatsApp size={20} color="#25D366" />
                WhatsApp Encargos
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
                <IconInstagram size={20} />
                @panfree.py
              </a>
            </div>
          </div>
        </div>
        {/* Línea separadora */}
        <div style={{ borderTop: '1px solid rgba(183,153,107,0.3)', paddingTop: '1.25rem' }}>
          {/* Enlaces legales */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1.5rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
          }}>
            <a
              href="/politica-de-privacidad"
              style={{ color: '#b7996b', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = '#eee6d9'}
              onMouseOut={e => e.currentTarget.style.color = '#b7996b'}
            >
              Política de Privacidad
            </a>
            <a
              href="/eliminar-datos"
              style={{ color: '#b7996b', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = '#eee6d9'}
              onMouseOut={e => e.currentTarget.style.color = '#b7996b'}
            >
              Eliminar Datos
            </a>
            <a
              href="/terminos-y-condiciones"
              style={{ color: '#b7996b', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = '#eee6d9'}
              onMouseOut={e => e.currentTarget.style.color = '#b7996b'}
            >
              Términos y Condiciones
            </a>
            {/* NUEVO: Sobre Nosotros */}
            <a
              href="/sobre-nosotros"
              style={{ color: '#b7996b', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = '#eee6d9'}
              onMouseOut={e => e.currentTarget.style.color = '#b7996b'}
            >
              Sobre Nosotros
            </a>
            {/* NUEVO: Certificado Oficial */}
            <a
              href="https://www.dinapi.gov.py/portal/v3/noticias/detalle-noticia?idNoticia=261"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#b7996b', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = '#eee6d9'}
              onMouseOut={e => e.currentTarget.style.color = '#b7996b'}
            >
              🏅 Certificado Oficial SIN GLUTEN
            </a>
          </div>
          {/* Copyright */}
          <p style={{ color: '#b7996b', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>
            © 2026 PanFree. Panadería Artesanal Libre de Gluten. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}