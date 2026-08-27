/**
📁 UBICACIÓN: src/lib/supabase.js
📅 ACTUALIZADO: 2026-08-19
📌 DESCRIPCIÓN: Cliente de Supabase - VERSIÓN COMPATIBLE SSR Y NAVEGADOR
*/
import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const DEFAULT_SUPABASE_URL = 'https://gbdrcaumghykiipqgbty.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjczNjIsImV4cCI6MjA4NzgwMzM2Mn0.OydRQxa51Ql42zvscWnQkEKJuU_3yeCS4qPQQoP6TuM'

/**
 * Sanitiza y asegura que supabaseUrl sea una URL HTTP/HTTPS válida
 */
export function sanitizeSupabaseUrl(url) {
  if (!url || typeof url !== 'string') return DEFAULT_SUPABASE_URL
  let clean = url.trim()
  if (!clean) return DEFAULT_SUPABASE_URL
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`
  }
  try {
    new URL(clean)
    return clean
  } catch {
    return DEFAULT_SUPABASE_URL
  }
}

export function sanitizeSupabaseKey(key) {
  if (!key || typeof key !== 'string') return DEFAULT_SUPABASE_ANON_KEY
  const clean = key.trim()
  const parts = clean.split('.')
  // A valid Supabase JWT token MUST have 3 parts (header.payload.signature)
  if (parts.length !== 3 || clean.length < 50) {
    return DEFAULT_SUPABASE_ANON_KEY
  }
  return clean
}

// ✅ Usar valores sanitizados
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

// ✅ Crear cliente SIEMPRE - NUNCA retornar null
export const supabase = typeof window !== 'undefined'
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Validar en runtime (cliente) si son los valores de producción
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase usando valores por defecto. Verificar flyctl secrets.')
  }
}

// Función helper para verificar conexión real
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('productos').select('id').limit(1)
    if (error) throw error
    return { connected: true, data }
  } catch (err) {
    console.error('❌ Error de conexión Supabase:', err.message)
    return { connected: false, error: err.message }
  }
}