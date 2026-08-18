'use client'
/**
 * 📁 UBICACIÓN: src/hooks/useAnalytics.js
 * 📅 CREADO: 2026-08-18
 * 📌 DESCRIPCIÓN: Hook y utilidades para enviar eventos e-commerce a GA4.
 *    - Todas las llamadas están protegidas con try/catch: un error de analytics
 *      NUNCA debe romper la UI de la tienda (ej: adblockers, gtag no cargado).
 *    - Respeta el consentimiento (localStorage: panfree_ga_consent) y Do Not Track.
 *    - Eventos: page_view, view_item, view_item_list, select_item, add_to_cart,
 *      remove_from_cart, begin_checkout, purchase.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */
import { useCallback } from 'react'

export const CONSENT_KEY = 'panfree_ga_consent'

// ── Consentimiento ──────────────────────────────────────────────────────────
// Por defecto "otorgado" (opt-out), salvo que el usuario haya elegido 'denied'
// explícitamente, o el navegador tenga activado Do Not Track.
export function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false
  try {
    const guardado = window.localStorage.getItem(CONSENT_KEY)
    if (guardado === 'denied') return false
    if (guardado === 'granted') return true

    const dnt = navigator.doNotTrack || window.doNotTrack
    if (dnt === '1' || dnt === 'yes') return false
    return true
  } catch {
    return false
  }
}

export function setAnalyticsConsent(otorgado) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONSENT_KEY, otorgado ? 'granted' : 'denied')
    window.dispatchEvent(new CustomEvent('panfree-consent-change'))
  } catch {
    // localStorage puede fallar (modo privado, cuota) — no rompemos la app
  }
}

// ── Envío seguro a gtag ──────────────────────────────────────────────────────
function enviarEvento(nombre, params = {}) {
  if (typeof window === 'undefined') return
  if (!hasAnalyticsConsent()) return
  try {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', nombre, params)
  } catch (err) {
    console.warn('[GA4] Error enviando evento', nombre, err)
  }
}

// Normaliza un producto de PanFree (producto o item de carrito) al formato "item" de GA4
function formatearItem(producto, extra = {}) {
  return {
    item_id:       producto?.id || producto?.slug || 'sin-id',
    item_name:     producto?.nombre || 'Producto sin nombre',
    item_category: producto?.categoria || undefined,
    price:         Number(producto?.precio_venta ?? producto?.precio ?? 0),
    quantity:      Number(producto?.cantidad ?? extra.quantity ?? 1),
    currency:      'PYG',
    ...extra,
  }
}

export function useAnalytics() {
  const pageview = useCallback((url) => {
    if (typeof window === 'undefined' || !hasAnalyticsConsent()) return
    try {
      if (typeof window.gtag !== 'function') return
      window.gtag('event', 'page_view', {
        page_path: url,
        page_location: window.location.href,
        page_title: document.title,
      })
    } catch (err) {
      console.warn('[GA4] Error enviando page_view', err)
    }
  }, [])

  const viewItem = useCallback((producto) => {
    enviarEvento('view_item', {
      currency: 'PYG',
      value: Number(producto?.precio_venta ?? 0),
      items: [formatearItem(producto)],
    })
  }, [])

  const viewItemList = useCallback((productos = [], listName = 'Catálogo') => {
    if (!Array.isArray(productos) || productos.length === 0) return
    enviarEvento('view_item_list', {
      item_list_name: listName,
      items: productos.slice(0, 20).map((p, i) =>
        formatearItem(p, { index: i, item_list_name: listName })),
    })
  }, [])

  const selectItem = useCallback((producto, listName = 'Catálogo') => {
    enviarEvento('select_item', {
      item_list_name: listName,
      items: [formatearItem(producto, { item_list_name: listName })],
    })
  }, [])

  const addToCart = useCallback((producto, cantidad = 1) => {
    const item = formatearItem(producto, { quantity: cantidad })
    enviarEvento('add_to_cart', {
      currency: 'PYG',
      value: item.price * item.quantity,
      items: [item],
    })
  }, [])

  const removeFromCart = useCallback((producto, cantidad = 1) => {
    const item = formatearItem(producto, { quantity: cantidad })
    enviarEvento('remove_from_cart', {
      currency: 'PYG',
      value: item.price * item.quantity,
      items: [item],
    })
  }, [])

  const beginCheckout = useCallback((items = [], total = 0) => {
    if (!Array.isArray(items) || items.length === 0) return
    enviarEvento('begin_checkout', {
      currency: 'PYG',
      value: Number(total) || 0,
      items: items.map(i => formatearItem(i)),
    })
  }, [])

  const purchase = useCallback((pedido) => {
    if (!pedido?.numeroPedido) return
    enviarEvento('purchase', {
      transaction_id: pedido.numeroPedido,
      currency: 'PYG',
      value: Number(pedido.totalFinal) || 0,
      shipping: Number(pedido.costoDelivery) || 0,
      items: (pedido.items || []).map(i => formatearItem(i)),
    })
  }, [])

  return { pageview, viewItem, viewItemList, selectItem, addToCart, removeFromCart, beginCheckout, purchase }
}