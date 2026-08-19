/**
 * 📁 UBICACIÓN: src/app/admin/layout.js
 * 📅 ACTUALIZADO: 2026-08-19 (FASE 6: UX Y MONITOREO)
 * 📌 DESCRIPCIÓN: Layout del panel administrativo con Sidebar colapsable,
 *    navegación modular completa, verificación de rol admin y notificaciones en tiempo real.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  Croissant,
  BookOpen,
  ShoppingCart,
  Wheat,
  Users,
  Building2,
  Factory,
  DollarSign,
  Settings,
  Megaphone,
  TrendingUp,
  HelpCircle,
  Globe,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import NotificacionesAdmin from './notificaciones'
import { AUDIT_ACTIONS, registrarAuditoria } from './lib/audit'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [verificando, setVerificando] = useState(true)
  const [adminConfirmado, setAdminConfirmado] = useState(false)
  const [sidebarAbierto, setSidebarAbierto] = useState(true)

  useEffect(() => {
    let mounted = true

    async function verificarAdmin() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          if (mounted) router.replace('/admin/login')
          return
        }

        const rol = session.user?.raw_user_meta_data?.role || session.user?.user_metadata?.role || session.user?.app_metadata?.role

        if (rol !== 'admin') {
          console.warn('[PanFree] Acceso no autorizado al panel admin:', session.user.email)
          await supabase.auth.signOut()
          if (mounted) router.replace('/')
          return
        }

        if (mounted) {
          setAdminConfirmado(true)
          setVerificando(false)
        }

      } catch (err) {
        console.error('[PanFree] Error verificando sesión admin:', err)
        if (mounted) router.replace('/admin/login')
      }
    }

    verificarAdmin()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (mounted) router.replace('/admin/login')
        return
      }
      const rol = session.user?.raw_user_meta_data?.role || session.user?.user_metadata?.role || session.user?.app_metadata?.role
      if (rol !== 'admin') {
        if (mounted) router.replace('/')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // ── Menú de navegación con Lucide Icons ──
  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/pedidos', icon: Package, label: 'Pedidos' },
    { href: '/admin/productos', icon: Croissant, label: 'Productos' },
    { href: '/admin/recetas', icon: BookOpen, label: 'Recetas' },
    { href: '/admin/compras', icon: ShoppingCart, label: 'Compras' },
    { href: '/admin/insumos', icon: Wheat, label: 'Insumos' },
    { href: '/admin/clientes', icon: Users, label: 'Clientes' },
    { href: '/admin/proveedores', icon: Building2, label: 'Proveedores' },
    { href: '/admin/produccion', icon: Factory, label: 'Producción' },
    { href: '/admin/costos', icon: DollarSign, label: 'Costos' },
    { href: '/admin/maquinarias', icon: Settings, label: 'Maquinarias' },
    { href: '/admin/marketing', icon: Megaphone, label: 'Marketing' },
    { href: '/admin/reportes', icon: TrendingUp, label: 'Reportes' },
    { href: '/admin/ayuda', icon: HelpCircle, label: 'Ayuda' },
  ]

  if (verificando) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eee6d9',
        fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
        gap: '1rem',
      }}>
        <Loader2 className="animate-spin" size={40} color="#334c2b" />
        <p style={{ color: '#334c2b', fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>
          Verificando acceso…
        </p>
      </div>
    )
  }

  if (!adminConfirmado) return null

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f0e8',
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex',
    }}>
      {/* Sidebar Colapsable */}
      <aside style={{
        width: sidebarAbierto ? '230px' : '64px',
        backgroundColor: '#334c2b',
        color: '#eee6d9',
        minHeight: '100vh',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '3px solid #b7996b',
        zIndex: 50,
      }}>
        {/* Cabecera Sidebar y Toggle */}
        <div style={{
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarAbierto ? 'space-between' : 'center',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          minHeight: '60px',
        }}>
          {sidebarAbierto && (
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#eee6d9', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Croissant size={20} color="#f46e15" /> PanFree
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            title={sidebarAbierto ? 'Colapsar menú' : 'Expandir menú'}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '4px',
              color: '#eee6d9',
              cursor: 'pointer',
              padding: '0.35rem 0.45rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            {sidebarAbierto ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navegación modular */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.6rem 0.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
        }}>
          {menuItems.map(item => {
            const Icon = item.icon
            const esActivo = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarAbierto ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: sidebarAbierto ? '0.55rem 0.85rem' : '0.55rem 0',
                  justifyContent: sidebarAbierto ? 'flex-start' : 'center',
                  color: esActivo ? '#fff' : '#eee6d9',
                  backgroundColor: esActivo ? 'rgba(244,110,21,0.25)' : 'transparent',
                  borderLeft: esActivo ? '3px solid #f46e15' : '3px solid transparent',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: esActivo ? '700' : '500',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {sidebarAbierto && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer del sidebar */}
        <div style={{
          padding: '0.8rem',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          backgroundColor: '#283c22',
        }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Ver tienda en vivo"
            style={{
              color: '#b7996b',
              textDecoration: 'none',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: sidebarAbierto ? 'flex-start' : 'center',
              padding: '0.4rem',
              borderRadius: '4px',
              fontWeight: '600',
            }}
          >
            <Globe size={16} />
            {sidebarAbierto && <span>Ver tienda ↗</span>}
          </a>
          <BtnLogout sidebarAbierto={sidebarAbierto} />
        </div>
      </aside>

      {/* Contenedor del contenido principal */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        {/* Header superior */}
        <header style={{
          backgroundColor: '#334c2b',
          color: '#eee6d9',
          padding: '0.65rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #b7996b',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <span style={{ fontWeight: '700', fontSize: '1rem', color: '#eee6d9' }}>
                PanFree
              </span>
              <span style={{ color: '#b7996b', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: '500' }}>
                ERP & Panel de Control
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NotificacionesAdmin />
          </div>
        </header>

        {/* Área de trabajo de cada página */}
        <main style={{ padding: '1.5rem', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function BtnLogout({ sidebarAbierto }) {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function handleLogout() {
    try {
      setSaliendo(true)
      await registrarAuditoria(AUDIT_ACTIONS.USUARIO_LOGOUT, 'Cierre de sesión manual desde el admin layout')
      await supabase.auth.signOut()
      router.replace('/admin/login')
    } catch (err) {
      console.error('[PanFree] Error al cerrar sesión:', err)
      router.replace('/admin/login')
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={saliendo}
      title="Cerrar sesión"
      style={{
        backgroundColor: saliendo ? '#666' : '#f46e15',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: sidebarAbierto ? '0.4rem 0.8rem' : '0.4rem 0',
        fontSize: '0.8rem',
        fontWeight: '600',
        cursor: saliendo ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.15s',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
      }}
    >
      <LogOut size={16} />
      {sidebarAbierto && <span>{saliendo ? 'Saliendo…' : 'Cerrar sesión'}</span>}
    </button>
  )
}
