import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sanitizeSupabaseUrl } from '@/lib/supabase'

const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) || (() => { throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada') })()

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

  const role = user.app_metadata?.role
  if (role !== 'admin') {
    if (isApiAdmin) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
