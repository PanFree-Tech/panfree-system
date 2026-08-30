'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useFavoritos } from '@/hooks/useFavoritos'

export default function FavoritoButton({ productoId, size = 22, className = '' }) {
  const { usuario } = useAuth()
  const { favoritos, agregarFavorito, eliminarFavorito, isFavorito, clienteId } = useFavoritos()
  const [loading, setLoading] = useState(false)

  const esFavorito = isFavorito(productoId)

  const toggleFavorito = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!usuario) {
      alert('Inicia sesión para guardar productos en favoritos')
      return
    }

    if (!clienteId) {
      console.error('No se encontró el cliente_id para el usuario')
      alert('Error al identificar tu cuenta. Por favor, cerra sesión y volvé a iniciar.')
      return
    }

    setLoading(true)
    try {
      if (esFavorito) {
        await eliminarFavorito(productoId)
      } else {
        // ✅ Usar clienteId correcto
        await agregarFavorito(productoId, clienteId)
      }
    } catch (error) {
      console.error('Error al cambiar favorito:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFavorito}
      disabled={loading || !clienteId}
      className={`p-2 rounded-full transition-colors ${
        esFavorito
          ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100'
          : 'text-gray-400 hover:text-red-400 hover:bg-gray-100'
      } ${className}`}
      aria-label={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Heart
        size={size}
        fill={esFavorito ? 'currentColor' : 'none'}
        className={loading ? 'opacity-50' : ''}
      />
    </button>
  )
}