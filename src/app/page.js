/**
 * UBICACION: src/app/page.js
 * ACTUALIZADO: 2026-03-06
 * CAMBIOS:
 *  - Convertido a Server Component (elimina 'use client')
 *  - Datos cargados en servidor con revalidate: 300 (5 min)
 *  - Estado e interactividad delegados a TiendaCliente.js
 *  - Mismo patrón que layout.js → layout-client.js
 */
import { createClient } from '@supabase/supabase-js'
import TiendaCliente from './TiendaCliente'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || 'https://gbdrcaumghykiipqgbty.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjczNjIsImV4cCI6MjA4NzgwMzM2Mn0.OydRQxa51Ql42zvscWnQkEKJuU_3yeCS4qPQQoP6TuM'

// Caché: revalidar cada 5 minutos
// Cambiar a 60 si Luciana actualiza insumos varias veces por hora
export const revalidate = 300

async function cargarDatos() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const [{ data: productos }, { data: disponibilidad }] = await Promise.all([
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

  // Mapa rápido: producto_id → disponibilidad
  const dispMap = {}
  ;(disponibilidad || []).forEach(d => { dispMap[d.producto_id] = d })

  return {
    productos:     productos || [],
    disponibilidad: dispMap,
  }
}

export default async function PaginaInicio() {
  const { productos, disponibilidad } = await cargarDatos()

  return (
    <TiendaCliente
      productos={productos}
      disponibilidad={disponibilidad}
    />
  )
}