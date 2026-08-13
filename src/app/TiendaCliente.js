/**
 * UBICACION: src/app/TiendaCliente.js
 * CREADO: 2026-03-06
 * DESCRIPCION:
 *  - Client Component que recibe datos pre-cargados del servidor
 *  - Maneja filtros de categoría, carrito e interactividad
 *  - Mismo patrón que layout-client.js
 *  - Los datos ya vienen cacheados desde page.js (revalidate: 300)
 */
'use client'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'

const CATEGORIAS = ['todos', 'panes', 'dulces', 'salados', 'eventos']

export default function TiendaCliente({ productos, disponibilidad }) {
  const [categoriaActiva, setCategoriaActiva] = useState('todos')
  const { agregarAlCarrito } = useCart()

  const productosFiltrados =
    categoriaActiva === 'todos'
      ? productos
      : productos.filter(p => p.categoria?.toLowerCase() === categoriaActiva)

  return (
    <div className="page-container">

      {/* === HERO SECTION === */}
      <section className="hero-section" style={{ textAlign: 'center', padding: '3rem 0', marginBottom: '2rem' }}>
        <h1 className="hero-title" style={{ margin: '0 0 1rem 0', color: '#334c2b' }}>
          Panificados Sin Gluten de Calidad
        </h1>
        <p className="hero-subtitle" style={{
          fontSize: '1.2rem', color: '#334c2b',
          maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', textAlign: 'center'
        }}>
          Elaborados artesanalmente en Paraguay.
        </p>
        <p style={{
          fontSize: '1.1rem', color: '#334c2b',
          maxWidth: '600px', margin: '0.5rem auto 0', lineHeight: '1.6', textAlign: 'center'
        }}>
          Delivery a domicilio en Encarnación y Gran Encarnación.
        </p>
      </section>

      {/* === FILTROS === */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex', gap: '0.5rem', overflowX: 'auto',
          paddingBottom: '0.5rem', justifyContent: 'flex-start',
          WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {CATEGORIAS.map(cat => {
            const activo = cat === categoriaActiva
            return (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                style={{
                  padding: '0.5rem 1.25rem', border: '2px solid #8c9937',
                  borderRadius: '20px',
                  background: activo ? '#8c9937' : 'transparent',
                  color: activo ? '#eee6d9' : '#8c9937',
                  cursor: 'pointer', textTransform: 'capitalize',
                  fontWeight: '600', fontSize: '0.9rem', fontFamily: 'inherit',
                  whiteSpace: 'nowrap', flexShrink: 0, minHeight: '44px',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </section>

      {/* === GRILLA DE PRODUCTOS === */}
      <section className="products-grid">
        {productosFiltrados.length === 0 ? (
          <p style={{
            textAlign: 'center', color: '#334c2b',
            gridColumn: '1 / -1', fontSize: '1.1rem', padding: '2rem 0'
          }}>
            {categoriaActiva === 'todos'
              ? 'No hay productos disponibles en este momento.'
              : `No hay productos en la categoría "${categoriaActiva}".`}
          </p>
        ) : (
          productosFiltrados.map(producto => {
            const disp = disponibilidad[producto.id]
            return (
              <ProductCard
                key={producto.id}
                producto={producto}
                disponible={disp?.disponible ?? true}
                requiereAnticipacion={disp?.requiere_anticipacion ?? false}
                onAddToCart={agregarAlCarrito}
              />
            )
          })
        )}
      </section>

      {/* === SECCIÓN DELIVERY === */}
      <section style={{
        marginTop: '3rem', padding: '1.5rem',
        backgroundColor: '#eee6d9', borderRadius: '8px',
        textAlign: 'center', border: '2px solid #8c9937'
      }}>
        <h3 style={{ margin: '0 0 0.75rem 0', color: '#334c2b', fontSize: '1.1rem' }}>
          🚚 Envíos a Domicilio
        </h3>
        <p style={{ color: '#334c2b', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
          Delivery en Encarnación y Gran Encarnación. Consultá el costo según tu ubicación.
        </p>
        <p style={{ color: '#8c9937', fontWeight: 'bold', fontSize: '1rem' }}>
          🎁 Envío gratis en compras superiores a ₲ 50.000
        </p>
      </section>

    </div>
  )
}