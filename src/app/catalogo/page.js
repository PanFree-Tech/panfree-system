/**
 * UBICACION: src/app/catalogo/page.js
 * ACTUALIZADO: 2026-08-27
 * DESCRIPCION:
 *  - Server Component para vista de CatÃ¡logo completo
 *  - Carga segura de productos activos y disponibilidad desde Supabase
 *  - NormalizaciÃ³n estricta de is_featured/destacado
 */
import logger from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { normalizeProduct } from '@/lib/image-utils'
import TiendaCliente from '../TiendaCliente'

export const revalidate = 300
export const dynamic = 'force-dynamic'

async function cargarDatos() {
  try {
    const [{ data: productos, error: errProd }, { data: disponibilidad, error: errDisp }] = await Promise.all([
      supabase
        .from('productos')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('nombre', { ascending: true }),
      supabase
        .from('vista_disponibilidad_productos')
        .select('*'),
    ])

    if (errProd) {
      logger.error('Error cargando productos en catÃ¡logo:', errProd)
    }
    if (errDisp) {
      logger.warn('Nota: vista_disponibilidad_productos no disponible:', errDisp?.message)
    }

    const productosNormalizados = (productos || []).map((p) => {
      const prodNorm = normalizeProduct(p)
      const enPromo = p.en_promocion === true || p.en_promocion === 'true' || p.en_promocion === 1
      return {
        ...prodNorm,
        en_promocion: enPromo,
      }
    })

    const dispMap = {}
    ;(disponibilidad || []).forEach((d) => {
      if (d?.producto_id) {
        dispMap[d.producto_id] = d
      }
    })

    return {
      productos: productosNormalizados,
      disponibilidad: dispMap,
    }
  } catch (err) {
    logger.error('Error cargando datos de Supabase en catÃ¡logo:', err)
    return {
      productos: [],
      disponibilidad: {},
    }
  }
}

export default async function PaginaCatalogo() {
  const { productos, disponibilidad } = await cargarDatos()

  return (
    <TiendaCliente
      productos={productos}
      disponibilidad={disponibilidad}
    />
  )
}
