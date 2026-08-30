/**
 * UBICACION: src/app/auth/callback/route.js
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sanitizeSupabaseUrl, sanitizeSupabaseKey } from '@/lib/supabase'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
    const supabaseAnonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // ✅ Intercambia el código por la sesión usando el code_verifier de las cookies automáticamente
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session?.user) {
      const user = data.session.user

      // ✅ Crear o actualizar perfil en la tabla clientes
      try {
        const { data: existing } = await supabase
          .from('clientes')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (!existing || existing.length === 0) {
          const nombre =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            (user.email ? user.email.split('@')[0] : 'Cliente')
          const avatar =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null

          await supabase.from('clientes').insert({
            nombre_completo: nombre,
            email: user.email,
            user_id: user.id,
            is_active: true,
            role: 'cliente',
            avatar: avatar,
          })
        }
      } catch (profileErr) {
        console.error('Error al registrar perfil de cliente:', profileErr)
      }

      // Redirigir a la página de destino
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Error al intercambiar código por sesión:', error)
  }

  // Si hubo un error o no vino el código, redirigir al inicio o página de error
  return NextResponse.redirect(`${origin}/?auth_error=oauth_failed`)
}