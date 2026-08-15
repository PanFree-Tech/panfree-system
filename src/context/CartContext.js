/**
 * src/context/CartContext.js
 * 
 * ÚNICA fuente de verdad para el carrito.
 * - Mantiene React state para todos los componentes que usan useCart()
 * - Expo métodos en window.__PANFREE_CART para compatibilidad con código legacy
 * - SIEMPRE reasigna los métodos en cada render para asegurar que apunten a React state
 */

'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([])
  const [visible, setVisible] = useState(false)
  const { estaAutenticado, abrirModal } = useAuth()

  const STORAGE_KEY = 'panfree_cart_v1'

  // ============================================
  // INICIALIZAR DESDE localStorage
  // ============================================
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setCarrito(Array.isArray(parsed) ? parsed : [])
        return
      }
      setCarrito([])
    } catch (err) {
      console.error('Error al cargar carrito:', err)
      setCarrito([])
    }
  }, [])

  // ============================================
  // PERSISTIR EN localStorage
  // ============================================
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito))
    } catch (err) {
      console.error('Error al guardar carrito:', err)
    }
  }, [carrito])

  // ============================================
  // Sincronizar con window.__PANFREE_CART - REASIGNAR SIEMPRE
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Crear objeto base si no existe
    if (!window.__PANFREE_CART) {
      const listeners = new EventTarget()
      const toastListeners = new EventTarget()
      window.__PANFREE_CART = { 
        items: carrito, 
        listeners, 
        toastListeners, 
        isOpen: false 
      }
    }

    const cart = window.__PANFREE_CART

    // ✅ REASIGNAR SIEMPRE - así aunque otro código haya creado el objeto,
    //    estos métodos apuntan a React state
    cart.items = carrito
    cart.getItems = () => [...carrito]
    cart.getCount = () => carrito.reduce((s, i) => s + (i.cantidad || i.quantity || 1), 0)
    cart.getTotal = () => carrito.reduce((s, i) => s + (i.subtotal || (i.precio_venta || i.price || 0) * (i.cantidad || i.quantity || 1) || 0), 0)
    
    // ✅ Estos métodos DELEGAN a React state via las funciones del Provider
    cart.addItem = (product) => addItemToCart(product)
    cart.updateQuantity = (id, q) => updateItemQuantity(id, q)
    cart.removeItem = (id) => removeItemFromCart(id)
    cart.clear = () => vaciarCarrito()
    cart.open = () => { cart.isOpen = true; setVisible(true) }
    cart.close = () => { cart.isOpen = false; setVisible(false) }
    cart.showToast = (msg) => cart.toastListeners.dispatchEvent(new CustomEvent('toast', { detail: msg }))
    cart.onToast = (fn) => cart.toastListeners.addEventListener('toast', fn)
    cart.offToast = (fn) => cart.toastListeners.removeEventListener('toast', fn)

    // Notificar a listeners legacy
    cart.listeners.dispatchEvent(new CustomEvent('update', { detail: carrito }))

  }, [carrito, addItemToCart, updateItemQuantity, removeItemFromCart, vaciarCarrito, setVisible])

  // ============================================
  // OPERACIONES DEL CARRITO
  // ============================================

  const _agregarProducto = useCallback((producto) => {
    setCarrito(prev => {
      const existente = prev.find(p => p.id === producto.id)
      if (existente) {
        return prev.map(p =>
          p.id === producto.id
            ? {
                ...p,
                cantidad: (p.cantidad || p.quantity || 1) + (producto.cantidad || producto.quantity || 1),
                subtotal: (p.subtotal || (p.precio_venta || p.price || 0) * (p.cantidad || p.quantity || 1)) + (producto.subtotal || (producto.precio_venta || producto.price || 0) * (producto.cantidad || producto.quantity || 1)),
              }
            : p
        )
      }
      return [...prev, producto]
    })
    setVisible(true)
  }, [])

  const agregarAlCarrito = useCallback((producto) => {
    if (!estaAutenticado) {
      abrirModal(() => _agregarProducto(producto))
      return
    }
    _agregarProducto(producto)
  }, [_agregarProducto, abrirModal, estaAutenticado])

  const eliminarDelCarrito = useCallback((productoId) => {
    setCarrito(prev => prev.filter(p => p.id !== productoId))
  }, [])

  const actualizarCantidad = useCallback((productoId, nuevaCantidad) => {
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
              subtotal: (p.precio_venta || p.price || 0) * nuevaCantidad,
            }
          : p
      )
    )
  }, [eliminarDelCarrito])

  const vaciarCarrito = useCallback(() => {
    setCarrito([])
  }, [])

  // ============================================
  // MÉTODOS DE COMPATIBILIDAD (usados por window.__PANFREE_CART)
  // ============================================

  const addItemToCart = useCallback((product) => {
    _agregarProducto({
      id: product.id || product.slug || Date.now().toString(),
      nombre: product.name || product.nombre,
      precio_venta: product.price || product.precio_venta || 0,
      imagen_url: product.image || product.imagen_url || '',
      cantidad: product.quantity || product.cantidad || 1,
      subtotal: (product.quantity || product.cantidad || 1) * (product.price || product.precio_venta || 0),
      categoria: product.categoria || product.category || '',
    })
  }, [_agregarProducto])

  const updateItemQuantity = useCallback((productId, quantity) => {
    actualizarCantidad(productId, quantity)
  }, [actualizarCantidad])

  const removeItemFromCart = useCallback((productId) => {
    eliminarDelCarrito(productId)
  }, [eliminarDelCarrito])

  // ============================================
  // CÁLCULO DE TOTALES
  // ============================================

  const total = carrito.reduce((sum, item) => sum + (item.subtotal || (item.precio_venta || item.price || 0) * (item.cantidad || item.quantity || 1) || 0), 0)
  const cantidadItems = carrito.reduce((sum, item) => sum + (item.cantidad || item.quantity || 1), 0)

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
        // Métodos de compatibilidad
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