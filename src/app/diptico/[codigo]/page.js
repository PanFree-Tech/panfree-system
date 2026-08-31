// src/app/diptico/[codigo]/page.js
import { supabase } from '@/lib/supabase'
import DipticoCliente from './DipticoCliente'

// Forzar renderizado dinámico en cada petición para evitar caché estática desactualizada
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaginaDiptico({ params }) {
  const codigoRaw = params?.codigo || ''
  const codigo = codigoRaw.trim().toUpperCase()

  // Validación básica del formato
  if (!codigo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-[#334c2b] mb-2">Código no válido</h1>
          <p className="text-gray-600 mb-4">No se proporcionó un código válido en el enlace.</p>
          <a href="/" className="inline-block px-6 py-3 bg-[#f46e15] text-white rounded-lg hover:bg-[#e05d0a] transition">
            Volver a la tienda
          </a>
        </div>
      </div>
    )
  }

  // Consulta insensible a mayúsculas/minúsculas y sin error fatal
  const { data: codigoData, error } = await supabase
    .from('codigos_dipticos')
    .select('*')
    .ilike('codigo', codigo)
    .maybeSingle()

  if (error) {
    console.error('❌ Error consultando código en Supabase:', error.message)
  }

  // Si no existe o fue bloqueado
  if (error || !codigoData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-[#334c2b] mb-2">Código no encontrado</h1>
          <p className="text-gray-600 mb-4">
            El código <strong>{codigo}</strong> no existe o no se pudo cargar.
          </p>
          <a href="/" className="inline-block px-6 py-3 bg-[#f46e15] text-white rounded-lg hover:bg-[#e05d0a] transition">
            Volver a la tienda
          </a>
        </div>
      </div>
    )
  }

  // Si el código ya fue canjeado
  if (codigoData.canjeado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-[#334c2b] mb-2">¡Código ya canjeado!</h1>
          <p className="text-gray-600 mb-4">Este código ya fue utilizado para sumar puntos.</p>
          <a href="/" className="inline-block px-6 py-3 bg-[#f46e15] text-white rounded-lg hover:bg-[#e05d0a] transition">
            Volver a la tienda
          </a>
        </div>
      </div>
    )
  }

  // Cargar producto asociado (si tiene producto_id)
  let producto = null
  if (codigoData.producto_id) {
    const { data: prodData } = await supabase
      .from('productos')
      .select('*')
      .eq('id', codigoData.producto_id)
      .maybeSingle()
    producto = prodData
  }

  // Fallback si no tiene producto asignado o no se encuentra
  if (!producto) {
    producto = {
      id: 'general',
      nombre: 'Panadería Artesanal PanFree',
      descripcion: 'Disfruta de nuestros productos 100% libres de gluten elaborados artesanalmente.',
      categoria: 'panaderia',
      imagen_url: 'https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png'
    }
  }

  // Cargar productos relacionados
  const { data: relacionados } = await supabase
    .from('productos')
    .select('id, nombre, precio_venta, imagen_url, slug')
    .limit(4)

  return (
    <DipticoCliente
      codigo={codigoData.codigo}
      producto={producto}
      tipoRegalo={codigoData.tipo_regalo || null}
      relacionados={relacionados || []}
    />
  )
}