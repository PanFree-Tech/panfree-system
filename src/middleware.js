/**
 * 📁 UBICACIÓN: src/middleware.js
 * 📅 ACTUALIZADO: 2026-08-16
 * 📌 DESCRIPCIÓN: Middleware de Next.js para proteger rutas del panel admin.
 *    - Usa @supabase/ssr (versión moderna y más segura)
 *    - CAPA 1: Verifica que exista sesión de Supabase
 *    - CAPA 2: Verifica que tenga rol 'admin'
 *    - Sin sesión → redirige a /admin/login
 *    - Con sesión pero rol !== 'admin' → redirige a / (tienda pública)
 *    - Valores de respaldo para evitar errores de build
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// ⚠️ VALORES DE RESPALDO (para evitar errores de build si faltan variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gbdrcaumghykiipqgbty.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjczNjIsImV4cCI6MjA4NzgwMzM2Mn0.OydRQxa51Ql42zvscWnQkEKJuU_3yeCS4qPQQoP6TuM'

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
  // CREAR CLIENTE DE SUPABASE CON @supabase/ssr
  // ============================================
  let response = NextResponse.next()
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  try {
    // ── CAPA 1: ¿Hay sesión válida? ────────────────────────────────────
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // No hay sesión válida → redirigir a login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // ── CAPA 2: ¿Es admin? ─────────────────────────────────────────────
    const userRole = user.app_metadata?.role || user.user_metadata?.role

    if (userRole !== 'admin') {
      // Logueado pero NO es admin → a la tienda pública
      return NextResponse.redirect(new URL('/', request.url))
    }

    // ── VERIFICACIÓN EXITOSA → PERMITIR ACCESO ─────────────────────────
    return response
  } catch (err) {
    console.error('Error en middleware:', err)
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}