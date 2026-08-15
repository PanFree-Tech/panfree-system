//📁 src/components/PWAReloadPrompt.js
'use client'
import React, { useState, useEffect } from 'react';

export default function PWAReloadPrompt() {
  const [waitingWorker, setWaitingWorker] = useState(null)
  const [showReload, setShowReload] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker)
              setShowReload(true)
            }
          })
        })
      })
    }
  }, [])

  const handleReload = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  if (!showReload) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#334c2b',
      color: '#eee6d9',
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000,
      border: '2px solid #b7996b',
      maxWidth: '400px',
      width: '90%',
      textAlign: 'center',
    }}>
      <p style={{ margin: '0 0 1rem' }}>
        🚀 ¡Nueva versión disponible!
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button
          onClick={() => setShowReload(false)}
          style={{
            backgroundColor: 'transparent',
            border: '2px solid #b7996b',
            color: '#b7996b',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
        <button
          onClick={handleReload}
          style={{
            backgroundColor: '#b7996b',
            border: 'none',
            color: '#334c2b',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '700',
          }}
        >
          Actualizar
        </button>
      </div>
    </div>
  )
}