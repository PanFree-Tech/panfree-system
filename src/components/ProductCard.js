'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  ShoppingCart,
  Package,
  CheckCircle,
  Mail,
  Star,
  Clock,
  WheatOff,
  Tag,
  Timer,
} from 'lucide-react'
import styles from './ProductCard.module.css'
import { useCart } from '../context/CartContext'
import { useAnalytics } from '../hooks/useAnalytics'

const formatGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`

/**
 * Calcula si la promoción de un producto está activa en este instante
 */
export function checkPromoActiva(producto) {
  if (!producto || !producto.en_promocion) return false
  const precioBase = Number(producto.precio_venta ?? producto.precio ?? 0)
  const precioPromo = Number(producto.precio_promocion ?? 0)
  if (precioPromo <= 0 || precioPromo >= precioBase) return false

  const now = new Date()
  if (producto.fecha_inicio_promo) {
    const inicio = new Date(producto.fecha_inicio_promo)
    if (now < inicio) return false
  }
  if (producto.fecha_fin_promo) {
    const fin = new Date(producto.fecha_fin_promo)
    if (now > fin) return false
  }
  return true
}

export default function ProductCard({
  producto,
  onAddToCart,
  disponible = true,
  requiereAnticipacion = false,
}) {
  const [cantidad, setCantidad] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(null)
  const [promoActiva, setPromoActiva] = useState(() => checkPromoActiva(producto))

  const imgRef = useRef(null)
  const { agregarAlCarrito, showToast } = useCart()
  const { viewItem, addToCart: trackAddToCart } = useAnalytics()

  // GA4: registra view_item cuando la tarjeta del producto se monta
  useEffect(() => {
    if (producto?.id) viewItem(producto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto?.id])

  // Temporizador en tiempo real para promociones con fecha_fin_promo
  useEffect(() => {
    if (!producto?.en_promocion || !producto?.precio_promocion) {
      setPromoActiva(false)
      setTiempoRestante(null)
      return
    }

    const actualizarTimer = () => {
      const activa = checkPromoActiva(producto)
      setPromoActiva(activa)

      if (!activa) {
        setTiempoRestante(null)
        return
      }

      if (producto.fecha_fin_promo) {
        const ahora = new Date().getTime()
        const fin = new Date(producto.fecha_fin_promo).getTime()
        const distancia = fin - ahora

        if (distancia <= 0) {
          setPromoActiva(false)
          setTiempoRestante(null)
          return
        }

        const dias = Math.floor(distancia / (1000 * 60 * 60 * 24))
        const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60))
        const segundos = Math.floor((distancia % (1000 * 60)) / 1000)

        if (dias > 0) {
          setTiempoRestante(`${dias}d ${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m`)
        } else {
          setTiempoRestante(
            `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
          )
        }
      } else {
        setTiempoRestante(null)
      }
    }

    actualizarTimer()
    const intervalo = setInterval(actualizarTimer, 1000)
    return () => clearInterval(intervalo)
  }, [producto])

  const agotado = !disponible

  const precioBase = Number(producto?.precio_venta ?? producto?.precio ?? 0)
  const precioPromo = Number(producto?.precio_promocion ?? 0)
  const precioFinal = promoActiva ? precioPromo : precioBase
  const ahorroGs = promoActiva && precioBase > precioPromo ? precioBase - precioPromo : 0
  const porcentajeDescuento =
    promoActiva && precioBase > 0 ? Math.round((1 - precioPromo / precioBase) * 100) : 0

  const manejarAgregar = useCallback(
    (e) => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      if (agotado || !producto) return

      const payload = {
        id: producto.id || producto.slug || Date.now().toString(),
        nombre: producto.nombre,
        precio_venta: precioFinal,
        precio_original: precioBase,
        en_promocion: promoActiva,
        imagen_url: producto.imagen_url || '',
        cantidad,
        subtotal: precioFinal * cantidad,
        categoria: producto.categoria || '',
        unidad_medida: producto.unidad_medida || null,
      }

      agregarAlCarrito(payload)
      onAddToCart?.(payload)
      trackAddToCart(producto, cantidad)
      showToast?.(`${producto.nombre} agregado al carrito`)
      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 1400)
      setCantidad(1)
    },
    [agotado, producto, precioFinal, precioBase, promoActiva, cantidad, agregarAlCarrito, onAddToCart, trackAddToCart, showToast]
  )

  const manejarPedidoEspecial = useCallback(
    (e) => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      if (!producto) return

      const msg = encodeURIComponent(
        `¡Hola PanFree! 🍞 Me gustaría encargar el siguiente producto:\n\n` +
          `*Producto:* ${producto.nombre}\n` +
          `*Categoría:* ${producto.categoria || 'Panadería'}\n` +
          `*Precio:* ${formatGs(precioFinal)}\n\n` +
          `¿Podrían confirmarme disponibilidad y tiempo de entrega? ¡Gracias!`
      )
      window.open(`https://wa.me/595984589845?text=${msg}`, '_blank', 'noopener,noreferrer')
    },
    [producto, precioFinal]
  )

  if (!producto) return null

  const slugUrl = producto?.slug ? `/producto/${producto.slug}` : '#'
  const productId = producto?.id ?? producto?.slug ?? producto?.nombre?.slice(0, 12) ?? 'item'

  return (
    <article
      id={`product-card-${productId}`}
      className={styles.card}
      role="article"
      aria-labelledby={`product-title-${productId}`}
    >
      {/* Badges superiores: Destacado y Promoción */}
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
        {producto.destacado || producto.is_featured ? (
          <div className={styles.badgeTopLeft}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Star size={13} fill="currentColor" /> Destacado
            </span>
          </div>
        ) : null}

        {promoActiva && (
          <div className={styles.promoBadge}>
            🔥 -{porcentajeDescuento}% OFF
          </div>
        )}
      </div>

      {/* Badge Sin Gluten */}
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
              priority={Boolean(producto.destacado || producto.is_featured)}
            />
          ) : (
            <div className={styles.imageFallback}>
              <Package size={32} color="#334c2b" />
            </div>
          )}

          {/* Banner de cuenta regresiva sobre la imagen */}
          {promoActiva && tiempoRestante && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(220, 38, 38, 0.92)',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                backdropFilter: 'blur(2px)',
                letterSpacing: '0.2px',
              }}
            >
              <Timer size={13} className="animate-pulse" />
              <span>Termina en: {tiempoRestante}</span>
            </div>
          )}
        </div>
      </a>

      {/* 2. CUERPO DE LA TARJETA */}
      <div className={styles.body}>
        {/* Categoría */}
        {producto.categoria && <span className={styles.categoryBadge}>{producto.categoria}</span>}

        {/* 3. TÍTULO */}
        <a href={slugUrl} className={styles.titleLink}>
          <h3 id={`product-title-${productId}`} className={styles.title}>
            {producto.nombre}
          </h3>
        </a>

        {/* Badge de anticipación */}
        {!agotado && requiereAnticipacion && (
          <div className={styles.anticipacionNotice}>
            <Clock size={13} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
            Pedido con 24h de anticipación
          </div>
        )}

        {/* 4. PRECIO CON UNIDAD DE MEDIDA Y DESCUENTO */}
        <div className={styles.priceRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', width: '100%' }}>
            {promoActiva ? (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.85rem', fontWeight: 600 }}>
                    {formatGs(precioBase)}
                  </span>
                  <span style={{ color: '#dc2626', fontSize: '1.2rem', fontWeight: 800 }}>
                    {formatGs(precioPromo)}
                  </span>
                  {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
                    <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>
                      / {producto.unidad_medida}
                    </span>
                  )}
                </div>
                {ahorroGs > 0 && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#991b1b',
                      fontWeight: 800,
                      backgroundColor: '#fee2e2',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      alignSelf: 'flex-start',
                      marginTop: '2px',
                    }}
                  >
                    AHORRAS {formatGs(ahorroGs)}
                  </span>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span className={`${styles.priceAmount} ${agotado ? styles.priceAgotado : ''}`}>
                  {formatGs(precioBase)}
                </span>
                {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
                  <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>
                    / {producto.unidad_medida}
                  </span>
                )}
              </div>
            )}
          </div>

          {agotado && <span className={styles.stockOutTag}>Sin stock</span>}
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
