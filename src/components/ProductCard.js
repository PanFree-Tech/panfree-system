'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import styles from './ProductCard.module.css'
import { useCart } from '../context/CartContext' // <-- nuevo import

// ... (mantener resto del archivo, carrusel y badges idénticos)

export default function ProductCard({
  producto,
  onAddToCart,
  disponible = true,
  requiereAnticipacion = false,
}) {
  const [cantidad, setCantidad] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const imgRef = useRef(null)
  const { agregarAlCarrito, showToast } = useCart() // <-- usar el context

  if (!producto) return null

  // ... badges, imagenes, etc. (idénticos)

  const manejarAgregar = useCallback(() => {
    if (!disponible) return

    // Usar API unificada del context (incluye verificación de auth)
    agregarAlCarrito({
      id: producto.id || producto.slug || Date.now().toString(),
      nombre: producto.nombre,
      precio_venta: producto.precio_venta || 0,
      imagen_url: producto.imagen_url || '',
      cantidad,
      subtotal: (producto.precio_venta || 0) * cantidad,
    })

    onAddToCart?.({ ...producto, cantidad, subtotal: producto.precio_venta * cantidad })

    // Animación de vuelo (mantener igual)
    // ... (mantener el bloque de animación tal cual)

    // Mostrar toast via context
    showToast(`✅ ${producto.nombre} agregado al carrito`)

    // Animación de check
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)

    setCantidad(1)
  }, [agregarAlCarrito, disponible, onAddToCart, producto, cantidad, showToast])

  // ... resto idéntico (render)
}