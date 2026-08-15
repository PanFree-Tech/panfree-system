'use client'
import { useEffect, useRef } from 'react'

export default function PWAInstallPrompt() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Registrar service worker de forma idempotente
    let reg
    navigator.serviceWorker.getRegistration('/sw.js').then(existing => {
      if (existing) return existing
      return navigator.serviceWorker.register('/sw.js')
    }).then((registration) => {
      reg = registration
      if (Notification.permission === 'denied') return null
      return reg.pushManager.getSubscription()
    }).then((subscription) => {
      if (subscription) {
        // ya suscrito — opcional: enviar al backend para refrescar info
        fetch('/api/push-suscribir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, source: 'pwa-install' }),
        }).catch(() => {})
        return
      }
      // solicitar permiso y suscribir si fue aceptado
      return Notification.requestPermission().then(permission => {
        if (permission !== 'granted') return null
        // VAPID_PUBLIC_KEY debe inyectarse via env o meta tag
        const VAPID_PUBLIC_KEY = window.__VAPID_PUBLIC_KEY__ || process.env.NEXT_PUBLIC_VAPID_KEY
        const converted = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: converted,
        })
      }).then(newSub => {
        if (!newSub) return null
        return fetch('/api/push-suscribir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: newSub, source: 'pwa-install' }),
        })
      })
    }).catch(err => {
      console.warn('PW install prompt init error', err)
    })

    // helper
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
  }, [])

  return null
}