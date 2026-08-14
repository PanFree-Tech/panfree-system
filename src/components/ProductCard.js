/**
 * 📁 UBICACIÓN: src/components/ProductCard.js
 * 📅 ACTUALIZADO: 2026-08-14 — badge Sin TACC visible + debug log
 */
'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const WA_NUMBER = '595984589845'

function CarruselCard({ imagenes, nombre, imagenAlt }) {
  const [indice, setIndice]   = useState(0)
  const [pausado, setPausado] = useState(false)
  const total                 = imagenes.length

  const siguiente = useCallback(() => {
    setIndice(i => (i + 1) % total)
  }, [total])

  useEffect(() => {
    if (total <= 1 || pausado) return
    const t = setTimeout(siguiente, 3000)
    return () => clearTimeout(t)
  }, [indice, pausado, total, siguiente])

  return (
    <div
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      style={{
        width: '100%', height: '200px',
        backgroundColor: '#f5f5f5', borderRadius: '4px',
        marginBottom: '1rem', overflow: 'hidden',
        position: 'relative',
      }}
    >
      {imagenes.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#999' }}>🍞 Sin imagen</span>
        </div>
      )}

      {imagenes.map((src, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          opacity: i === indice ? 1 : 0,
          transition: 'opacity 0.7s ease-in-out',
          pointerEvents: i === indice ? 'auto' : 'none',
        }}>
          <Image
            src={src}
            alt={i === 0 ? (imagenAlt || nombre) : `${nombre} — foto ${i + 1}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 300px"
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            priority={i === 0}
          />
        </div>
      ))}

      {/* Puntos discretos — solo con 2+ imágenes */}
      {total > 1 && (
        <div style={{
          position: 'absolute', bottom: '0.5rem', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: '0.3rem',
          zIndex: 2,
        }}>
          {imagenes.map((_, i) => (
            <div key={i} style={{
              width: i === indice ? '16px' : '6px',
              height: '6px', borderRadius: '3px',
              backgroundColor: '#fff',
              opacity: i === indice ? 0.95 : 0.5,
              transition: 'width 0.35s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductCard({ producto, onAddToCart, disponible = true, requiereAnticipacion = false }) {
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    console.log('[ProductCard] render producto:', producto?.id, producto?.nombre)
  }, [producto])

  if (!producto) return null

  const agotado = !disponible

  const imagenes = [
    ...(producto.imagen_url ? [producto.imagen_url] : []),
    ...(Array.isArray(producto.imagenes_urls) ? producto.imagenes_urls.filter(Boolean) : []),
  ]

  const manejarAgregar = () => {
    if (agotado) return
    onAddToCart({ ...producto, cantidad, subtotal: producto.precio_venta * cantidad })
    setCantidad(1)
  }

  const manejarPedidoEspecial = () => {
    const msg = encodeURIComponent(
      `¡Hola PanFree! 🍞 Me gustaría encargar el siguiente producto:\n\n` +
      `*Producto:* ${producto.nombre}\n*Categoría:* ${producto.categoria}\n` +
      `*Precio:* ₲ ${producto.precio_venta?.toLocaleString('es-PY')}\n\n` +
      `¿Podrían decirme disponibilidad y tiempo estimado de producción? ¡Gracias!`
    )
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

  const slugUrl = producto?.slug ? `/producto/${producto.slug}` : null

  return (
    <div className="product-card" style={{
      border: '2px solid #b7996b', borderRadius: '8px', padding: '1.5rem',
      maxWidth: '100%', textAlign: 'center',
      boxShadow: '0 2px 8px rgba(62,39,35,0.1)', backgroundColor: '#ffffff',
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
      transition: 'opacity 0.2s',
      position: 'relative',
    }}>

      {/* Badge Sin TACC */}
      {producto?.certificado_tacc && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: '#fff7e6', border: '1px solid #ffd966', padding: '6px 10px', borderRadius: 18, fontWeight: 700, fontSize: '0.8rem' }}>
          ✅ Sin TACC
        </div>
      )}

      <a href={slugUrl || '#'} style={{ display: 'block', textDecoration: 'none' }}>
        <CarruselCard imagenes={imagenes} nombre={producto.nombre} imagenAlt={producto.imagen_alt} />
      </a>

      {slugUrl ? (
        <a href={slugUrl} style={{ textDecoration: 'none' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#334c2b', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={e  => e.currentTarget.style.textDecoration = 'none'}>
            {producto.nombre}
          </h3>
        </a>
      ) : (
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#334c2b', fontSize: '1.1rem', fontWeight: '600' }}>{producto.nombre}</h3>
      )}

      <p style={{ margin: '0 0 0.5rem 0', color: '#8f9a44', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{producto.categoria}</p>
      <p style={{ margin: '0 0 1rem 0', color: '#334c2b', fontSize: '0.9rem', lineHeight: '1.4', opacity: 0.9 }}>{producto.descripcion}</p>
      <p style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 'bold', color: agotado ? '#999' : '#f46e15' }}>
        ₲ {producto.precio_venta?.toLocaleString('es-PY') || '0'}
      </p>
      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: agotado ? '#c62828' : '#2e7d32', fontWeight: '500' }}>
        {agotado ? '❌ No disponible por el momento' : '✅ Disponible · Fabricado por pedido'}
      </p>

      {!agotado && requiereAnticipacion && (
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#5d4037', fontWeight: '600', backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '4px', padding: '0.3rem 0.6rem' }}>
          ⏰ Pedido con 24hs de anticipación
        </p>
      )}
      {(agotado || !requiereAnticipacion) && <div style={{ marginBottom: '0.5rem' }} />}

      {!agotado && (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <button onClick={() => setCantidad(c => Math.max(1, c - 1))} aria-label="Reducir cantidad"
              style={{ width: '44px', height: '44px', border: '2px solid #b7996b', borderRadius: '4px', background: '#f9f5f0', cursor: 'pointer', fontWeight: '700', fontSize: '1.2rem', color: '#334c2b' }}>
              −
            </button>
            <input type="number" min="1" max={99} value={cantidad}
              onChange={e => setCantidad(Math.max(1, Math.min(parseInt(e.target.value) || 1, 99)))}
              style={{ width: '60px', height: '44px', textAlign: 'center', border: '2px solid #b7996b', borderRadius: '4px', fontFamily: 'inherit', fontSize: '16px', backgroundColor: '#fff', color: '#334c2b' }} />
            <button onClick={() => setCantidad(c => Math.min(c + 1, 99))} aria-label="Aumentar cantidad"
              style={{ width: '44px', height: '44px', border: '2px solid #b7996b', borderRadius: '4px', background: '#f9f5f0', cursor: 'pointer', fontWeight: '700', fontSize: '1.2rem', color: '#334c2b' }}>
              +
            </button>
          </div>
          <button onClick={manejarAgregar}
            style={{ width: '100%', minHeight: '48px', padding: '0.75rem', backgroundColor: '#f46e15', color: '#fff', border: '2px solid #d4580f', borderRadius: '6px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
            🛒 Agregar al Carrito
          </button>
        </>
      )}

      {agotado && (
        <div style={{ marginTop: '0.5rem' }}>
          <button onClick={manejarPedidoEspecial}
            style={{ width: '100%', minHeight: '48px', padding: '0.75rem', backgroundColor: '#334c2b', color: '#eee6d9', border: '2px solid #b7996b', borderRadius: '4px', fontSize: '0.95rem', fontWeight: 600 }}>
            ✉️ Quiero encargar este producto
          </button>
          <p style={{ fontSize: '0.75rem', color: '#888', margin: 0, lineHeight: '1.4' }}>Te contactamos para producirlo especialmente 🍞</p>
        </div>
      )}
    </div>
  )
}
