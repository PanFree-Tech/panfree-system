/**
 * UBICACION: src/app/page.js
 * ACTUALIZADO: 2026-08-27
 * DESCRIPCION:
 *  - Server Component con revalidación optimizada
 *  - Carga segura de productos activos y disponibilidad
 *  - Normalización estricta de is_featured/destacado para evitar falsos positivos
 */
import { supabase } from '@/lib/supabase'
import { normalizeProduct } from '@/lib/image-utils'
import TiendaCliente from './TiendaCliente'

// Caché: revalidar cada 5 minutos
export const revalidate = 300

async function cargarDatos() {
  try {
    const [
      { data: productos, error: errProd },
      { data: disponibilidad, error: errDisp },
      { data: configSitio },
    ] = await Promise.all([
      supabase
        .from('productos')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('nombre', { ascending: true }),
      supabase
        .from('vista_disponibilidad_productos')
        .select('*'),
      supabase
        .from('configuracion_sitio')
        .select('*')
        .eq('id', 1)
        .single(),
    ])

    if (errProd) {
      console.error('Error cargando productos:', errProd)
    }
    if (errDisp) {
      console.warn('Nota: vista_disponibilidad_productos no disponible:', errDisp?.message)
    }

    // Normalizar productos: asegurar que is_featured/destacado sea booleano estricto y resolver URLs de imagen válidas
    const productosNormalizados = (productos || []).map((p) => {
      const prodNorm = normalizeProduct(p)
      const enPromo = p.en_promocion === true || p.en_promocion === 'true' || p.en_promocion === 1
      return {
        ...prodNorm,
        en_promocion: enPromo,
      }
    })

    // Mapa rápido: producto_id → disponibilidad
    const dispMap = {}
    ;(disponibilidad || []).forEach((d) => {
      if (d?.producto_id) {
        dispMap[d.producto_id] = d
      }
    })

    return {
      productos: productosNormalizados,
      disponibilidad: dispMap,
      configuracion: configSitio || null,
    }
  } catch (err) {
    console.error('Error cargando datos de Supabase:', err)
    return {
      productos: [],
      disponibilidad: {},
      configuracion: null,
    }
  }
}

export default async function PaginaInicio() {
  const { productos, disponibilidad, configuracion } = await cargarDatos()

  return (
    <TiendaCliente
      productos={productos}
      disponibilidad={disponibilidad}
      configuracion={configuracion}
    />
  )
}
