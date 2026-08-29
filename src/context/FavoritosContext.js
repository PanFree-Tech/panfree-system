'use client'

import { createContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export const FavoritosContext = createContext()

export function FavoritosProvider({ children }) {
  const [favoritos, setFavoritos] = useState([])
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState(null)

  // Obtener usuario actual
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user)
    })
  }, [])

  // Cargar favoritos cuando el usuario cambia
  useEffect(() => {
    if (!usuario) {
      setFavoritos([])
      setLoading(false)
      return
    }

    async function cargarFavoritos() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('favoritos')
          .select('producto_id')
          .eq('cliente_id', usuario.id)

        if (error) throw error
        setFavoritos(data?.map((f) => f.producto_id) || [])
      } catch (error) {
        console.error('Error cargando favoritos:', error)
        setFavoritos([])
      } finally {
        setLoading(false)
      }
    }

    cargarFavoritos()
  }, [usuario])

  // Agregar favorito
  const agregarFavorito = useCallback(async (productoId) => {
    if (!usuario) {
      alert('Inicia sesión para guardar favoritos')
      return
    }

    try {
      const { error } = await supabase
        .from('favoritos')
        .insert({
          cliente_id: usuario.id,
          producto_id: productoId,
        })

      if (error) throw error

      setFavoritos((prev) => [...prev, productoId])
    } catch (error) {
      console.error('Error agregando favorito:', error)
      alert('Error al guardar favorito')
    }
  }, [usuario])

  // Eliminar favorito
  const eliminarFavorito = useCallback(async (productoId) => {
    if (!usuario) return

    try {
      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('cliente_id', usuario.id)
        .eq('producto_id', productoId)

      if (error) throw error

      setFavoritos((prev) => prev.filter((id) => id !== productoId))
    } catch (error) {
      console.error('Error eliminando favorito:', error)
    }
  }, [usuario])

  // Verificar si un producto está en favoritos
  const isFavorito = useCallback((productoId) => {
    return favoritos.includes(productoId)
  }, [favoritos])

  return (
    <FavoritosContext.Provider
      value={{
        favoritos,
        loading,
        agregarFavorito,
        eliminarFavorito,
        isFavorito,
      }}
    >
      {children}
    </FavoritosContext.Provider>
  )
}