/**
 * 📁 UBICACIÓN: src/app/admin/marketing/hooks/useSupabaseProducts.js
 * 📌 Hook para cargar productos activos desde Supabase.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

/**
 * Hook para gestionar la carga de productos de Panfree desde la base de datos
 * @returns {{
 *   productos: Array<Object>,
 *   loadingProd: boolean,
 *   error: string|null,
 *   reloadProductos: () => Promise<void>
 * }}
 */
export function useSupabaseProducts() {
  const [productos, setProductos] = useState([])
  const [loadingProd, setLoadingProd] = useState(true)
  const [error, setError] = useState(null)

  const fetchProductos = useCallback(async () => {
    try {
      setLoadingProd(true)
      setError(null)
      const { data, error: sbError } = await supabase
        .from('productos')
        .select('id,nombre,categoria,precio_venta,imagen_url,slug,descripcion,production_capacity,current_orders,lead_time,order_available,availability_status')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('nombre')

      if (sbError) throw sbError
      setProductos(data || [])
    } catch (err) {
      console.error('Error al cargar productos para marketing:', err)
      setError(err?.message || 'Error al conectar con la base de datos')
    } finally {
      setLoadingProd(false)
    }
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  return {
    productos,
    loadingProd,
    error,
    reloadProductos: fetchProductos,
  }
}
