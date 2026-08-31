/**
UBICACION: src/app/TiendaCliente.js
CREADO: 2026-03-06
DESCRIPCION:
Client Component con Hero de alta conversión, badges de confianza,
búsqueda en tiempo real y filtros ordenados sin desorden visual.
✅ ELIMINADA sección de testimonios (eran falsos). Los enlaces a redes ya están en header/footer.
*/
'use client'
import React, { useState, useMemo, useEffect } from 'react'
import {
  Sparkles,
  WheatOff,
  Croissant,      // ✅ Pan (sin gluten)
  ChefHat,        // ✅ Chef (artesanal)
  CakeSlice,
  Sandwich,
  PartyPopper,
  ShieldCheck,
  Truck,
  Search,
  X,
  Gift,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAnalytics } from '../hooks/useAnalytics' // ← NUEVO: import de useAnalytics
import ProductCard from '../components/ProductCard'

const CATEGORIAS = [
  { id: 'todos', label: 'Todos', Icon: Sparkles },
  { id: 'panes', label: 'Panes', Icon: Croissant },  // ✅ Pan en lugar de trigo
  { id: 'dulces', label: 'Dulces', Icon: CakeSlice },
  { id: 'salados', label: 'Salados', Icon: Sandwich },
  { id: 'eventos', label: 'Eventos', Icon: PartyPopper },
]

