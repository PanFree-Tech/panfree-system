// 📁 src/components/PWAInstallPrompt.js
'use client'
import { useState, useEffect } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar PWA')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleClose = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      backgroundColor: '#334c2b',
      color: '#eee6d9',
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000,
      border: '2px solid #b7996b',
      animation: 'slideUp 0.3s ease',
    }}>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img 
          src="/icons/icon-192x192.png" 
          alt="PanFree"
          style={{ width: '48px', height: '48px', borderRadius: '12px' }}
        />
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 0.25rem', color: '#b7996b' }}>
            Instalar PanFree
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            Instala esta app en tu dispositivo para usarla sin internet
          </p>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '0.5rem', 
        marginTop: '1rem' 
      }}>
        <button
          onClick={handleClose}
          style={{
            backgroundColor: 'transparent',
            border: '2px solid #b7996b',
            color: '#b7996b',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Ahora no
        </button>
        <button
          onClick={handleInstall}
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
          Instalar
        </button>
      </div>
    </div>
  )
}