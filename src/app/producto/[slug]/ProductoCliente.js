/**
 * 📁 UBICACIÓN: src/app/producto/[slug]/ProductoCliente.js
 * 📅 ACTUALIZADO: 2026-03-07
 * 📌 CAMBIOS:
 *  - Carrusel de imágenes: imagen_url + imagenes_urls[]
 *  - Auto-avance cada 4 segundos, pausa al hover
 *  - Fade crossfade entre imágenes
 *  - Flechas prev/next + puntos indicadores pill
 *  - Swipe táctil en mobile
 *  - Si solo hay 1 imagen: comportamiento idéntico al original
 */
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '../../../context/CartContext'

const formatPYG = n => `₲ ${Number(n || 0).toLocaleString('es-PY')}`

const CATEGORIA_LABEL = {
  panes   : '🍞 Panes',
  dulces  : '🍰 Dulces',
  salados : '🧀 Salados',
  eventos : '🎉 Eventos',
}

// ─────────────────────────────────────────────
// Carrusel — fade crossfade, flechas, puntos, swipe
// ─────────────────────────────────────────────
function CarruselImagenes({ imagenes, nombre, imagenAlt }) {
  const [indice, setIndice]     = useState(0)
  const [pausado, setPausado]   = useState(false)
  const touchStartX             = useRef(null)
  const total                   = imagenes.length

  const irA = useCallback((i) => {
    setIndice(((i % total) + total) % total)
  }, [total])

  const siguiente = useCallback(() => irA(indice + 1), [indice, irA])
  const anterior  = useCallback(() => irA(indice - 1), [indice, irA])

  // Auto-avance — solo con 2+ imágenes
  useEffect(() => {
    if (total <= 1 || pausado) return
    const t = setTimeout(siguiente, 4000)
    return () => clearTimeout(t)
  }, [indice, pausado, total, siguiente])

  // Swipe táctil
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
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
      {/* Contenedor imagen */}
      <div style={{
        backgroundColor: '#f5f0e8',
        borderRadius: '12px',
        border: '2px solid #b7996b',
        overflow: 'hidden',
        aspectRatio: '1',
        position: 'relative',
      }}>
        {imagenes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '5rem' }}>🍞</span>
          </div>
        )}

        {imagenes.map((src, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            opacity: i === indice ? 1 : 0,
            transition: 'opacity 0.65s ease-in-out',
            pointerEvents: i === indice ? 'auto' : 'none',
          }}>
            <Image
              src={src}
              alt={i === 0 ? (imagenAlt || nombre) : `${nombre} — foto ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority={i === 0}
            />
          </div>
        ))}

        {/* Flechas */}
        {total > 1 && (
          <>
            <button onClick={anterior} aria-label="Imagen anterior" style={estiloFlecha('left')}>‹</button>
            <button onClick={siguiente} aria-label="Imagen siguiente" style={estiloFlecha('right')}>›</button>
          </>
        )}

        {/* Contador top-right */}
        {total > 1 && (
          <div style={{
            position: 'absolute', top: '0.6rem', right: '0.6rem',
            backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff',
            fontSize: '0.72rem', fontWeight: 600,
            padding: '0.2rem 0.55rem', borderRadius: '20px',
            zIndex: 2, backdropFilter: 'blur(4px)',
          }}>
            {indice + 1} / {total}
          </div>
        )}
      </div>

      {/* Puntos indicadores pill */}
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
                border: 'none', padding: 0,
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
    position: 'absolute', [lado]: '0.6rem', top: '50%',
    transform: 'translateY(-50%)',
    width: '36px', height: '36px',
    backgroundColor: 'rgba(255,255,255,0.88)',
    border: '1px solid #b7996b', borderRadius: '50%',
    cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700,
    color: '#334c2b', lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    zIndex: 2, backdropFilter: 'blur(4px)',
    transition: 'background-color 0.2s',
  }
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function PaginaProductoCliente({ producto, relacionados, disponible = true, requiereAnticipacion = false }) {
  const router = useRouter()
  const { agregarAlCarrito } = useCart()
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  // Array completo: imagen principal + galería adicional
  const imagenes = [
    ...(producto.imagen_url ? [producto.imagen_url] : []),
    ...(Array.isArray(producto.imagenes_urls) ? producto.imagenes_urls.filter(Boolean) : []),
  ]

  const sinStock = !disponible

  function handleAgregar() {
    if (sinStock) return
    for (let i = 0; i < cantidad; i++) agregarAlCarrito(producto)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem', fontFamily: '"Segoe UI", sans-serif' }}>

      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: '#334c2b', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', padding: 0, fontWeight: 600 }}>
          🏠 Inicio
        </button>
        <span>›</span>
        <button onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: '#334c2b', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', padding: 0 }}>
          {CATEGORIA_LABEL[producto.categoria] || producto.categoria}
        </button>
        <span>›</span>
        <span style={{ color: '#555' }}>{producto.nombre}</span>
      </nav>

      {/* ── Contenido principal ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>

        {/* Carrusel */}
        <div style={{ position: 'relative' }}>
          <CarruselImagenes
            imagenes={imagenes}
            nombre={producto.nombre}
            imagenAlt={producto.imagen_alt}
          />
          {/* Badges sobre el carrusel */}
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', zIndex: 3 }}>
            {producto.is_featured && (
              <span style={{ backgroundColor: '#f46e15', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                ⭐ Destacado
              </span>
            )}
            <span style={{ backgroundColor: '#334c2b', color: '#eee6d9', padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
              🌾 Sin Gluten
            </span>
          </div>
        </div>

        {/* Info del producto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <span style={{ fontSize: '0.85rem', color: '#8c9937', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {CATEGORIA_LABEL[producto.categoria] || producto.categoria}
          </span>

          <h1 style={{ margin: 0, color: '#334c2b', fontSize: 'clamp(1.4rem, 4vw, 2rem)', lineHeight: 1.2, fontWeight: 800 }}>
            {producto.nombre}
          </h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800, color: '#f46e15' }}>
              {formatPYG(producto.precio_venta)}
            </span>
            {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
              <span style={{ fontSize: '0.9rem', color: '#888' }}>por {producto.unidad_medida}</span>
            )}
            {producto.precio_mayorista && (
              <span style={{ fontSize: '0.85rem', color: '#334c2b', backgroundColor: '#eee6d9', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 600 }}>
                Mayorista: {formatPYG(producto.precio_mayorista)}
              </span>
            )}
          </div>

          {producto.descripcion && (
            <p style={{ color: '#555', lineHeight: 1.7, fontSize: '0.95rem', margin: 0, padding: '1rem', backgroundColor: '#f9f6f1', borderRadius: '8px', borderLeft: '3px solid #b7996b' }}>
              {producto.descripcion}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: sinStock ? '#c62828' : '#2e7d32', flexShrink: 0 }} />
            <span style={{ color: sinStock ? '#c62828' : '#2e7d32', fontWeight: 600 }}>
              {sinStock ? 'No disponible por el momento' : 'Disponible · Fabricado por pedido'}
            </span>
          </div>

          {!sinStock && requiereAnticipacion && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: '#fff8e1', border: '1px solid #ffe082',
              borderRadius: '6px', padding: '0.5rem 0.85rem',
              fontSize: '0.85rem', color: '#5d4037', fontWeight: '600',
            }}>
              <span>⏰</span>
              <span>Este producto requiere <strong>24hs de anticipación</strong> para su preparación</span>
            </div>
          )}

          {!sinStock && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #b7996b', borderRadius: '8px', overflow: 'hidden' }}>
                <button onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  style={{ width: '40px', height: '44px', border: 'none', backgroundColor: '#f9f6f1', cursor: 'pointer', fontSize: '1.2rem', color: '#334c2b', fontWeight: 700 }}>−</button>
                <span style={{ width: '40px', textAlign: 'center', fontWeight: 700, color: '#334c2b', fontSize: '1rem' }}>{cantidad}</span>
                <button onClick={() => setCantidad(c => Math.min(99, c + 1))}
                  style={{ width: '40px', height: '44px', border: 'none', backgroundColor: '#f9f6f1', cursor: 'pointer', fontSize: '1.2rem', color: '#334c2b', fontWeight: 700 }}>+</button>
              </div>
              <button onClick={handleAgregar}
                style={{
                  flex: 1, minWidth: '180px', padding: '0.75rem 1.5rem',
                  backgroundColor: agregado ? '#2e7d32' : '#f46e15',
                  color: '#fff', border: '2px solid', borderColor: agregado ? '#1b5e20' : '#d4580f',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                  fontSize: '1rem', transition: 'background-color 0.2s', minHeight: '44px',
                  boxShadow: '0 2px 6px rgba(244,110,21,0.3)',
                }}>
                {agregado ? '✅ Agregado al carrito' : '🛒 Agregar al carrito'}
              </button>
            </div>
          )}

          {sinStock && (
            <div>
              <a
                href={`https://wa.me/595984589845?text=${encodeURIComponent(`¡Hola PanFree! 🍞 Me gustaría encargar:\n*${producto.nombre}*\n¿Podrían decirme disponibilidad? ¡Gracias!`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center',
                  padding: '0.75rem 1.5rem', backgroundColor: '#334c2b',
                  color: '#eee6d9', borderRadius: '8px', textDecoration: 'none',
                  fontWeight: 700, fontSize: '0.95rem', border: '2px solid #b7996b',
                }}>
                ✉️ Quiero encargar este producto
              </a>
              <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.5rem', textAlign: 'center' }}>
                Te contactamos para producirlo especialmente 🍞
              </p>
            </div>
          )}

