/**
📁 UBICACIÓN: src/app/layout-client.js
📌 DESCRIPCIÓN: Layout general del cliente para PanFree.
Header con botón de menú hamburguesa y Drawer lateral animado.
Integración de contextos AuthProvider, CartProvider y FavoritosProvider.
Carrito unificado (CartSidebar), BottomNav móvil, AuthModal y ToastNotification.
Google Analytics 4, Microsoft Clarity y Footer completo.
*/
'use client'
import React, { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { CartProvider, useCart } from '../context/CartContext'
import { FavoritosProvider } from '@/context/FavoritosContext' // <-- Nuevo import
import CartSidebar from '../components/CartSidebar'
import AuthModal from '../components/AuthModal'
import ErrorBoundary from '../components/ErrorBoundary'
import { UserGreeting } from '@/components/UserGreeting'
import BottomNav from '@/components/BottomNav'
import ToastNotification from '@/components/ToastNotification'
import { Shield, Menu } from 'lucide-react'
import GAScript from '../components/GAScript'
import { useAnalytics } from '../hooks/useAnalytics'
import ClarityScript from '../components/ClarityScript'
import { useDrawer } from '../hooks/useDrawer'
import Drawer from '../components/layout/Drawer'

// ─── SVG logos oficiales inline ───────────────────────────────────────────────
function IconWhatsApp({ size = 24, color = '#25D366' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
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

// ─── Constantes ───────────────────────────────────────────────────────────────
const WA_URL             = 'https://wa.me/595984589845'
const IG_URL             = 'https://www.instagram.com/panfree.py'
const ENVIO_GRATIS_DESDE = 50000 // ₲ 50.000

// ─── Función para resolver logo ──────────────────────────────────────────────
function resolverLogoTienda(data) {
  if (!data) return '/images/logo-panfree.svg'
  if (data.logo_variante_activa) {
    let variantes = []
    if (Array.isArray(data.logo_variantes)) {
      variantes = data.logo_variantes
    } else if (typeof data.logo_variantes === 'string') {
      try { variantes = JSON.parse(data.logo_variantes) } catch {}
    }
    const found = variantes.find(v => v.id === data.logo_variante_activa || v.url === data.logo_variante_activa)
    if (found?.url) return found.url
    if (data.logo_variante_activa.startsWith('http')) return data.logo_variante_activa
  }
  if (data.usar_logo_rosa && data.logo_rosa_url) return data.logo_rosa_url
  if (data.logo_url) return data.logo_url
  return '/images/logo-panfree.svg'
}

// ─── Tracker de páginas vistas (GA4) ────────────────────────────────────────
function AnalyticsPageTracker() {
  const pathname = usePathname()
  const { pageview } = useAnalytics()
  useEffect(() => {
    if (typeof pageview === 'function') {
      pageview(pathname)
    }
  }, [pathname, pageview])
  return null
}

// ─── Layout principal ──────────────────────────────────────────────────────────
export default function LayoutClient({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritosProvider>
          <LayoutContent>{children}</LayoutContent>
        </FavoritosProvider>
      </CartProvider>
    </AuthProvider>
  )
}

// ─── Contenido del Layout ──────────────────────────────────────────────────────
function LayoutContent({ children }) {
  const pathname = usePathname()
  const { cantidadItems, setVisible } = useCart()
  const { usuario } = useAuth()
  const { isOpen, openDrawer, closeDrawer } = useDrawer()
  const [logoActual, setLogoActual] = useState('/images/logo-panfree.svg')
  const role = usuario?.raw_user_meta_data?.role || usuario?.user_metadata?.role || usuario?.app_metadata?.role
  const isAdmin = role === 'admin'

  // Ocultar header en admin y auth
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return <>{children}</>
  }

  // Cargar logo dinámico
  useEffect(() => {
    supabase
      .from('configuracion_sitio')
      .select('logo_url, logo_variantes, logo_variante_activa, logo_rosa_url, usar_logo_rosa')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          const logoResuelto = resolverLogoTienda(data)
          setLogoActual(logoResuelto)
        }
      })
      .catch(() => {})
  }, [])

  // Soporte para long-press en móvil
  const timerRef = useRef(null)
  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin'
      }
    }, 1200)
  }
  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }
  const handleDoubleClick = (e) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      window.location.href = '/admin'
    }
  }

  return (
    <>
      <GAScript />
      <AnalyticsPageTracker />
      <ClarityScript />
      {/* ============================================================ */}
      {/* HEADER con Logo + Hamburguesa + Redes + Carrito */}
      {/* ============================================================ */}
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
          {/* Izquierda: Hamburguesa + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Botón Hamburguesa (solo móvil) */}
            <button
              onClick={openDrawer}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={24} className="text-[#334c2b]" />
            </button>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <a
                href={isAdmin ? '/admin' : '/'}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
                title={isAdmin ? 'Panel de Administración PanFree' : 'PanFree — Inicio (Doble clic o mantener presionado para Admin)'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    className="header-logo-img"
                    src={logoActual}
                    alt="PanFree"
                    width={54} height={54}
                    style={{ objectFit: 'contain', display: 'block' }}
                    onError={e => {
                      if (e.target.src !== '/images/logo-panfree.svg') {
                        e.target.src = '/images/logo-panfree.svg'
                      }
                    }}
                  />
                  {isAdmin && (
                    <span
                      title="Sesión de Administrador activa"
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#2e7d32',
                        border: '2px solid #ffffff',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        display: 'block',
                      }}
                    />
                  )}
                </div>
                <div className="header-logo-text">
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#334c2b', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    PanFree
                    {isAdmin && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        backgroundColor: '#334c2b',
                        color: '#eee6d9',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}>
                        Admin
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8f9a44', fontWeight: 600 }}>
                    100% Sin Gluten · Encarnación
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Centro: Navegación (solo desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            <a href="/catalogo" className="text-sm font-medium text-gray-600 hover:text-[#334c2b] transition">Catálogo</a>
            <a href="/sobre-nosotros" className="text-sm font-medium text-gray-600 hover:text-[#334c2b] transition">Nosotros</a>
            <a href="/contacto" className="text-sm font-medium text-gray-600 hover:text-[#334c2b] transition">Contacto</a>
          </nav>

          {/* Derecha: Acciones */}
          <div className="flex items-center gap-1">
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="header-social-desktop p-2 hover:bg-gray-100 rounded-full transition">
              <IconWhatsApp size={22} color="#25D366" />
            </a>
            <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="header-social-desktop p-2 hover:bg-gray-100 rounded-full transition">
              <IconInstagram size={22} />
            </a>
            <div className="header-social-desktop" style={{ width: '1px', height: '24px', backgroundColor: '#b7996b', margin: '0 0.25rem' }} />
            <UserGreeting />
            {/* Carrito */}
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
              <span className="header-cart-text" style={{ display: 'inline' }}>Carrito</span>
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
          </div>
        </div>
      </header>

      {/* Drawer lateral */}
      <Drawer isOpen={isOpen} onClose={closeDrawer} />
      
      {/* Banner de envío gratis */}
      <BannerEnvioGratis />
      
      {/* Contenido principal */}
      <ErrorBoundary>
        <main>{children}</main>
      </ErrorBoundary>
      
      {/* Carrito, Auth, Footer, BottomNav, Toast */}
      <CartSidebar />
      <AuthModal />
      <Footer />
      <BottomNav />
      <ToastNotification />
    </>
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

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const [logoFooter, setLogoFooter] = useState('/images/logo-panfree.svg')
  useEffect(() => {
    supabase
      .from('configuracion_sitio')
      .select('logo_url, logo_variantes, logo_variante_activa, logo_rosa_url, usar_logo_rosa')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          const logoResuelto = resolverLogoTienda(data)
          setLogoFooter(logoResuelto)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <footer style={{ backgroundColor: '#334c2b', color: '#eee6d9', marginTop: '3.5rem', borderTop: '2px solid #b7996b' }}>
      <div className="footer-inner" style={{ padding: '2.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem'
        }}>
          <div style={{ maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                backgroundColor: '#eee6d9',
                borderRadius: '6px',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #b7996b',
              }}>
                <img
                  src={logoFooter}
                  alt="PanFree"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={e => {
                    if (e.target.src !== '/images/logo-panfree.svg') {
                      e.target.src = '/images/logo-panfree.svg'
                    }
                  }}
                />
              </div>
              <p style={{ fontWeight: '800', fontSize: '1.2rem', margin: 0, color: '#eee6d9' }}>
                PanFree Encarnación
              </p>
            </div>
            <p style={{ color: '#d0c5b4', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
              El placer de volver a comer libremente. Panificados, dulces y salados 100% artesanales sin gluten.
            </p>
          </div>
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
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#b7996b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Atención Directa
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
        <div style={{ borderTop: '1px solid rgba(183,153,107,0.3)', paddingTop: '1.25rem' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1.5rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
          }}>
            <a href="/politica-de-privacidad" style={{ color: '#b7996b', textDecoration: 'none' }}>Política de Privacidad</a>
            <a href="/eliminar-datos" style={{ color: '#b7996b', textDecoration: 'none' }}>Eliminar Datos</a>
            <a href="/terminos-y-condiciones" style={{ color: '#b7996b', textDecoration: 'none' }}>Términos y Condiciones</a>
            <a href="/sobre-nosotros" style={{ color: '#b7996b', textDecoration: 'none' }}>Sobre Nosotros</a>
            <a href="/canjear" style={{ color: '#b7996b', textDecoration: 'none' }}>🎁 Canjear Díptico</a>
            <a
              href="https://www.dinapi.gov.py/portal/v3/noticias/detalle-noticia?idNoticia=261"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#b7996b', textDecoration: 'none' }}
            >
              🏅 Certificado Oficial SIN GLUTEN
            </a>
            <a
              href="/admin"
              style={{ color: '#b7996b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Shield size={14} /> Panel Admin
            </a>
          </div>
          <p style={{ color: '#b7996b', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>
            © 2026 PanFree. Panadería Artesanal Libre de Gluten. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}