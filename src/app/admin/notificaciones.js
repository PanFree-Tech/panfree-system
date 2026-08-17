'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function NotificacionesAdmin() {
  const [notificaciones, setNotificaciones] = useState([])
  const [contador, setContador] = useState(0)
  const [mostrar, setMostrar] = useState(false)
  const audioRef = useRef(null)

  // Cargar audio de notificación (opcional)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3')
    }
  }, [])

  useEffect(() => {
    // Cargar notificaciones no leídas
    const cargarNotificaciones = async () => {
      const { data } = await supabase
        .from('notificaciones_admin')
        .select('*')
        .eq('leida', false)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotificaciones(data || [])
      setContador(data?.length || 0)
    }

    cargarNotificaciones()

    // Suscribirse a Realtime
    const subscription = supabase
      .channel('notificaciones_admin')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones_admin'
      }, (payload) => {
        setNotificaciones(prev => [payload.new, ...prev])
        setContador(prev => prev + 1)
        // Reproducir sonido si existe
        if (audioRef.current) {
          audioRef.current.play().catch(() => {})
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const marcarComoLeida = async (id) => {
    await supabase
      .from('notificaciones_admin')
      .update({ leida: true })
      .eq('id', id)

    setNotificaciones(prev => prev.filter(n => n.id !== id))
    setContador(prev => prev - 1)
  }

  const marcarTodasComoLeidas = async () => {
    const ids = notificaciones.map(n => n.id)
    if (ids.length === 0) return

    await supabase
      .from('notificaciones_admin')
      .update({ leida: true })
      .in('id', ids)

    setNotificaciones([])
    setContador(0)
  }

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
    }}>
      {/* Botón de campana */}
      <button
        onClick={() => setMostrar(!mostrar)}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.5rem',
          minHeight: '44px',
          minWidth: '44px',
        }}
      >
        🔔
        {contador > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: '#c62828',
            color: '#fff',
            borderRadius: '50%',
            fontSize: '0.7rem',
            padding: '0.1rem 0.4rem',
            minWidth: '18px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}>
            {contador}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {mostrar && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '380px',
          maxHeight: '400px',
          overflowY: 'auto',
          backgroundColor: '#fff',
          border: '2px solid #b7996b',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid #eee6d9',
            paddingBottom: '0.5rem',
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#334c2b' }}>
              Notificaciones
            </h3>
            {contador > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                style={{
                  background: 'transparent',
                  border: '1px solid #b7996b',
                  borderRadius: '4px',
                  padding: '0.2rem 0.6rem',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  color: '#888',
                }}
              >
                Marcar todas
              </button>
            )}
          </div>

          {notificaciones.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', margin: '1rem 0' }}>
              ✅ No hay notificaciones nuevas
            </p>
          ) : (
            notificaciones.map(notif => (
              <div key={notif.id} style={{
                padding: '0.6rem 0.8rem',
                backgroundColor: '#f9f6f1',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: '3px solid #f46e15',
              }}>
                <span style={{ fontSize: '0.9rem' }}>{notif.mensaje}</span>
                <button
                  onClick={() => marcarComoLeida(notif.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#b7996b',
                    fontSize: '1rem',
                    padding: '0.2rem',
                  }}
                >
                  ✅
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}