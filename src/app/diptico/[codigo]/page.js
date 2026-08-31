// src/app/diptico/[codigo]/page.js
import { supabase } from '@/lib/supabase'
import DipticoCliente from './DipticoCliente'

// ✅ Usar generateStaticParams para evitar errores de build
export async function generateStaticParams() {
  const { data: codigos } = await supabase
    .from('codigos_dipticos')
    .select('codigo')
    .eq('canjeado', false)
    .limit(10)

  return codigos?.map((c) => ({
    codigo: c.codigo,
  })) || []
}

export default async function PaginaDiptico({ params }) {
  // ✅ Obtener el código de los parámetros
  const codigo = params?.codigo?.toUpperCase() || ''
  
  // ✅ Buscar el código en la base de datos
  const { data: codigoData, error } = await supabase
    .from('codigos_dipticos')
    .select('*')
    .eq('codigo', codigo)
    .single()

  // ✅ Si el código no existe
  if (error || !codigoData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-[#334c2b] mb-2">
            Código no encontrado
          </h1>
          <p className="text-gray-600 mb-4">
            El código que ingresaste no es válido o ya fue utilizado.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[#f46e15] text-white rounded-lg hover:bg-[#e05d0a] transition"
          >
            Volver a la tienda
          </a>
        </div>
      </div>
    )
  }

  // ✅ Si el código ya fue canjeado
  if (codigoData.canjeado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-[#334c2b] mb-2">
            ¡Código ya canjeado!
          </h1>
          <p className="text-gray-600 mb-4">
            Este código ya fue utilizado para sumar puntos.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[#f46e15] text-white rounded-lg hover:bg-[#e05d0a] transition"
          >
            Volver a la tienda
          </a>
        </div>
      </div>
    )
  }

  // ✅ Obtener datos del producto
  const { data: producto, error: prodError } = await supabase
    .from('productos')
    .select('*')
    .eq('id', codigoData.producto_id)
    .single()

  // Si no hay producto, mostrar mensaje
  if (prodError || !producto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">😅</div>
          <h1 className="text-2xl font-bold text-[#334c2b] mb-2">
            Producto no disponible
          </h1>
          <p className="text-gray-600 mb-4">
            El producto asociado a este código ya no está disponible.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[#f46e15] text-white rounded-lg hover:bg-[#e05d0a] transition"
          >
            Volver a la tienda
          </a>
        </div>
      </div>
    )
  }

  // ✅ Obtener productos relacionados
  const { data: relacionados } = await supabase
    .from('productos')
    .select('id, nombre, precio_venta, imagen_url, slug')
    .eq('categoria', producto.categoria)
    .neq('id', producto.id)
    .limit(4)

  return (
    <DipticoCliente
      codigo={codigo}
      producto={producto}
      tipoRegalo={codigoData.tipo_regalo}
      relacionados={relacionados || []}
    />
  )
}