/**
src/lib/supabase.js
ACTUALIZADO: 2026-10-14
DESCRIPCION: Cliente de Supabase - VERSION COMPATIBLE SSR Y NAVEGADOR
SEGURIDAD (SEC-002): sin claves ni URLs hardcodeadas.
  Las env vars son obligatorias. Si faltan, fail-fast en runtime.
*/
import logger from '@/lib/logger'
import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Sanitiza y asegura que supabaseUrl sea una URL HTTP/HTTPS valida.
 * Fail-fast: si no hay URL, tira error explicito (SEC-002).
 */
export function sanitizeSupabaseUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL no esta configurada. ' +
      'Agregala en .env.local (dev) o en las env vars del hosting (prod).'
    )
  }
  let clean = url.trim()
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = "https://" + clean
  }
  try {
    new URL(clean)
    return clean
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no es una URL valida: " + url)
  }
}

/**
 * Sanitiza la anon key de Supabase.
 * Fail-fast: si no hay key valida, tira error explicito (SEC-002).
 */
export function sanitizeSupabaseKey(key) {
  if (!key || typeof key !== 'string' || !key.trim()) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY no esta configurada. ' +
      'Agregala en .env.local (dev) o en las env vars del hosting (prod).'
    )
  }
  const clean = key.trim()

  // Aceptar ambos formatos de Supabase:
  //   - JWT legacy (eyJ...): header.payload.signature (3 partes)
  //   - Publishable nuevo (sb_publishable_...): string corto
  const esJWT = clean.split('.').length === 3 && clean.length >= 50
  const esPublishable = clean.startsWith('sb_publishable_')

  if (!esJWT && !esPublishable) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY no tiene formato valido. ' +
      'Se espera JWT legacy (eyJ...) o Publishable key (sb_publishable_...).'
    )
  }
  return clean
}

// Usar valores sanitizados (fail-fast si faltan env vars)
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

const supabaseUrl = sanitizeSupabaseUrl(rawUrl)
const supabaseAnonKey = sanitizeSupabaseKey(rawKey)

export const createClient = () => {
  if (typeof window !== 'undefined') {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Crear cliente SIEMPRE - NUNCA retornar null
export const supabase = typeof window !== 'undefined'
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Funcion helper para verificar conexion real
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('productos').select('id').limit(1)
    if (error) throw error
    return { connected: true, data }
  } catch (err) {
    logger.error('Error de conexion Supabase:', err.message)
    return { connected: false, error: err.message }
  }
}
