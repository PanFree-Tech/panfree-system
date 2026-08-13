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
 */
import './globals.css'
import LayoutClient from './layout-client'

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

// viewport y themeColor DEBEN exportarse por separado en Next.js 14
export const viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit:  'cover',
  themeColor:   '#334c2b',
}

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
      </body>
    </html>
  )
}