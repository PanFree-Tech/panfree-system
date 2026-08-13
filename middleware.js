/**
 * 📁 UBICACIÓN: middleware.js (raíz del proyecto)
 * 📅 ACTUALIZADO: 2026-03-12
 * 📌 DESCRIPCIÓN: Middleware de Next.js para proteger rutas del panel admin.
 *    - Sin @supabase/ssr (no instalado). Usa solo cookies nativas de Next.js.
 *    - CAPA 1: Verifica que exista cookie de sesión de Supabase.
 *    - CAPA 2: Decodifica el JWT para leer app_metadata.role sin llamadas externas.
 *    - Sin sesión → redirige a /admin/login.
 *    - Con sesión pero rol !== 'admin' → redirige a / (tienda pública).
 *    - La verificación profunda ocurre en AdminLayout (cliente) como segunda capa.
 * ✅ 2026-03-12: user_metadata → app_metadata (app_metadata no es editable por el usuario).
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

import { NextResponse } from 'next/server'

/**
 * Decodifica el payload de un JWT sin verificar firma.
 * Solo usamos esto para leer el rol en el middleware de forma rápida.
 */
function decodeJwtPayload(token) {
  try {
    const base64Payload = token.split('.')[1]
    if (!base64Payload) return null
    const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Extrae el access_token de Supabase desde las cookies.
 * Supabase puede guardar la sesión en formato directo o chunkeado (.0, .1...).
 */
function extractAccessToken(request) {
  const cookies = request.cookies.getAll()
  const authCookies = cookies.filter(
    c => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )

  if (authCookies.length === 0) return null

  // Caso 1: cookie directa (sin chunking)
  const directCookie = authCookies.find(
    c => c.name.endsWith('-auth-token') && !c.name.match(/\.\d+$/)
  )
  if (directCookie) {
    try {
      const session = JSON.parse(decodeURIComponent(directCookie.value))
      return session?.access_token || session?.[0]?.access_token || null
    } catch { return null }
  }

  // Caso 2: cookie chunkeada (.0, .1, etc.)
  const chunks = authCookies
    .filter(c => c.name.match(/\.\d+$/))
    .sort((a, b) => parseInt(a.name.split('.').pop()) - parseInt(b.name.split('.').pop()))

  if (chunks.length > 0) {
    try {
      const joined = chunks.map(c => c.value).join('')
      const session = JSON.parse(decodeURIComponent(joined))
      return session?.access_token || null
    } catch { return null }
  }

  return null
}

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Login siempre público
  if (pathname === '/admin/login') return NextResponse.next()
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // ── CAPA 1: ¿Hay sesión? ──────────────────────────────────────────────────
  const accessToken = extractAccessToken(request)

  if (!accessToken) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── CAPA 2: ¿Es admin? ────────────────────────────────────────────────────
  const payload = decodeJwtPayload(accessToken)

  // Token expirado
  if (payload?.exp && Date.now() / 1000 > payload.exp) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // ✅ app_metadata no es editable por el usuario final (a diferencia de user_metadata)
  const userRole = payload?.app_metadata?.role

  if (userRole !== 'admin') {
    // Logueado pero NO es admin → a la tienda pública
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ✅ Admin verificado → permitir acceso
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}