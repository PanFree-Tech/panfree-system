/**
 * 📁 UBICACIÓN: src/middleware.js
 * 📅 ACTUALIZADO: 2026-10-13 - F3-01 (SEC-003 cerrado)
 * 📌 DESCRIPCIÓN: Middleware de Next.js para protección perimetral de rutas /admin y /api/admin.
 *    - Protege todas las rutas /admin/* y /api/admin/*
 *    - CAPA 1: Verifica sesión activa de Supabase
 *    - CAPA 2: Verifica rol 'admin' leyendo SOLO de app_metadata (ADR-002)
 *
 *    ADR-002: app_metadata.role es la ÚNICA fuente de verdad del rol.
 *    user_metadata NUNCA se usa para autorización (es editable por el usuario).
 *
 *    - API sin auth → 401 JSON
 *    - API sin rol admin → 403 JSON
 *    - Web sin auth → Redirige a /admin/login con redirect param
 *    - Web sin rol admin → Redirige a /unauthorized
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { sanitizeSupabaseUrl } from '@/lib/supabase'

// Variables de entorno de Supabase sanitizadas
const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) || (() => { throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada') })()

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const isApiAdmin = pathname.startsWith('/api/admin')
  const isAdminPage = pathname.startsWith('/admin')

  // ============================================
  // 1. EXCLUSIONES PÚBLICAS
  // ============================================
  // Permitir la página de inicio de sesión de admin
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Si no es una ruta administrativa, continuar normalmente
  if (!isApiAdmin && !isAdminPage) {
    return NextResponse.next()
  }

  // ============================================
  // 2. CREAR CLIENTE SUPABASE COMPATIBLE
  // ============================================
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  let user = null

  try {
    // Intentar con createServerClient (@supabase/ssr)
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

    const { data, error } = await supabase.auth.getUser()
    if (!error && data?.user) {
      user = data.user
    } else {
      // Fallback a getSession
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        user = sessionData.session.user
      }
    }
  } catch {
    // Fallback secundario con createMiddlewareClient de auth-helpers
    try {
      const supabaseHelper = createMiddlewareClient({ req: request, res: response })
      const { data: { session } } = await supabaseHelper.auth.getSession()
      user = session?.user || null
    } catch (e) {
      console.error('Error inicializando auth helper en middleware:', e.message)
    }
  }

  // ============================================
  // 3. CAPA 1: VERIFICAR AUTENTICACIÓN
  // ============================================
  if (!user) {
    // Para rutas API: responder 401 JSON
    if (isApiAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado',
          message: 'Se requiere una sesión activa para acceder a este recurso de administración.',
        },
        { status: 401 }
      )
    }

    // Para páginas web de /admin: redirigir a /admin/login
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ============================================
  // 4. CAPA 2: VERIFICAR ROL 'admin'
  // ============================================
  // ADR-002: SOLO app_metadata.role es fuente de verdad.
  // user_metadata es editable por el usuario y NUNCA se consulta acá.
  // Ver: docs/architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md
  const userRole = user.app_metadata?.role

  const isAdmin = userRole === 'admin'

  if (!isAdmin) {
    // Para rutas API: responder 403 JSON
    if (isApiAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
          message: 'Permisos insuficientes. Se requiere rol de administrador.',
        },
        { status: 403 }
      )
    }

    // Para páginas web: redirigir a página de no autorizado
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // ============================================
  // 5. ACCESO PERMITIDO
  // ============================================
  return response
}

// Configuración de rutas interceptadas por el Middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}