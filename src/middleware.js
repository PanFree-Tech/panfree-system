import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { sanitizeSupabaseUrl, sanitizeSupabaseKey } from '@/lib/supabase'

const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) || (() => { throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada') })()

function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    logger.warn('[middleware] SUPABASE_SERVICE_ROLE_KEY no configurada, no se puede verificar clientes.role')
    return null
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const isApiAdmin = pathname.startsWith('/api/admin')
  const isAdminPage = pathname.startsWith('/admin')

  if (pathname === '/admin/login') return NextResponse.next()
  if (!isApiAdmin && !isAdminPage) return NextResponse.next()

  let response = NextResponse.next({ request: { headers: request.headers } })
  let user = null

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    })
    const { data, error } = await supabase.auth.getUser()
    if (!error && data?.user) user = data.user
  } catch (e) {
    logger.error('Error en middleware auth (AUD-002):', e?.message)
  }

  if (!user) {
    if (isApiAdmin) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fase 4 #1: verificar rol real en clientes.role (ADR-002)
  // Fallback: app_metadata.role (compatibilidad con el JWT viejo)
  let role = user.app_metadata?.role

  const adminClient = getSupabaseAdmin()
  if (adminClient) {
    try {
      const { data: cliente, error: clienteError } = await adminClient
        .from('clientes')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (clienteError) {
        logger.warn('[middleware] Error consultando clientes.role:', clienteError.message)
      } else if (cliente?.role) {
        role = cliente.role
      }
    } catch (e) {
      logger.warn('[middleware] Excepcion consultando clientes.role:', e?.message)
    }
  }

  if (role !== 'admin') {
    if (isApiAdmin) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}