/**
 * 📁 UBICACIÓN: src/hooks/usePushNotifications.js
 * 📅 ACTUALIZADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Hook de React para gestionar Push Notifications Web (VAPID) y Service Worker en PanFree:
 *    - Detección de compatibilidad en el navegador
 *    - Solicitud de permisos con feedback claro (default, granted, denied)
 *    - Suscripción y registro automático/manual sincronizado con Supabase (/api/push-suscribir)
 *    - Envío de notificaciones de prueba (sendTestNotification)
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Convierte una clave VAPID pública en Base64 URL a Uint8Array requerido por PushManager
 */
function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array()
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isSubscribingRef = useRef(false)

  // ── 1. Verificar soporte y estado inicial de suscripción ──
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        setIsSupported(false)
        setPermission('unsupported')
        setLoading(false)
        return
      }

      setIsSupported(true)
      const currentPermission = Notification.permission
      setPermission(currentPermission)

      // Registrar o sincronizar Service Worker
      let registration
      try {
        registration = await navigator.serviceWorker.getRegistration()
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        }
      } catch (swErr) {
        console.warn('[Push Hook] Error obteniendo Service Worker registration:', swErr.message)
      }

      if (!registration) {
        setLoading(false)
        return
      }

      // Verificar si ya existe suscripción activa en PushManager
      const existingSub = await registration.pushManager.getSubscription()
      if (existingSub) {
        setSubscription(existingSub)
        setIsSubscribed(true)
      } else {
        setSubscription(null)
        setIsSubscribed(false)
      }
    } catch (err) {
      console.warn('⚠️ [Push Hook] Error verificando estado de push:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSubscriptionStatus()
  }, [checkSubscriptionStatus])

  // ── 2. Solicitar permiso al usuario de forma explícita ──
  const requestPermission = async () => {
    if (!isSupported) {
      setError('Las notificaciones push no están soportadas en este navegador')
      return 'unsupported'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (err) {
      console.error('❌ [Push Hook] Error solicitando permiso:', err)
      setError(err.message)
      return 'denied'
    }
  }

  // ── 3. Suscribir dispositivo y guardar en Supabase ──
  const subscribe = async (userId = null) => {
    if (!isSupported) {
      setError('Notificaciones no soportadas en este navegador')
      return { success: false, error: 'No soportado' }
    }

    if (isSubscribingRef.current) {
      console.log('⏳ [Push Hook] Suscripción en curso, esperando...')
      return { success: false, inProgress: true }
    }

    isSubscribingRef.current = true
    setLoading(true)
    setError(null)

    try {
      // 1. Validar y solicitar permiso si es necesario
      let currentPermission = Notification.permission
      if (currentPermission === 'default') {
        currentPermission = await Notification.requestPermission()
        setPermission(currentPermission)
      }

      if (currentPermission !== 'granted') {
        throw new Error('Permiso de notificaciones no concedido por el usuario')
      }

      // 2. Asegurar que el Service Worker esté registrado y listo
      let registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      }

      // Esperar a que el SW esté activo
      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') resolve()
          })
          setTimeout(resolve, 1500) // Fallback timeout
        })
      }

      // 3. Obtener clave pública VAPID
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error('Variable NEXT_PUBLIC_VAPID_PUBLIC_KEY no encontrada en el entorno')
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      // 4. Obtener o crear suscripción en PushManager
      let pushSub = await registration.pushManager.getSubscription()
      if (!pushSub) {
        pushSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        })
      }

      // 5. Guardar suscripción en Supabase vía API
      const subPayload = pushSub.toJSON ? pushSub.toJSON() : pushSub
      const response = await fetch('/api/push-suscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subPayload,
          userId: userId,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar suscripción en la base de datos')
      }

      setSubscription(pushSub)
      setIsSubscribed(true)
      setPermission('granted')
      console.log('🎉 [Push Hook] Dispositivo suscrito con éxito a Push Notifications')

      return { success: true, subscription: pushSub }
    } catch (err) {
      console.error('❌ [Push Hook] Error al suscribir a push:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      isSubscribingRef.current = false
    }
  }

  // ── 4. Desuscribir dispositivo ──
  const unsubscribe = async () => {
    if (!isSupported) return { success: false }

    setLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const currentSub = await registration.pushManager.getSubscription()
        if (currentSub) {
          const endpoint = currentSub.endpoint
          await currentSub.unsubscribe()

          // Eliminar de Supabase
          await fetch(`/api/push-suscribir?endpoint=${encodeURIComponent(endpoint)}`, {
            method: 'DELETE',
          }).catch((e) => console.warn('Error al eliminar en backend:', e))
        }
      }

      setSubscription(null)
      setIsSubscribed(false)
      return { success: true }
    } catch (err) {
      console.error('❌ [Push Hook] Error al desuscribir:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // ── 5. Enviar notificación de prueba ──
  const sendTestNotification = async (customTitle, customBody) => {
    try {
      const response = await fetch('/api/push-notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: customTitle || '🍞 Notificación de Prueba - PanFree',
          cuerpo: customBody || '¡El sistema de notificaciones Push Web está funcionando correctamente!',
          url_accion: '/admin/pedidos',
          sendToAdmins: true,
        }),
      })

      const result = await response.json()
      return result
    } catch (err) {
      console.error('❌ [Push Hook] Error enviando prueba:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    loading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    refreshStatus: checkSubscriptionStatus,
  }
}
export default usePushNotifications
