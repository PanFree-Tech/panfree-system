/**
 * 📁 UBICACIÓN: src/context/CartContext.js
 * 📅 ACTUALIZADO: 2026-03-05
 * 📌 DESCRIPCIÓN: Context API global para el carrito de compras.
 *    Provee estado del carrito, visibilidad del sidebar, y funciones:
 *    - agregarAlCarrito: verifica sesión activa antes de agregar.
 *      Si el cliente NO está autenticado, abre el modal de login (AuthContext)
 *      y encola la acción para ejecutarla automáticamente post-login.
 *    - eliminarDelCarrito: quita un producto por id
 *    - actualizarCantidad: modifica cantidad (elimina si llega a 0)
 *    - vaciarCarrito: limpia todo el carrito
 *    - total: suma de subtotales en PYG (₲)
 *    - cantidadItems: cantidad total de unidades en el carrito
 *    Persiste el carrito en localStorage bajo la clave 'panfree-carrito'.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([])
  const [visible, setVisible] = useState(false)
  const { estaAutenticado, abrirModal } = useAuth()

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    try {
      const guardado = localStorage.getItem('panfree-carrito')
      if (guardado) setCarrito(JSON.parse(guardado))
    } catch (err) {
      console.error('Error al cargar carrito desde localStorage:', err)
    }
  }, [])

  // Persistir carrito en localStorage cada vez que cambia
  useEffect(() => {
    try {
      localStorage.setItem('panfree-carrito', JSON.stringify(carrito))
    } catch (err) {
      console.error('Error al guardar carrito en localStorage:', err)
    }
  }, [carrito])

  // Agregar producto — requiere autenticación
  const agregarAlCarrito = (producto) => {
    if (!estaAutenticado) {
      // Abrir modal de login con la acción pendiente
      abrirModal(() => _agregarProducto(producto))
      return
    }
    _agregarProducto(producto)
  }

  // Lógica interna de agregar (sin verificación de auth)
  const _agregarProducto = (producto) => {
    setCarrito(prev => {
      const existente = prev.find(p => p.id === producto.id)
      if (existente) {
        return prev.map(p =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + producto.cantidad, subtotal: p.subtotal + producto.subtotal }
            : p
        )
      }
      return [...prev, producto]
    })
    setVisible(true)
  }

  const eliminarDelCarrito = (productoId) => {
    setCarrito(prev => prev.filter(p => p.id !== productoId))
  }

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) { eliminarDelCarrito(productoId); return }
    setCarrito(prev =>
      prev.map(p =>
        p.id === productoId
          ? { ...p, cantidad: nuevaCantidad, subtotal: p.precio_venta * nuevaCantidad }
          : p
      )
    )
  }

  const vaciarCarrito = () => setCarrito([])
  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0)
  const cantidadItems = carrito.reduce((sum, item) => sum + item.cantidad, 0)

  return (
    <CartContext.Provider value={{
      carrito, visible, setVisible,
      agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, vaciarCarrito,
      total, cantidadItems
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart debe usarse dentro de un <CartProvider>')
  return context
}