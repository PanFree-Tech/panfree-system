// src/hooks/useFavoritos.js
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useFavoritos() {
  const { usuario } = useAuth()
  const [favoritos, setFavoritos] = useState([])
  const [loading, setLoading] = useState(true)

  // Cargar favoritos del usuario
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
        setFavoritos(data?.map(f => f.producto_id) || [])
      } catch (error) {
        console.error('Error cargando favoritos:', error)
        setFavoritos([])
      } finally {
        setLoading(false)
      }
    }

    cargarFavoritos()
  }, [usuario])

  const agregarFavorito = useCallback(async (productoId, clienteId) => {
    if (!clienteId) {
      console.error('clienteId es requerido')
      return
    }

    const { error } = await supabase
      .from('favoritos')
      .insert({ cliente_id: clienteId, producto_id: productoId })

    if (error) throw error

    setFavoritos(prev => [...prev, productoId])
  }, [])

  const eliminarFavorito = useCallback(async (productoId) => {
    if (!usuario) return

    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('producto_id', productoId)
      .eq('cliente_id', usuario.id)

    if (error) throw error

    setFavoritos(prev => prev.filter(id => id !== productoId))
  }, [usuario])

  const isFavorito = useCallback((productoId) => {
    return favoritos.includes(productoId)
  }, [favoritos])

  return {
    favoritos,
    loading,
    agregarFavorito,
    eliminarFavorito,
    isFavorito,
  }
}