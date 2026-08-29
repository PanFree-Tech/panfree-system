'use client'

import { useContext } from 'react'
import { FavoritosContext } from '@/context/FavoritosContext'

export function useFavoritos() {
  const context = useContext(FavoritosContext)
  if (!context) {
    throw new Error('useFavoritos debe usarse dentro de un <FavoritosProvider>')
  }
  return context
}