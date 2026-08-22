/**
 * 📁 UBICACIÓN: src/lib/supabase-client.js
 * 📌 DESCRIPCIÓN: Cliente de Supabase para el navegador con @supabase/ssr
 *    Maneja y sincroniza automáticamente las cookies de autenticación entre el navegador y las API Routes de Next.js.
 */

import { createBrowserClient } from '@supabase/ssr'
import { sanitizeSupabaseUrl, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from './supabase'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

const supabaseUrl = sanitizeSupabaseUrl(rawUrl)
const supabaseAnonKey = (rawKey && typeof rawKey === 'string' && rawKey.trim()) ? rawKey.trim() : DEFAULT_SUPABASE_ANON_KEY

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )

export const supabase = createClient()

export default supabase
