/**
📁 UBICACIÓN: src/lib/supabase.js
📅 ACTUALIZADO: 2026-08-19
📌 DESCRIPCIÓN: Cliente de Supabase - VERSIÓN COMPATIBLE SSR Y NAVEGADOR
*/
import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ✅ Usar valores placeholder si las vars no existen (para permitir build)
// Los valores reales se inyectan en runtime desde flyctl secrets
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gbdrcaumghykiipqgbty.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjczNjIsImV4cCI6MjA4NzgwMzM2Mn0.OydRQxa51Ql42zvscWnQkEKJuU_3yeCS4qPQQoP6TuM'

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