'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    async function cargarDatos() {
      try {
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }
        setUsuario(user)

        // Obtener pedidos del usuario
        const { data, error } = await supabase
          .from('pedidos')
          .select(`
            id,
            numero_pedido,
            estado,
            total_final,
            metodo_entrega,
            created_at,
            cliente_id
          `)
          .eq('cliente_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setPedidos(data || [])
      } catch (err) {
        console.error('Error cargando pedidos:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  const estadoColor = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-blue-100 text-blue-800',
      en_produccion: 'bg-orange-100 text-orange-800',
      listo: 'bg-green-100 text-green-800',
      entregado: 'bg-green-200 text-green-900',
      cancelado: 'bg-red-100 text-red-800',
    }
    return colores[estado] || 'bg-gray-100 text-gray-800'
  }

  const estadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_produccion: 'En producción',
      listo: 'Listo para retirar',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    }
    return labels[estado] || estado
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#334c2b] border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando tus pedidos...</p>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#334c2b] mb-6">📦 Mis Pedidos</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500 text-lg mb-4">
            Inicia sesión para ver tus pedidos.
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#334c2b] mb-6">📦 Mis Pedidos</h1>
      
      {pedidos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500 text-lg mb-4">
            No tienes pedidos realizados aún.
          </p>
          <a
            href="/catalogo"
            className="inline-block bg-[#f46e15] text-white px-6 py-3 rounded-lg hover:bg-[#d95f0e] transition font-medium"
          >
            🛍️ Hacer mi primer pedido
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-[#334c2b]">
                    Pedido #{pedido.numero_pedido}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(pedido.created_at).toLocaleDateString('es-PY', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {pedido.metodo_entrega === 'delivery' ? '🚚 Delivery' : '🏪 Retiro en local'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${estadoColor(pedido.estado)}`}>
                    {estadoLabel(pedido.estado)}
                  </span>
                  <p className="text-lg font-bold text-[#f46e15] mt-2">
                    {pedido.total_final?.toLocaleString('es-PY')} ₲
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/pedido/${pedido.numero_pedido}`}
                  className="text-[#334c2b] hover:text-[#f46e15] text-sm font-medium transition"
                >
                  Ver detalles del pedido →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}