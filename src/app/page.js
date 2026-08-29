'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { normalizeProduct } from '@/lib/image-utils'
import { CartProvider } from '@/context/CartContext'
import TiendaCliente from './TiendaCliente'

export default function PaginaInicio() {
  const [productos, setProductos] = useState([])
  const [disponibilidad, setDisponibilidad] = useState({})
  const [configuracion, setConfiguracion] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [
          { data: productosData, error: errProd },
          { data: disponibilidadData, error: errDisp },
          { data: configData },
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

        if (errProd) console.error('Error cargando productos:', errProd)
        if (errDisp) console.warn('Nota: vista_disponibilidad_productos no disponible:', errDisp?.message)

        const productosNormalizados = (productosData || []).map((p) => {
          const prodNorm = normalizeProduct(p)
          const enPromo = p.en_promocion === true || p.en_promocion === 'true' || p.en_promocion === 1
          return { ...prodNorm, en_promocion: enPromo }
        })

        const dispMap = {}
        ;(disponibilidadData || []).forEach((d) => {
          if (d?.producto_id) dispMap[d.producto_id] = d
        })

        setProductos(productosNormalizados)
        setDisponibilidad(dispMap)
        setConfiguracion(configData || null)
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#334c2b] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <CartProvider>
      <TiendaCliente
        productos={productos}
        disponibilidad={disponibilidad}
        configuracion={configuracion}
      />
    </CartProvider>
  )
}