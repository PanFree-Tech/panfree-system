/**
 * 📁 UBICACIÓN: src/app/admin/page.js
 * 📅 ACTUALIZADO: 2026-08-19 (Fase 4 - Sistema Compartido)
 * 📌 DESCRIPCIÓN: Dashboard principal del panel de administración de PanFree.
 *    - Métricas en tiempo real (productos activos, pedidos pendientes, clientes, insumos)
 *    - Suscripción y activación de notificaciones Push VAPID
 *    - Accesos rápidos a todos los módulos del ERP
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LayoutDashboard,
  Croissant,
  Package,
  Users,
  Wheat,
  BookOpen,
  ShoppingCart,
  Factory,
  Settings,
  Megaphone,
  TrendingUp,
  HelpCircle,
  DollarSign,
  Bell,
  BellOff,
  Loader2,
  CheckCircle2,
  Globe,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { COLORS } from './_styles'
import { formatPYG, formatFecha } from './lib/helpers'

// VAPID public key
const VAPID_PUBLIC_KEY =
  'BFja0jK4232iA8cec5oo9vaOguB9EKDyyyss7YWmYfsDv6cqEeZynD7Z9ozV82Yc1vgZmAIdw4mLWuXjn6jINKg'

function Tarjeta({ icon: Icon, titulo, valor, subtitulo, color = COLORS.verdeOscuro, href }) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        textDecoration: 'none',
        backgroundColor: COLORS.blanco,
        borderRadius: '8px',
        border: `2px solid ${COLORS.grisBorde}`,
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(51,76,43,0.08)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        cursor: 'pointer',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(51,76,43,0.15)'
        e.currentTarget.style.borderColor = COLORS.marfil
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(51,76,43,0.08)'
        e.currentTarget.style.borderColor = COLORS.grisBorde
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: '#faf7f2', color: COLORS.verdeOscuro }}>
          <Icon size={24} color="#334c2b" />
        </div>
        <span
          style={{
            color: '#8f9a44',
            fontWeight: '600',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {titulo}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color }}>{valor}</p>
      {subtitulo && (
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: COLORS.grisClaro }}>
          {subtitulo}
        </p>
      )}
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
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      })

      // Obtener usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Guardar en Supabase
      const res = await fetch('/api/push-suscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: suscripcion.toJSON(),
          userId: user.id,
          userAgent: navigator.userAgent,
        }),
      })

      if (!res.ok) throw new Error('Error guardando suscripción')

      setEstado('activo')
      alert('Notificaciones activadas. Recibirás alertas cuando lleguen pedidos nuevos.')
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
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setEstado('inactivo')
    } catch (err) {
      console.error('Error desactivando:', err)
    }
  }

  if (estado === 'cargando' || estado === 'no-soportado') return null

  if (estado === 'activo')
    return (
      <button
        type="button"
        onClick={desactivarNotificaciones}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: COLORS.beige,
          color: COLORS.verdeOscuro,
          border: `2px solid ${COLORS.verdeOscuro}`,
          borderRadius: '8px',
          padding: '0.6rem 1rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: '600',
          fontSize: '0.88rem',
        }}
      >
        <Bell size={16} /> Notificaciones activas · Desactivar
      </button>
    )

  if (estado === 'bloqueado')
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#fff3f3',
          color: COLORS.rojo,
          border: `2px solid ${COLORS.rojo}`,
          borderRadius: '8px',
          padding: '0.6rem 1rem',
          fontSize: '0.88rem',
        }}
      >
        <BellOff size={16} /> Notificaciones bloqueadas — habilitá en ajustes del navegador
      </div>
    )

  return (
    <button
      type="button"
      onClick={activarNotificaciones}
      disabled={estado === 'activando'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: COLORS.verdeOscuro,
        color: COLORS.beige,
        border: `2px solid ${COLORS.marfil}`,
        borderRadius: '8px',
        padding: '0.6rem 1rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: '600',
        fontSize: '0.88rem',
        opacity: estado === 'activando' ? 0.7 : 1,
      }}
    >
      {estado === 'activando' ? (
        <>
          <Loader2 className="animate-spin" size={16} />
          <span>Activando...</span>
        </>
      ) : (
        <>
          <Bell size={16} />
          <span>Activar notificaciones de pedidos</span>
        </>
      )}
    </button>
  )
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [metricas, setMetricas] = useState({
    totalProductos: '—',
    productosActivos: '—',
    totalClientes: '—',
    totalInsumos: '—',
    pedidosPendientes: '—',
    ultimosPedidos: [],
    loading: true,
  })

  const cargarMetricas = useCallback(async () => {
    setMetricas((prev) => ({ ...prev, loading: true }))
    try {
      const safeCount = async (tabla, filterFn = null) => {
        try {
          let query = supabase.from(tabla).select('*', { count: 'exact', head: true })
          if (filterFn) query = filterFn(query)
          const { count, error } = await query
          if (!error && count !== null) return count

          let fallback = supabase.from(tabla).select('id')
          if (filterFn) fallback = filterFn(fallback)
          const { data } = await fallback
          return data ? data.length : 0
        } catch {
          return 0
        }
      }

      const [
        totalProductos,
        productosActivos,
        totalClientes,
        totalInsumos,
        pedidosPendientes,
      ] = await Promise.all([
        safeCount('productos'),
        safeCount('productos', (q) => q.eq('is_active', true)),
        safeCount('clientes'),
        safeCount('insumos'),
        safeCount('pedidos', (q) => q.eq('estado', 'pendiente')),
      ])

      let ultimosPedidos = []
      try {
        const { data: pedidosData } = await supabase
          .from('pedidos')
          .select('id, numero_pedido, estado, total_final, subtotal, metodo_entrega, metodo_pago, created_at, clientes(nombre_completo)')
          .order('created_at', { ascending: false })
          .limit(5)

        if (pedidosData) {
          ultimosPedidos = pedidosData
        }
      } catch (errPed) {
        console.warn('[Dashboard] Fallback ultimos pedidos:', errPed)
      }

      setMetricas({
        totalProductos: totalProductos ?? 0,
        productosActivos: productosActivos ?? 0,
        totalClientes: totalClientes ?? 0,
        totalInsumos: totalInsumos ?? 0,
        pedidosPendientes: pedidosPendientes ?? 0,
        ultimosPedidos,
        loading: false,
      })
    } catch (err) {
      console.error('[PanFree] Error cargando métricas:', err)
      setMetricas((m) => ({ ...m, loading: false }))
    }
  }, [])

  useEffect(() => {
    cargarMetricas()
  }, [cargarMetricas])

  const hoyFormateado = new Date().toLocaleDateString('es-PY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div>
      {/* Encabezado */}
      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 0.25rem',
              color: COLORS.verdeOscuro,
              fontSize: '1.6rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <LayoutDashboard size={26} color="#334c2b" /> Dashboard
          </h1>
          <p
            style={{
              margin: 0,
              color: '#8f9a44',
              fontSize: '0.9rem',
              textTransform: 'capitalize',
            }}
          >
            {hoyFormateado}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={cargarMetricas}
            title="Recargar datos"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#fff',
              border: `2px solid ${COLORS.grisBorde}`,
              borderRadius: '8px',
              padding: '0.6rem 0.9rem',
              cursor: 'pointer',
              color: COLORS.verdeOscuro,
              fontWeight: '600',
              fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={15} className={metricas.loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <BotonNotificaciones />
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <Tarjeta
          icon={Croissant}
          titulo="Productos activos"
          valor={metricas.loading ? '…' : metricas.productosActivos}
          subtitulo={`${metricas.totalProductos} en total`}
          href="/admin/productos"
        />
        <Tarjeta
          icon={Package}
          titulo="Pedidos pendientes"
          valor={metricas.loading ? '…' : metricas.pedidosPendientes}
          subtitulo="Sin procesar"
          color={metricas.pedidosPendientes > 0 ? COLORS.naranja : COLORS.verdeOscuro}
          href="/admin/pedidos"
        />
        <Tarjeta
          icon={Users}
          titulo="Clientes registrados"
          valor={metricas.loading ? '…' : metricas.totalClientes}
          subtitulo="Usuarios activos"
          href="/admin/clientes"
        />
        <Tarjeta
          icon={Wheat}
          titulo="Insumos (PPP)"
          valor={metricas.loading ? '…' : metricas.totalInsumos}
          subtitulo="Materias primas"
          href="/admin/insumos"
        />
      </section>

      {/* Últimos pedidos */}
      {metricas.ultimosPedidos.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, color: COLORS.verdeOscuro, fontSize: '1.1rem', fontWeight: '600' }}>
              Pedidos Recientes
            </h2>
            <a
              href="/admin/pedidos"
              style={{
                color: COLORS.naranja,
                fontSize: '0.85rem',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Ver todos los pedidos <ArrowRight size={14} />
            </a>
          </div>

          <div
            style={{
              backgroundColor: COLORS.blanco,
              borderRadius: '8px',
              border: `2px solid ${COLORS.grisBorde}`,
              overflow: 'hidden',
            }}
          >
            {metricas.ultimosPedidos.map((ped, idx) => (
              <a
                key={ped.id}
                href="/admin/pedidos"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1.25rem',
                  borderBottom: idx === metricas.ultimosPedidos.length - 1 ? 'none' : `1px solid ${COLORS.marfil}`,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#faf6f0')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div>
                  <span style={{ fontWeight: '700', color: COLORS.verdeOscuro, fontFamily: 'monospace', fontSize: '0.92rem' }}>
                    {ped.numero_pedido}
                  </span>
                  <span style={{ margin: '0 0.5rem', color: '#ccc' }}>·</span>
                  <span style={{ fontSize: '0.85rem', color: '#555' }}>
                    {ped.clientes?.nombre_completo || 'Cliente'}
                  </span>
                  <span style={{ margin: '0 0.5rem', color: '#ccc' }}>·</span>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {formatFecha(ped.created_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      backgroundColor: ped.estado === 'pendiente' ? '#fff3e0' : '#e8f5e9',
                      color: ped.estado === 'pendiente' ? '#e65100' : '#2e7d32',
                      textTransform: 'capitalize',
                    }}
                  >
                    {ped.estado}
                  </span>
                  <span style={{ fontWeight: '800', color: COLORS.verdeOscuro, fontSize: '0.95rem' }}>
                    {formatPYG(ped.total_final || ped.subtotal)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Accesos rápidos */}
      <section>
        <h2
          style={{
            margin: '0 0 1rem',
            color: COLORS.verdeOscuro,
            fontSize: '1.1rem',
            fontWeight: '600',
          }}
        >
          Gestión del Sistema
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {[
            { href: '/admin/productos', icon: Croissant, label: 'Productos' },
            { href: '/admin/recetas', icon: BookOpen, label: 'Recetas' },
            { href: '/admin/insumos', icon: Wheat, label: 'Insumos' },
            { href: '/admin/proveedores', icon: Factory, label: 'Proveedores' },
            { href: '/admin/compras', icon: ShoppingCart, label: 'Compras' },
            { href: '/admin/produccion', icon: Factory, label: 'Producción' },
            { href: '/admin/maquinarias', icon: Settings, label: 'Maquinarias' },
            { href: '/admin/costos', icon: DollarSign, label: 'Costos' },
            { href: '/admin/pedidos', icon: Package, label: 'Pedidos' },
            { href: '/admin/clientes', icon: Users, label: 'Clientes' },
            { href: '/admin/marketing', icon: Megaphone, label: 'Marketing' },
            { href: '/admin/reportes', icon: TrendingUp, label: 'Reportes' },
            { href: '/admin/ayuda', icon: HelpCircle, label: 'Ayuda' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '1.25rem 0.75rem',
                  backgroundColor: COLORS.blanco,
                  borderRadius: '8px',
                  border: `2px solid ${COLORS.grisBorde}`,
                  textDecoration: 'none',
                  color: COLORS.verdeOscuro,
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  transition: 'border-color 0.15s, background-color 0.15s',
                  minHeight: '90px',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = COLORS.naranja
                  e.currentTarget.style.backgroundColor = '#fff8f3'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = COLORS.grisBorde
                  e.currentTarget.style.backgroundColor = COLORS.blanco
                }}
              >
                <Icon size={24} color="#334c2b" />
                {item.label}
              </a>
            )
          })}
        </div>
      </section>

      {/* Info del sistema */}
      <section
        style={{
          marginTop: '2.5rem',
          backgroundColor: COLORS.beige,
          borderRadius: '8px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #d4c5b0',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem', color: COLORS.verdeOscuro, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Globe size={18} /> Estado del Sistema
        </h3>
        <p
          style={{
            margin: 0,
            color: COLORS.verdeOscuro,
            fontSize: '0.85rem',
            lineHeight: '1.6',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={14} color="#2e7d32" /> Supabase conectado
          </span>
          ·
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={14} color="#2e7d32" /> Auth activo
          </span>
          ·
          <span>
            Tienda:{' '}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: COLORS.naranja, fontWeight: '600' }}
            >
              panfree.fit
            </a>
          </span>
        </p>
      </section>
    </div>
  )
}
