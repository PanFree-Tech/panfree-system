'use client'

import React, { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import styles from './ProductCard.module.css'
import { useCart } from '../context/CartContext'

function formatCurrency(value) {
  try {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value)
  } catch {
    return `₲ ${value}`
  }
}

export default function ProductCard({
  producto,
  onAddToCart,
  disponible = true,
  requiereAnticipacion = false,
}) {
  const [cantidad, setCantidad] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const imgRef = useRef(null)

  const { agregarAlCarrito, showToast } = useCart()

  if (!producto) return null

  const agotado = !disponible

  const manejarAgregar = useCallback(() => {
    if (agotado) return

    const payload = {
      id: producto.id || producto.slug || Date.now().toString(),
      nombre: producto.nombre,
      precio_venta: producto.precio_venta || 0,
      imagen_url: producto.imagen_url || '',
      cantidad,
      subtotal: (producto.precio_venta || 0) * cantidad,
    }

    agregarAlCarrito(payload)

    onAddToCart?.({ ...producto, cantidad, subtotal: producto.precio_venta * cantidad })

    // Animación de vuelo
    const imgEl = imgRef.current
    const target = document.getElementById('floating-cart-button') || document.body
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
        flyImg.style.transition = 'transform 700ms cubic-bezier(.22,1,.36,1), opacity 700ms ease'
        flyImg.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
        document.body.appendChild(flyImg)

        const deltaX = targetRect.left + targetRect.width / 2 - (startRect.left + startRect.width / 2)
        const deltaY = targetRect.top + targetRect.height / 2 - (startRect.top + startRect.height / 2)

        requestAnimationFrame(() => {
          flyImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.15)`
          flyImg.style.opacity = '0.4'
        })

        setTimeout(() => {
          flyImg.remove()
        }, 750)
      } catch (err) { /* ignorar */ }
    }

    showToast?.(`✅ ${producto.nombre} agregado al carrito`)

    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
    setCantidad(1)
  }, [agotado, producto, cantidad, agregarAlCarrito, onAddToCart, showToast])

  const manejarPedidoEspecial = useCallback(() => {
    const msg = encodeURIComponent(
      `¡Hola PanFree! 🍞 Me gustaría encargar el siguiente producto:\n\n` +
      `*Producto:* ${producto.nombre}\n*Categoría:* ${producto.categoria || ''}\n` +
      `*Precio:* ₲ ${producto.precio_venta?.toLocaleString?.('es-PY') || producto.precio_venta || '0'}\n\n` +
      `¿Podrían decirme disponibilidad y tiempo estimado de producción? ¡Gracias!`
    )
    window.open(`https://wa.me/595984589845?text=${msg}`, '_blank', 'noopener,noreferrer')
  }, [producto])

  const slugUrl = producto?.slug ? `/producto/${producto.slug}` : '#'
  const productId = producto?.id ?? producto?.slug ?? producto?.nombre?.slice(0, 12) ?? Date.now().toString()

  return (
    <article className={styles.card} role="article" aria-labelledby={`product-title-${productId}`}>
      {/* BADGES */}
      {producto.destacado && (
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles.badgeTop}`}>⭐ Más vendido</span>
        </div>
      )}

      {/* IMAGEN / CARRUSEL */}
      <a href={slugUrl} className={styles.imageLink} aria-label={`Ver detalles de ${producto.nombre}`}>
        <div className={styles.imageWrapper}>
          <div className={styles.carouselRoot}>
            {producto.imagen_url ? (
              <Image
                src={producto.imagen_url}
                alt={producto.nombre}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 300px"
                className={styles.carouselImage}
                priority
                loading="eager"
              />
            ) : (
              <div className={styles.carouselEmpty}>
                <span className={styles.emptyText}>🍞 Sin imagen</span>
              </div>
            )}
          </div>
        </div>
      </a>

      {/* CONTENIDO */}
      <div className={styles.body}>
        <a href={slugUrl} className={styles.titleLink}>
          <h3 id={`product-title-${productId}`} className={styles.title}>
            {producto.nombre}
          </h3>
        </a>

        <p className={styles.category}>{producto.categoria}</p>
        <p className={styles.description}>{producto.descripcion}</p>

        <div className={styles.pricingRow}>
          <p className={`${styles.price} ${agotado ? styles.priceDisabled : ''}`}>
            ₲ {producto.precio_venta?.toLocaleString?.('es-PY') || '0'}
          </p>
          <p className={`${styles.availability} ${agotado ? styles.availabilityOut : styles.availabilityIn}`}>
            {agotado ? '❌ No disponible' : '✅ Disponible'}
          </p>
        </div>

        {!agotado && requiereAnticipacion && (
          <p className={styles.preorderBadge}>⏰ Pedido con 24hs de anticipación</p>
        )}

        <div className={styles.controls}>
          {!agotado ? (
            <>
              <div className={styles.qtyGroup}>
                <button onClick={() => setCantidad(c => Math.max(1, c - 1))} className={styles.qtyBtn}>−</button>
                <input type="number" min="1" max={99} value={cantidad} onChange={e => setCantidad(Math.max(1, Math.min(parseInt(e.target.value) || 1, 99)))} className={styles.qtyInput} />
                <button onClick={() => setCantidad(c => Math.min(c + 1, 99))} className={styles.qtyBtn}>+</button>
              </div>
              <button onClick={manejarAgregar} className={`${styles.addBtn} ${isAdded ? styles.added : ''}`} ref={imgRef}>
                {isAdded ? '✅ ¡Agregado!' : '🛒 Agregar al Carrito'}
              </button>
            </>
          ) : (
            <div className={styles.outOfStockGroup}>
              <button onClick={manejarPedidoEspecial} className={styles.orderBtn}>
                ✉️ Quiero encargar este producto
              </button>
              <p className={styles.outOfStockNote}>Te contactamos para producirlo especialmente 🍞</p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}