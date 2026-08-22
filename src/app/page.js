/**
 * UBICACION: src/app/page.js
 * ACTUALIZADO: 2026-03-06
 * CAMBIOS:
 *  - Convertido a Server Component (elimina 'use client')
 *  - Datos cargados en servidor con revalidate: 300 (5 min)
 *  - Estado e interactividad delegados a TiendaCliente.js
 *  - Mismo patrón que layout.js → layout-client.js
 *  - ✅ FIX: Eliminar fallback inseguro de Supabase
 *  - ✅ FIX: Lanzar error claro si faltan variables de entorno
 */
import { supabase } from '@/lib/supabase'
import TiendaCliente from './TiendaCliente'

// Caché: revalidar cada 5 minutos
// Cambiar a 60 si Luciana actualiza insumos varias veces por hora
export const revalidate = 300

async function cargarDatos() {
  try {
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
  } catch (err) {
    console.error('Error cargando datos de Supabase:', err)
    return {
      productos: [],
      disponibilidad: {},
    }
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