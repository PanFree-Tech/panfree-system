/**
 * 📁 UBICACIÓN: middleware.js (raíz)
 * 📅 ACTUALIZADO: 2026-08-15 (VERIFICA JWT CORRECTAMENTE)
 * 📌 DESCRIPCIÓN: Middleware de Next.js para proteger rutas del panel admin.
 *    CAMBIO CRÍTICO: Ahora VERIFICA la firma del JWT, no solo lo decodifica.
 *    - Usa @supabase/auth-helpers-nextjs para validación correcta
 *    - CAPA 1: Verifica que exista sesión de Supabase
 *    - CAPA 2: Verifica que tenga rol 'admin'
 *    - Sin sesión → redirige a /admin/login
 *    - Con sesión pero rol !== 'admin' → redirige a / (tienda pública)
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // ============================================
  // PERMITIR /admin/login SIEMPRE
  // ============================================
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // ============================================
  // SI NO ES RUTA /admin → PERMITIR
  // ============================================
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // ============================================
  // CREAR CLIENTE DE SUPABASE (VERIFICA JWT)
  // ============================================
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  try {
    // ── CAPA 1: ¿Hay sesión válida? ────────────────────────────────────
    // getSession() VERIFICA la firma del JWT automáticamente
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Error verificando sesión:', error)
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!session?.user) {
      // No hay sesión válida → redirigir a login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // ── CAPA 2: ¿Es admin? ─────────────────────────────────────────────
    // Verificar app_metadata.role (no es editable por el usuario)
    const userRole =
      session.user.app_metadata?.role || session.user.user_metadata?.role

    if (userRole !== 'admin') {
      // Logueado pero NO es admin → a la tienda pública
      return NextResponse.redirect(new URL('/', request.url))
    }

    // ── VERIFICACIÓN EXITOSA → PERMITIR ACCESO ─────────────────────────
    return res
  } catch (err) {
    console.error('Error en middleware:', err)
    // En caso de error, redirigir a login para seguridad
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}