/**
 * src/context/CartContext.js
 * 
 * ÚNICA fuente de verdad para el carrito.
 * - Mantiene React state para todos los componentes que usan useCart()
 * - Expo métodos en window.__PANFREE_CART para compatibilidad con código legacy
 * - ✅ FIX: bandera "cargado" para evitar carrera entre carga y guardado
 * - ✅ FIX AUDITORÍA CONVERSIÓN: eliminada la obligación de estar autenticado para agregar al carrito
 * - ✅ AGREGADO: campo unidad_medida en los items del carrito
 * - ✅ FIX: corrección de duplicación de cantidades (usar cantidad del producto, no sumar)
 */

'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([])
  const [visible, setVisible] = useState(false)
  const [cargado, setCargado] = useState(false)

  const STORAGE_KEY = 'panfree_cart_v1'

  // ============================================
  // INICIALIZACIÓN - CARGAR DESDE localStorage
  // ============================================
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('🔄 Carrito cargado desde localStorage:', parsed)
        setCarrito(Array.isArray(parsed) ? parsed : [])
      } else {
        console.log('🔄 No hay carrito guardado, iniciando vacío')
        setCarrito([])
      }
    } catch (err) {
      console.error('Error al cargar carrito:', err)
      setCarrito([])
    } finally {
      setCargado(true)
    }
  }, [])

  // ============================================
  // PERSISTIR EN localStorage - SOLO DESPUÉS DE CARGAR
  // ============================================
  useEffect(() => {
    if (!cargado) {
      console.log('⏳ Persistencia en espera (cargando...)')
      return
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito))
        console.log('💾 Carrito guardado en localStorage:', carrito)
      }
    } catch (err) {
      console.error('Error al guardar carrito:', err)
    }
  }, [carrito, cargado])

  // ============================================
  // FUNCIONES DEL CARRITO
  // ============================================

  const _agregarProducto = useCallback((producto) => {
    console.log('🛒 _agregarProducto recibió:', producto)
    
    setCarrito(prev => {
      console.log('📦 Carrito actual (prev):', prev)
      
      const existente = prev.find(p => p.id === producto.id)
      if (existente) {
        // ✅ SIMPLEMENTE ACTUALIZAR (NO SUMAR)
        console.log('✅ Producto ya existe, actualizando cantidad a:', producto.cantidad || 1)
        const nuevoCarrito = prev.map(p =>
          p.id === producto.id
            ? {
                ...p,
                cantidad: producto.cantidad || 1,
                subtotal: (p.precio_venta || 0) * (producto.cantidad || 1),
              }
            : p
        )
        console.log('📦 Carrito actualizado (existente):', nuevoCarrito)
        return nuevoCarrito
      }
      
      // Nuevo producto
      console.log('✅ Producto nuevo, agregando al carrito')
      const nuevoProducto = {
        ...producto,
        cantidad: producto.cantidad || 1,
        subtotal: producto.subtotal || (producto.precio_venta || 0) * (producto.cantidad || 1),
        unidad_medida: producto.unidad_medida || null,
      }
      
      const nuevoCarrito = [...prev, nuevoProducto]
      console.log('📦 Carrito actualizado (nuevo):', nuevoCarrito)
      return nuevoCarrito
    })
    setVisible(true)
  }, [])

  // ✅ AHORA NO BLOQUEA POR AUTENTICACIÓN
  const agregarAlCarrito = useCallback((producto) => {
    console.log('🛒 agregarAlCarrito llamado con:', producto)
    if (!producto || !producto.id) {
      console.error('❌ Producto inválido:', producto)
      return
    }
    _agregarProducto(producto)
  }, [_agregarProducto])

  const eliminarDelCarrito = useCallback((productoId) => {
    console.log('🗑️ Eliminando producto:', productoId)
    setCarrito(prev => prev.filter(p => p.id !== productoId))
  }, [])

  const actualizarCantidad = useCallback((productoId, nuevaCantidad) => {
    console.log('🔄 Actualizando cantidad:', productoId, nuevaCantidad)
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
              subtotal: (p.precio_venta || 0) * nuevaCantidad,
            }
          : p
      )
    )
  }, [eliminarDelCarrito])

  const vaciarCarrito = useCallback(() => {
    console.log('🗑️ Vaciando carrito')
    setCarrito([])
  }, [])

  // ============================================
  // MÉTODOS DE COMPATIBILIDAD (window.__PANFREE_CART)
  // ============================================

  const addItemToCart = useCallback((product) => {
    console.log('🔄 addItemToCart (legacy) llamado con:', product)
    _agregarProducto({
      id: product.id || product.slug || Date.now().toString(),
      nombre: product.name || product.nombre,
      precio_venta: product.price || product.precio_venta || 0,
      imagen_url: product.image || product.imagen_url || '',
      cantidad: product.quantity || product.cantidad || 1,
      subtotal: (product.quantity || product.cantidad || 1) * (product.price || product.precio_venta || 0),
      categoria: product.categoria || product.category || '',
      unidad_medida: product.unidad_medida || null,
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

  const total = carrito.reduce((sum, item) => sum + (item.subtotal || (item.precio_venta || 0) * (item.cantidad || 1) || 0), 0)
  const cantidadItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0)

  // ============================================
  // SINCRONIZACIÓN CON window.__PANFREE_CART
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!window.__PANFREE_CART) {
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

    window.__PANFREE_CART.items = carrito
    window.__PANFREE_CART.getItems = () => [...carrito]
    window.__PANFREE_CART.getCount = () =>
      carrito.reduce((s, item) => s + (item.cantidad || 1), 0)
    window.__PANFREE_CART.getTotal = () =>
      carrito.reduce((s, item) => s + (item.subtotal || (item.price || item.precio_venta) * (item.cantidad || 1) || 0), 0)

    try {
      window.__PANFREE_CART.listeners?.dispatchEvent(new CustomEvent('update', { detail: carrito }))
    } catch (err) {
      // ignore
    }

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