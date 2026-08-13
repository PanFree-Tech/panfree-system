//📁 src/components/OnlineStatusIndicator.js
'use client'
import { useState, useEffect } from 'react'

export default function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOffline, setShowOffline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowOffline(false)
      setTimeout(() => {
        // Mostrar mensaje de reconexión por 3 segundos
        setShowOffline(true)
        setTimeout(() => setShowOffline(false), 3000)
      }, 500)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showOffline) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '20px',
      right: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      backgroundColor: isOnline ? '#4caf50' : '#f44336',
      color: 'white',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      textAlign: 'center',
      zIndex: 999,
      fontWeight: '600',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      animation: 'fadeInOut 3s ease',
    }}>
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
      
      {isOnline ? '🟢 Conexión restablecida' : '🔴 Sin conexión - Modo offline'}
    </div>
  )
}