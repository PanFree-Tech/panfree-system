'use client'
/**
 * 📁 UBICACIÓN: src/components/GAScript.jsx
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Carga Google Analytics 4 (gtag.js) vía next/script.
 *    - strategy="afterInteractive": no bloquea el render inicial ni el LCP.
 *    - Respeta el consentimiento guardado en localStorage (panfree_ga_consent).
 *    - Captura e inyecta parámetros UTM y campañas (useCampaigns).
 *    - El Measurement ID se lee de NEXT_PUBLIC_GA_MEASUREMENT_ID — NUNCA hardcodeado.
 *    - send_page_view:false porque los page_view se disparan manualmente
 *      desde AnalyticsPageTracker (layout-client.js) para soportar SPA routing con parámetros de campaña.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { hasAnalyticsConsent } from '../hooks/useAnalytics'
import { extractUTMParams, saveCampaign, getStoredCampaign } from '../hooks/useCampaigns'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function GAScript() {
  const [consentido, setConsentido] = useState(false)

  useEffect(() => {
    // 1. Extraer y guardar UTMs si existen en la URL al cargar
    const utm = extractUTMParams()
    if (utm) {
      saveCampaign(utm)
    }

    setConsentido(hasAnalyticsConsent())

    // Si el usuario cambia su preferencia de consentimiento en tiempo real
    function onConsentChange() {
      const consent = hasAnalyticsConsent()
      setConsentido(consent)
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: consent ? 'granted' : 'denied',
          ad_storage: consent ? 'granted' : 'denied',
        })
      }
    }

    window.addEventListener('panfree-consent-change', onConsentChange)
    return () => window.removeEventListener('panfree-consent-change', onConsentChange)
  }, [])

  // Fail-safe: si falta el ID o no hay consentimiento, no se renderiza nada
  if (!GA_MEASUREMENT_ID || !consentido) return null

  // Leer campaña para configurar default si está disponible
  const activeCampaign = typeof window !== 'undefined' ? getStoredCampaign() : null
  const campaignConfig = activeCampaign ? {
    campaign_source: activeCampaign.utm_source,
    campaign_medium: activeCampaign.utm_medium,
    campaign_name: activeCampaign.utm_campaign,
    campaign_term: activeCampaign.utm_term,
    campaign_content: activeCampaign.utm_content,
  } : {}

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
          gtag('consent', 'default', {
            'analytics_storage': 'granted',
            'ad_storage': 'granted'
          });
          gtag('config', '${GA_MEASUREMENT_ID}', {
            anonymize_ip: true,
            send_page_view: false,
            ${activeCampaign?.utm_source ? `campaign_source: ${JSON.stringify(activeCampaign.utm_source)},` : ''}
            ${activeCampaign?.utm_medium ? `campaign_medium: ${JSON.stringify(activeCampaign.utm_medium)},` : ''}
            ${activeCampaign?.utm_campaign ? `campaign_name: ${JSON.stringify(activeCampaign.utm_campaign)},` : ''}
            ${activeCampaign?.utm_term ? `campaign_term: ${JSON.stringify(activeCampaign.utm_term)},` : ''}
            ${activeCampaign?.utm_content ? `campaign_content: ${JSON.stringify(activeCampaign.utm_content)},` : ''}
          });
        `}
      </Script>
    </>
  )
}
