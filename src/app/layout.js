/*
 * UBICACION: src/app/layout.js
 * CORRECCIONES:
 *   - viewport y themeColor movidos al export `viewport` separado (Next.js 14 lo requiere)
 *   - Agregado metadataBase (eliminaba warning de Open Graph)
 * CAMBIOS 2026-03-04:
 *   - favicon.ico agregado como ícono principal (shortcut)
 *   - keywords, authors, creator, publisher para mejor SEO
 *   - title como objeto con template para páginas internas
 *   - og:image con alt descriptivo
 *   - link rel="shortcut icon" en  
 * CAMBIOS 2026-03-07:
 *   - ✅ NUEVO: FloatingCartButton (botón flotante en móvil)
 *   - ✅ NUEVO: SlideCart (carrito deslizable)
 *   - ✅ NUEVO: ToastNotification (notificaciones emergentes)
 * CAMBIOS 2026-08-15:
 *   - ✅ FIX: Mover CartInitializer a layout-client.js (Client Component)
 * CAMBIOS 2026-08-16:
 *   - ✅ NUEVO: Metaetiqueta de verificación de dominio de Facebook
 *     facebook-domain-verification: b1zdu5wmi3jvuvzewn9incwwy4uavo
 * CAMBIOS 2026-08-29:
 *   - ✅ NUEVO: Agregado componente Header en el layout principal
 */

import './globals.css'
import LayoutClient from './layout-client'

// ============================================
// METADATOS (SEO) - CON VERIFICACIÓN DE FACEBOOK
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

  // ✅ VERIFICACIÓN DE DOMINIO PARA FACEBOOK
   verification: {
    facebook: 'e74odtvc4c40a654s1hw4jl1rkdcep',
  },

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
    images: [{ url: '/og-image.jpg', width: 1200, height: 630,  alt: 'PanFree — Panificados Sin Gluten' }],
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
    apple:    [{ url: '/icons/icon-192x192.png', sizes: '192x192' , type: 'image/png' }],
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
// ROOT LAYOUT (Server Component)
// ============================================
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  )
}