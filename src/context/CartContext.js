/**
 * 📁 UBICACIÓN: src/context/CartContext.js
 * 📅 ACTUALIZADO: 2026-08-15 (REFACTORIZACIÓN UNIFICADA)
 * 📌 DESCRIPCIÓN: Context API global para el carrito de compras.
 *    CAMBIO CRÍTICO: Ahora es la ÚNICA fuente de verdad para el carrito.
 *    - Mantiene API actual (agregarAlCarrito, eliminarDelCarrito, etc.)
 *    - Mantiene localStorage key actual ('panfree-carrito')
 *    - Añade sincronización con window.__PANFREE_CART para compatibilidad
 *    - Dispatch eventos para FloatingCartButton, SlideCart, ToastNotification
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

  // ============================================
  // INICIALIZAR CARRITO DESDE LOCALSTORAGE
  // ============================================
  useEffect(() => {
    try {
      const guardado = localStorage.getItem('panfree-carrito')
      if (guardado) {
        const parsed = JSON.parse(guardado)
        setCarrito(Array.isArray(parsed) ? parsed : [])
      }
    } catch (err) {
      console.error('Error al cargar carrito desde localStorage:', err)
      setCarrito([])
    }
  }, [])

  // ============================================
  // PERSISTIR EN LOCALSTORAGE
  // ============================================
  useEffect(() => {
    try {
      localStorage.setItem('panfree-carrito', JSON.stringify(carrito))
    } catch (err) {
      console.error('Error al guardar carrito en localStorage:', err)
    }
  }, [carrito])

  // ============================================
  // SINCRONIZAR CON window.__PANFREE_CART (COMPATIBILIDAD)
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Inicializar window.__PANFREE_CART si no existe
    if (!window.__PANFREE_CART) {
      window.__PANFREE_CART = {
        items: carrito,
        listeners: new EventTarget(),
        toastListeners: new EventTarget(),
        isOpen: false,
      }
    }

    // Sincronizar items
    window.__PANFREE_CART.items = carrito

    // Actualizar métodos getters
    window.__PANFREE_CART.getItems = () => [...carrito]
    window.__PANFREE_CART.getCount = () =>
      carrito.reduce((s, item) => s + (item.cantidad || 1), 0)
    window.__PANFREE_CART.getTotal = () =>
      carrito.reduce((s, item) => s + item.subtotal, 0)

    // Dispatch evento 'update' para escuchadores externos
    if (window.__PANFREE_CART.listeners) {
      window.__PANFREE_CART.listeners.dispatchEvent(
        new CustomEvent('update', { detail: carrito })
      )
    }
  }, [carrito])

  // ============================================
  // AGREGAR PRODUCTO (CON VERIFICACIÓN DE AUTH)
  // ============================================
  const agregarAlCarrito = (producto) => {
    if (!estaAutenticado) {
      // Abrir modal de login con la acción pendiente
      abrirModal(() => _agregarProducto(producto))
      return
    }
    _agregarProducto(producto)
  }

  // ============================================
  // LÓGICA INTERNA DE AGREGAR (SIN VERIFICACIÓN DE AUTH)
  // ============================================
  const _agregarProducto = (producto) => {
    setCarrito(prev => {
      const existente = prev.find(p => p.id === producto.id)
      if (existente) {
        return prev.map(p =>
          p.id === producto.id
            ? {
                ...p,
                cantidad: p.cantidad + (producto.cantidad || 1),
                subtotal:
                  (p.subtotal || p.precio_venta * p.cantidad) +
                  (producto.subtotal || producto.precio_venta * (producto.cantidad || 1)),
              }
            : p
        )
      }
      return [...prev, producto]
    })
    setVisible(true)

    // Mostrar toast si window.__PANFREE_CART existe
    if (typeof window !== 'undefined' && window.__PANFREE_CART?.showToast) {
      window.__PANFREE_CART.showToast(
        `✅ ${producto.nombre} agregado al carrito`
      )
    }
  }

  // ============================================
  // ELIMINAR DEL CARRITO
  // ============================================
  const eliminarDelCarrito = (productoId) => {
    setCarrito(prev => prev.filter(p => p.id !== productoId))
  }

  // ============================================
  // ACTUALIZAR CANTIDAD
  // ============================================
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      eliminarDelCarrito(productoId)
      return
    }
    setCarrito(prev =>
      prev.map(p =>
        p.id === productoId
          ? {
              ...p,
              cantidad: nuevaCantidad,
              subtotal: p.precio_venta * nuevaCantidad,
            }
          : p
      )
    )
  }

  // ============================================
  // VACIAR CARRITO
  // ============================================
  const vaciarCarrito = () => {
    setCarrito([])
  }

  // ============================================
  // CALCULAR TOTALES
  // ============================================
  const total = carrito.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  const cantidadItems = carrito.reduce(
    (sum, item) => sum + (item.cantidad || 1),
    0
  )

  // ============================================
  // MÉTODOS PARA COMPATIBILIDAD CON window.__PANFREE_CART
  // ============================================
  const addItemToCart = (product) => {
    _agregarProducto({
      id: product.id || product.slug || Date.now().toString(),
      nombre: product.name || product.nombre,
      precio_venta: product.price || product.precio_venta || 0,
      imagen_url: product.image || product.imagen_url || '',
      cantidad: product.quantity || 1,
      subtotal:
        (product.quantity || 1) * (product.price || product.precio_venta || 0),
      categoria: product.categoria || '',
    })
  }

  const updateItemQuantity = (productId, quantity) => {
    actualizarCantidad(productId, quantity)
  }

  const removeItemFromCart = (productId) => {
    eliminarDelCarrito(productId)
  }

  // ============================================
  // PROVIDER
  // ============================================
  return (
    <CartContext.Provider
      value={{
        carrito,
        visible,
        setVisible,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        total,
        cantidadItems,
        // Métodos para compatibilidad con window.__PANFREE_CART
        addItemToCart,
        updateItemQuantity,
        removeItemFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de un <CartProvider>')
  }
  return context
}