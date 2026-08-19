/**
 * 📁 UBICACIÓN: src/lib/supabase-client.js
 * 📌 DESCRIPCIÓN: Cliente de Supabase para el navegador con @supabase/ssr
 *    Maneja y sincroniza automáticamente las cookies de autenticación entre el navegador y las API Routes de Next.js.
 */

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gbdrcaumghykiipqgbty.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjczNjIsImV4cCI6MjA4NzgwMzM2Mn0.OydRQxa51Ql42zvscWnQkEKJuU_3yeCS4qPQQoP6TuM'

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )

export const supabase = createClient()

export default supabase
