/**
 * 📁 UBICACIÓN: src/app/producto/[slug]/ProductoCliente.js
 * 📅 ACTUALIZADO: 2026-08-27
 * 📌 DESCRIPCIÓN:
 *  - Vista de detalle de producto 100% responsiva y optimizada para móvil
 *  - Optimización con Next.js Image y Cloudinary
 *  - Sistema de Promociones con Temporizador en tiempo real
 *  - "Destacado" y "Sin Gluten" condicionales y con estilo consistente
 *  - Formato de Guaraníes unificado con "Gs."
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  WheatOff,
  Star,
  Timer,
  Tag,
  Clock,
  ShoppingCart,
  Check,
  Share2,
  Copy,
  Package,
} from 'lucide-react'
import { useCart } from '../../../context/CartContext'
import { resolveProductImageUrl, isInvalidImageUrl } from '@/lib/image-utils'

export const formatGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`

const CATEGORIA_LABEL = {
  panes: '🍞 Panes',
  dulces: '🍰 Dulces',
  salados: '🧀 Salados',
  eventos: '🎉 Eventos',
}

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
 * Valida si la promoción del producto está vigente en el instante actual
 */
export function isPromoVigente(producto) {
  if (!producto) return false
  const enPromo = producto.en_promocion === true || producto.en_promocion === 'true' || producto.en_promocion === 1
  if (!enPromo) return false

  const base = Number(producto.precio_venta ?? producto.precio ?? 0)
  const promo = Number(producto.precio_promocion ?? 0)
  if (promo <= 0) return false
  if (base > 0 && promo >= base) return false

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

// ─────────────────────────────────────────────
// Carrusel — fade crossfade, flechas, puntos, swipe
// ─────────────────────────────────────────────
function CarruselImagenes({ imagenes, nombre, imagenAlt }) {
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [imgErrors, setImgErrors] = useState({})
  const touchStartX = useRef(null)
  const total = imagenes.length

  const irA = useCallback(
    (i) => {
      if (total <= 0) return
      setIndice(((i % total) + total) % total)
    },
    [total]
  )

  const siguiente = useCallback(() => irA(indice + 1), [indice, irA])
  const anterior = useCallback(() => irA(indice - 1), [indice, irA])

  useEffect(() => {
    if (total <= 1 || pausado) return
    const t = setTimeout(siguiente, 4500)
    return () => clearTimeout(t)
  }, [indice, pausado, total, siguiente])

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? siguiente() : anterior()
    touchStartX.current = null
  }

  return (
    <div
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ userSelect: 'none', width: '100%' }}
    >
      <div
        style={{
          backgroundColor: '#f5f0e8',
          borderRadius: '12px',
          border: '1.5px solid #b7996b',
          overflow: 'hidden',
          aspectRatio: '1',
          position: 'relative',
          width: '100%',
        }}
      >
        {total === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee6d9' }}>
            <Package size={56} color="#334c2b" />
          </div>
        ) : (
          imagenes.map((src, i) => {
            const hasError = imgErrors[i]
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: i === indice ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out',
                  pointerEvents: i === indice ? 'auto' : 'none',
                }}
              >
                {!hasError && src ? (
                  <Image
                    src={src}
                    alt={i === 0 ? imagenAlt || nombre : `${nombre} — foto ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    style={{ objectFit: 'cover' }}
                    priority={i === 0}
                    onError={() => setImgErrors((prev) => ({ ...prev, [i]: true }))}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee6d9' }}>
                    <Package size={56} color="#334c2b" />
                  </div>
                )}
              </div>
            )
          })
        )}

        {total > 1 && (
          <>
            <button onClick={anterior} aria-label="Imagen anterior" style={estiloFlecha('left')}>
              ‹
            </button>
            <button onClick={siguiente} aria-label="Imagen siguiente" style={estiloFlecha('right')}>
              ›
            </button>
          </>
        )}

        {total > 1 && (
          <div
            style={{
              position: 'absolute',
              top: '0.6rem',
              right: '0.6rem',
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '20px',
              zIndex: 4,
              backdropFilter: 'blur(4px)',
            }}
          >
            {indice + 1} / {total}
          </div>
        )}
      </div>

      {total > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '0.65rem' }}>
          {imagenes.map((_, i) => (
            <button
              key={i}
              onClick={() => irA(i)}
              aria-label={`Ver imagen ${i + 1}`}
              style={{
                width: i === indice ? '20px' : '7px',
                height: '7px',
                borderRadius: '4px',
                border: 'none',
                padding: 0,
                backgroundColor: i === indice ? '#f46e15' : '#b7996b',
                opacity: i === indice ? 1 : 0.45,
                cursor: 'pointer',
                transition: 'width 0.3s ease, background-color 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function estiloFlecha(lado) {
  return {
    position: 'absolute',
    [lado]: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '34px',
    height: '34px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    border: '1px solid #b7996b',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#334c2b',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    zIndex: 4,
    backdropFilter: 'blur(4px)',
    transition: 'background-color 0.2s',
  }
}

// ─────────────────────────────────────────────
// Componente Principal de Producto
// ─────────────────────────────────────────────
export default function PaginaProductoCliente({
  producto,
  relacionados = [],
  disponible = true,
  requiereAnticipacion = false,
}) {
  const router = useRouter()
  const { agregarAlCarrito, showToast } = useCart()
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Estado de promoción en tiempo real
  const [promoActiva, setPromoActiva] = useState(() => isPromoVigente(producto))
  const [tiempoRestante, setTiempoRestante] = useState(null)

  // Temporizador en vivo
  useEffect(() => {
    if (!producto || !isPromoVigente(producto)) {
      setPromoActiva(false)
      setTiempoRestante(null)
      return
    }

    const chequearPromoYTimer = () => {
      const activa = isPromoVigente(producto)
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
        const diff = fin - ahora

        if (diff <= 0) {
          setPromoActiva(false)
          setTiempoRestante(null)
          return
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24))
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)

        setTiempoRestante({ dias: d, horas: h, minutos: m, segundos: s })
      } else {
        setTiempoRestante(null)
      }
    }

    chequearPromoYTimer()
    const timer = setInterval(chequearPromoYTimer, 1000)
    return () => clearInterval(timer)
  }, [producto])

  if (!producto) return null

  const esDestacado = Boolean(
    producto.is_featured === true ||
    producto.is_featured === 'true' ||
    producto.destacado === true ||
    producto.destacado === 'true'
  )

  const imagenPrincipal = resolveProductImageUrl(producto)
  const imagenesAdicionales = Array.isArray(producto.imagenes_urls)
    ? producto.imagenes_urls
        .map(u => (typeof u === 'string' && u.includes('ze02jdnrxho') ? 'https://gbdrcaumghykiipqgbty.supabase.co/storage/v1/object/public/productos/productos/1773103970210-ze02jdnrxho.jpg' : u))
        .filter(u => u && !isInvalidImageUrl(u))
    : []

  const imagenes = [
    ...(imagenPrincipal ? [imagenPrincipal] : []),
    ...imagenesAdicionales.filter(u => u !== imagenPrincipal),
  ]

  const sinStock = !disponible
  const precioBase = Number(producto.precio_venta ?? producto.precio ?? 0)
  const precioPromo = Number(producto.precio_promocion ?? 0)
  const precioUnitario = promoActiva ? precioPromo : precioBase

  const ahorroGs = promoActiva && precioBase > precioPromo ? precioBase - precioPromo : 0
  const porcentajeDescuento =
    promoActiva && precioBase > 0 ? Math.round((1 - precioPromo / precioBase) * 100) : 0

  function handleAgregar() {
    if (sinStock || !producto) return
    agregarAlCarrito({
      id: producto.id || producto.slug || Date.now().toString(),
      nombre: producto.nombre,
      precio_venta: precioUnitario,
      precio_original: precioBase,
      en_promocion: promoActiva,
      imagen_url: imagenPrincipal || '',
      cantidad,
      subtotal: precioUnitario * cantidad,
      categoria: producto.categoria || '',
      unidad_medida: producto.unidad_medida || null,
    })
    showToast?.(`${producto.nombre} agregado al carrito`)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1600)
  }

  const handleCopiarLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem', fontFamily: '"Segoe UI", sans-serif' }}>
      {/* Breadcrumb */}
      <nav
        style={{
          fontSize: '0.82rem',
          color: '#888',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.4rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#334c2b',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.82rem',
            padding: 0,
            fontWeight: 600,
          }}
        >
          🏠 Inicio
        </button>
        <span>›</span>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#334c2b',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.82rem',
            padding: 0,
          }}
        >
          {CATEGORIA_LABEL[producto.categoria] || producto.categoria}
        </button>
        <span>›</span>
        <span style={{ color: '#555', fontWeight: 600 }}>{producto.nombre}</span>
      </nav>

      {/* ── Contenido Principal Responsive ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
        className="product-detail-container"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem',
            alignItems: 'start',
          }}
        >
          {/* Columna Izquierda: Carrusel */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px', margin: '0 auto' }}>
            <CarruselImagenes imagenes={imagenes} nombre={producto.nombre} imagenAlt={producto.imagen_alt} />

            {/* Badges Flotantes sobre la Imagen */}
            <div
              style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              {promoActiva && (
                <span
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 2px 6px rgba(220,38,38,0.35)',
                    width: 'fit-content',
                  }}
                >
                  🔥 OFERTA -{porcentajeDescuento}%
                </span>
              )}
              {esDestacado && (
                <span
                  style={{
                    backgroundColor: '#f46e15',
                    color: '#fff',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    width: 'fit-content',
                  }}
                >
                  <Star size={13} fill="currentColor" /> Destacado
                </span>
              )}
              <span
                style={{
                  backgroundColor: '#334c2b',
                  color: '#eee6d9',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  border: '1px solid #b7996b',
                  width: 'fit-content',
                }}
              >
                <WheatOff size={14} color="#f7d875" /> Sin Gluten
              </span>
            </div>
          </div>

          {/* Columna Derecha: Información del Producto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <div>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: '#8c9937',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {CATEGORIA_LABEL[producto.categoria] || producto.categoria}
              </span>
              <h1
                style={{
                  margin: '0.25rem 0 0 0',
                  color: '#334c2b',
                  fontSize: 'clamp(1.35rem, 3.5vw, 1.9rem)',
                  lineHeight: 1.25,
                  fontWeight: 800,
                }}
              >
                {producto.nombre}
              </h1>
            </div>

            {/* Banner Temporizador de Promoción en Vivo */}
            {promoActiva && tiempoRestante && (
              <div
                style={{
                  backgroundColor: '#fff1f2',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#9f1239', fontWeight: 800, fontSize: '0.8rem' }}>
                  <Timer size={16} color="#e11d48" className="animate-pulse" />
                  <span>¡OFERTA POR TIEMPO LIMITADO!</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: '#4b5563' }}>Termina en:</span>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {tiempoRestante.dias > 0 && (
                      <div style={timerBoxStyle}>
                        <span style={timerNumStyle}>{tiempoRestante.dias}</span>
                        <span style={timerLabelStyle}>días</span>
                      </div>
                    )}
                    <div style={timerBoxStyle}>
                      <span style={timerNumStyle}>{String(tiempoRestante.horas).padStart(2, '0')}</span>
                      <span style={timerLabelStyle}>hs</span>
                    </div>
                    <div style={timerBoxStyle}>
                      <span style={timerNumStyle}>{String(tiempoRestante.minutos).padStart(2, '0')}</span>
                      <span style={timerLabelStyle}>min</span>
                    </div>
                    <div style={timerBoxStyle}>
                      <span style={timerNumStyle}>{String(tiempoRestante.segundos).padStart(2, '0')}</span>
                      <span style={timerLabelStyle}>seg</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sección de Precio */}
            <div
              style={{
                backgroundColor: promoActiva ? '#fef2f2' : '#fdfbf8',
                border: `1.5px solid ${promoActiva ? '#fca5a5' : '#e0d5c5'}`,
                borderRadius: '10px',
                padding: '0.85rem',
              }}
            >
              {promoActiva ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.1rem', color: '#9ca3af', textDecoration: 'line-through', fontWeight: 600 }}>
                      {formatGs(precioBase)}
                    </span>
                    <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>
                      {formatGs(precioPromo)}
                    </span>
                    {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
                      <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>/ {producto.unidad_medida}</span>
                    )}
                  </div>

                  {ahorroGs > 0 && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        marginTop: '0.4rem',
                        border: '1px solid #fecaca',
                      }}
                    >
                      <Tag size={14} /> AHORRAS {formatGs(ahorroGs)} ({porcentajeDescuento}% OFF)
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#334c2b', lineHeight: 1 }}>
                    {formatGs(precioBase)}
                  </span>
                  {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
                    <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>/ {producto.unidad_medida}</span>
                  )}
                </div>
              )}

              {producto.precio_mayorista && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: '#334c2b',
                      backgroundColor: '#eee6d9',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '16px',
                      fontWeight: 700,
                    }}
                  >
                    Mayorista: {formatGs(producto.precio_mayorista)}
                  </span>
                </div>
              )}
            </div>

            {/* Descripción */}
            {producto.descripcion && (
              <p
                style={{
                  color: '#4b5563',
                  lineHeight: 1.6,
                  fontSize: '0.92rem',
                  margin: 0,
                  padding: '0.75rem 0.85rem',
                  backgroundColor: '#f9f6f1',
                  borderRadius: '8px',
                  borderLeft: '4px solid #b7996b',
                }}
              >
                {producto.descripcion}
              </p>
            )}

            {/* Disponibilidad */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: sinStock ? '#c62828' : '#2e7d32',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: sinStock ? '#c62828' : '#2e7d32', fontWeight: 700 }}>
                {sinStock ? 'No disponible por el momento' : 'Disponible · Elaboración artesanal'}
              </span>
            </div>

            {/* Aviso de anticipación */}
            {!sinStock && requiereAnticipacion && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#fff8e1',
                  border: '1px solid #ffe082',
                  borderRadius: '6px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.82rem',
                  color: '#5d4037',
                  fontWeight: '600',
                }}
              >
                <Clock size={15} />
                <span>
                  Requiere <strong>24hs de anticipación</strong>
                </span>
              </div>
            )}

            {/* Controles de Compra Responsive */}
            {!sinStock && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #b7996b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#fdfbf8',
                    height: '42px',
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    style={{
                      width: '36px',
                      height: '100%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      color: '#334c2b',
                      fontWeight: 700,
                    }}
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span
                    style={{
                      width: '32px',
                      textAlign: 'center',
                      fontWeight: 800,
                      color: '#334c2b',
                      fontSize: '0.95rem',
                    }}
                  >
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.min(99, c + 1))}
                    style={{
                      width: '36px',
                      height: '100%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      color: '#334c2b',
                      fontWeight: 700,
                    }}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAgregar}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '0.65rem 1rem',
                    backgroundColor: agregado ? '#2e7d32' : '#f46e15',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    transition: 'background-color 0.2s, transform 0.1s',
                    height: '42px',
                    minHeight: '42px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 6px rgba(244,110,21,0.3)',
                    whiteSpace: 'nowrap',
                  }}
                  aria-label={`Agregar ${cantidad} al carrito`}
                >
                  {agregado ? (
                    <>
                      <Check size={18} /> ¡Agregado!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} /> Agregar al carrito
                    </>
                  )}
                </button>
              </div>
            )}

            {sinStock && (
              <div>
                <a
                  href={`https://wa.me/595984589845?text=${encodeURIComponent(
                    `¡Hola PanFree! 🍞 Me gustaría encargar:\n*${producto.nombre}*\n¿Podrían decirme disponibilidad? ¡Gracias!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#334c2b',
                    color: '#eee6d9',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    border: '1.5px solid #b7996b',
                  }}
                >
                  ✉️ Quiero encargar este producto por WhatsApp
                </a>
              </div>
            )}

            {/* Acciones de Compartir */}
            <div
              style={{
                borderTop: '1px solid #e8ddd0',
                paddingTop: '0.85rem',
                display: 'flex',
                gap: '0.4rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>Compartir:</span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${producto.nombre} ${promoActiva ? `(🔥 Oferta ${formatGs(precioPromo)})` : ''} — PanFree\nhttps://panfree.fit/producto/${producto.slug}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#25d366',
                  color: '#fff',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <Share2 size={13} /> WhatsApp
              </a>
              <button
                onClick={handleCopiarLink}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#334c2b',
                  color: '#eee6d9',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <Copy size={13} /> {copiado ? '¡Copiado!' : 'Copiar enlace'}
              </button>
            </div>

            {/* Información de Delivery */}
            <div
              style={{
                backgroundColor: '#eee6d9',
                borderRadius: '8px',
                padding: '0.75rem 0.85rem',
                fontSize: '0.82rem',
                color: '#334c2b',
                lineHeight: 1.5,
              }}
            >
              🚚 <strong>Delivery</strong> en Encarnación y Gran Encarnación
              <br />
              🎁 <strong>Envío gratis</strong> en compras superiores a Gs. 50.000
            </div>
          </div>
        </div>
      </div>

      {/* ── Productos Relacionados ── */}
      {relacionados.length > 0 && (
        <section style={{ marginTop: '2.5rem' }}>
          <h2 style={{ color: '#334c2b', fontSize: '1.2rem', margin: '0 0 1rem', fontWeight: 800 }}>
            También te puede gustar
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {relacionados.map((r) => {
              const rPromoActiva = isPromoVigente(r)
              const rPrecioBase = Number(r.precio_venta || r.precio || 0)
              const rPrecioPromo = Number(r.precio_promocion || 0)

              return (
                <a
                  key={r.id}
                  href={`/producto/${r.slug}`}
                  style={{
                    textDecoration: 'none',
                    backgroundColor: '#fff',
                    border: '1px solid #e0d5c5',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#f5f0e8',
                      aspectRatio: '1',
                      position: 'relative',
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  >
                    {resolveProductImageUrl(r) ? (
                      <Image
                        src={resolveProductImageUrl(r)}
                        alt={r.imagen_alt || r.nombre}
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={28} color="#334c2b" />
                      </div>
                    )}

                    {rPromoActiva && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '12px',
                        }}
                      >
                        🔥 Oferta
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '0.6rem' }}>
                    <p style={{ margin: '0 0 0.25rem', color: '#334c2b', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.25 }}>
                      {r.nombre}
                    </p>
                    {rPromoActiva ? (
                      <div>
                        <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.75rem', marginRight: '4px' }}>
                          {formatGs(rPrecioBase)}
                        </span>
                        <strong style={{ color: '#dc2626', fontSize: '0.9rem' }}>{formatGs(rPrecioPromo)}</strong>
                      </div>
                    ) : (
                      <strong style={{ color: '#334c2b', fontSize: '0.9rem' }}>{formatGs(rPrecioBase)}</strong>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* Volver */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            backgroundColor: '#334c2b',
            color: '#eee6d9',
            border: 'none',
            padding: '0.65rem 1.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          ← Ver todos los productos
        </button>
      </div>
    </div>
  )
}

const timerBoxStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #fecdd3',
  borderRadius: '6px',
  padding: '2px 5px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  minWidth: '30px',
}

const timerNumStyle = {
  fontSize: '0.85rem',
  fontWeight: 800,
  color: '#9f1239',
  lineHeight: 1,
}

const timerLabelStyle = {
  fontSize: '0.58rem',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
}
