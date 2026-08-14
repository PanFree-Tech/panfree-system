/**
 * UBICACION: src/app/page.js
 * ACTUALIZADO: 2026-08-14 — manejo de errores y logs
 */
import { createClient } from '@supabase/supabase-js'
import TiendaCliente from './TiendaCliente'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Caché: revalidar cada 5 minutos
export const revalidate = 300

async function cargarDatos() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Fail loudly in server logs so deploys with missing envs sean detectables.
    console.error('[cargarDatos] Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY', {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
    })
    return { productos: [], disponibilidad: {}, errors: { missingEnv: true } }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, detectSessionInUrl: false }
  })

  const [prodRes, dispRes] = await Promise.all([
    supabase
      .from('productos')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('nombre',      { ascending: true }),
    supabase
      .from('vista_disponibilidad_productos')
      .select('producto_id, disponible, tandas_posibles, ingredientes_faltantes, requiere_anticipacion'),
  ])

  if (prodRes.error) {
    console.error('[Supabase] productos error:', prodRes.error)
  } else {
    console.log(`[Supabase] productos: ${Array.isArray(prodRes.data) ? prodRes.data.length : 0} items`)
  }

  if (dispRes.error) {
    console.error('[Supabase] disponibilidad error:', dispRes.error)
  } else {
    console.log(`[Supabase] disponibilidad: ${Array.isArray(dispRes.data) ? dispRes.data.length : 0} rows`)
  }

  const dispMap = {}
  ;(dispRes.data || []).forEach(d => { dispMap[d.producto_id] = d })

  return {
    productos:     prodRes.data || [],
    disponibilidad: dispMap,
    errors: {
      productos: prodRes.error || null,
      disponibilidad: dispRes.error || null,
    }
  }
}

export default async function PaginaInicio() {
  const { productos, disponibilidad, errors } = await cargarDatos()

  console.log('[PaginaInicio] productos.length =', (productos || []).length, ' errors=', errors)

  return (
    <TiendaCliente
      productos={productos}
      disponibilidad={disponibilidad}
      fetchErrors={errors}
    />
  )
}