<div style={{ borderTop: '1px solid #e8ddd0', paddingTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
  <span style={{ fontSize: '0.85rem', color: '#888' }}>Compartir:</span>
  <a
    href={`https://wa.me/?text=${encodeURIComponent(producto.nombre + ' — PanFree\nhttps://panfree.fit/producto/' + producto.slug)}`}
    target="_blank" rel="noopener noreferrer"
    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#25d366', color: '#fff', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.857-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"/></svg>
    WhatsApp
  </a>
  <button
    onClick={() => { navigator.clipboard?.writeText('https://panfree.fit/producto/' + producto.slug); alert('¡Link copiado!') }}
    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#334c2b', color: '#eee6d9', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
    Copiar link
  </button>
</div>

          <div style={{ backgroundColor: '#eee6d9', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#334c2b', lineHeight: 1.6 }}>
            🚚 <strong>Delivery</strong> en Encarnación y Gran Encarnación<br/>
            🎁 <strong>Envío gratis</strong> en compras superiores a ₲ 50.000<br/>
            📞 Consultas: <strong>+595 984 589845</strong>
          </div>
        </div>
      </div>

      {/* ── Productos relacionados ── */}
      {relacionados.length > 0 && (
        <section>
          <h2 style={{ color: '#334c2b', fontSize: '1.2rem', margin: '0 0 1.25rem', fontWeight: 700 }}>
            También te puede gustar
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {relacionados.map(r => (
              <a key={r.id} href={`/producto/${r.slug}`}
                style={{ textDecoration: 'none', backgroundColor: '#fff', border: '2px solid #e0d5c5', borderRadius: '8px', overflow: 'hidden', display: 'block' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#b7996b'}
                onMouseOut={e  => e.currentTarget.style.borderColor = '#e0d5c5'}>
                <div style={{ backgroundColor: '#f5f0e8', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {r.imagen_url
                    ? <Image src={r.imagen_url} alt={r.imagen_alt || r.nombre} fill sizes="200px" style={{ objectFit: 'cover' }} />
                    : <span style={{ fontSize: '2.5rem' }}>🍞</span>
                  }
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <p style={{ margin: '0 0 0.3rem', color: '#334c2b', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{r.nombre}</p>
                  <p style={{ margin: 0, color: '#f46e15', fontWeight: 800, fontSize: '0.95rem' }}>{formatPYG(r.precio_venta)}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Volver */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <button onClick={() => router.push('/')}
          style={{ backgroundColor: '#334c2b', color: '#eee6d9', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.95rem' }}>
          ← Ver todos los productos
        </button>
      </div>
    </div>
  )
}