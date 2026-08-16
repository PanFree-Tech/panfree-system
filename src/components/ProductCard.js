'use client'

import React, { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import styles from './ProductCard.module.css'
import { useCart } from '../context/CartContext'

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

  const agotado = !disponible

  const manejarAgregar = useCallback((e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (agotado || !producto) return

    const precioVenta = producto.precio_venta ?? producto.precio ?? 0
    const payload = {
      id: producto.id || producto.slug || Date.now().toString(),
      nombre: producto.nombre,
      precio_venta: precioVenta,
      imagen_url: producto.imagen_url || '',
      cantidad,
      subtotal: precioVenta * cantidad,
      categoria: producto.categoria || '',
    }

    agregarAlCarrito(payload)
    onAddToCart?.(payload)

    showToast?.(`✅ ${producto.nombre} agregado al carrito`)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1400)
    setCantidad(1)
  }, [agotado, producto, cantidad, agregarAlCarrito, onAddToCart, showToast])

  const manejarPedidoEspecial = useCallback((e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!producto) return

    const precioVenta = producto.precio_venta ?? producto.precio ?? 0
    const msg = encodeURIComponent(
      `¡Hola PanFree! 🍞 Me gustaría encargar el siguiente producto:\n\n` +
      `*Producto:* ${producto.nombre}\n` +
      `*Categoría:* ${producto.categoria || 'Panadería'}\n` +
      `*Precio aproximado:* ₲ ${precioVenta}\n\n` +
      `¿Podrían confirmarme disponibilidad y tiempo de entrega? ¡Gracias!`
    )
    window.open(`https://wa.me/595984589845?text=${msg}`, '_blank', 'noopener,noreferrer')
  }, [producto])

  if (!producto) return null

  const slugUrl = producto?.slug ? `/producto/${producto.slug}` : '#'
  const productId = producto?.id ?? producto?.slug ?? producto?.nombre?.slice(0, 12) ?? 'item'
  const precioVal = producto?.precio_venta ?? producto?.precio ?? 0
  const precioFormateado = typeof precioVal === 'number' ? precioVal.toLocaleString('es-PY') : precioVal

  return (
    <article
      id={`product-card-${productId}`}
      className={styles.card}
      role="article"
      aria-labelledby={`product-title-${productId}`}
    >
      {/* Badges superiores */}
      {producto.destacado && (
        <div className={styles.badgeTopLeft}>
          <span>⭐ Destacado</span>
        </div>
      )}

      {/* 1. IMAGEN */}
      <a href={slugUrl} className={styles.imageLink} aria-label={`Ver detalle de ${producto.nombre}`}>
        <div className={styles.imageWrapper}>
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              className={styles.productImage}
              priority={Boolean(producto.destacado)}
            />
          ) : (
            <div className={styles.imageFallback}>
              <span style={{ fontSize: '2rem' }}>🍞</span>
            </div>
          )}
        </div>
      </a>

      {/* 2. CUERPO DE LA TARJETA */}
      <div className={styles.body}>
        {/* Categoría sutil */}
        {producto.categoria && (
          <span className={styles.categoryBadge}>
            {producto.categoria}
          </span>
        )}

        {/* 2. TÍTULO */}
        <a href={slugUrl} className={styles.titleLink}>
          <h3 id={`product-title-${productId}`} className={styles.title}>
            {producto.nombre}
          </h3>
        </a>

        {/* Badge de anticipación si requiere */}
        {!agotado && requiereAnticipacion && (
          <div className={styles.anticipacionNotice}>
            ⏰ Pedido con 24h de anticipación
          </div>
        )}

        {/* 3. PRECIO (DESTACADO Y EN NEGRITA) */}
        <div className={styles.priceRow}>
          <div className={styles.priceContainer}>
            <span className={styles.currencySymbol}>₲</span>
            <span className={`${styles.priceAmount} ${agotado ? styles.priceAgotado : ''}`}>
              {precioFormateado}
            </span>
          </div>
          {agotado && (
            <span className={styles.stockOutTag}>Sin stock</span>
          )}
        </div>

        {/* 4. BOTÓN DE COMPRA Y SELECTOR DE CANTIDAD */}
        <div className={styles.actionRow}>
          {!agotado ? (
            <div className={styles.purchaseControls}>
              {/* Selector de cantidad compacto */}
              <div className={styles.qtyBox}>
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className={styles.qtyButton}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className={styles.qtyDisplay} aria-live="polite">
                  {cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.min(99, c + 1))}
                  className={styles.qtyButton}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              {/* Botón CTA EXCLUSIVO NARANJA #f46e15 */}
              <button
                type="button"
                id={`add-to-cart-btn-${productId}`}
                onClick={manejarAgregar}
                ref={imgRef}
                className={`${styles.addToCartBtn} ${isAdded ? styles.addToCartBtnAdded : ''}`}
                aria-label={`Agregar ${cantidad} ${producto.nombre} al carrito`}
              >
                {isAdded ? (
                  <span>✅ ¡Agregado!</span>
                ) : (
                  <span>🛒 Agregar</span>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={manejarPedidoEspecial}
              className={styles.whatsappOrderBtn}
              aria-label={`Encargar ${producto.nombre} por WhatsApp`}
            >
              <span>✉️ Encargar</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
