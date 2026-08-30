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
import { FavoritosProvider } from '@/context/FavoritosContext'
import CartSidebar from '../components/CartSidebar'
import AuthModal from '../components/AuthModal'
import ErrorBoundary from '../components/ErrorBoundary'
import UserGreeting from '@/components/UserGreeting'
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
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
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