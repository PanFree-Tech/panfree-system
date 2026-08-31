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
  Check,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Award,
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
        setPuntos((prev) => prev + (data.puntos || 100))
        setMensaje({
          tipo: 'exito',
          texto: `¡Código canjeado con éxito! Has sumado +${data.puntos || 100} puntos a tu cuenta.`,
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
    <div className="min-h-screen bg-[#fcfaf7] text-[#2d1f14] font-sans antialiased selection:bg-[#f46e15]/20 selection:text-[#334c2b]">
      {/* ─── HERO SECTION WITH ORGANIC BACKGROUND & CURVED DIVIDER ─── */}
      <header className="relative bg-gradient-to-b from-[#24371f] via-[#2f4627] to-[#334c2b] text-white pt-10 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Subtle decorative pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1.5px, transparent 1.5px), radial-gradient(#b7996b 1.5px, #24371f 1.5px)`,
            backgroundSize: '36px 36px',
            backgroundPosition: '0 0, 18px 18px'
          }}
        />

        {/* Ambient warm glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#f46e15]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#b7996b]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center z-10">
          {/* Top category badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#f5f1eb] text-xs sm:text-sm font-medium mb-5 shadow-sm">
            <WheatOff size={14} className="text-[#b7996b]" />
            <span>Panadería Artesanal 100% Libre de Gluten</span>
          </div>

          {/* Brand Logo */}
          <div className="mb-4 p-3 bg-white/95 rounded-2xl shadow-xl shadow-black/20 border border-white/30 transition-transform duration-300 hover:scale-105">
            <img
              src="https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png"
              alt="PanFree Bakery"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white max-w-2xl leading-tight">
            ¡Gracias por elegir PanFree!
          </h1>
          <p className="text-[#eee6d9] text-base sm:text-lg mt-2 font-medium max-w-xl">
            El placer de volver a comer libremente
          </p>

          <p className="text-[#b7996b] text-xs sm:text-sm mt-3 max-w-md font-light leading-relaxed">
            Cada producto artesanal está horneado con dedicación para que disfrutes sin preocupaciones.
          </p>
        </div>

        {/* Smooth organic bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-8 sm:h-12 text-[#fcfaf7]"
            fill="currentColor"
          >
            <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,30 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </header>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 -mt-2">
        {/* ─── VOUCHER / LOYALTY CARD ─── */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#e8dfd3] p-6 sm:p-8 relative overflow-hidden transition-all duration-200 hover:shadow-md">
          {/* Subtle warm accent bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#b7996b] via-[#f46e15] to-[#334c2b]" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f0e9df]">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f46e15] uppercase tracking-wider mb-1">
                <Sparkles size={14} /> Club de Fidelidad
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#334c2b]">
                Tu código exclusivo
              </h2>
              <p className="text-sm text-[#8a7a6b] mt-0.5">
                Canjea este código para acumular puntos y canjearlos por productos y descuentos
              </p>
            </div>

            <button
              onClick={copiarCodigo}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 self-start sm:self-auto ${
                copiado
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-[#f5f1eb] text-[#334c2b] hover:bg-[#ebdcc7] border border-[#e2d6c6]'
              }`}
            >
              {copiado ? (
                <>
                  <Check size={16} className="text-green-600" />
                  <span>¡Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={16} className="text-[#334c2b]" />
                  <span>Copiar código</span>
                </>
              )}
            </button>
          </div>

          {/* Ticket styled code box */}
          <div className="my-6">
            <div className="relative bg-gradient-to-br from-[#fcfaf7] to-[#f5f1eb] rounded-xl p-6 border-2 border-dashed border-[#b7996b]/50 text-center shadow-inner group">
              <span className="text-xs uppercase tracking-widest text-[#8a7a6b] font-semibold block mb-1">
                Código del Producto
              </span>
              <span className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-[#334c2b] selection:bg-[#334c2b] selection:text-white">
                {codigo}
              </span>
              <p className="text-xs text-[#8a7a6b] mt-2">
                Presente en el díptico o empaque de tu compra
              </p>
            </div>
          </div>

          {/* Action section depending on auth state */}
          {usuario ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between bg-[#f5f1eb] px-4 py-3 rounded-xl border border-[#e8dfd3]">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-[#f46e15]" />
                  <span className="text-sm text-[#2d1f14]">
                    Tus puntos acumulados:
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-[#f46e15]">
                    {puntos} pts
                  </span>
                  <Link
                    href="/perfil/puntos"
                    className="text-xs font-semibold text-[#334c2b] hover:text-[#f46e15] hover:underline inline-flex items-center gap-1 transition"
                  >
                    Ver catálogo de premios <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              <button
                onClick={handleCanjear}
                disabled={loading || canjeado}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-white text-base shadow-md transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 ${
                  canjeado
                    ? 'bg-gray-400 cursor-not-allowed opacity-90'
                    : loading
                    ? 'bg-[#b7996b] cursor-wait'
                    : 'bg-gradient-to-r from-[#f46e15] to-[#e05b0a] hover:from-[#e05b0a] hover:to-[#cb4e05] shadow-[#f46e15]/20 hover:shadow-lg hover:shadow-[#f46e15]/30'
                }`}
              >
                {loading ? (
                  <span>Canjeando código...</span>
                ) : canjeado ? (
                  <>
                    <CheckCircle size={20} />
                    <span>¡Código canjeado con éxito!</span>
                  </>
                ) : (
                  <>
                    <Gift size={20} />
                    <span>Canjear puntos (+100 pts)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3.5 px-6 bg-[#334c2b] hover:bg-[#253920] text-white rounded-xl font-bold text-base shadow-md shadow-[#334c2b]/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Iniciar sesión para canjear</span>
                <ArrowRight size={18} />
              </button>
              <p className="text-center text-xs text-[#8a7a6b] mt-2.5">
                ¿No tienes cuenta? Se creará automáticamente al iniciar sesión.
              </p>
            </div>
          )}

          {/* Feedback message banner */}
          {mensaje && (
            <div
              className={`mt-5 p-4 rounded-xl flex items-start gap-3 text-sm transition-all animate-fadeIn ${
                mensaje.tipo === 'exito'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {mensaje.tipo === 'exito' ? (
                <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-snug">{mensaje.texto}</span>
            </div>
          )}
        </section>

        {/* ─── SPECIAL GIFT BANNER (IF PRESENT) ─── */}
        {tipoRegalo && (
          <section className="bg-gradient-to-br from-[#fff7f0] to-[#fdede0] rounded-2xl border-2 border-[#f46e15]/40 p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#f46e15] text-white rounded-xl shadow-md shadow-[#f46e15]/30">
                <Gift size={26} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#334c2b]">
                  ¡Tienes un beneficio especial con este código!
                </h3>
                <p className="text-sm text-[#2d1f14]/80 mt-1 leading-relaxed">
                  {tipoRegalo === 'descuento'
                    ? 'Has recibido un descuento exclusivo aplicable en tu próxima compra de panadería.'
                    : tipoRegalo === 'producto'
                    ? 'Has recibido un producto de regalo adicional en tu próximo pedido.'
                    : '¡Sorpresa! Has recibido un beneficio especial para consentirte.'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ─── PRODUCT INFORMATION & ARTISANAL DETAILS ─── */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#e8dfd3] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#f0e9df]">
            <div>
              <span className="text-xs font-bold text-[#b7996b] uppercase tracking-wider">
                Detalle del Producto
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#334c2b] mt-0.5">
                {producto.nombre}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-[#334c2b] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
              <WheatOff size={14} className="text-[#b7996b]" />
              100% Sin Gluten
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Product Image and DINAPI Badge */}
            <div className="md:col-span-5 flex flex-col items-center space-y-4">
              <div className="w-full aspect-square bg-[#f5f1eb] rounded-2xl overflow-hidden border border-[#e8dfd3] shadow-inner relative group">
                {producto.imagen_url ? (
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#8a7a6b]">
                    <WheatOff size={48} className="text-[#b7996b] mb-2 opacity-60" />
                    <span className="text-sm font-medium">Panadería Artesanal</span>
                  </div>
                )}
              </div>

              {/* Official DINAPI Badge */}
              <div className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl p-3 flex items-center justify-center gap-3">
                <img
                  src="/images/simbolo-dinapi-sin-gluten.png"
                  alt="Símbolo Nacional SIN GLUTEN"
                  className="h-10 w-auto object-contain"
                />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#334c2b] uppercase leading-tight">
                    Certificación Nacional
                  </p>
                  <p className="text-[10px] text-[#8a7a6b] leading-tight">
                    Símbolo Oficial Sin Gluten
                  </p>
                </div>
              </div>
            </div>

            {/* Product Descriptions & Nutritional Information */}
            <div className="md:col-span-7 space-y-5">
              <div>
                <h3 className="text-xs font-bold text-[#8a7a6b] uppercase tracking-wider mb-1.5">
                  Descripción
                </h3>
                <p className="text-[#2d1f14] text-sm sm:text-base leading-relaxed">
                  {producto.descripcion || 'Elaborado artesanalmente con ingredientes seleccionados, libres de contaminación cruzada y con todo el sabor tradicional.'}
                </p>
              </div>

              {/* Ingredients Card */}
              <div className="bg-[#f5f1eb] rounded-xl p-4 sm:p-5 border border-[#e8dfd3]/80">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-[#334c2b]">
                    Ingredientes Naturales
                  </h3>
                </div>
                <p className="text-[#2d1f14]/85 text-xs sm:text-sm leading-relaxed">
                  {producto.ingredientes || 'Información detallada de ingredientes próximamente disponible.'}
                </p>
              </div>

              {/* Nutritional Facts Table */}
              {producto.calorias && (
                <div className="rounded-xl overflow-hidden border border-[#e8dfd3] shadow-sm">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-[#334c2b] text-white">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold">
                          Información Nutricional
                        </th>
                        <th className="px-4 py-2.5 text-right font-semibold text-[#eee6d9]">
                          Por porción ({producto.peso_porcion || 100}g)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0e9df] bg-white">
                      <tr className="hover:bg-[#fcfaf7] transition-colors">
                        <td className="px-4 py-2.5 text-[#2d1f14]">Valor Energético / Calorías</td>
                        <td className="px-4 py-2.5 text-right font-bold text-[#334c2b]">{producto.calorias || '—'} kcal</td>
                      </tr>
                      <tr className="hover:bg-[#fcfaf7] transition-colors">
                        <td className="px-4 py-2.5 text-[#2d1f14]">Proteínas</td>
                        <td className="px-4 py-2.5 text-right font-medium text-[#2d1f14]">{producto.proteinas || '—'} g</td>
                      </tr>
                      <tr className="hover:bg-[#fcfaf7] transition-colors">
                        <td className="px-4 py-2.5 text-[#2d1f14]">Carbohidratos</td>
                        <td className="px-4 py-2.5 text-right font-medium text-[#2d1f14]">{producto.carbohidratos || '—'} g</td>
                      </tr>
                      <tr className="hover:bg-[#fcfaf7] transition-colors">
                        <td className="px-4 py-2.5 text-[#2d1f14]">Grasas Totales</td>
                        <td className="px-4 py-2.5 text-right font-medium text-[#2d1f14]">{producto.grasas || '—'} g</td>
                      </tr>
                      <tr className="hover:bg-[#fcfaf7] transition-colors">
                        <td className="px-4 py-2.5 text-[#2d1f14]">Fibra Alimentaria</td>
                        <td className="px-4 py-2.5 text-right font-medium text-[#2d1f14]">{producto.fibra || '—'} g</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── RELATED PRODUCTS HIGHLIGHT ─── */}
        {relacionados && relacionados.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-[#e8dfd3] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-[#f46e15] uppercase tracking-wider">
                  Recomendados para ti
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#334c2b]">
                  También te puede gustar
                </h2>
              </div>
              <Link
                href="/catalogo"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#334c2b] hover:text-[#f46e15] transition"
              >
                <span>Ver catálogo</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
              {relacionados.map((prod) => (
                <Link
                  key={prod.id}
                  href={`/producto/${prod.slug}`}
                  className="group bg-[#fcfaf7] rounded-xl overflow-hidden border border-[#e8dfd3] hover:border-[#b7996b] hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-square bg-[#f5f1eb] overflow-hidden relative">
                    {prod.imagen_url ? (
                      <img
                        src={prod.imagen_url}
                        alt={prod.nombre}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8a7a6b]">
                        <WheatOff size={24} className="opacity-40" />
                      </div>
                    )}
                    <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[#334c2b] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Sin Gluten
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <h3 className="font-semibold text-xs sm:text-sm text-[#334c2b] line-clamp-2 group-hover:text-[#f46e15] transition-colors leading-snug">
                      {prod.nombre}
                    </h3>
                    <p className="text-[#f46e15] font-extrabold text-sm sm:text-base mt-2">
                      ₲ {Number(prod.precio_venta).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── CONNECT & DIRECT CHANNELS ─── */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#e8dfd3] p-6 sm:p-8">
          <div className="text-center max-w-md mx-auto mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#334c2b]">
              Conecta con nosotros
            </h2>
            <p className="text-xs sm:text-sm text-[#8a7a6b] mt-1">
              ¿Dudas, pedidos especiales o sugerencias? Estamos para ayudarte
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <a
              href="https://wa.me/595984589845"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center p-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                <Phone size={18} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#1e7e34]">WhatsApp</span>
              <span className="text-[11px] text-[#8a7a6b] mt-0.5">Pedidos rápidos</span>
            </a>

            <a
              href="https://instagram.com/panfree.py"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center p-4 rounded-xl bg-pink-50 hover:bg-pink-100/80 border border-pink-200/60 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-bold text-pink-900">Instagram</span>
              <span className="text-[11px] text-[#8a7a6b] mt-0.5">@panfree.py</span>
            </a>

            <a
              href="mailto:contacto@panfree.fit"
              className="flex flex-col items-center text-center p-4 rounded-xl bg-[#f5f1eb] hover:bg-[#ebdcc7] border border-[#e8dfd3] transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#b7996b] text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                <Mail size={18} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#334c2b]">Email</span>
              <span className="text-[11px] text-[#8a7a6b] mt-0.5">contacto@panfree.fit</span>
            </a>

            <a
              href="/"
              className="flex flex-col items-center text-center p-4 rounded-xl bg-[#334c2b]/10 hover:bg-[#334c2b]/20 border border-[#334c2b]/20 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#334c2b] text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                <ShoppingBag size={18} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#334c2b]">Tienda Online</span>
              <span className="text-[11px] text-[#8a7a6b] mt-0.5">Ver productos</span>
            </a>
          </div>
        </section>
      </main>

      {/* ─── FOOTER WITH BRAND PROMISE & ACCENT ─── */}
      <footer className="mt-12 bg-[#253920] text-[#eee6d9] pt-10 pb-8 px-4 sm:px-6 border-t border-[#334c2b]">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="flex justify-center">
            <img
              src="https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png"
              alt="PanFree"
              className="h-10 w-auto opacity-90 brightness-110"
            />
          </div>

          <p className="text-sm font-medium text-[#f5f1eb] max-w-md mx-auto">
            Panadería artesanal libre de gluten. El placer de volver a comer libremente.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#b7996b] pt-2">
            <Link href="/politica-de-privacidad" className="hover:text-white transition">
              Política de Privacidad
            </Link>
            <Link href="/terminos-y-condiciones" className="hover:text-white transition">
              Términos y Condiciones
            </Link>
            <Link href="/contacto" className="hover:text-white transition">
              Contacto
            </Link>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-[#8a7a6b]">
            <p>© 2026 PanFree. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
