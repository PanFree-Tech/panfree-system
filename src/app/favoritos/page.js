'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { resolveProductImageUrl } from '@/lib/image-utils'
import { useFavoritos } from '@/hooks/useFavoritos'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'
import Link from 'next/link'

export default function FavoritosPage() {
  const router = useRouter()
  const { favoritos, eliminarFavorito, loading: loadingFavoritos } = useFavoritos()
  const { agregarAlCarrito } = useCart()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState(null)

  // Obtener usuario actual
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user)
    })
  }, [])

  // Cargar productos favoritos
  useEffect(() => {
    if (!usuario || !favoritos.length) {
      setProductos([])
      setLoading(false)
      return
    }

    async function cargarProductos() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .in('id', favoritos)
          .eq('is_active', true)

        if (error) throw error
        setProductos(data || [])
      } catch (error) {
        console.error('Error cargando productos favoritos:', error)
        setProductos([])
      } finally {
        setLoading(false)
      }
    }

    cargarProductos()
  }, [usuario, favoritos])

  // Función para agregar al carrito
  const agregarProductoAlCarrito = (producto) => {
    const payload = {
      id: producto.id,
      nombre: producto.nombre,
      precio_venta: producto.precio_venta,
      cantidad: 1,
      subtotal: producto.precio_venta,
      imagen_url: resolveProductImageUrl(producto) || '',
      categoria: producto.categoria || '',
      unidad_medida: producto.unidad_medida || null,
    }
    agregarAlCarrito(payload)
  }

  // Función para eliminar de favoritos
  const handleEliminarFavorito = async (productoId) => {
    await eliminarFavorito(productoId)
    setProductos((prev) => prev.filter((p) => p.id !== productoId))
  }

  if (!usuario) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#334c2b] mb-6">❤️ Mis Favoritos</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            Inicia sesión para ver tus productos favoritos.
          </p>
          <a
            href="/login"
            className="inline-block bg-[#334c2b] text-white px-6 py-3 rounded-lg hover:bg-[#2a3d24] transition font-medium"
          >
            🔑 Iniciar sesión
          </a>
        </div>
      </div>
    )
  }

  if (loading || loadingFavoritos) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#334c2b] border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando tus favoritos...</p>
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#334c2b] mb-6">❤️ Mis Favoritos</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            No tienes productos guardados en favoritos.
          </p>
          <p className="text-gray-400 text-sm">
            Explora nuestro catálogo y guarda tus productos preferidos.
          </p>
          <a
            href="/catalogo"
            className="inline-block mt-6 bg-[#334c2b] text-white px-6 py-3 rounded-lg hover:bg-[#2a3d24] transition font-medium"
          >
            🛍️ Ver catálogo
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#334c2b]">❤️ Mis Favoritos</h1>
        <span className="text-sm text-gray-500">
          {productos.length} producto{productos.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productos.map((producto) => {
          const imagenUrl = resolveProductImageUrl(producto)
          return (
            <div
              key={producto.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group"
            >
              {/* Imagen */}
              <Link
                href={`/producto/${producto.slug}`}
                className="block relative aspect-square bg-gray-100"
              >
                {imagenUrl ? (
                  <Image
                    src={imagenUrl}
                    alt={producto.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <ShoppingBag className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {/* Botón eliminar favorito (esquina superior derecha) */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleEliminarFavorito(producto.id)
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 transition"
                  aria-label="Quitar de favoritos"
                >
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </button>
              </Link>

              {/* Info */}
              <div className="p-4">
                <Link href={`/producto/${producto.slug}`}>
                  <h3 className="font-semibold text-[#334c2b] hover:text-[#f46e15] transition line-clamp-1">
                    {producto.nombre}
                  </h3>
                </Link>
                {producto.categoria && (
                  <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">
                    {producto.categoria}
                  </p>
                )}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-lg font-bold text-[#f46e15]">
                    Gs. {Number(producto.precio_venta).toLocaleString('es-PY')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      agregarProductoAlCarrito(producto)
                    }}
                    className="bg-[#f46e15] text-white px-4 py-2 rounded-lg hover:bg-[#d95d0b] transition text-sm font-medium"
                  >
                    🛒 Agregar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Botón para volver al catálogo */}
      <div className="mt-8 text-center">
        <a
          href="/catalogo"
          className="inline-block bg-[#334c2b] text-white px-6 py-3 rounded-lg hover:bg-[#2a3d24] transition font-medium"
        >
          🛍️ Seguir explorando el catálogo
        </a>
      </div>
    </div>
  )
}