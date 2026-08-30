/**
 * 📁 UBICACIÓN: src/app/admin/layout.js
 * 📅 ACTUALIZADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Layout del panel administrativo con:
 *    - Sidebar responsivo (drawer móvil + toggle escritorio)
 *    - Navegación modular completa y verificación de rol admin
 *    - Notificaciones en tiempo real (tabla notificaciones_admin)
 *    - Integración nativa de Notificaciones Push Web (VAPID) con autologin/suscripción
 *    - Banner intuitivo para activación de permisos push si está en estado 'default'
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
  Sliders,
  Wrench,
  Settings,
  Megaphone,
  TrendingUp,
  HelpCircle,
  Globe,
  Mail,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Loader2,
  Tag,
  QrCode,
  BellRing,
  CheckCircle2,
  Volume2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase-client'
import NotificacionesAdmin from './notificaciones'
import { AUDIT_ACTIONS, registrarAuditoria } from './lib/audit'
import { useMobile } from '../../hooks/useMobile'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import styles from './admin.module.css'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile, isTablet } = useMobile(960)

  const [verificando, setVerificando] = useState(true)
  const [adminConfirmado, setAdminConfirmado] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState(false)
  const [mostrarPromptPush, setMostrarPromptPush] = useState(true)
  const [activandoPush, setActivandoPush] = useState(false)
  const [mensajePushTest, setMensajePushTest] = useState(null)

  // Hook de Notificaciones Push
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    subscribe: pushSubscribe,
    sendTestNotification,
    loading: pushLoading,
  } = usePushNotifications()

  // Cerrar sidebar móvil automáticamente al cambiar de ruta
  useEffect(() => {
    setSidebarMovilAbierto(false)
  }, [pathname])

  // Ajustar estado por defecto del sidebar según tamaño de pantalla
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarAbierto(true)
    }
  }, [isMobile, isTablet])

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
          setAdminUser(session.user)
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
      } else {
        if (mounted) setAdminUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // ── Auto-suscripción automática a Push si el permiso ya está concedido ('granted') ──
  useEffect(() => {
    if (adminConfirmado && adminUser?.id && pushSupported && pushPermission === 'granted' && !pushSubscribed && !pushLoading) {
      pushSubscribe(adminUser.id).catch((err) => {
        console.warn('⚠️ Auto-suscripción push admin:', err.message)
      })
    }
  }, [adminConfirmado, adminUser, pushSupported, pushPermission, pushSubscribed, pushLoading, pushSubscribe])

  const handleActivarPush = async () => {
    try {
      setActivandoPush(true)
      const res = await pushSubscribe(adminUser?.id)
      if (res?.success) {
        setMostrarPromptPush(false)
      }
    } catch (err) {
      console.error('Error activando push:', err)
    } finally {
      setActivandoPush(false)
    }
  }

  const handleTestPush = async () => {
    setMensajePushTest('Enviando...')
    const res = await sendTestNotification(
      '🍞 ¡Prueba de Notificación Push!',
      'Si estás viendo esto, las notificaciones push de PanFree están activas y funcionando correctamente.'
    )
    if (res?.success) {
      setMensajePushTest('¡Notificación enviada!')
      setTimeout(() => setMensajePushTest(null), 3500)
    } else {
      setMensajePushTest('Error al enviar')
      setTimeout(() => setMensajePushTest(null), 3500)
    }
  }

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
    { href: '/admin/maquinarias', icon: Wrench, label: 'Maquinarias' },
    { href: '/admin/marketing', icon: Megaphone, label: 'Marketing' },
    { href: '/admin/dipticos', icon: QrCode, label: 'Dípticos' },
    { href: '/admin/cupones', icon: Tag, label: 'Cupones' },
    { href: '/admin/correos', icon: Mail, label: 'Correos' },
    { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
    { href: '/admin/reportes', icon: TrendingUp, label: 'Reportes' },
    { href: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
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
        <p style={{ color: '#334c2b', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
          Verificando acceso…
        </p>
      </div>
    )
  }

  if (!adminConfirmado) return null

  const esPantallaPequena = isMobile || isTablet
  const mostrarTextoSidebar = esPantallaPequena || sidebarAbierto

  return (
    <div className={styles.adminContainer}>
      {/* Backdrop overlay para móvil */}
      {sidebarMovilAbierto && (
        <div
          className={styles.backdropOverlay}
          onClick={() => setSidebarMovilAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Responsivo */}
      <aside
        className={`${styles.sidebar} ${
          sidebarAbierto ? styles.sidebarExpanded : styles.sidebarCollapsed
        } ${sidebarMovilAbierto ? styles.sidebarMobileOpen : ''}`}
      >
        {/* Cabecera Sidebar y Toggle */}
        <div className={styles.sidebarHeader}>
          {mostrarTextoSidebar ? (
            <span className={styles.sidebarBrand}>
              <Croissant size={22} color="#f46e15" /> PanFree Admin
            </span>
          ) : (
            <Croissant size={22} color="#f46e15" style={{ margin: '0 auto' }} />
          )}

          {/* Botón cerrar en móvil o colapsar en escritorio */}
          {esPantallaPequena ? (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setSidebarMovilAbierto(false)}
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          ) : (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setSidebarAbierto(!sidebarAbierto)}
              title={sidebarAbierto ? 'Colapsar menú' : 'Expandir menú'}
              aria-label={sidebarAbierto ? 'Colapsar menú' : 'Expandir menú'}
            >
              {sidebarAbierto ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
        </div>

        {/* Navegación modular */}
        <nav className={styles.sidebarNav} aria-label="Menú principal">
          {menuItems.map((item) => {
            const Icon = item.icon
            const esActivo = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!mostrarTextoSidebar ? item.label : undefined}
                className={`${styles.navLink} ${esActivo ? styles.navLinkActive : ''}`}
                style={{
                  justifyContent: mostrarTextoSidebar ? 'flex-start' : 'center',
                  padding: mostrarTextoSidebar ? '0.65rem 0.85rem' : '0.65rem 0',
                }}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {mostrarTextoSidebar && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className={styles.sidebarFooter}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Ver tienda en vivo"
            className={styles.tiendaLink}
            style={{ justifyContent: mostrarTextoSidebar ? 'flex-start' : 'center' }}
          >
            <Globe size={18} style={{ flexShrink: 0 }} />
            {mostrarTextoSidebar && <span>Ver tienda ↗</span>}
          </a>
          <BtnLogout sidebarAbierto={mostrarTextoSidebar} />
        </div>
      </aside>

      {/* Contenedor del contenido principal */}
      <div className={styles.mainWrapper}>
        {/* Header superior */}
        <header className={styles.header}>
          <div className={styles.headerBrand}>
            {/* Botón hamburguesa visible solo en pantallas pequeñas */}
            <button
              type="button"
              className={styles.hamburgerBtn}
              onClick={() => setSidebarMovilAbierto(true)}
              aria-label="Abrir menú de navegación"
            >
              <Menu size={24} />
            </button>

            <div>
              <span className={styles.headerTitle}>PanFree</span>
              <span className={styles.headerSubtitle}>ERP & Panel de Control</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Indicador y botón de prueba de Push Web */}
            {pushSubscribed ? (
              <button
                type="button"
                onClick={handleTestPush}
                title="Notificaciones push activadas en este dispositivo. Haz clic para enviar prueba."
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#eee6d9',
                  borderRadius: '20px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <BellRing size={14} color="#81c784" />
                <span style={{ display: esPantallaPequena ? 'none' : 'inline' }}>
                  {mensajePushTest || 'Push Activo'}
                </span>
              </button>
            ) : pushSupported && pushPermission !== 'denied' ? (
              <button
                type="button"
                onClick={handleActivarPush}
                disabled={activandoPush}
                title="Activar notificaciones push en este navegador"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#f46e15',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '20px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {activandoPush ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} />}
                <span>Activar Push</span>
              </button>
            ) : null}

            <NotificacionesAdmin />
          </div>
        </header>

        {/* Banner para activar Notificaciones Push cuando el permiso está en 'default' */}
        {pushSupported && pushPermission === 'default' && mostrarPromptPush && (
          <div
            style={{
              backgroundColor: '#334c2b',
              color: '#eee6d9',
              padding: '0.75rem 1.25rem',
              margin: '0.75rem 1rem 0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderLeft: '5px solid #f46e15',
              fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
              <BellRing size={22} color="#f46e15" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '0.88rem', color: '#fff' }}>
                  ¿Deseas recibir alertas de nuevos pedidos al instante?
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#d5cbb8', lineHeight: '1.3' }}>
                  Te notificaremos inmediatamente en tu navegador cuando entre un nuevo pedido, incluso si tienes el panel minimizado.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleActivarPush}
                disabled={activandoPush}
                style={{
                  backgroundColor: '#f46e15',
                  color: '#fff',
                  border: 'none',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {activandoPush ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Activar Notificaciones
              </button>

              <button
                type="button"
                onClick={() => setMostrarPromptPush(false)}
                title="Cerrar aviso"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(238, 230, 217, 0.4)',
                  color: '#eee6d9',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Ahora no
              </button>
            </div>
          </div>
        )}

        {/* Área de trabajo de cada página */}
        <main className={styles.mainContent}>
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
      className={styles.btnLogout}
      style={{
        padding: sidebarAbierto ? '0.55rem 0.8rem' : '0.55rem 0',
      }}
    >
      <LogOut size={18} style={{ flexShrink: 0 }} />
      {sidebarAbierto && <span>{saliendo ? 'Saliendo…' : 'Cerrar sesión'}</span>}
    </button>
  )
}
