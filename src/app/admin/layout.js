/**
 * 📁 UBICACIÓN: src/app/admin/layout.js
 * 📅 ACTUALIZADO: 2026-03-12
 * 📌 DESCRIPCIÓN: Layout del panel administrativo con DOBLE verificación de seguridad.
 *    CAPA 1 (middleware.js): Verifica sesión + rol admin en el servidor antes de cargar.
 *    CAPA 2 (este layout): Verifica nuevamente en el cliente por si el middleware falla.
 *    - Sin sesión → redirige a /admin/login
 *    - Con sesión pero sin rol 'admin' → redirige a / con mensaje de error
 *    - Solo usuarios con app_metadata.role === 'admin' ven el panel
 *    Admins autorizados: pirovanipedrojose@gmail.com, luzzdevictoria@gmail.com, contacto.panfree@gmail.com
 * ✅ 2026-03-12: user_metadata → app_metadata (app_metadata no es editable por el usuario).
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  const [adminConfirmado, setAdminConfirmado] = useState(false)

  useEffect(() => {
    let mounted = true

    async function verificarAdmin() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          if (mounted) router.replace('/admin/login')
          return
        }

        // ✅ app_metadata no es editable por el usuario final
        const rol = session.user?.app_metadata?.role

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
      const rol = session.user?.app_metadata?.role
      if (rol !== 'admin') {
        if (mounted) router.replace('/')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

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
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #b7996b',
          borderTopColor: '#334c2b',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#334c2b', fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>
          Verificando acceso…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!adminConfirmado) return null

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f0e8',
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <header style={{
        backgroundColor: '#334c2b',
        color: '#eee6d9',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '3px solid #b7996b',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🍞</span>
          <div>
            <span style={{ fontWeight: '700', fontSize: '1rem', color: '#eee6d9', letterSpacing: '0.02em' }}>
              PanFree
            </span>
            <span style={{ color: '#b7996b', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: '400' }}>
              Panel Admin
            </span>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a href="/admin" style={navLinkStyle}>Dashboard</a>
          <a href="/admin/productos" style={navLinkStyle}>Productos</a>
          <a href="/admin/pedidos" style={navLinkStyle}>Pedidos</a>
          <a href="/" target="_blank" style={{ ...navLinkStyle, color: '#b7996b' }}>Ver tienda ↗</a>
          <BtnLogout />
        </nav>
      </header>

      <main style={{ padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  )
}

const navLinkStyle = {
  color: '#eee6d9',
  textDecoration: 'none',
  fontSize: '0.85rem',
  padding: '0.35rem 0.7rem',
  borderRadius: '4px',
  transition: 'background 0.15s',
  fontWeight: '500',
}

function BtnLogout() {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function handleLogout() {
    setSaliendo(true)
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={saliendo}
      style={{
        backgroundColor: saliendo ? '#666' : '#f46e15',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '0.35rem 0.8rem',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: saliendo ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        marginLeft: '0.5rem',
        transition: 'background 0.15s',
      }}
    >
      {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}