'use client'
/**
 * 📁 UBICACIÓN: src/hooks/useCampaigns.js
 * 📅 CREADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Hook y utilidades para captura, almacenamiento y gestión de parámetros UTM y campañas publicitarias.
 *    - Captura: utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid
 *    - Persistencia: Almacena en localStorage y Cookies (30 días de vigencia)
 *    - Integración: Exporta helpers para enriquecer eventos de Google Analytics 4 y Measurement Protocol
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

import { useEffect, useState, useCallback } from 'react'

export const UTM_STORAGE_KEY = 'panfree_utm_campaign'
export const UTM_COOKIE_KEY = 'panfree_utm'
const CAMPAIGN_EXPIRY_DAYS = 30

/**
 * Parsea y extrae parámetros de campaña desde una query string o URL
 */
export function extractUTMParams(searchString = '') {
  if (typeof window === 'undefined' && !searchString) return null

  const query = searchString || (typeof window !== 'undefined' ? window.location.search : '')
  if (!query) return null

  try {
    const params = new URLSearchParams(query)
    const utm_source = params.get('utm_source')
    const utm_medium = params.get('utm_medium')
    const utm_campaign = params.get('utm_campaign')
    const utm_term = params.get('utm_term')
    const utm_content = params.get('utm_content')
    const gclid = params.get('gclid')
    const fbclid = params.get('fbclid')

    // Solo considerar si al menos uno relevante está presente
    if (!utm_source && !utm_medium && !utm_campaign && !gclid && !fbclid) {
      return null
    }

    return {
      utm_source: utm_source || (gclid ? 'google' : fbclid ? 'facebook' : undefined),
      utm_medium: utm_medium || (gclid ? 'cpc' : fbclid ? 'social' : undefined),
      utm_campaign: utm_campaign || undefined,
      utm_term: utm_term || undefined,
      utm_content: utm_content || undefined,
      gclid: gclid || undefined,
      fbclid: fbclid || undefined,
      captured_at: new Date().toISOString(),
      landing_page: typeof window !== 'undefined' ? window.location.pathname : '/',
      referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
    }
  } catch (err) {
    console.warn('[useCampaigns] Error extrayendo UTM:', err)
    return null
  }
}

/**
 * Guarda los parámetros de campaña en LocalStorage y Cookie
 */
export function saveCampaign(campaignData) {
  if (typeof window === 'undefined' || !campaignData) return
  try {
    const jsonStr = JSON.stringify(campaignData)
    // 1. LocalStorage
    window.localStorage.setItem(UTM_STORAGE_KEY, jsonStr)

    // 2. Cookie de respaldo (30 días)
    const expires = new Date(Date.now() + CAMPAIGN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${UTM_COOKIE_KEY}=${encodeURIComponent(jsonStr)}; expires=${expires}; path=/; SameSite=Lax`

    // Notificar cambio
    window.dispatchEvent(new CustomEvent('panfree-campaign-updated', { detail: campaignData }))
  } catch (err) {
    console.warn('[useCampaigns] Error guardando campaña:', err)
  }
}

/**
 * Obtiene la campaña actualmente almacenada
 */
export function getStoredCampaign() {
  if (typeof window === 'undefined') return null
  try {
    // 1. Intentar desde LocalStorage
    const localData = window.localStorage.getItem(UTM_STORAGE_KEY)
    if (localData) {
      const parsed = JSON.parse(localData)
      // Validar expiración (30 días)
      if (parsed.captured_at) {
        const diffMs = Date.now() - new Date(parsed.captured_at).getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        if (diffDays <= CAMPAIGN_EXPIRY_DAYS) {
          return parsed
        }
      } else {
        return parsed
      }
    }

    // 2. Fallback a Cookie
    const match = document.cookie.match(new RegExp(`(^| )${UTM_COOKIE_KEY}=([^;]+)`))
    if (match && match[2]) {
      const cookieData = JSON.parse(decodeURIComponent(match[2]))
      return cookieData
    }
  } catch (err) {
    console.warn('[useCampaigns] Error leyendo campaña almacenada:', err)
  }
  return null
}

/**
 * Limpia la información de campaña guardada
 */
export function clearCampaign() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(UTM_STORAGE_KEY)
    document.cookie = `${UTM_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    window.dispatchEvent(new CustomEvent('panfree-campaign-updated', { detail: null }))
  } catch (err) {
    console.warn('[useCampaigns] Error limpiando campaña:', err)
  }
}

/**
 * Formatea los parámetros de campaña para ser enviados junto con eventos de GA4
 */
export function getCampaignForAnalytics() {
  const c = getStoredCampaign()
  if (!c) return {}
  const res = {}
  if (c.utm_source) res.campaign_source = c.utm_source
  if (c.utm_medium) res.campaign_medium = c.utm_medium
  if (c.utm_campaign) res.campaign_name = c.utm_campaign
  if (c.utm_term) res.campaign_term = c.utm_term
  if (c.utm_content) res.campaign_content = c.utm_content
  if (c.gclid) res.gclid = c.gclid
  return res
}

/**
 * Hook React para capturar y consultar campañas activas
 */
export function useCampaigns() {
  const [campaign, setCampaign] = useState(null)

  useEffect(() => {
    // 1. Extraer si hay parámetros nuevos en la URL actual
    const incomingUTM = extractUTMParams()
    if (incomingUTM) {
      saveCampaign(incomingUTM)
      setCampaign(incomingUTM)
    } else {
      // 2. Cargar campaña previa si existe
      const stored = getStoredCampaign()
      setCampaign(stored)
    }

    function onCampaignChange(e) {
      setCampaign(e.detail || null)
    }

    window.addEventListener('panfree-campaign-updated', onCampaignChange)
    return () => window.removeEventListener('panfree-campaign-updated', onCampaignChange)
  }, [])

  const getAnalyticsParams = useCallback(() => {
    return getCampaignForAnalytics()
  }, [])

  return {
    campaign,
    hasCampaign: Boolean(campaign?.utm_source || campaign?.utm_campaign),
    saveCampaign,
    clearCampaign,
    getStoredCampaign,
    getAnalyticsParams,
  }
}
