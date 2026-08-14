/**
 * 📁 UBICACIÓN: src/components/ProductCard.js
 * 📅 ACTUALIZADO: 2026-03-07
 * 📌 CAMBIOS:
 *  - Carrusel automático: imagen_url + imagenes_urls[]
 *  - Auto-avance cada 3 segundos, pausa al hover
 *  - Fade crossfade — sin controles (grilla compacta)
 *  - Si solo hay 1 imagen: comportamiento idéntico al original
 *  - Todos los hooks SIEMPRE antes de cualquier return condicional
 */
'use client'

/**
 * Archivo: src/components/ProductCard.js
 * Mejoras:
 * - Estilos movidos a ProductCard.module.css
 * - Accesibilidad: aria-labels, roles, ids vinculados
 * - Manejo de teclado: botones nativos y atributos aria
 * - Responsive mediante CSS module
 * - Mantiene toda la funcionalidad original (carrusel, cantidad, añadir al carrito, encargo por WA)
 */

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import styles from './ProductCard.module.css'

// Número de WhatsApp original del repo
const WA_NUMBER = '595984589845'

/* Carrusel interno (se mantiene la misma funcionalidad que tenía el original) */
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
          className={`${styles.carouselSlide} ${i === indice ? styles.carouselActive : ''}`}
          aria-hidden={i === indice ? 'false' : 'true'}
        >
          <Image
            src={src}
            alt={i === 0 ? (imagenAlt || nombre) : `${nombre} — foto ${i + 1}`}
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

export default function ProductCard({ producto, onAddToCart, disponible = true, requiereAnticipacion = false }) {
  const [cantidad, setCantidad] = useState(1)

  if (!producto) return null

  const agotado = !disponible

  const imagenes = [
    ...(producto.imagen_url ? [producto.imagen_url] : []),
    ...(Array.isArray(producto.imagenes_urls) ? producto.imagenes_urls.filter(Boolean) : []),
  ]

  const manejarAgregar = useCallback(() => {
    if (agotado) return
    onAddToCart?.({ ...producto, cantidad, subtotal: producto.precio_venta * cantidad })
    setCantidad(1)
  }, [agotado, onAddToCart, producto, cantidad])

  const manejarPedidoEspecial = useCallback(() => {
    const msg = encodeURIComponent(
      `¡Hola PanFree! 🍞 Me gustaría encargar el siguiente producto:\n\n` +
      `*Producto:* ${producto.nombre}\n*Categoría:* ${producto.categoria}\n` +
      `*Precio:* ₲ ${producto.precio_venta?.toLocaleString('es-PY')}\n\n` +
      `¿Podrían decirme disponibilidad y tiempo estimado de producción? ¡Gracias!`
    )
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }, [producto])

  const slugUrl = producto?.slug ? `/producto/${producto.slug}` : '#'
  const productId = producto?.id ?? producto?.slug ?? producto?.nombre.slice(0, 12)

  return (
    <article className={styles.card} role="article" aria-labelledby={`product-title-${productId}`}>
      <a href={slugUrl} className={styles.imageLink} aria-label={`Ver detalles de ${producto.nombre}`}>
        <CarruselCard imagenes={imagenes} nombre={producto.nombre} imagenAlt={producto.imagen_alt} />
      </a>

      <div className={styles.body}>
        {slugUrl ? (
          <a href={slugUrl} className={styles.titleLink} aria-label={`Ir a la página del producto ${producto.nombre}`}>
            <h3 id={`product-title-${productId}`} className={styles.title}>{producto.nombre}</h3>
          </a>
        ) : (
          <h3 id={`product-title-${productId}`} className={styles.title}>{producto.nombre}</h3>
        )}

        <p className={styles.category} aria-hidden="false">{producto.categoria}</p>
        <p className={styles.description}>{producto.descripcion}</p>

        <div className={styles.pricingRow}>
          <p className={`${styles.price} ${agotado ? styles.priceDisabled : ''}`} aria-live="polite">
            ₲ {producto.precio_venta?.toLocaleString('es-PY') || '0'}
          </p>
          <p className={`${styles.availability} ${agotado ? styles.availabilityOut : styles.availabilityIn}`}>
            {agotado ? '❌ No disponible' : '✅ Disponible'}
          </p>
        </div>

        {(!agotado && requiereAnticipacion) && (
          <p className={styles.preorderBadge} role="status" aria-label="Pedido con anticipación">
            ⏰ Pedido con 24hs de anticipación
          </p>
        )}

        <div className={styles.controls}>
          {!agotado ? (
            <>
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
                  onChange={e => setCantidad(Math.max(1, Math.min(parseInt(e.target.value) || 1, 99)))}
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

              <button
                type="button"
                onClick={manejarAgregar}
                className={styles.addBtn}
                aria-label={`Agregar ${cantidad} unidades de ${producto.nombre} al carrito`}
              >
                🛒 Agregar al Carrito
              </button>
            </>
          ) : (
            <div className={styles.outOfStockGroup}>
              <button
                type="button"
                onClick={manejarPedidoEspecial}
                className={styles.orderBtn}
                aria-label={`Encargar ${producto.nombre} por WhatsApp`}
              >
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