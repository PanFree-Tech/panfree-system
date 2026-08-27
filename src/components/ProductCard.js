'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  ShoppingCart,
  Package,
  CheckCircle,
  Mail,
  Star,
  Clock,
  WheatOff,
  Timer,
} from 'lucide-react'
import styles from './ProductCard.module.css'
import { useCart } from '../context/CartContext'
import { useAnalytics } from '../hooks/useAnalytics'
import { resolveProductImageUrl } from '@/lib/image-utils'

export const formatGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`

/**
 * Parsea cualquier formato de fecha de Supabase/PostgreSQL a un objeto Date válido
 */
export function parseFechaPromo(val) {
  if (!val) return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  if (typeof val === 'number') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof val === 'string') {
    let s = val.trim()
    if (!s) return null
    if (s.includes(' ') && !s.includes('T')) {
      s = s.replace(' ', 'T')
    }
    s = s.replace(/([+-]\d{2})$/, '$1:00')
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d

    const fallback = new Date(val)
    if (!isNaN(fallback.getTime())) return fallback
  }
  return null
}

/**
 * Calcula si la promoción de un producto está activa en este instante
 */
export function checkPromoActiva(producto) {
  if (!producto) return false
  const enPromo = producto.en_promocion === true || producto.en_promocion === 'true' || producto.en_promocion === 1
  if (!enPromo) return false

  const precioBase = Number(producto.precio_venta ?? producto.precio ?? 0)
  const precioPromo = Number(producto.precio_promocion ?? 0)
  if (precioPromo <= 0) return false
  if (precioBase > 0 && precioPromo >= precioBase) return false

  const nowMs = Date.now()

  if (producto.fecha_inicio_promo) {
    const inicio = parseFechaPromo(producto.fecha_inicio_promo)
    if (inicio && nowMs < inicio.getTime()) {
      return false
    }
  }

  if (producto.fecha_fin_promo) {
    const fin = parseFechaPromo(producto.fecha_fin_promo)
    if (fin && nowMs > fin.getTime()) {
      return false
    }
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
  const [imgError, setImgError] = useState(false)
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
    if (!producto || !checkPromoActiva(producto)) {
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
        const finDate = parseFechaPromo(producto.fecha_fin_promo)
        if (!finDate) {
          setTiempoRestante(null)
          return
        }
        const ahora = Date.now()
        const fin = finDate.getTime()
        const distancia = fin - ahora

        if (distancia <= 0) {
          setPromoActiva(false)
          setTiempoRestante(null)
          return
        }

        const dias = Math.floor(distancia / (1000 * 60 * 60 * 24))
        const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutos = Math.floor((distancia % (1000 * 60)) / (1000 * 60))
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

  if (!producto) return null

  const esDestacado = Boolean(
    producto.is_featured === true ||
    producto.is_featured === 'true' ||
    producto.destacado === true ||
    producto.destacado === 'true'
  )

  const agotado = !disponible
  const precioBase = Number(producto?.precio_venta ?? producto?.precio ?? 0)
  const precioPromo = Number(producto?.precio_promocion ?? 0)
  const precioFinal = promoActiva ? precioPromo : precioBase
  const ahorroGs = promoActiva && precioBase > precioPromo ? precioBase - precioPromo : 0
  const porcentajeDescuento =
    promoActiva && precioBase > 0 ? Math.round((1 - precioPromo / precioBase) * 100) : 0

  const manejarAgregar = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (agotado || !producto) return

    const payload = {
      id: producto.id || producto.slug || Date.now().toString(),
      nombre: producto.nombre,
      precio_venta: precioFinal,
      precio_original: precioBase,
      en_promocion: promoActiva,
      imagen_url: imagenValida || '',
      cantidad,
      subtotal: precioFinal * cantidad,
      categoria: producto.categoria || '',
      unidad_medida: producto.unidad_medida || null,
    }

    agregarAlCarrito(payload)
    onAddToCart?.(payload)
    trackAddToCart?.(producto, cantidad)
    showToast?.(`${producto.nombre} agregado al carrito`)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1400)
    setCantidad(1)
  }

  const manejarPedidoEspecial = (e) => {
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
  }

  const imagenValida = resolveProductImageUrl(producto)
  const slugUrl = producto?.slug ? `/producto/${producto.slug}` : '#'
  const productId = producto?.id ?? producto?.slug ?? producto?.nombre?.slice(0, 12) ?? 'item'
  const tieneImagen = Boolean(imagenValida && !imgError)

  return (
    <article
      id={`product-card-${productId}`}
      className={styles.card}
      role="article"
      aria-labelledby={`product-title-${productId}`}
    >
      {/* Badges superiores izquierdos: Destacado y Oferta */}
      {(esDestacado || promoActiva) && (
        <div className={styles.badgesTopLeft}>
          {esDestacado && (
            <div className={styles.badgeTopLeft}>
              <Star size={12} fill="currentColor" />
              <span>Destacado</span>
            </div>
          )}

          {promoActiva && (
            <div className={styles.promoBadge}>
              🔥 -{porcentajeDescuento}% OFF
            </div>
          )}
        </div>
      )}

      {/* Badge Sin Gluten Superior Derecho */}
      <div className={styles.badgeTopRight}>
        <WheatOff
          size={14}
          strokeWidth={2.5}
          color="#f7d875"
          style={{
            filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.5))',
          }}
        />
        <span className={styles.badgeSinGlutenText}>Sin Gluten</span>
      </div>

      {/* 1. IMAGEN DEL PRODUCTO */}
      <a href={slugUrl} className={styles.imageLink} aria-label={`Ver detalle de ${producto.nombre}`}>
        <div className={styles.imageWrapper}>
          {tieneImagen ? (
            <Image
              src={imagenValida}
              alt={producto.nombre}
              fill
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 280px"
              className={styles.productImage}
              priority={esDestacado}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={styles.imageFallback}>
              <Package size={32} color="#334c2b" />
            </div>
          )}

          {/* Banner de cuenta regresiva sobre la imagen */}
          {promoActiva && tiempoRestante && (
            <div className={styles.promoTimerOverlay}>
              <Timer size={13} className="animate-pulse" />
              <span>Termina en: {tiempoRestante}</span>
            </div>
          )}
        </div>
      </a>

      {/* 2. CUERPO DE LA TARJETA */}
      <div className={styles.body}>
        <div>
          {/* Categoría */}
          {producto.categoria && <span className={styles.categoryBadge}>{producto.categoria}</span>}

          {/* Título */}
          <a href={slugUrl} className={styles.titleLink}>
            <h3 id={`product-title-${productId}`} className={styles.title}>
              {producto.nombre}
            </h3>
          </a>

          {/* Badge de anticipación */}
          {!agotado && requiereAnticipacion && (
            <div className={styles.anticipacionNotice}>
              <Clock size={12} />
              <span>Pedido con 24h</span>
            </div>
          )}
        </div>

        {/* 3. PRECIO CON UNIDAD DE MEDIDA Y DESCUENTO */}
        <div className={styles.priceRow}>
          <div className={styles.priceContainer}>
            {promoActiva ? (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span className={styles.oldPrice}>
                    {formatGs(precioBase)}
                  </span>
                  <span className={styles.pricePromo}>
                    {formatGs(precioPromo)}
                  </span>
                  {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
                    <span className={styles.unitMeasure}>
                      / {producto.unidad_medida}
                    </span>
                  )}
                </div>
                {ahorroGs > 0 && (
                  <span className={styles.savingsTag}>
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
                  <span className={styles.unitMeasure}>
                    / {producto.unidad_medida}
                  </span>
                )}
              </div>
            )}
          </div>

          {agotado && <span className={styles.stockOutTag}>Sin stock</span>}
        </div>

        {/* 4. BOTONES DE ACCIÓN */}
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={15} /> ¡Agregado!
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShoppingCart size={15} /> Agregar
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={15} /> Encargar
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
