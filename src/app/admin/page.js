/**
 * 📁 UBICACIÓN: src/app/admin/page.js
 * 📅 ACTUALIZADO: 2026-03-06
 * 📌 CAMBIOS:
 *  - Botón "Activar notificaciones push" en el dashboard
 *  - Guarda suscripción en Supabase via /api/push-suscribir
 */
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const formatPYG = n => `₲ ${Number(n || 0).toLocaleString('es-PY')}`

// VAPID public key — reemplazar con la tuya después de generarla
const VAPID_PUBLIC_KEY = 'BFja0jK4232iA8cec5oo9vaOguB9EKDyyyss7YWmYfsDv6cqEeZynD7Z9ozV82Yc1vgZmAIdw4mLWuXjn6jINKg'

function Tarjeta({ icon, titulo, valor, subtitulo, color = '#334c2b', href }) {
  return (
    <a href={href} style={{ display: 'block', textDecoration: 'none', backgroundColor: '#fff', borderRadius: '8px', border: '2px solid #e0d5c5', padding: '1.5rem', boxShadow: '0 2px 8px rgba(51,76,43,0.08)', transition: 'box-shadow 0.2s, border-color 0.2s', cursor: 'pointer' }}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(51,76,43,0.15)'; e.currentTarget.style.borderColor = '#b7996b' }}
      onMouseOut={e  => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(51,76,43,0.08)'; e.currentTarget.style.borderColor = '#e0d5c5' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
        <span style={{ color: '#8f9a44', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{titulo}</span>
      </div>
      <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color }}>{valor}</p>
      {subtitulo && <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#999' }}>{subtitulo}</p>}
    </a>
  )
}

// ── Botón Push Notifications ──────────────────────────────────────────────────
function BotonNotificaciones() {
  const [estado, setEstado] = useState('cargando') // cargando | activo | inactivo | no-soportado

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setEstado('no-soportado')
      return
    }
    if (Notification.permission === 'granted') {
      setEstado('activo')
    } else if (Notification.permission === 'denied') {
      setEstado('bloqueado')
    } else {
      setEstado('inactivo')
    }
  }, [])

  async function activarNotificaciones() {
    try {
      setEstado('activando')

      // Pedir permiso
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        setEstado('bloqueado')
        return
      }

      // Obtener service worker
      const sw = await navigator.serviceWorker.ready

      // Suscribirse al push
      const suscripcion = await sw.pushManager.subscribe({
        userVisibleOnly     : true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      })

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Guardar en Supabase
      const res = await fetch('/api/push-suscribir', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          subscription: suscripcion.toJSON(),
          userId      : user.id,
          userAgent   : navigator.userAgent,
        }),
      })

      if (!res.ok) throw new Error('Error guardando suscripción')

      setEstado('activo')
      alert('✅ Notificaciones activadas. Recibirás alertas cuando lleguen pedidos nuevos.')

    } catch (err) {
      console.error('Error activando notificaciones:', err)
      setEstado('inactivo')
      alert('Error activando notificaciones: ' + err.message)
    }
  }

  async function desactivarNotificaciones() {
    try {
      const sw = await navigator.serviceWorker.ready
      const sub = await sw.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push-suscribir', {
          method : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setEstado('inactivo')
    } catch (err) {
      console.error('Error desactivando:', err)
    }
  }

  if (estado === 'cargando')      return null
  if (estado === 'no-soportado')  return null

  if (estado === 'activo') return (
    <button onClick={desactivarNotificaciones}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#eee6d9', color: '#334c2b', border: '2px solid #334c2b', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.88rem' }}>
      🔔 Notificaciones activas · Desactivar
    </button>
  )

  if (estado === 'bloqueado') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff3f3', color: '#c62828', border: '2px solid #c62828', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.88rem' }}>
      🔕 Notificaciones bloqueadas — habilitá en ajustes del navegador
    </div>
  )

  return (
    <button onClick={activarNotificaciones} disabled={estado === 'activando'}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#334c2b', color: '#eee6d9', border: '2px solid #b7996b', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.88rem', opacity: estado === 'activando' ? 0.7 : 1 }}>
      {estado === 'activando' ? '⏳ Activando...' : '🔔 Activar notificaciones de pedidos'}
    </button>
  )
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [metricas, setMetricas] = useState({
    totalProductos: '—', productosActivos: '—',
    totalClientes: '—', totalInsumos: '—',
    pedidosPendientes: '—', ventasHoy: '—', loading: true,
  })

  useEffect(() => {
    async function cargarMetricas() {
      try {
        const [
          { count: totalProductos },
          { count: productosActivos },
          { count: totalClientes },
          { count: totalInsumos },
          { count: pedidosPendientes },
        ] = await Promise.all([
          supabase.from('productos').select('*', { count: 'exact', head: true }),
          supabase.from('productos').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('clientes').select('*', { count: 'exact', head: true }),
          supabase.from('insumos').select('*', { count: 'exact', head: true }),
          supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        ])
        setMetricas({
          totalProductos   : totalProductos    ?? '—',
          productosActivos : productosActivos  ?? '—',
          totalClientes    : totalClientes     ?? '—',
          totalInsumos     : totalInsumos      ?? '—',
          pedidosPendientes: pedidosPendientes ?? '—',
          ventasHoy        : '—',
          loading          : false,
        })
      } catch (err) {
        console.error('Error cargando métricas:', err)
        setMetricas(m => ({ ...m, loading: false }))
      }
    }
    cargarMetricas()
  }, [])

  const hoy = new Date().toLocaleDateString('es-PY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', color: '#334c2b', fontSize: '1.6rem', fontWeight: '700' }}>
            📊 Dashboard
          </h1>
          <p style={{ margin: 0, color: '#8f9a44', fontSize: '0.9rem', textTransform: 'capitalize' }}>
            {hoy}
          </p>
        </div>
        <BotonNotificaciones />
      </div>

      {/* Tarjetas de métricas */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <Tarjeta icon="🍞" titulo="Productos activos"   valor={metricas.loading ? '⏳' : metricas.productosActivos}  subtitulo={`${metricas.totalProductos} en total`} href="/admin/productos" />
        <Tarjeta icon="📦" titulo="Pedidos pendientes"  valor={metricas.loading ? '⏳' : metricas.pedidosPendientes} subtitulo="Sin procesar" color={metricas.pedidosPendientes > 0 ? '#f46e15' : '#334c2b'} href="/admin/pedidos" />
        <Tarjeta icon="👥" titulo="Clientes registrados" valor={metricas.loading ? '⏳' : metricas.totalClientes}    subtitulo="Usuarios activos" href="/admin/clientes" />
        <Tarjeta icon="🧪" titulo="Insumos (PPP)"       valor={metricas.loading ? '⏳' : metricas.totalInsumos}     subtitulo="Materias primas" href="/admin/insumos" />
      </section>

      {/* Accesos rápidos */}
      <section>
        <h2 style={{ margin: '0 0 1rem', color: '#334c2b', fontSize: '1.1rem', fontWeight: '600' }}>
          Gestión del Sistema
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {[
            { href: '/admin/productos',   icon: '🍞', label: 'Productos'   },
            { href: '/admin/recetas',     icon: '📋', label: 'Recetas'     },
            { href: '/admin/insumos',     icon: '🧪', label: 'Insumos'     },
            { href: '/admin/proveedores', icon: '🏭', label: 'Proveedores' },
            { href: '/admin/compras',     icon: '🛒', label: 'Compras'     },
            { href: '/admin/produccion',  icon: '⚙️',  label: 'Producción'  },
            { href: '/admin/maquinarias', icon: '🔌', label: 'Maquinarias' },
            { href: '/admin/costos',      icon: '💰', label: 'Costos'      },
            { href: '/admin/pedidos',     icon: '📦', label: 'Pedidos'     },
            { href: '/admin/clientes',    icon: '👥', label: 'Clientes'    },
			{ href: '/admin/marketing',   icon: '📸', label: 'Marketing'   },
            { href: '/admin/reportes',    icon: '📊', label: 'Reportes'    },
            { href: '/admin/ayuda',       icon: '❓', label: 'Ayuda'       },
          ].map(item => (
            <a key={item.href} href={item.href}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.25rem 0.75rem', backgroundColor: '#fff', borderRadius: '8px', border: '2px solid #e0d5c5', textDecoration: 'none', color: '#334c2b', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', transition: 'border-color 0.15s, background-color 0.15s', minHeight: '90px' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#f46e15'; e.currentTarget.style.backgroundColor = '#fff8f3' }}
              onMouseOut={e  => { e.currentTarget.style.borderColor = '#e0d5c5'; e.currentTarget.style.backgroundColor = '#fff' }}
            >
              <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>
      </section>

      {/* Info del sistema */}
      <section style={{ marginTop: '2.5rem', backgroundColor: '#eee6d9', borderRadius: '8px', padding: '1.25rem 1.5rem', border: '1px solid #d4c5b0' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#334c2b', fontSize: '0.95rem' }}>
          🌐 Estado del Sistema
        </h3>
        <p style={{ margin: 0, color: '#334c2b', fontSize: '0.85rem', lineHeight: '1.6' }}>
          ✅ Supabase conectado · ✅ Auth activo · 🏪 Tienda:{' '}
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ color: '#f46e15', fontWeight: '600' }}>panfree.fit</a>
        </p>
      </section>
    </div>
  )
}