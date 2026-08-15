/**
 * src/context/CartContext.js
 * 
 * ÚNICA fuente de verdad para el carrito.
 * - Mantiene React state para todos los componentes que usan useCart()
 * - Expo métodos en window.__PANFREE_CART para compatibilidad con código legacy
 * - SIEMPRE reasigna los métodos en cada render para asegurar que apunten a React state
 * - FIX: useEffect de sincronización movido al FINAL para evitar TDZ (Temporal Dead Zone)
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
  // INICIALIZACIÓN (efectos tempranos)
  // ============================================

  // Inicializar carrito desde localStorage o desde window.__PANFREE_CART si ya existe
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
  // FUNCIONES DEL CARRITO (declaradas PRIMERO)
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
  // SINCRONIZACIÓN CON window.__PANFREE_CART
  // (MOVIDO AQUÍ - DESPUÉS DE DECLARAR TODAS LAS FUNCIONES)
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!window.__PANFREE_CART) {
      // Creamos una fachada mínima que otros scripts esperan
      const listeners = new EventTarget()
      const toastListeners = new EventTarget()
      const itemsLocal = carrito || []

      window.__PANFREE_CART = {
        items: itemsLocal,
        listeners,
        toastListeners,
        isOpen: false,
        getItems: () => [...(window.__PANFREE_CART.items || [])],
        getCount: () => (window.__PANFREE_CART.items || []).reduce((s, it) => s + (it.quantity || 1), 0),
        getTotal: () => (window.__PANFREE_CART.items || []).reduce((s, it) => s + (it.quantity || 1) * (it.price || 0), 0),
        addItem: (product) => {
          // delegar a context
          const event = new CustomEvent('__from_legacy_add', { detail: product })
          listeners.dispatchEvent(event)
        },
        updateQuantity: (id, q) => {
          const event = new CustomEvent('__from_legacy_update', { detail: { id, q } })
          listeners.dispatchEvent(event)
        },
        removeItem: (id) => {
          const event = new CustomEvent('__from_legacy_remove', { detail: { id } })
          listeners.dispatchEvent(event)
        },
        clear: () => {
          const event = new CustomEvent('__from_legacy_clear')
          listeners.dispatchEvent(event)
        },
        showToast: (msg) => {
          toastListeners.dispatchEvent(new CustomEvent('toast', { detail: msg }))
        },
        onToast: (fn) => toastListeners.addEventListener('toast', fn),
        offToast: (fn) => toastListeners.removeEventListener('toast', fn),
      }
    }

    // Actualizar items y getters
    window.__PANFREE_CART.items = carrito
    window.__PANFREE_CART.getItems = () => [...carrito]
    window.__PANFREE_CART.getCount = () =>
      carrito.reduce((s, item) => s + (item.cantidad || item.quantity || 1), 0)
    window.__PANFREE_CART.getTotal = () =>
      carrito.reduce((s, item) => s + (item.subtotal || (item.price || item.precio_venta) * (item.cantidad || item.quantity || 1) || 0), 0)

    // Emitir evento update para listeners externos
    try {
      window.__PANFREE_CART.listeners?.dispatchEvent(new CustomEvent('update', { detail: carrito }))
    } catch (err) {
      // ignore
    }

    // Listeners para mensajes legacy -> delegar en el context
    const legacyAdd = (e) => {
      const p = e.detail
      addItemToCart(p)
    }
    const legacyUpdate = (e) => {
      const { id, q } = e.detail
      updateItemQuantity(id, q)
    }
    const legacyRemove = (e) => {
      const { id } = e.detail
      removeItemFromCart(id)
    }
    const legacyClear = () => vaciarCarrito()

    window.__PANFREE_CART.listeners?.addEventListener('__from_legacy_add', legacyAdd)
    window.__PANFREE_CART.listeners?.addEventListener('__from_legacy_update', legacyUpdate)
    window.__PANFREE_CART.listeners?.addEventListener('__from_legacy_remove', legacyRemove)
    window.__PANFREE_CART.listeners?.addEventListener('__from_legacy_clear', legacyClear)

    return () => {
      window.__PANFREE_CART.listeners?.removeEventListener('__from_legacy_add', legacyAdd)
      window.__PANFREE_CART.listeners?.removeEventListener('__from_legacy_update', legacyUpdate)
      window.__PANFREE_CART.listeners?.removeEventListener('__from_legacy_remove', legacyRemove)
      window.__PANFREE_CART.listeners?.removeEventListener('__from_legacy_clear', legacyClear)
    }
  }, [carrito, addItemToCart, updateItemQuantity, removeItemFromCart, vaciarCarrito])

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