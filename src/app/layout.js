/**
 * UBICACION: src/app/layout.js
 * CORRECCIONES:
 *   - viewport y themeColor movidos al export `viewport` separado (Next.js 14 lo requiere)
 *   - Agregado metadataBase (eliminaba warning de Open Graph)
 * CAMBIOS 2026-03-04:
 *   - favicon.ico agregado como ícono principal (shortcut)
 *   - keywords, authors, creator, publisher para mejor SEO
 *   - title como objeto con template para páginas internas
 *   - og:image con alt descriptivo
 *   - link rel="shortcut icon" en <head>
 * CAMBIOS 2026-03-07:
 *   - ✅ NUEVO: FloatingCartButton (botón flotante en móvil)
 *   - ✅ NUEVO: SlideCart (carrito deslizable)
 *   - ✅ NUEVO: ToastNotification (notificaciones emergentes)
 *   - ✅ NUEVO: Inicialización del carrito global (window.__PANFREE_CART)
 */

import './globals.css'
import LayoutClient from './layout-client'
import FloatingCartButton from '@/components/FloatingCartButton'
import SlideCart from '@/components/SlideCart'
import ToastNotification from '@/components/ToastNotification'

// ============================================
// METADATOS (SEO) - SIN CAMBIOS
// ============================================
export const metadata = {
  metadataBase: new URL('https://panfree.fit'),

  title: {
    default:  'PanFree — Panificados Sin Gluten | Encarnación, Paraguay',
    template: '%s | PanFree',
  },
  description: 'El placer de volver a comer libremente. Panificados artesanales sin gluten en Encarnación, Paraguay.',
  keywords: ['sin gluten', 'panificados', 'panadería', 'Encarnación', 'Paraguay', 'celíaco', 'sin TACC', 'PanFree'],
  authors:   [{ name: 'PanFree' }],
  creator:   'PanFree',
  publisher: 'PanFree',
  manifest:  '/manifest.json',

  appleWebApp: {
    capable:         true,
    statusBarStyle:  'default',
    title:           'PanFree',
  },
  formatDetection: { telephone: false },

  openGraph: {
    type:        'website',
    locale:      'es_PY',
    url:         'https://panfree.fit',
    siteName:    'PanFree',
    title:       'PanFree — Panificados Sin Gluten',
    description: 'El placer de volver a comer libremente.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'PanFree — Panificados Sin Gluten' }],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'PanFree',
    description: 'Panificados sin gluten en Encarnación',
    images:      ['/og-image.jpg'],
  },

  icons: {
    icon: [
      { url: '/favicon.ico',            sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple:    [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
}

// ============================================
// VIEWPORT - SIN CAMBIOS
// ============================================
export const viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit:  'cover',
  themeColor:   '#334c2b',
}

// ============================================
// INICIALIZACIÓN DEL CARRITO GLOBAL
// (se ejecuta en el cliente para que los componentes lo usen)
// ============================================
function CartInitializer() {
  'use client'
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (!window.__PANFREE_CART) {
      const listeners = new EventTarget()
      const toastListeners = new EventTarget()
      const STORAGE_KEY = 'panfree_cart_v1'
      const saved = localStorage.getItem(STORAGE_KEY)
      const items = saved ? JSON.parse(saved) : []

      const save = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        listeners.dispatchEvent(new CustomEvent('update'))
      }

      window.__PANFREE_CART = {
        items,
        listeners,
        toastListeners,
        isOpen: false,
        subscribe(fn) { listeners.addEventListener('update', fn) },
        unsubscribe(fn) { listeners.removeEventListener('update', fn) },
        open() {
          window.__PANFREE_CART.isOpen = true
          listeners.dispatchEvent(new CustomEvent('open', { detail: true }))
        },
        close() {
          window.__PANFREE_CART.isOpen = false
          listeners.dispatchEvent(new CustomEvent('close', { detail: false }))
        },
        getItems() { return [...items] },
        getCount() { return items.reduce((s, it) => s + (it.quantity || 1), 0) },
        getTotal() { return items.reduce((s, it) => s + (it.quantity || 1) * (it.price || 0), 0) },
        addItem(product) {
          const idx = items.findIndex((i) => i.id === product.id)
          if (idx >= 0) {
            items[idx].quantity = (items[idx].quantity || 1) + (product.quantity || 1)
          } else {
            items.push({ ...product, quantity: product.quantity || 1 })
          }
          save()
        },
        updateQuantity(id, quantity) {
          const idx = items.findIndex((i) => i.id === id)
          if (idx >= 0) {
            items[idx].quantity = quantity
            if (items[idx].quantity <= 0) items.splice(idx, 1)
            save()
          }
        },
        removeItem(id) {
          const idx = items.findIndex((i) => i.id === id)
          if (idx >= 0) {
            items.splice(idx, 1)
            save()
          }
        },
        clear() {
          items.length = 0
          save()
        },
        showToast(msg) {
          toastListeners.dispatchEvent(new CustomEvent('toast', { detail: msg }))
        },
        onToast(fn) { toastListeners.addEventListener('toast', fn) },
        offToast(fn) { toastListeners.removeEventListener('toast', fn) },
      }
    }
  }, [])

  return null
}

// ============================================
// ROOT LAYOUT (Server Component)
// ============================================
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PanFree" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#334c2b" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <LayoutClient>
          {children}
        </LayoutClient>
        
        {/* ✅ NUEVO: Componentes del carrito flotante */}
        <CartInitializer />
        <FloatingCartButton />
        <SlideCart />
        <ToastNotification />
      </body>
    </html>
  )
}