/**
 * 📁 UBICACIÓN: src/app/producto/[slug]/ProductoCliente.js
 * 📅 ACTUALIZADO: 2026-08-27
 * 📌 CAMBIOS:
 *  - Sistema de Promociones con Temporizador en tiempo real (días, horas, minutos, segundos).
 *  - Formato de Guaraníes unificado con "Gs." (~~Gs. 50.000~~ Gs. 40.000 AHORRAS Gs. 10.000).
 *  - Actualización automática de estado cuando expira el temporizador.
 *  - Carrusel de imágenes con soporte de galería múltiple.
 *  - Badge "Sin Gluten" con WheatOff y "Destacado" con Star.
 */

'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { WheatOff, Star, Timer, Tag, Clock, ShoppingCart, Check, Share2, Copy } from 'lucide-react'
import { useCart } from '../../../context/CartContext'

export const formatGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`

const CATEGORIA_LABEL = {
  panes: '🍞 Panes',
  dulces: '🍰 Dulces',
  salados: '🧀 Salados',
  eventos: '🎉 Eventos',
}

/**
 * Valida si la promoción del producto está vigente en el instante actual
 */
function isPromoVigente(producto) {
  if (!producto || !producto.en_promocion) return false
  const base = Number(producto.precio_venta ?? producto.precio ?? 0)
  const promo = Number(producto.precio_promocion ?? 0)
  if (promo <= 0 || promo >= base) return false

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

// ─────────────────────────────────────────────
// Carrusel — fade crossfade, flechas, puntos, swipe
// ─────────────────────────────────────────────
function CarruselImagenes({ imagenes, nombre, imagenAlt }) {
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const touchStartX = useRef(null)
  const total = imagenes.length

  const irA = useCallback(
    (i) => {
      setIndice(((i % total) + total) % total)
    },
    [total]
  )

  const siguiente = useCallback(() => irA(indice + 1), [indice, irA])
  const anterior = useCallback(() => irA(indice - 1), [indice, irA])

  useEffect(() => {
    if (total <= 1 || pausado) return
    const t = setTimeout(siguiente, 4000)
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
      style={{ userSelect: 'none' }}
    >
      <div
        style={{
          backgroundColor: '#f5f0e8',
          borderRadius: '12px',
          border: '2px solid #b7996b',
          overflow: 'hidden',
          aspectRatio: '1',
          position: 'relative',
        }}
      >
        {imagenes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '5rem' }}>🍞</span>
          </div>
        )}

        {imagenes.map((src, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: i === indice ? 1 : 0,
              transition: 'opacity 0.65s ease-in-out',
              pointerEvents: i === indice ? 'auto' : 'none',
            }}
          >
            <Image
              src={src}
              alt={i === 0 ? imagenAlt || nombre : `${nombre} — foto ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority={i === 0}
            />
          </div>
        ))}

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
              backgroundColor: 'rgba(0,0,0,0.45)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.2rem 0.55rem',
              borderRadius: '20px',
              zIndex: 2,
              backdropFilter: 'blur(4px)',
            }}
          >
            {indice + 1} / {total}
          </div>
        )}
      </div>

      {total > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '0.75rem' }}>
          {imagenes.map((_, i) => (
            <button
              key={i}
              onClick={() => irA(i)}
              aria-label={`Ver imagen ${i + 1}`}
              style={{
                width: i === indice ? '22px' : '8px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                padding: 0,
                backgroundColor: i === indice ? '#f46e15' : '#b7996b',
                opacity: i === indice ? 1 : 0.5,
                cursor: 'pointer',
                transition: 'width 0.35s ease, background-color 0.35s ease',
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
    [lado]: '0.6rem',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '36px',
    height: '36px',
    backgroundColor: 'rgba(255,255,255,0.88)',
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    zIndex: 2,
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
    if (!producto?.en_promocion || !producto?.precio_promocion) {
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
        const ahora = new Date().getTime()
        const fin = new Date(producto.fecha_fin_promo).getTime()
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

  const imagenes = [
    ...(producto?.imagen_url ? [producto.imagen_url] : []),
    ...(Array.isArray(producto?.imagenes_urls) ? producto.imagenes_urls.filter(Boolean) : []),
  ]

  const sinStock = !disponible

  const precioBase = Number(producto?.precio_venta ?? producto?.precio ?? 0)
  const precioPromo = Number(producto?.precio_promocion ?? 0)
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
      imagen_url: producto.imagen_url || (Array.isArray(producto.imagenes_urls) ? producto.imagenes_urls[0] : '') || '',
      cantidad,
      subtotal: precioUnitario * cantidad,
      categoria: producto.categoria || '',
      unidad_medida: producto.unidad_medida || null,
    })
    showToast?.(`${producto.nombre} agregado al carrito`)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  const handleCopiarLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  if (!producto) return null

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem', fontFamily: '"Segoe UI", sans-serif' }}>
      {/* Breadcrumb */}
      <nav
        style={{
          fontSize: '0.85rem',
          color: '#888',
          marginBottom: '1.5rem',
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
            fontSize: '0.85rem',
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
            fontSize: '0.85rem',
            padding: 0,
          }}
        >
          {CATEGORIA_LABEL[producto.categoria] || producto.categoria}
        </button>
        <span>›</span>
        <span style={{ color: '#555', fontWeight: 600 }}>{producto.nombre}</span>
      </nav>

      {/* ── Contenido Principal ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem',
        }}
      >
        {/* Columna Izquierda: Carrusel */}
        <div style={{ position: 'relative' }}>
          <CarruselImagenes imagenes={imagenes} nombre={producto.nombre} imagenAlt={producto.imagen_alt} />

          {/* Badges Flotantes sobre la Imagen */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              zIndex: 3,
            }}
          >
            {promoActiva && (
              <span
                style={{
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(220,38,38,0.35)',
                }}
              >
                🔥 OFERTA -{porcentajeDescuento}%
              </span>
            )}
            {(producto.is_featured || producto.destacado) && (
              <span
                style={{
                  backgroundColor: '#f46e15',
                  color: '#fff',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Star size={14} fill="currentColor" /> Destacado
              </span>
            )}
            <span
              style={{
                backgroundColor: '#334c2b',
                color: '#eee6d9',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                border: '1px solid #b7996b',
              }}
            >
              <WheatOff size={15} color="#f7d875" /> Sin Gluten
            </span>
          </div>
        </div>

        {/* Columna Derecha: Información del Producto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <span
              style={{
                fontSize: '0.85rem',
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
                margin: '0.35rem 0 0 0',
                color: '#334c2b',
                fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
                lineHeight: 1.2,
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
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#9f1239', fontWeight: 800, fontSize: '0.85rem' }}>
                <Timer size={18} color="#e11d48" className="animate-pulse" />
                <span>¡OFERTA POR TIEMPO LIMITADO!</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#4b5563' }}>Termina en:</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
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
              padding: '1rem',
            }}
          >
            {promoActiva ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.25rem', color: '#9ca3af', textDecoration: 'line-through', fontWeight: 600 }}>
                    {formatGs(precioBase)}
                  </span>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>
                    {formatGs(precioPromo)}
                  </span>
                  {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
                    <span style={{ fontSize: '0.95rem', color: '#666', fontWeight: 600 }}>/ {producto.unidad_medida}</span>
                  )}
                </div>

                {ahorroGs > 0 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      marginTop: '0.5rem',
                      border: '1px solid #fecaca',
                    }}
                  >
                    <Tag size={15} /> AHORRAS {formatGs(ahorroGs)} ({porcentajeDescuento}% OFF)
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#334c2b', lineHeight: 1 }}>
                  {formatGs(precioBase)}
                </span>
                {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
                  <span style={{ fontSize: '0.95rem', color: '#666', fontWeight: 600 }}>/ {producto.unidad_medida}</span>
                )}
              </div>
            )}

            {producto.precio_mayorista && (
              <div style={{ marginTop: '0.6rem' }}>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: '#334c2b',
                    backgroundColor: '#eee6d9',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
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
                lineHeight: 1.7,
                fontSize: '0.95rem',
                margin: 0,
                padding: '1rem',
                backgroundColor: '#f9f6f1',
                borderRadius: '8px',
                borderLeft: '4px solid #b7996b',
              }}
            >
              {producto.descripcion}
            </p>
          )}

          {/* Disponibilidad */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: sinStock ? '#c62828' : '#2e7d32',
                flexShrink: 0,
              }}
            />
            <span style={{ color: sinStock ? '#c62828' : '#2e7d32', fontWeight: 700 }}>
              {sinStock ? 'No disponible por el momento' : 'Disponible · Fabricado por pedido artesanal'}
            </span>
          </div>

          {/* Aviso de anticipación */}
          {!sinStock && requiereAnticipacion && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#fff8e1',
                border: '1px solid #ffe082',
                borderRadius: '6px',
                padding: '0.5rem 0.85rem',
                fontSize: '0.85rem',
                color: '#5d4037',
                fontWeight: '600',
              }}
            >
              <Clock size={16} />
              <span>
                Este producto requiere <strong>24hs de anticipación</strong> para su preparación
              </span>
            </div>
          )}

          {/* Controles de Compra */}
          {!sinStock && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '2px solid #b7996b',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#fdfbf8',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  style={{
                    width: '42px',
                    height: '46px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#334c2b',
                    fontWeight: 700,
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    width: '42px',
                    textAlign: 'center',
                    fontWeight: 800,
                    color: '#334c2b',
                    fontSize: '1.05rem',
                  }}
                >
                  {cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.min(99, c + 1))}
                  style={{
                    width: '42px',
                    height: '46px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#334c2b',
                    fontWeight: 700,
                  }}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAgregar}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: agregado ? '#2e7d32' : '#f46e15',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  transition: 'background-color 0.2s, transform 0.1s',
                  minHeight: '46px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 3px 8px rgba(244,110,21,0.35)',
                }}
              >
                {agregado ? (
                  <>
                    <Check size={20} /> ¡Agregado al carrito!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} /> Agregar al carrito
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
                  padding: '0.85rem 1.5rem',
                  backgroundColor: '#334c2b',
                  color: '#eee6d9',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: '2px solid #b7996b',
                }}
              >
                ✉️ Quiero encargar este producto por WhatsApp
              </a>
              <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.5rem', textAlign: 'center' }}>
                Te contactamos para producirlo especialmente 🍞
              </p>
            </div>
          )}

          {/* Acciones de Compartir */}
          <div
            style={{
              borderTop: '1px solid #e8ddd0',
              paddingTop: '1rem',
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 600 }}>Compartir:</span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${producto.nombre} ${promoActiva ? `(🔥 Oferta ${formatGs(precioPromo)})` : ''} — PanFree\nhttps://panfree.fit/producto/${producto.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#25d366',
                color: '#fff',
                padding: '0.4rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Share2 size={14} /> WhatsApp
            </a>
            <button
              onClick={handleCopiarLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#334c2b',
                color: '#eee6d9',
                padding: '0.4rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Copy size={14} /> {copiado ? '¡Copiado!' : 'Copiar enlace'}
            </button>
          </div>

          {/* Información de Delivery */}
          <div
            style={{
              backgroundColor: '#eee6d9',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              fontSize: '0.85rem',
              color: '#334c2b',
              lineHeight: 1.6,
            }}
          >
            🚚 <strong>Delivery</strong> en Encarnación y Gran Encarnación
            <br />
            🎁 <strong>Envío gratis</strong> en compras superiores a Gs. 50.000
            <br />
            📞 Consultas: <strong>+595 984 589845</strong>
          </div>
        </div>
      </div>

      {/* ── Productos Relacionados ── */}
      {relacionados.length > 0 && (
        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ color: '#334c2b', fontSize: '1.3rem', margin: '0 0 1.25rem', fontWeight: 800 }}>
            También te puede gustar
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
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
                    border: '1.5px solid #e0d5c5',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    display: 'block',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = '#b7996b')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e0d5c5')}
                >
                  <div
                    style={{
                      backgroundColor: '#f5f0e8',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {r.imagen_url ? (
                      <Image
                        src={r.imagen_url}
                        alt={r.imagen_alt || r.nombre}
                        fill
                        sizes="200px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '2.5rem' }}>🍞</span>
                    )}

                    {rPromoActiva && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '12px',
                        }}
                      >
                        🔥 Oferta
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '0.75rem' }}>
                    <p style={{ margin: '0 0 0.3rem', color: '#334c2b', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>
                      {r.nombre}
                    </p>
                    {rPromoActiva ? (
                      <div>
                        <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.78rem', marginRight: '4px' }}>
                          {formatGs(rPrecioBase)}
                        </span>
                        <strong style={{ color: '#dc2626', fontSize: '0.95rem' }}>{formatGs(rPrecioPromo)}</strong>
                      </div>
                    ) : (
                      <strong style={{ color: '#334c2b', fontSize: '0.95rem' }}>{formatGs(rPrecioBase)}</strong>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* Volver */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            backgroundColor: '#334c2b',
            color: '#eee6d9',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '0.95rem',
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
  padding: '2px 6px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  minWidth: '32px',
}

const timerNumStyle = {
  fontSize: '0.9rem',
  fontWeight: 800,
  color: '#9f1239',
  lineHeight: 1,
}

const timerLabelStyle = {
  fontSize: '0.62rem',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
}
