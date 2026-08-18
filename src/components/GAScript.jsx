'use client'
/**
 * 📁 UBICACIÓN: src/components/GAScript.jsx
 * 📅 CREADO: 2026-08-18
 * 📌 DESCRIPCIÓN: Carga Google Analytics 4 (gtag.js) vía next/script.
 *    - strategy="afterInteractive": no bloquea el render inicial ni el LCP.
 *    - Respeta el consentimiento guardado en localStorage (panfree_ga_consent).
 *    - El Measurement ID se lee de NEXT_PUBLIC_GA_MEASUREMENT_ID — NUNCA hardcodeado.
 *    - send_page_view:false porque los page_view se disparan manualmente
 *      desde AnalyticsPageTracker (layout-client.js) para soportar SPA routing.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { hasAnalyticsConsent } from '../hooks/useAnalytics'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function GAScript() {
  const [consentido, setConsentido] = useState(false)

  useEffect(() => {
    setConsentido(hasAnalyticsConsent())

    // Si el usuario cambia su preferencia de consentimiento en tiempo real
    function onConsentChange() {
      setConsentido(hasAnalyticsConsent())
    }
    window.addEventListener('panfree-consent-change', onConsentChange)
    return () => window.removeEventListener('panfree-consent-change', onConsentChange)
  }, [])

  // Fail-safe: si falta el ID o no hay consentimiento, no se renderiza nada
  if (!GA_MEASUREMENT_ID || !consentido) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            anonymize_ip: true,
            send_page_view: false
          });
        `}
      </Script>
    </>
  )
}