export default function TiendaCliente({ productos = [], disponibilidad = {}, configuracion = null }) {
  const [categoriaActiva, setCategoriaActiva] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const { agregarAlCarrito } = useCart()
  const { viewItemList, selectItem } = useAnalytics() // ← NUEVO: hook de analytics

  // Filtro combinado de categoría y texto de búsqueda
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchCategoria =
        categoriaActiva === 'todos' ||
        p.categoria?.toLowerCase() === categoriaActiva.toLowerCase()

      const matchBusqueda =
        !busqueda.trim() ||
        p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.categoria?.toLowerCase().includes(busqueda.toLowerCase())

      return matchCategoria && matchBusqueda
    })
  }, [productos, categoriaActiva, busqueda])

  // Producto destacado para el hero si existe
  const productoHero = useMemo(() => {
    return productos.find(p => p.is_featured || p.destacado) || productos[0] || null
  }, [productos])

  // GA4: view_item_list cada vez que cambia el listado filtrado (categoría/búsqueda)
  useEffect(() => {
    if (productosFiltrados.length > 0) {
      const nombreLista = categoriaActiva === 'todos'
        ? 'Catálogo completo'
        : `Categoría: ${categoriaActiva}`
      viewItemList(productosFiltrados, nombreLista)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productosFiltrados, categoriaActiva])

  const bannerImg = configuracion?.banner_url
  const bannerTitulo = configuracion?.banner_titulo || 'Panificados y Repostería 100% Sin Gluten'
  const bannerSubtitulo = configuracion?.banner_subtitulo || 'Elaboración artesanal en Encarnación con ingredientes seleccionados y la máxima seguridad para celíacos.'

  return (
    <div className="page-container" id="catalogo">
      {/* ============================================================ */}
      {/* 1. HERO / BANNER SECTION ORDENADO Y DE ALTA CONVERSIÓN */}
      {/* ============================================================ */}
      <section
        id="hero-section"
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          padding: bannerImg ? '3rem 1.5rem' : '2rem 1.5rem',
          marginBottom: '2rem',
          border: '1px solid #e0d5c5',
          boxShadow: '0 2px 8px rgba(51, 76, 43, 0.06)',
          backgroundColor: '#fdfbf8',
          ...(bannerImg ? {
            backgroundImage: `linear-gradient(rgba(20, 30, 15, 0.65), rgba(20, 30, 15, 0.75)), url(${bannerImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#ffffff',
          } : {}),
        }}
      >
        <div
          style={{
            maxWidth: '850px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Badge Destacado 100% Sin Gluten */}
          <div
            id="hero-gluten-free-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: bannerImg ? 'rgba(255,255,255,0.2)' : '#334c2b',
              color: '#eee6d9',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '24px',
              border: '1px solid #b7996b',
              marginBottom: '1rem',
              letterSpacing: '0.3px',
              backdropFilter: bannerImg ? 'blur(4px)' : 'none',
            }}
          >
            <WheatOff size={16} /> 100% Sin Gluten
          </div>
          {/* Título Principal */}
          <h1
            className="hero-title"
            style={{
              margin: '0 0 0.75rem 0',
              color: bannerImg ? '#ffffff' : '#334c2b',
              fontWeight: 800,
              lineHeight: 1.25,
              textShadow: bannerImg ? '0 2px 4px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            {bannerTitulo}
          </h1>
          {/* Subtítulo Conciso */}
          <p
            className="hero-subtitle"
            style={{
              fontSize: '1.05rem',
              color: bannerImg ? '#f0ede6' : '#4a5d3f',
              maxWidth: '580px',
              margin: '0 0 1.5rem 0',
              lineHeight: 1.5,
              textShadow: bannerImg ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {bannerSubtitulo}
          </p>
          {/* Badges de Confianza en Línea Horizontal */}
          <div
            id="trust-badges-row"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.75rem',
              width: '100%',
              paddingTop: '0.5rem',
              borderTop: '1px solid #eee6d9',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #b7996b',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#334c2b',
              }}
            >
              <ShieldCheck size={16} color="#334c2b" /> Apto Celíacos
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #b7996b',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#334c2b',
              }}
            >
              <ChefHat size={16} color="#334c2b" /> Artesanal
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #b7996b',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#334c2b',
              }}
            >
              <Truck size={16} color="#334c2b" /> Delivery Encarnación
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. BÚSQUEDA Y FILTROS ORDENADOS */}
      {/* ============================================================ */}
      <section
        id="catalog-filters-section"
        style={{ marginBottom: '1.5rem' }}
      >
        {/* Barra de búsqueda */}
        <div style={{ marginBottom: '1rem', maxWidth: '500px' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                color: '#8f9a44',
                pointerEvents: 'none',
              }}
            >
              <Search size={18} />
            </span>
            <input
              id="search-products-input"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar panes, dulces, salados..."
              style={{
                width: '100%',
                padding: '0.65rem 2.2rem 0.65rem 2.4rem',
                border: '1px solid #b7996b',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#334c2b',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Chips de Categorías (Sin naranja, 60-30-10 estricto) */}
        <div
          id="category-chips-bar"
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.4rem',
            justifyContent: 'flex-start',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {CATEGORIAS.map((cat) => {
            const activo = cat.id === categoriaActiva
            const IconComponent = cat.Icon
            return (
              <button
                key={cat.id}
                id={`filter-btn-${cat.id}`}
                onClick={() => setCategoriaActiva(cat.id)}
                style={{
                  padding: '0.45rem 1rem',
                  border: activo ? '1.5px solid #334c2b' : '1px solid #d0c5b4',
                  borderRadius: '20px',
                  backgroundColor: activo ? '#334c2b' : '#ffffff',
                  color: activo ? '#eee6d9' : '#334c2b',
                  cursor: 'pointer',
                  fontWeight: activo ? 700 : 600,
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  minHeight: '38px',
                }}
              >
                <IconComponent size={18} color={activo ? '#eee6d9' : '#334c2b'} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. GRILLA DE PRODUCTOS (2 COLUMNAS EN MÓVIL) */}
      {/* ============================================================ */}
      <section className="products-grid" id="products-grid-container">
        {productosFiltrados.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#334c2b',
              gridColumn: '1 / -1',
              padding: '3rem 1rem',
              backgroundColor: '#fdfbf8',
              borderRadius: '8px',
              border: '1px solid #e0d5c5',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Croissant size={32} color="#334c2b" />
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>
              {busqueda
                ? `No se encontraron productos para "${busqueda}".`
                : `No hay productos disponibles en la categoría "${categoriaActiva}".`}
            </p>
            <button
              onClick={() => {
                setCategoriaActiva('todos')
                setBusqueda('')
              }}
              style={{
                marginTop: '0.75rem',
                background: 'none',
                border: '1px solid #334c2b',
                color: '#334c2b',
                padding: '0.4rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          productosFiltrados.map((producto) => {
            const disp = disponibilidad[producto.id]
            return (
              // GA4: select_item al hacer click en cualquier parte de la tarjeta.
              // display:'contents' evita romper el CSS grid (.products-grid).
              <div
                key={producto.id}
                style={{ display: 'contents' }}
                onClickCapture={() => selectItem(producto, categoriaActiva)}
              >
                <ProductCard
                  producto={producto}
                  disponible={disp?.disponible ?? true}
                  requiereAnticipacion={disp?.requiere_anticipacion ?? false}
                  onAddToCart={agregarAlCarrito}
                />
              </div>
            )
          })
        )}
      </section>

      {/* ============================================================ */}
      {/* 4. BANNER INFORMATIVO DE DELIVERY */}
      {/* ============================================================ */}
      <section
        id="home-delivery-info-section"
        style={{
          marginTop: '2.5rem',
          padding: '1.25rem 1.5rem',
          backgroundColor: '#f9f5f0',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #b7996b',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#334c2b', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Truck size={20} color="#334c2b" /> Envíos a Domicilio en Encarnación
        </h3>
        <p style={{ color: '#4a5d3f', marginBottom: '0.4rem', fontSize: '0.9rem', lineHeight: 1.4 }}>
          Entregas en Encarnación y Gran Encarnación. Consultá tiempos y zonas por WhatsApp.
        </p>
        <p style={{ color: '#2e7d32', fontWeight: 700, fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Gift size={18} color="#2e7d32" /> Envío gratis en compras superiores a ₲ 50.000
        </p>
      </section>
    </div>
  )
}