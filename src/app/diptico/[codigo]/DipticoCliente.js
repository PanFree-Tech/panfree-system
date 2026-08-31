// src/app/diptico/[codigo]/DipticoCliente.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  WheatOff,
  ShieldCheck,
  Heart,
  Star,
  Gift,
  PartyPopper,
  Truck,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Copy,
} from 'lucide-react'

export default function DipticoCliente({
  codigo,
  producto,
  tipoRegalo,
  relacionados,
}) {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [puntos, setPuntos] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [canjeado, setCanjeado] = useState(false)

  // Verificar si el usuario está logueado
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUsuario(data.user)
        // Obtener puntos del cliente
        supabase
          .from('clientes')
          .select('puntos_fidelidad')
          .eq('user_id', data.user.id)
          .single()
          .then(({ data: cliente }) => {
            if (cliente) setPuntos(cliente.puntos_fidelidad || 0)
          })
      }
    })
  }, [])

  const handleCanjear = async () => {
    if (!usuario) {
      router.push('/login')
      return
    }

    if (canjeado) {
      setMensaje({ tipo: 'error', texto: 'Este código ya fue canjeado.' })
      return
    }

    setLoading(true)
    setMensaje(null)

    try {
      const res = await fetch('/api/dipticos/canjear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, userId: usuario.id }),
      })

      const data = await res.json()

      if (data.success) {
        setCanjeado(true)
        setPuntos((prev) => prev + data.puntos || 100)
        setMensaje({
          tipo: 'exito',
          texto: `🎉 ¡Código canjeado! Has sumado +${data.puntos || 100} puntos.`,
        })
      } else {
        setMensaje({ tipo: 'error', texto: data.mensaje || 'Error al canjear el código.' })
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al conectar con el servidor.' })
    } finally {
      setLoading(false)
    }
  }

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7]">
      {/* ─── HEADER ─── */}
      <div className="bg-[#334c2b] text-white py-6 px-4 text-center">
        <div className="flex justify-center mb-3">
          <img
            src="https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png"
            alt="PanFree"
            className="h-16 w-auto"
          />
        </div>
        <h1 className="text-2xl font-bold">🍞 ¡Gracias por elegir PanFree!</h1>
        <p className="text-[#b7996b] text-sm mt-1">El placer de volver a comer libremente</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ─── MENSAJE DE BIENVENIDA ─── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 text-center">
          <p className="text-gray-600 text-lg">
            Cada producto que elaboramos está hecho con amor y dedicación para que disfrutes sin preocupaciones.
          </p>
        </div>

        {/* ─── CÓDIGO Y CANJE ─── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#334c2b]">🎯 Tu código de fidelidad</h2>
              <p className="text-sm text-gray-500">Canjea este código para sumar puntos</p>
            </div>
            <button
              onClick={copiarCodigo}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
            >
              <Copy size={16} />
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="bg-[#f5f1eb] rounded-lg p-4 text-center mb-4">
            <span className="text-3xl font-mono font-bold tracking-wider text-[#334c2b]">
              {codigo}
            </span>
          </div>

          {usuario ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  Tus puntos: <strong className="text-[#f46e15]">{puntos} pts</strong>
                </span>
                <Link href="/perfil/puntos" className="text-sm text-[#f46e15] hover:underline">
                  Ver premios →
                </Link>
              </div>

              <button
                onClick={handleCanjear}
                disabled={loading || canjeado}
                className={`w-full py-3 rounded-lg font-bold text-white transition ${
                  canjeado
                    ? 'bg-gray-400 cursor-not-allowed'
                    : loading
                    ? 'bg-[#b7996b] cursor-wait'
                    : 'bg-[#f46e15] hover:bg-[#e05d0a]'
                }`}
              >
                {loading
                  ? '⏳ Canjeando...'
                  : canjeado
                  ? '✅ ¡Código canjeado!'
                  : '🎁 Canjear puntos (+100 pts)'}
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-[#334c2b] text-white rounded-lg font-bold hover:bg-[#2a3d24] transition"
            >
              🔑 Iniciar sesión para canjear
            </button>
          )}

          {mensaje && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
                mensaje.tipo === 'exito'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              {mensaje.tipo === 'exito' ? (
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              )}
              <span>{mensaje.texto}</span>
            </div>
          )}
        </div>

        {/* ─── REGALO (si existe) ─── */}
        {tipoRegalo && (
          <div className="bg-gradient-to-r from-[#f46e15]/10 to-[#b7996b]/10 rounded-xl border-2 border-[#f46e15] p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Gift size={28} className="text-[#f46e15]" />
              <h2 className="text-xl font-bold text-[#334c2b]">🎁 ¡Tienes un regalo especial!</h2>
            </div>
            <p className="text-gray-600">
              {tipoRegalo === 'descuento'
                ? 'Has recibido un descuento para tu próxima compra.'
                : tipoRegalo === 'producto'
                ? 'Has recibido un producto de regalo en tu pedido.'
                : '¡Sorpresa! Has recibido un beneficio especial.'}
            </p>
          </div>
        )}

        {/* ─── INFORMACIÓN DEL PRODUCTO ─── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-[#334c2b]">📦 {producto.nombre}</h2>
            <span className="inline-flex items-center gap-1 bg-[#334c2b] text-white text-xs px-3 py-1 rounded-full">
              <WheatOff size={14} /> 100% Sin Gluten
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {producto.imagen_url ? (
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-4xl">🍞</span>
                  </div>
                )}
              </div>
              <div className="flex justify-center mt-2">
                <img
                  src="/images/simbolo-dinapi-sin-gluten.png"
                  alt="Símbolo Nacional SIN GLUTEN"
                  className="h-12 w-auto"
                />
              </div>
            </div>

            <div className="flex-1">
              <p className="text-gray-600 mb-4">{producto.descripcion}</p>

              {/* Ingredientes */}
              <div className="bg-[#f5f1eb] rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-[#334c2b] mb-2">📋 Ingredientes</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {producto.ingredientes || 'Información de ingredientes próximamente.'}
                </p>
              </div>

              {/* Tabla Nutricional */}
              {producto.calorias && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-[#334c2b] text-white">
                      <tr>
                        <th className="px-4 py-2 text-left">Información Nutricional</th>
                        <th className="px-4 py-2 text-right">Por porción ({producto.peso_porcion || 100}g)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr><td className="px-4 py-2">Calorías</td><td className="px-4 py-2 text-right font-medium">{producto.calorias || '—'} kcal</td></tr>
                      <tr><td className="px-4 py-2">Proteínas</td><td className="px-4 py-2 text-right font-medium">{producto.proteinas || '—'} g</td></tr>
                      <tr><td className="px-4 py-2">Carbohidratos</td><td className="px-4 py-2 text-right font-medium">{producto.carbohidratos || '—'} g</td></tr>
                      <tr><td className="px-4 py-2">Grasas</td><td className="px-4 py-2 text-right font-medium">{producto.grasas || '—'} g</td></tr>
                      <tr><td className="px-4 py-2">Fibra</td><td className="px-4 py-2 text-right font-medium">{producto.fibra || '—'} g</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── RECOMENDACIONES ─── */}
        {relacionados && relacionados.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-[#334c2b] mb-4">
              También te puede interesar...
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relacionados.map((prod) => (
                <Link
                  key={prod.id}
                  href={`/producto/${prod.slug}`}
                  className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition"
                >
                  <div className="aspect-square bg-gray-100">
                    {prod.imagen_url ? (
                      <img
                        src={prod.imagen_url}
                        alt={prod.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">🍞</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-[#334c2b] line-clamp-1">
                      {prod.nombre}
                    </h3>
                    <p className="text-[#f46e15] font-bold text-sm mt-1">
                      ₲ {Number(prod.precio_venta).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── ENLACES DE CONTACTO ─── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#334c2b] mb-4">📱 Conecta con nosotros</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="https://wa.me/595984589845"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-[#25D366]/10 rounded-lg hover:bg-[#25D366]/20 transition"
            >
              <Phone size={20} className="text-[#25D366]" />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>
            <a
              href="https://instagram.com/panfree.py"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition"
            >
              <svg className="w-5 h-5 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              <span className="text-sm font-medium">Instagram</span>
            </a>
            <a
              href="mailto:contacto@panfree.fit"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <Mail size={20} className="text-gray-600" />
              <span className="text-sm font-medium">Email</span>
            </a>
            <a
              href="/"
              className="flex items-center gap-2 p-3 bg-[#334c2b]/10 rounded-lg hover:bg-[#334c2b]/20 transition"
            >
              <ExternalLink size={20} className="text-[#334c2b]" />
              <span className="text-sm font-medium">Tienda</span>
            </a>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="mt-8 text-center text-sm text-gray-400 border-t border-gray-200 pt-6">
          <p className="font-medium text-gray-500">
            Gracias por confiar en PanFree. El placer de volver a comer libremente.
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/politica-de-privacidad" className="hover:text-[#334c2b]">
              Política de Privacidad
            </a>
            <a href="/terminos-y-condiciones" className="hover:text-[#334c2b]">
              Términos y Condiciones
            </a>
          </div>
          <p className="mt-4">© 2026 PanFree. Panadería Artesanal Libre de Gluten.</p>
        </div>
      </div>
    </div>
  )
}