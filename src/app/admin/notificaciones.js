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
import { supabase } from '../../lib/supabase'
import { formatFecha } from './lib/helpers'

export default function NotificacionesAdmin() {
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

  useEffect(() => {
    let canal = null

    async function cargarNotificaciones() {
      try {
        setCargando(true)
        const { data, error } = await supabase
          .from('notificaciones_admin')
          .select('*')
          .eq('leida', false)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setNotificaciones(data || [])
        setContador(data?.length || 0)
      } catch (err) {
        console.error('[PanFree] Error cargando notificaciones admin:', err)
      } finally {
        setCargando(false)
      }
    }

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
            if (!nueva.leida) {
              setNotificaciones((prev) => [nueva, ...prev.filter((n) => n.id !== nueva.id)])
              setContador((prev) => prev + 1)
              
              if (audioRef.current) {
                audioRef.current.play().catch(() => {})
              }

              // Mostrar Toast emergente
              setToast({
                id: nueva.id || Date.now(),
                mensaje: nueva.mensaje,
                timestamp: Date.now(),
              })

              setTimeout(() => {
                setToast((current) => (current?.id === (nueva.id || Date.now()) ? null : current))
              }, 5000)
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

  const marcarComoLeida = async (id) => {
    try {
      await supabase
        .from('notificaciones_admin')
        .update({ leida: true })
        .eq('id', id)

      setNotificaciones((prev) => prev.filter((n) => n.id !== id))
      setContador((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('[PanFree] Error marcando notificación:', err)
    }
  }

  const marcarTodasComoLeidas = async () => {
    const ids = notificaciones.map((n) => n.id)
    if (ids.length === 0) return

    try {
      await supabase
        .from('notificaciones_admin')
        .update({ leida: true })
        .in('id', ids)

      setNotificaciones([])
      setContador(0)
    } catch (err) {
      console.error('[PanFree] Error marcando todas las notificaciones:', err)
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Toast emergente flotante */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            backgroundColor: '#334c2b',
            color: '#eee6d9',
            padding: '1rem 1.4rem',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 2000,
            maxWidth: '400px',
            borderLeft: '5px solid #f46e15',
            animation: 'panfreeSlideIn 0.3s ease',
            fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.3rem', lineHeight: '1' }}>🔔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#b7996b', marginBottom: '0.2rem' }}>
                Nueva notificación
              </div>
              <div style={{ fontSize: '0.85rem', color: '#eee6d9', lineHeight: '1.4' }}>
                {toast.mensaje}
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#b7996b',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0',
                lineHeight: '1',
              }}
            >
              ✕
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
          fontSize: '1.3rem',
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
        🔔
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
            width: '360px',
            maxWidth: '90vw',
            maxHeight: '420px',
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '2px solid #b7996b',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
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
              <span style={{ fontSize: '1rem' }}>🔔</span>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#334c2b', fontWeight: '700' }}>
                Notificaciones
              </h3>
            </div>
            {contador > 0 && (
              <button
                type="button"
                onClick={marcarTodasComoLeidas}
                style={{
                  background: 'transparent',
                  border: '1px solid #b7996b',
                  borderRadius: '4px',
                  padding: '0.2rem 0.6rem',
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
            <p style={{ color: '#888', textAlign: 'center', margin: '1.5rem 0', fontSize: '0.88rem' }}>
              ⏳ Cargando notificaciones...
            </p>
          ) : notificaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#666' }}>
              <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>✨</p>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '600', color: '#2e7d32' }}>
                No hay notificaciones nuevas
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#999' }}>
                Te avisaremos cuando haya nuevos pedidos o alertas
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#faf7f2',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    borderLeft: '4px solid #f46e15',
                    border: '1px solid #ede4d6',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#333', fontWeight: '500', lineHeight: '1.4' }}>
                      {notif.mensaje}
                    </p>
                    {notif.created_at && (
                      <span style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.25rem', display: 'block' }}>
                        {formatFecha(notif.created_at)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => marcarComoLeida(notif.id)}
                    title="Marcar como leída"
                    style={{
                      background: '#fff',
                      border: '1px solid #b7996b',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#2e7d32',
                      fontSize: '0.85rem',
                      padding: '0.2rem 0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✓
                  </button>
                </div>
              ))}
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
