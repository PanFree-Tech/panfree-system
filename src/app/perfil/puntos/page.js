/**
 * 📁 src/app/perfil/puntos/page.js
 * Dashboard de fidelización y gamificación: puntos, niveles, catálogo de premios e historial.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase-client'
import {
    Award,
    Gift,
    QrCode,
    History,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Tag,
    Copy,
    Check,
    Loader2,
    Star,
    Truck,
    ShoppingBag,
    Crown,
    Flame,
    ExternalLink,
    ChevronDown,
    ChevronUp
} from 'lucide-react'

const NIVELES = [
    { nombre: 'Bronce', puntosMin: 0, puntosMax: 99, color: '#cd7f32', bg: 'from-amber-50 to-orange-50', badge: 'bg-amber-100 text-amber-900 border-amber-300', emoji: '🥉' },
    { nombre: 'Plata', puntosMin: 100, puntosMax: 299, color: '#94a3b8', bg: 'from-slate-50 to-gray-100', badge: 'bg-slate-100 text-slate-800 border-slate-300', emoji: '🥈' },
    { nombre: 'Oro', puntosMin: 300, puntosMax: 599, color: '#eab308', bg: 'from-yellow-50 to-amber-100', badge: 'bg-yellow-100 text-yellow-900 border-yellow-300', emoji: '🥇' },
    { nombre: 'VIP', puntosMin: 600, puntosMax: Infinity, color: '#b8860b', bg: 'from-purple-50 to-amber-50', badge: 'bg-purple-100 text-purple-900 border-purple-300', emoji: '👑' },
]

const PREMIOS_DEFAULT = [
    { id: 'p1', nombre: 'Descuento 10%', descripcion: '10% de descuento en tu próxima compra', costo_puntos: 100, tipo: 'descuento', valor: '10', icono: '🛍️' },
    { id: 'p2', nombre: 'Delivery Gratis', descripcion: 'Envío gratis en tu próximo pedido', costo_puntos: 150, tipo: 'delivery_gratis', valor: '0', icono: '🚚' },
    { id: 'p3', nombre: 'Budín de Naranja', descripcion: 'Budín de naranja sin gluten (unidad)', costo_puntos: 200, tipo: 'producto_gratis', valor: 'Budín de Naranja', icono: '🧁' },
    { id: 'p4', nombre: 'Muffin Surtido', descripcion: 'Caja de 6 muffins surtidos', costo_puntos: 250, tipo: 'producto_gratis', valor: 'Muffin Surtido', icono: '🧁' },
    { id: 'p5', nombre: 'Pan de Campo', descripcion: 'Pan de campo artesanal (500g)', costo_puntos: 300, tipo: 'producto_gratis', valor: 'Pan de Campo', icono: '🍞' },
]

function obtenerInfoNivel(puntos = 0) {
    const pts = Math.max(0, Number(puntos) || 0)
    let actual = NIVELES[0]
    for (let i = 0; i < NIVELES.length; i++) {
        if (pts >= NIVELES[i].puntosMin) {
            actual = NIVELES[i]
        }
    }
    const indexActual = NIVELES.findIndex(n => n.nombre === actual.nombre)
    const siguiente = indexActual < NIVELES.length - 1 ? NIVELES[indexActual + 1] : null

    let progreso = 100
    let puntosParaSiguiente = 0

    if (siguiente) {
        const rango = siguiente.puntosMin - actual.puntosMin
        const acumulado = pts - actual.puntosMin
        progreso = Math.min(100, Math.max(0, Math.round((acumulado / rango) * 100)))
        puntosParaSiguiente = siguiente.puntosMin - pts
    }

    return { actual, siguiente, progreso, puntosParaSiguiente }
}

export default function PuntosPage() {
    const router = useRouter()
    const { usuario, loading: authLoading, abrirModal } = useAuth()

    const [cargando, setCargando] = useState(true)
    const [cliente, setCliente] = useState(null)
    const [premios, setPremios] = useState([])
    const [historialCanjes, setHistorialCanjes] = useState([])
    const [historialPremios, setHistorialPremios] = useState([])
    const [canjeandoPremioId, setCanjeandoPremioId] = useState(null)
    const [mensajePremio, setMensajePremio] = useState(null)
    const [cuponCopiado, setCuponCopiado] = useState(null)
    const [mostrarHistorial, setMostrarHistorial] = useState(false)

    useEffect(() => {
        if (!authLoading && !usuario) {
            setCargando(false)
            return
        }

        if (usuario) {
            cargarDatos()
        }
    }, [usuario, authLoading])

    const cargarDatos = async () => {
        if (!usuario) return
        setCargando(true)

        try {
            // 1. Cargar cliente
            let clienteData = null
            const { data: cData, error: cErr } = await supabase
                .from('clientes')
                .select('*')
                .eq('user_id', usuario.id)
                .maybeSingle()

            if (!cErr && cData) {
                clienteData = cData
            } else {
                const nombre = usuario.user_metadata?.full_name || usuario.user_metadata?.name || usuario.email?.split('@')[0] || 'Cliente'
                const { data: nuevoC } = await supabase
                    .from('clientes')
                    .insert({
                        user_id: usuario.id,
                        email: usuario.email,
                        nombre_completo: nombre,
                        puntos_fidelidad: 0,
                        nivel_cliente: 'bronce',
                        is_active: true,
                        role: 'cliente'
                    })
                    .select()
                    .single()

                clienteData = nuevoC
            }

            setCliente(clienteData)

            // 2. Cargar premios
            const { data: premiosData, error: pErr } = await supabase
                .from('premios')
                .select('*')
                .eq('activo', true)
                .order('costo_puntos', { ascending: true })

            if (!pErr && premiosData && premiosData.length > 0) {
                // Adaptar si no tienen icono
                const adaptados = premiosData.map(p => ({
                    ...p,
                    icono: p.icono || (p.tipo === 'delivery_gratis' ? '🚚' : p.tipo === 'descuento' ? '🛍️' : '🍞')
                }))
                setPremios(adaptados)
            } else {
                setPremios(PREMIOS_DEFAULT)
            }

            // 3. Historiales
            if (clienteData?.id) {
                const { data: hData } = await supabase
                    .from('canjes_dipticos')
                    .select('id, puntos_ganados, created_at, codigos_dipticos(codigo)')
                    .eq('cliente_id', clienteData.id)
                    .order('created_at', { ascending: false })
                    .limit(20)

                setHistorialCanjes(hData || [])

                const { data: hpData } = await supabase
                    .from('canjes_premios')
                    .select('id, puntos_gastados, cupon_generado, created_at, premios(nombre, tipo)')
                    .eq('cliente_id', clienteData.id)
                    .order('created_at', { ascending: false })
                    .limit(20)

                setHistorialPremios(hpData || [])
            }

        } catch (err) {
            console.error('Error cargando datos del dashboard de puntos:', err)
        } finally {
            setCargando(false)
        }
    }

    const handleCanjearPremio = async (premio) => {
        if (!cliente) return
        const puntosDisponibles = cliente.puntos_fidelidad || 0

        if (puntosDisponibles < premio.costo_puntos) {
            setMensajePremio({
                tipo: 'error',
                texto: `Te faltan ${premio.costo_puntos - puntosDisponibles} puntos para canjear "${premio.nombre}".`
            })
            return
        }

        const confirma = window.confirm(`¿Confirmás el canje de "${premio.nombre}" por ${premio.costo_puntos} puntos?`)
        if (!confirma) return

        setCanjeandoPremioId(premio.id)
        setMensajePremio(null)

        try {
            const res = await fetch('/api/premios/canjear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    premioId: premio.id,
                    clienteId: cliente.id,
                    userId: usuario.id
                })
            })

            const data = await res.json()

            if (data.success) {
                setMensajePremio({
                    tipo: 'success',
                    texto: `¡Felicitaciones! Canjeaste "${premio.nombre}".`,
                    cupon: data.cupon
                })
                setCliente(prev => ({
                    ...prev,
                    puntos_fidelidad: data.puntosRestantes !== undefined ? data.puntosRestantes : (prev.puntos_fidelidad - premio.costo_puntos)
                }))
                cargarDatos()
            } else {
                setMensajePremio({
                    tipo: 'error',
                    texto: data.mensaje || data.error || 'No se pudo procesar el canje del premio.'
                })
            }
        } catch (err) {
            console.error('Error canjeando premio:', err)
            setMensajePremio({
                tipo: 'error',
                texto: 'Error de conexión al procesar el canje.'
            })
        } finally {
            setCanjeandoPremioId(null)
        }
    }

    const copiarCupon = (texto) => {
        if (!texto) return
        navigator.clipboard.writeText(texto)
        setCuponCopiado(texto)
        setTimeout(() => setCuponCopiado(null), 3000)
    }

    if (authLoading || cargando) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#fcfaf7] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#334c2b]" />
                <p className="text-sm font-semibold text-[#334c2b]">Cargando tus puntos y beneficios...</p>
            </div>
        )
    }

    if (!usuario) {
        return (
            <div className="min-h-[85vh] bg-[#fcfaf7] flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full bg-white rounded-2xl border border-[#e8dfd3] shadow-md p-8 text-center">
                    <div className="w-16 h-16 bg-[#f46e15]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-[#f46e15]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#334c2b] mb-2">
                        Club PanFree Fidelidad
                    </h2>
                    <p className="text-sm text-[#8a7a6b] mb-6 leading-relaxed">
                        Iniciá sesión para consultar tus puntos acumulados, subir de nivel y canjear premios exclusivos en panadería libre de gluten.
                    </p>
                    <button
                        onClick={() => abrirModal ? abrirModal() : router.push('/login?redirect=/perfil/puntos')}
                        className="w-full py-3.5 px-6 bg-[#f46e15] hover:bg-[#e05b0a] text-white rounded-xl font-bold text-base shadow-md shadow-[#f46e15]/20 hover:shadow-lg transition-all duration-200"
                    >
                        Iniciar Sesión / Registrarme
                    </button>
                    <Link
                        href="/premios"
                        className="inline-block mt-4 text-xs font-semibold text-[#334c2b] hover:text-[#f46e15] transition"
                    >
                        Ver catálogo público de premios →
                    </Link>
                </div>
            </div>
        )
    }

    const puntosCliente = cliente?.puntos_fidelidad || 0
    const nombreUsuario = cliente?.nombre_completo || usuario.user_metadata?.full_name || usuario.user_metadata?.name || 'Cliente PanFree'
    const { actual: nivelActual, siguiente: siguienteNivel, progreso, puntosParaSiguiente } = obtenerInfoNivel(puntosCliente)

    return (
        <div className="min-h-screen bg-[#fcfaf7] text-[#2d1f14] py-8 px-4 sm:px-6 antialiased">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Barra de navegación superior */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[#e8dfd3]/80">
                    <Link
                        href="/perfil"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#334c2b] hover:text-[#f46e15] transition"
                    >
                        <ArrowLeft size={16} />
                        <span>Volver a Mi Cuenta</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/premios"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a7a6b] hover:text-[#334c2b] transition px-3 py-1.5 rounded-lg border border-[#e8dfd3] bg-white"
                        >
                            <Gift size={14} className="text-[#f46e15]" />
                            <span>Catálogo Público</span>
                        </Link>

                        <Link
                            href="/canjear"
                            className="inline-flex items-center gap-2 bg-[#f46e15] hover:bg-[#e05b0a] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition"
                        >
                            <QrCode size={16} />
                            <span>Canjear Nuevo Díptico</span>
                        </Link>
                    </div>
                </div>

                {/* Saludo Personalizado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-bold text-[#f46e15] inline-flex items-center gap-1">
                            <Sparkles size={14} /> Club PanFree Fidelidad
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#334c2b] mt-0.5">
                            ¡Hola, {nombreUsuario.split(' ')[0]}!
                        </h1>
                        <p className="text-xs sm:text-sm text-[#8a7a6b]">
                            Acumulá puntos con tus compras y dípticos para canjear por premios deliciosos.
                        </p>
                    </div>
                </div>

                {/* ─── BANNER PRINCIPAL DE PUNTOS Y GAMIFICACIÓN ─── */}
                <section className="bg-white rounded-2xl shadow-sm border border-[#e8dfd3] p-6 sm:p-8 relative overflow-hidden transition-all duration-200">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#b7996b] via-[#f46e15] to-[#334c2b]" />

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Columna 1: Puntos Disponibles en Grande */}
                        <div className="md:col-span-4 bg-gradient-to-br from-[#fcfaf7] to-[#f5f1eb] rounded-2xl p-6 border border-[#e8dfd3] text-center flex flex-col justify-center items-center shadow-inner">
                            <span className="text-xs uppercase tracking-widest text-[#8a7a6b] font-bold mb-1">
                                Tus Puntos Disponibles
                            </span>
                            <div className="text-4xl sm:text-5xl font-black text-[#334c2b] tracking-tight my-1">
                                {puntosCliente.toLocaleString('es-PY')}
                            </div>
                            <span className="text-xs font-semibold text-[#f46e15] bg-[#f46e15]/10 px-3 py-1 rounded-full mt-2 inline-flex items-center gap-1">
                                <Sparkles size={12} /> Puntos PanFree
                            </span>
                        </div>

                        {/* Columna 2: Nivel Actual y Progreso */}
                        <div className="md:col-span-8 flex flex-col justify-between space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <span className="text-xs text-[#8a7a6b] font-medium block">Nivel Actual</span>
                                    <div className="inline-flex items-center gap-2 mt-0.5">
                                        <span className="text-2xl">{nivelActual.emoji}</span>
                                        <h2 className="text-2xl font-black text-[#334c2b]">
                                            Nivel {nivelActual.nombre}
                                        </h2>
                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${nivelActual.badge}`}>
                                            Activo
                                        </span>
                                    </div>
                                </div>

                                {siguienteNivel ? (
                                    <div className="text-left sm:text-right">
                                        <span className="text-xs text-[#8a7a6b]">Siguiente nivel:</span>
                                        <p className="text-xs font-bold text-[#334c2b]">
                                            {siguienteNivel.nombre} {siguienteNivel.emoji} ({siguienteNivel.puntosMin} pts)
                                        </p>
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold text-[#b8860b] bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                                        ¡Nivel Máximo VIP Alcanzado! 👑
                                    </span>
                                )}
                            </div>

                            {/* Barra de progreso */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-[#334c2b]">
                                    <span>Progreso hacia {siguienteNivel ? siguienteNivel.nombre : 'VIP'}</span>
                                    <span className="text-[#f46e15]">{progreso}%</span>
                                </div>
                                <div className="w-full h-3 bg-[#e8dfd3]/60 rounded-full overflow-hidden p-0.5">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#b7996b] via-[#f46e15] to-[#e05b0a] rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${progreso}%` }}
                                    />
                                </div>
                                {siguienteNivel && (
                                    <p className="text-[11px] text-[#8a7a6b] text-right">
                                        Te faltan <strong className="text-[#334c2b]">{puntosParaSiguiente} pts</strong> para subir de categoría.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Escala de Niveles Gamificada */}
                    <div className="mt-8 pt-6 border-t border-[#f0e9df]">
                        <span className="text-xs font-bold text-[#8a7a6b] uppercase tracking-wider block mb-3">
                            Escalera de Niveles
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {NIVELES.map((n) => {
                                const esActual = n.nombre === nivelActual.nombre
                                return (
                                    <div
                                        key={n.nombre}
                                        className={`p-3.5 rounded-xl border text-center transition-all duration-200 ${
                                            esActual
                                                ? 'bg-[#fcfaf7] border-[#f46e15] ring-2 ring-[#f46e15]/20 shadow-sm'
                                                : 'bg-white border-[#e8dfd3]/80 opacity-80'
                                        }`}
                                    >
                                        <div className="text-2xl mb-1">{n.emoji}</div>
                                        <div className={`font-bold text-sm ${esActual ? 'text-[#f46e15]' : 'text-[#334c2b]'}`}>
                                            {n.nombre}
                                        </div>
                                        <div className="text-[11px] text-[#8a7a6b] mt-0.5">
                                            {n.puntosMax === Infinity ? `${n.puntosMin}+ pts` : `${n.puntosMin} a ${n.puntosMax} pts`}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* Notificación de canje de premio */}
                {mensajePremio && (
                    <div className={`p-4 rounded-2xl border flex items-start gap-3 text-sm animate-fadeIn ${
                        mensajePremio.tipo === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                        {mensajePremio.tipo === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 space-y-2">
                            <p className="font-semibold">{mensajePremio.texto}</p>
                            {mensajePremio.cupon && (
                                <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs">
                                    <Tag size={15} className="text-emerald-700" />
                                    <span className="font-mono font-extrabold text-emerald-800 tracking-wider">
                                        {mensajePremio.cupon}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copiarCupon(mensajePremio.cupon)}
                                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 ml-1 inline-flex items-center gap-1 bg-emerald-100/60 px-2 py-0.5 rounded"
                                    >
                                        {cuponCopiado === mensajePremio.cupon ? <Check size={13} /> : <Copy size={13} />}
                                        <span>{cuponCopiado === mensajePremio.cupon ? 'Copiado' : 'Copiar'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── CATÁLOGO DE PREMIOS CANJEABLES ─── */}
                <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <span className="text-xs font-bold text-[#f46e15] uppercase tracking-wider">
                                Recompensas Disponibles
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#334c2b]">
                                Catálogo de Premios
                            </h2>
                        </div>
                        <p className="text-xs text-[#8a7a6b]">
                            Elegí tu premio favorito y canjealo al instante con tus puntos.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {premios.map((premio) => {
                            const costo = premio.costo_puntos || premio.puntos || 0
                            const puedeCanjear = puntosCliente >= costo
                            const procesandoEste = canjeandoPremioId === premio.id

                            return (
                                <div
                                    key={premio.id}
                                    className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                                        puedeCanjear
                                            ? 'border-[#b7996b] shadow-sm hover:shadow-md hover:border-[#f46e15]'
                                            : 'border-[#e8dfd3] opacity-85'
                                    }`}
                                >
                                    {puedeCanjear && (
                                        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-xs">
                                            ¡Listo para canjear!
                                        </div>
                                    )}

                                    <div>
                                        <div className="text-4xl mb-3">{premio.icono || '🎁'}</div>
                                        <h3 className="text-lg font-bold text-[#334c2b] mb-1">
                                            {premio.nombre}
                                        </h3>
                                        <p className="text-xs text-[#8a7a6b] leading-relaxed mb-4">
                                            {premio.descripcion}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-[#f0e9df] flex items-center justify-between gap-2">
                                        <div>
                                            <span className="text-xs text-[#8a7a6b] block">Costo</span>
                                            <span className="text-lg font-extrabold text-[#f46e15]">
                                                {costo} <span className="text-xs font-semibold text-[#8a7a6b]">pts</span>
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleCanjearPremio(premio)}
                                            disabled={!puedeCanjear || procesandoEste}
                                            className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                                                puedeCanjear
                                                    ? 'bg-[#f46e15] hover:bg-[#e05b0a] text-white active:scale-95 shadow-[#f46e15]/20'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                            }`}
                                        >
                                            {procesandoEste ? (
                                                <Loader2 size={15} className="animate-spin" />
                                            ) : puedeCanjear ? (
                                                <>
                                                    <Gift size={15} />
                                                    <span>Canjear</span>
                                                </>
                                            ) : (
                                                <span>Faltan {costo - puntosCliente} pts</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ─── HISTORIAL DE ACTIVIDAD (COLAPSABLE / ELEGANTE) ─── */}
                <section className="bg-white rounded-2xl border border-[#e8dfd3] shadow-sm overflow-hidden">
                    <button
                        onClick={() => setMostrarHistorial(!mostrarHistorial)}
                        className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-[#fcfaf7] transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#f5f1eb] text-[#334c2b] flex items-center justify-center">
                                <History size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#334c2b]">
                                    Historial de Puntos y Premios
                                </h3>
                                <p className="text-xs text-[#8a7a6b]">
                                    Consultá tus dípticos canjeados y cupones generados
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#f46e15]">
                            <span>{mostrarHistorial ? 'Ocultar historial' : 'Ver historial'}</span>
                            {mostrarHistorial ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </button>

                    {mostrarHistorial && (
                        <div className="p-6 pt-0 border-t border-[#f0e9df] grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {/* Dípticos Canjeados */}
                            <div className="bg-[#fcfaf7] p-4 rounded-xl border border-[#e8dfd3]">
                                <h4 className="text-xs font-bold text-[#334c2b] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <QrCode size={15} className="text-[#f46e15]" />
                                    Dípticos Físicos Canjeados
                                </h4>

                                {historialCanjes.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-[#8a7a6b]">
                                        <p>Aún no has canjeado ningún código de díptico.</p>
                                        <Link href="/canjear" className="text-[#f46e15] font-semibold mt-1 inline-block hover:underline">
                                            Canjear mi primer código →
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-[#e8dfd3] text-[#8a7a6b]">
                                                    <th className="py-2">Fecha</th>
                                                    <th className="py-2">Código</th>
                                                    <th className="py-2 text-right">Puntos</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#f0e9df]">
                                                {historialCanjes.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="py-2 text-[#8a7a6b]">
                                                            {new Date(item.created_at).toLocaleDateString('es-PY')}
                                                        </td>
                                                        <td className="py-2 font-mono font-bold text-[#334c2b]">
                                                            {item.codigos_dipticos?.codigo || 'DÍPTICO'}
                                                        </td>
                                                        <td className="py-2 text-right font-extrabold text-emerald-600">
                                                            +{item.puntos_ganados}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Premios y Cupones Canjeados */}
                            <div className="bg-[#fcfaf7] p-4 rounded-xl border border-[#e8dfd3]">
                                <h4 className="text-xs font-bold text-[#334c2b] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Tag size={15} className="text-emerald-700" />
                                    Premios y Cupones Obtenidos
                                </h4>

                                {historialPremios.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-[#8a7a6b]">
                                        <p>Cuando canjees premios, aquí verás tus cupones activos.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-[#e8dfd3] text-[#8a7a6b]">
                                                    <th className="py-2">Premio</th>
                                                    <th className="py-2">Cupón</th>
                                                    <th className="py-2 text-right">Puntos</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#f0e9df]">
                                                {historialPremios.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="py-2 font-medium text-[#334c2b]">
                                                            {item.premios?.nombre || 'Premio'}
                                                        </td>
                                                        <td className="py-2">
                                                            {item.cupon_generado ? (
                                                                <button
                                                                    onClick={() => copiarCupon(item.cupon_generado)}
                                                                    className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded inline-flex items-center gap-1"
                                                                >
                                                                    <span>{item.cupon_generado}</span>
                                                                    <Copy size={10} />
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 text-right font-extrabold text-rose-600">
                                                            -{item.puntos_gastados}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* Bases de la promoción footer link */}
                <div className="text-center pt-4">
                    <Link
                        href="/promocion-dipticos-bases"
                        className="text-xs text-[#8a7a6b] hover:text-[#f46e15] hover:underline"
                        target="_blank"
                    >
                        Ver Bases y Condiciones de la Promoción de Puntos →
                    </Link>
                </div>

            </div>
        </div>
    )
}
