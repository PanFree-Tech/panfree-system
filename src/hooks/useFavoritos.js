// src/hooks/useFavoritos.js
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useFavoritos() {
  const { usuario } = useAuth()
  const [favoritos, setFavoritos] = useState([])
  const [loading, setLoading] = useState(true)
  const [clienteId, setClienteId] = useState(null)

  // ✅ Obtener el cliente_id correcto
  useEffect(() => {
    if (!usuario) {
      setClienteId(null)
      return
    }

    async function obtenerClienteId() {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id')
          .eq('user_id', usuario.id)
          .single()

        if (error) throw error
        setClienteId(data?.id || null)
      } catch (error) {
        console.error('Error obteniendo cliente_id:', error)
        setClienteId(null)
      }
    }

    obtenerClienteId()
  }, [usuario])

  // ✅ Cargar favoritos usando cliente_id
  useEffect(() => {
    if (!clienteId) {
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
          .eq('cliente_id', clienteId)

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
  }, [clienteId])

  const agregarFavorito = useCallback(async (productoId, clienteIdParam) => {
    // Si no se pasa clienteId, usar el que tenemos
    const id = clienteIdParam || clienteId
    
    if (!id) {
      console.error('clienteId es requerido')
      return
    }

    const { error } = await supabase
      .from('favoritos')
      .insert({ cliente_id: id, producto_id: productoId })

    if (error) throw error

    setFavoritos(prev => [...prev, productoId])
  }, [clienteId])

  const eliminarFavorito = useCallback(async (productoId) => {
    if (!clienteId) {
      console.error('clienteId es requerido para eliminar')
      return
    }

    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('producto_id', productoId)
      .eq('cliente_id', clienteId)

    if (error) throw error

    setFavoritos(prev => prev.filter(id => id !== productoId))
  }, [clienteId])

  const isFavorito = useCallback((productoId) => {
    return favoritos.includes(productoId)
  }, [favoritos])

  return {
    favoritos,
    loading,
    agregarFavorito,
    eliminarFavorito,
    isFavorito,
    clienteId,
  }
}