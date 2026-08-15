/**
 * 📁 UBICACIÓN: src/components/ProductCard.js
 * 📅 ACTUALIZADO: 2026-08-15 (VERSIÓN COMBINADA: ACTUAL + MEJORAS)
 * 📌 DESCRIPCIÓN: 
 *    Tarjeta de producto con TODAS las funcionalidades actuales +
 *    mejoras visuales (badges, animaciones, hover mejorado).
 *    
 *    MANTIENE:
 *    - Carrusel de imágenes (imagen_url + imagenes_urls[])
 *    - WhatsApp para productos agotados
 *    - Controles de cantidad (+ y -)
 *    - Estado disponible/agotado
 *    - Animación de vuelo al agregar al carrito
 *    - Toast notification
 *    - TODAS las props actuales
 *    
 *    AGREGA:
 *    - Badges (⭐ Más vendido, 🆕 Nuevo, 🔥 Oferta)
 *    - Animación de check (✅ Agregado!)
 *    - Hover mejorado (sombra + zoom)
 *    - Mejor UI con CldImageWrapper
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import styles from './ProductCard.module.css'

// Número de WhatsApp original del repo
const WA_NUMBER = '595984589845'

// ============================================
// CARRUSEL INTERNO
// ============================================
function CarruselCard({ imagenes = [], nombre = '', imagenAlt = '' }) {
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const total = imagenes?.length || 0

  const siguiente = useCallback(() => {
    setIndice(i => (i + 1) % Math.max(1, total))
  }, [total])

  useEffect(() => {
    if (total <= 1 || pausado) return
    const t = setTimeout(siguiente, 3000)
    return () => clearTimeout(t)
  }, [indice, pausado, total, siguiente])

  return (
    <div
      className={styles.carouselRoot}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      role="group"
      aria-label={`${nombre} — carrusel de imágenes`}
    >
      {total === 0 && (
        <div className={styles.carouselEmpty} aria-hidden="false">
          <span className={styles.emptyText}>🍞 Sin imagen</span>
        </div>
      )}

      {imagenes.map((src, i) => (
        <div
          key={i}
          className={`${styles.carouselSlide} ${
            i === indice ? styles.carouselActive : ''
          }`}
          aria-hidden={i === indice ? 'false' : 'true'}
        >
          <Image
            src={src}
            alt={i === 0 ? imagenAlt || nombre : `${nombre} — foto ${i + 1}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 300px"
            className={styles.carouselImage}
            priority={i === 0}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {total > 1 && (
        <div className={styles.carouselDots} role="tablist" aria-label="Seleccionar imagen">
          {imagenes.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === indice ? styles.dotActive : ''}`}
              onClick={() => setIndice(i)}
              aria-label={`Ir a imagen ${i + 1}`}
              aria-selected={i === indice}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// FUNCIÓN PARA ASEGURAR QUE EL CARRITO EXISTE
// ============================================
function ensureCart() {
  if (typeof window === 'undefined') return null
  if (!window.__PANFREE_CART) {
    window.__PANFREE_CART = {
      items: [],
      listeners: new EventTarget(),
      toastListeners: new EventTarget(),
      isOpen: false,
      subscribe(fn) {
        this.listeners.addEventListener('update', fn)
      },
      unsubscribe(fn) {
        this.listeners.removeEventListener('update', fn)
      },
      open() {
        this.isOpen = true
        this.listeners.dispatchEvent(new CustomEvent('open'))
      },
      close() {
        this.isOpen = false
        this.listeners.dispatchEvent(new CustomEvent('close'))
      },
      getItems() {
        return [...this.items]
      },
      getCount() {
        return this.items.reduce((s, i) => s + (i.quantity || 1), 0)
      },
      getTotal() {
        return this.items.reduce((s, i) => s + (i.quantity || 1) * (i.price || 0), 0)
      },
      addItem(product) {
        const idx = this.items.findIndex(i => i.id === product.id)
        if (idx >= 0) {
          this.items[idx].quantity = (this.items[idx].quantity || 1) + (product.quantity || 1)
        } else {
          this.items.push({ ...product, quantity: product.quantity || 1 })
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('panfree_cart_v1', JSON.stringify(this.items))
        }
        this.listeners.dispatchEvent(new CustomEvent('update'))
      },
      updateQuantity(id, quantity) {
        const idx = this.items.findIndex(i => i.id === id)
        if (idx >= 0) {
          this.items[idx].quantity = quantity
          if (this.items[idx].quantity <= 0) this.items.splice(idx, 1)
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('panfree_cart_v1', JSON.stringify(this.items))
          }
          this.listeners.dispatchEvent(new CustomEvent('update'))
        }
      },
      removeItem(id) {
        const idx = this.items.findIndex(i => i.id === id)
        if (idx >= 0) {
          this.items.splice(idx, 1)
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('panfree_cart_v1', JSON.stringify(this.items))
          }
          this.listeners.dispatchEvent(new CustomEvent('update'))
        }
      },
      clear() {
        this.items.length = 0
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('panfree_cart_v1', JSON.stringify(this.items))
        }
        this.listeners.dispatchEvent(new CustomEvent('update'))
      },
      showToast(msg) {
        this.toastListeners.dispatchEvent(new CustomEvent('toast', { detail: msg }))
      },
      onToast(fn) {
        this.toastListeners.addEventListener('toast', fn)
      },
      offToast(fn) {
        this.toastListeners.removeEventListener('toast', fn)
      },
    }
  }
  return window.__PANFREE_CART
}

// ============================================
// PRODUCT CARD PRINCIPAL (VERSIÓN COMBINADA)
// ============================================
export default function ProductCard({
  producto,
  onAddToCart,
  disponible = true,
  requiereAnticipacion = false,
}) {
  const [cantidad, setCantidad] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const imgRef = useRef(null)

  if (!producto) return null

  const agotado = !disponible

  const imagenes = [
    ...(producto.imagen_url ? [producto.imagen_url] : []),
    ...(Array.isArray(producto.imagenes_urls)
      ? producto.imagenes_urls.filter(Boolean)
      : []),
  ]

  // ============================================
  // DETERMINAR BADGES
  // ============================================
  const badges = []
  if (producto.destacado || producto.is_featured) {
    badges.push({ tipo: 'top', emoji: '⭐', label: 'Más vendido' })
  }
  if (
    producto.createdAt &&
    new Date(producto.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ) {
    badges.push({ tipo: 'new', emoji: '🆕', label: 'Nuevo' })
  }
  if (producto.descuento || producto.discount) {
    badges.push({ tipo: 'sale', emoji: '🔥', label: 'Oferta' })
  }

  // ============================================
  // AGREGAR AL CARRITO
  // ============================================
  const manejarAgregar = useCallback(() => {
    if (agotado) return

    const cart = ensureCart()
    if (cart) {
      cart.addItem({
        id: producto.id || producto.slug || Date.now().toString(),
        name: producto.nombre,
        price: producto.precio_venta || 0,
        image: producto.imagen_url || '',
        quantity: cantidad,
      })
    }

    onAddToCart?.({ ...producto, cantidad, subtotal: producto.precio_venta * cantidad })

    // ── Animación de vuelo al carrito ──
    const imgEl = imgRef.current
    const target =
      document.getElementById('floating-cart-button') ||
      document.querySelector('[data-cart-target]') ||
      document.body

    if (imgEl && target) {
      try {
        const startRect = imgEl.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()

        const flyImg = document.createElement('img')
        flyImg.src = producto.imagen_url || ''
        flyImg.alt = producto.nombre || 'producto'
        flyImg.style.position = 'fixed'
        flyImg.style.left = `${startRect.left}px`
        flyImg.style.top = `${startRect.top}px`
        flyImg.style.width = `${startRect.width}px`
        flyImg.style.height = `${startRect.height}px`
        flyImg.style.objectFit = 'cover'
        flyImg.style.borderRadius = '8px'
        flyImg.style.zIndex = '1400'
        flyImg.style.pointerEvents = 'none'
        flyImg.style.transition =
          'transform 700ms cubic-bezier(.22,1,.36,1), opacity 700ms ease'
        flyImg.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
        document.body.appendChild(flyImg)

        const deltaX =
          targetRect.left + targetRect.width / 2 - (startRect.left + startRect.width / 2)
        const deltaY =
          targetRect.top + targetRect.height / 2 - (startRect.top + startRect.height / 2)

        requestAnimationFrame(() => {
          flyImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.15)`
          flyImg.style.opacity = '0.4'
        })

        setTimeout(() => {
          flyImg.remove()
        }, 750)
      } catch (err) {
        // ignorar
      }
    }

    if (cart) {
      cart.showToast(`✅ ${producto.nombre} agregado al carrito`)
    }

    // ── Animación de check ──
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)

    setCantidad(1)
  }, [agotado, onAddToCart, producto, cantidad])

  // ============================================
  // PEDIDO ESPECIAL POR WHATSAPP
  // ============================================
  const manejarPedidoEspecial = useCallback(() => {
    const msg = encodeURIComponent(
      `¡Hola PanFree! 🍞 Me gustaría encargar el siguiente producto:\n\n` +
      `*Producto:* ${producto.nombre}\n*Categoría:* ${producto.categoria}\n` +
      `*Precio:* ₲ ${producto.precio_venta?.toLocaleString('es-PY')}\n\n` +
      `¿Podrían decirme disponibilidad y tiempo estimado de producción? ¡Gracias!`
    )
    window.open(
      `https://wa.me/${WA_NUMBER}?text=${msg}`,
      '_blank',
      'noopener,noreferrer'
    )
  }, [producto])

  const slugUrl = producto?.slug ? `/producto/${producto.slug}` : '#'
  const productId =
    producto?.id ?? producto?.slug ?? producto?.nombre?.slice(0, 12) ?? Date.now().toString()

  return (
    <article
      className={styles.card}
      role="article"
      aria-labelledby={`product-title-${productId}`}
    >
      {/* BADGES */}
      {badges.length > 0 && (
        <div className={styles.badges}>
          {badges.map((badge, i) => (
            <span
              key={i}
              className={`${styles.badge} ${styles[`badge${badge.tipo.charAt(0).toUpperCase() + badge.tipo.slice(1)}`]}`}
              title={badge.label}
            >
              {badge.emoji}
            </span>
          ))}
        </div>
      )}

      {/* IMAGEN / CARRUSEL */}
      <a href={slugUrl} className={styles.imageLink} aria-label={`Ver detalles de ${producto.nombre}`}>
        <div className={styles.imageWrapper}>
          <CarruselCard
            imagenes={imagenes}
            nombre={producto.nombre}
            imagenAlt={producto.imagen_alt}
          />
        </div>
      </a>

      {/* CONTENIDO */}
      <div className={styles.body}>
        {slugUrl ? (
          <a
            href={slugUrl}
            className={styles.titleLink}
            aria-label={`Ir a la página del producto ${producto.nombre}`}
          >
            <h3 id={`product-title-${productId}`} className={styles.title}>
              {producto.nombre}
            </h3>
          </a>
        ) : (
          <h3 id={`product-title-${productId}`} className={styles.title}>
            {producto.nombre}
          </h3>
        )}

        <p className={styles.category} aria-hidden="false">
          {producto.categoria}
        </p>
        <p className={styles.description}>{producto.descripcion}</p>

        {/* PRECIO Y DISPONIBILIDAD */}
        <div className={styles.pricingRow}>
          <p
            className={`${styles.price} ${agotado ? styles.priceDisabled : ''}`}
            aria-live="polite"
          >
            ₲ {producto.precio_venta?.toLocaleString('es-PY') || '0'}
          </p>
          <p
            className={`${styles.availability} ${
              agotado ? styles.availabilityOut : styles.availabilityIn
            }`}
          >
            {agotado ? '❌ No disponible' : '✅ Disponible'}
          </p>
        </div>

        {!agotado && requiereAnticipacion && (
          <p
            className={styles.preorderBadge}
            role="status"
            aria-label="Pedido con anticipación"
          >
            ⏰ Pedido con 24hs de anticipación
          </p>
        )}

        {/* CONTROLES */}
        <div className={styles.controls}>
          {!agotado ? (
            <>
              {/* CANTIDAD */}
              <div className={styles.qtyGroup} role="group" aria-label="Controles de cantidad">
                <button
                  type="button"
                  onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  aria-label="Reducir cantidad"
                  className={styles.qtyBtn}
                >
                  −
                </button>

                <input
                  type="number"
                  min="1"
                  max={99}
                  value={cantidad}
                  onChange={e =>
                    setCantidad(Math.max(1, Math.min(parseInt(e.target.value) || 1, 99)))
                  }
                  className={styles.qtyInput}
                  aria-label={`Cantidad para ${producto.nombre}`}
                />

                <button
                  type="button"
                  onClick={() => setCantidad(c => Math.min(c + 1, 99))}
                  aria-label="Aumentar cantidad"
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>

              {/* BOTÓN AGREGAR */}
              <button
                type="button"
                onClick={manejarAgregar}
                className={`${styles.addBtn} ${isAdded ? styles.added : ''}`}
                aria-label={`Agregar ${cantidad} unidades de ${producto.nombre} al carrito`}
                ref={imgRef}
              >
                {isAdded ? '✅ ¡Agregado!' : '🛒 Agregar al Carrito'}
              </button>
            </>
          ) : (
            /* PRODUCTO AGOTADO */
            <div className={styles.outOfStockGroup}>
              <button
                type="button"
                onClick={manejarPedidoEspecial}
                className={styles.orderBtn}
                aria-label={`Encargar ${producto.nombre} por WhatsApp`}
              >
                ✉️ Quiero encargar este producto
              </button>
              <p className={styles.outOfStockNote}>
                Te contactamos para producirlo especialmente 🍞
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}