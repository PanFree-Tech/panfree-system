/**
 * 📁 UBICACIÓN: src/hooks/useMobile.js
 * 📌 Hook reutilizable para detección de dispositivos móviles y tablets.
 *    - Seguro para SSR (Server-Side Rendering de Next.js)
 *    - Detección en tiempo real de breakpoints mobile (<768px) y tablet (<1024px)
 *    - Detección de capacidades táctiles (touch)
 */

'use client'

import { useState, useEffect } from 'react'

export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [windowWidth, setWindowWidth] = useState(1200)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    // Verificar que window está disponible en cliente
    if (typeof window === 'undefined') return

    const checkDevice = () => {
      const width = window.innerWidth
      setWindowWidth(width)
      setIsMobile(width < breakpoint)
      setIsTablet(width >= breakpoint && width < 1024)
      setIsDesktop(width >= 1024)
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      )
    }

    // Comprobación inicial
    checkDevice()

    // Listener con debounce ligero para optimizar rendimiento
    let timeoutId = null
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkDevice, 80)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleResize, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [breakpoint])

  return {
    isMobile,
    isTablet,
    isDesktop,
    width: windowWidth,
    isTouchDevice,
  }
}

export default useMobile
