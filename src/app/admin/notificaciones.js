/**
 * 📁 UBICACIÓN: src/app/admin/notificaciones.js
 * 📅 ACTUALIZADO: 2026-08-19 (FASE 6: UX Y MONITOREO)
 * 📌 DESCRIPCIÓN: Componente de notificaciones en tiempo real para el panel de administración.
 *    - Toasts emergentes flotantes con auto-dismiss
 *    - Campana interactiva con badge animado de pulso
 *    - Suscripción en tiempo real a la tabla 'notificaciones_admin'
 *    - Soporte para marcar individuales o todas como leídas
 *    - Cierre automático al hacer clic fuera del dropdown
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Sparkles,
  Check,
  X,
  Loader2,
  Package,
  AlertTriangle,
  XCircle,
  Info,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatFecha } from './lib/helpers'

export default function NotificacionesAdmin() {
  const router = useRouter()
  const [notificaciones, setNotificaciones] = useState([])
  const [contador, setContador] = useState(0)
  const [mostrar, setMostrar] = useState(false)
  const [toast, setToast] = useState(null)
  const [cargando, setCargando] = useState(true)
  const dropdownRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3')
    }
  }, [])

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrar(false)
      }
    }
    if (mostrar) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mostrar])

  const cargarNotificaciones = async () => {
    try {
      setCargando(true)
      const { data, error } = await supabase
        .from('notificaciones_admin')
        .select('*')
        .eq('leido', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // Fallback simple si la columna leido vs leida difiere
        const { data: fallbackData } = await supabase
          .from('notificaciones_admin')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        
        const noLeidas = (fallbackData || []).filter(n => n.leido === false || n.leida === false)
        setNotificaciones(noLeidas)
        setContador(noLeidas.length)
      } else {
        setNotificaciones(data || [])
        setContador(data?.length || 0)
      }
    } catch (err) {
      console.error('[PanFree] Error cargando notificaciones admin:', err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let canal = null

    cargarNotificaciones()

    // Suscribirse a Realtime de Postgres
    try {
      canal = supabase
        .channel('notificaciones_admin_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificaciones_admin',
          },
          (payload) => {
            const nueva = payload.new
            const esNoLeida = nueva.leido === false || nueva.leida === false
            if (esNoLeida) {
              setNotificaciones((prev) => [nueva, ...prev.filter((n) => n.id !== nueva.id)])
              setContador((prev) => prev + 1)

              if (audioRef.current) {
                audioRef.current.play().catch(() => {})
              }

              // Mostrar Toast emergente
              setToast({
                id: nueva.id || Date.now(),
                titulo: nueva.titulo || 'Nueva notificación',
                mensaje: nueva.mensaje,
                link: nueva.link,
                tipo: nueva.tipo,
                timestamp: Date.now(),
              })

              setTimeout(() => {
                setToast((current) => (current?.id === (nueva.id || Date.now()) ? null : current))
              }, 6000)
            }
          }
        )
        .subscribe()
    } catch (err) {
      console.error('[PanFree] Error suscribiendo a notificaciones:', err)
    }

    return () => {
      if (canal) supabase.removeChannel(canal)
    }
  }, [])

  const handleMarcarLeida = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await supabase
        .from('notificaciones_admin')
        .update({ leido: true, leida: true })
        .eq('id', id)

      setNotificaciones((prev) => prev.filter((n) => n.id !== id))
      setContador((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('[PanFree] Error marcando notificación:', err)
    }
  }

  const handleMarcarTodas = async () => {
    const ids = notificaciones.map((n) => n.id)
    if (ids.length === 0) return

    try {
      await supabase
        .from('notificaciones_admin')
        .update({ leido: true, leida: true })
        .in('id', ids)

      setNotificaciones([])
      setContador(0)
    } catch (err) {
      console.error('[PanFree] Error marcando todas:', err)
    }
  }

  const irANotificacion = (notif) => {
    handleMarcarLeida(notif.id)
    setMostrar(false)
    if (notif.link) {
      router.push(notif.link)
    }
  }

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case 'nuevo_pedido':
        return <Package size={18} color="#f46e15" />
      case 'stock_bajo':
        return <AlertTriangle size={18} color="#c62828" />
      case 'cancelacion':
        return <XCircle size={18} color="#c62828" />
      default:
        return <Info size={18} color="#334c2b" />
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Toast emergente flotante */}
      {toast && (
        <div
          onClick={() => {
            if (toast.link) {
              setToast(null)
              router.push(toast.link)
            }
          }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            backgroundColor: '#334c2b',
            color: '#eee6d9',
            padding: '1rem 1.4rem',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            zIndex: 2000,
            maxWidth: '400px',
            borderLeft: `6px solid ${toast.tipo === 'stock_bajo' || toast.tipo === 'cancelacion' ? '#c62828' : '#f46e15'}`,
            animation: 'panfreeSlideIn 0.3s ease',
            cursor: toast.link ? 'pointer' : 'default',
            fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              {obtenerIconoTipo(toast.tipo)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#b7996b', marginBottom: '0.2rem' }}>
                {toast.titulo}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#eee6d9', lineHeight: '1.4' }}>
                {toast.mensaje}
              </div>
              {toast.link && (
                <div style={{ fontSize: '0.75rem', color: '#f46e15', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                  <span>Ver detalles</span>
                  <ExternalLink size={12} />
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setToast(null)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#b7996b',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Botón de campana */}
      <button
        type="button"
        onClick={() => setMostrar(!mostrar)}
        title="Notificaciones de administración"
        style={{
          background: mostrar ? 'rgba(0,0,0,0.15)' : 'transparent',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.4rem 0.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#eee6d9',
          minHeight: '40px',
          minWidth: '40px',
        }}
      >
        <Bell size={20} />
        {contador > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0px',
              right: '0px',
              backgroundColor: '#c62828',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '0.7rem',
              padding: '0.1rem 0.4rem',
              minWidth: '18px',
              textAlign: 'center',
              fontWeight: '700',
              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
              animation: 'panfreePulse 1.2s infinite ease-in-out',
            }}
          >
            {contador > 99 ? '99+' : contador}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {mostrar && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: '0',
            width: '380px',
            maxWidth: '92vw',
            maxHeight: '460px',
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '2px solid #b7996b',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            zIndex: 1000,
            padding: '1rem',
            fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
              borderBottom: '1px solid #eee6d9',
              paddingBottom: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bell size={16} color="#334c2b" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#334c2b', fontWeight: '700' }}>
                Notificaciones ({contador})
              </h3>
            </div>
            {contador > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodas}
                style={{
                  background: 'transparent',
                  border: '1px solid #b7996b',
                  borderRadius: '4px',
                  padding: '0.25rem 0.6rem',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  color: '#334c2b',
                  fontWeight: '600',
                }}
              >
                Marcar todas
              </button>
            )}
          </div>

          {cargando ? (
            <p style={{ color: '#888', textAlign: 'center', margin: '1.5rem 0', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Loader2 className="animate-spin" size={16} /> Cargando notificaciones...
            </p>
          ) : notificaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#666' }}>
              <Sparkles size={28} color="#b7996b" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '600', color: '#2e7d32' }}>
                No hay notificaciones nuevas
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#999' }}>
                Te avisaremos cuando haya nuevos pedidos o alertas
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {notificaciones.map((notif) => {
                const borderAccent =
                  notif.tipo === 'stock_bajo' || notif.tipo === 'cancelacion'
                    ? '#c62828'
                    : '#f46e15'

                return (
                  <div
                    key={notif.id}
                    onClick={() => irANotificacion(notif)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      backgroundColor: '#faf7f2',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      borderLeft: `4px solid ${borderAccent}`,
                      border: '1px solid #ede4d6',
                      cursor: notif.link ? 'pointer' : 'default',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {obtenerIconoTipo(notif.tipo)}
                    </div>
                    <div style={{ flex: 1 }}>
                      {notif.titulo && (
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334c2b', marginBottom: '0.15rem' }}>
                          {notif.titulo}
                        </div>
                      )}
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#444', lineHeight: '1.4' }}>
                        {notif.mensaje}
                      </p>
                      {notif.created_at && (
                        <span style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.3rem', display: 'block' }}>
                          {formatFecha(notif.created_at)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleMarcarLeida(notif.id, e)}
                      title="Marcar como leída"
                      style={{
                        background: '#fff',
                        border: '1px solid #b7996b',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#2e7d32',
                        fontSize: '0.85rem',
                        padding: '0.25rem 0.45rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes panfreeSlideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes panfreePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}

