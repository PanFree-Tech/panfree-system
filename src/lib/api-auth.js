/**
 * src/lib/api-auth.js
 * Helper para autenticacion dual en endpoints API:
 *   - Modo 1: JWT de Supabase (browser del admin)
 *   - Modo 2: API_TOKEN compartido (server-to-server)
 *
 * Uso:
 *   const auth = await requireAuth(req)
 *   if (!auth.ok) return auth.response
 *   // auth.user es el usuario (null si fue token compartido)
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sanitizeSupabaseUrl, sanitizeSupabaseKey } from '@/lib/supabase'

function getSupabaseAuthClient() {
  const url = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
  const anonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  return createServerClient(url, anonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}

/**
 * Valida el header Authorization del request.
 * Retorna { ok: true, user, mode } si es valido.
 * Retorna { ok: false, response } con NextResponse de error si no.
 *
 * @param {Request} req
 * @param {object} options
 * @param {boolean} options.requireAdmin - si true, solo admins (default: true)
 * @returns {Promise<{ok: boolean, user?: object, mode?: 'token'|'jwt', response?: NextResponse}>}
 */
export async function requireAuth(req, { requireAdmin = true } = {}) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]?.trim()

  // 1. Sin header -> 401
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'No autorizado: falta header Authorization' },
        { status: 401 }
      ),
    }
  }

  // 2. Modo token compartido (server-to-server)
  const apiToken = process.env.API_TOKEN
  if (apiToken && token === apiToken) {
    return { ok: true, user: null, mode: 'token' }
  }

  // 3. Modo JWT (browser del admin)
  try {
    const supabase = getSupabaseAuthClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: 'No autorizado: JWT invalido' },
          { status: 401 }
        ),
      }
    }

    // 4. Si requireAdmin, verificar rol en tabla clientes (patron is_admin)
    if (requireAdmin) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cliente?.role !== 'admin') {
        return {
          ok: false,
          response: NextResponse.json(
            { success: false, error: 'No autorizado: se requiere rol admin' },
            { status: 403 }
          ),
        }
      }
    }

    return { ok: true, user, mode: 'jwt' }
  } catch (err) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Error validando autenticacion' },
        { status: 500 }
      ),
    }
  }
}