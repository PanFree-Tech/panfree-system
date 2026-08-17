'use client'

import React, { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  ShoppingCart,
  Package,
  CheckCircle,
  Mail,
  Star,
  Clock,
  WheatOff,
} from 'lucide-react'
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
      unidad_medida: producto.unidad_medida || null, // ← NUEVO: guardar unidad
    }

    agregarAlCarrito(payload)
    onAddToCart?.(payload)

    showToast?.(`${producto.nombre} agregado al carrito`)
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
      {/* Badges superiores: Destacado (izquierda) */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          pointerEvents: 'none',
        }}
      >
        {producto.destacado && (
          <div className={styles.badgeTopLeft}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Star size={13} fill="currentColor" /> Destacado
            </span>
          </div>
        )}
      </div>

      {/* Badge Sin Gluten - Fondo verde con ícono dorado y reflejo (derecha) */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#334c2b',
          border: '1px solid #b7996b',
          borderRadius: '16px',
          padding: '4px 10px 4px 6px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
        }}
      >
        <WheatOff
          size={16}
          strokeWidth={2.5}
          color="#f7d875"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.5)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
          }}
        />
        <span
          style={{
            color: '#eee6d9',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
          }}
        >
          Sin Gluten
        </span>
      </div>

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
              <Package size={32} color="#334c2b" />
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

        {/* 3. TÍTULO */}
        <a href={slugUrl} className={styles.titleLink}>
          <h3 id={`product-title-${productId}`} className={styles.title}>
            {producto.nombre}
          </h3>
        </a>

        {/* Badge de anticipación si requiere */}
        {!agotado && requiereAnticipacion && (
          <div className={styles.anticipacionNotice}>
            <Clock size={13} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
            Pedido con 24h de anticipación
          </div>
        )}

        {/* 4. PRECIO CON UNIDAD DE MEDIDA */}
        <div className={styles.priceRow}>
          <div className={styles.priceContainer}>
            <span className={styles.currencySymbol}>₲</span>
            <span className={`${styles.priceAmount} ${agotado ? styles.priceAgotado : ''}`}>
              {precioFormateado}
            </span>
            {/* 👇 NUEVO: mostrar unidad de medida si existe y no es 'unidad' */}
            {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
              <span style={{
                fontSize: '0.7rem',
                color: '#888',
                marginLeft: '4px',
                fontWeight: 400,
              }}>
                / {producto.unidad_medida}
              </span>
            )}
          </div>
          {agotado && (
            <span className={styles.stockOutTag}>Sin stock</span>
          )}
        </div>

        {/* 5. BOTÓN DE COMPRA */}
        <div className={styles.actionRow}>
          {!agotado ? (
            <div className={styles.purchaseControls}>
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

              <button
                type="button"
                id={`add-to-cart-btn-${productId}`}
                onClick={manejarAgregar}
                ref={imgRef}
                className={`${styles.addToCartBtn} ${isAdded ? styles.addToCartBtnAdded : ''}`}
                aria-label={`Agregar ${cantidad} ${producto.nombre} al carrito`}
              >
                {isAdded ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle size={16} /> ¡Agregado!
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <ShoppingCart size={16} /> Agregar
                  </span>
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={16} /> Encargar
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}