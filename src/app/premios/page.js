/**
 * 📁 src/app/premios/page.js
 * Catálogo público de premios y recompensas del Club PanFree Fidelidad.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase-client'
import {
    Gift,
    Award,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    QrCode,
    Loader2,
    Crown,
    Star
} from 'lucide-react'

const PREMIOS_DEFAULT = [
    { id: 'p1', nombre: 'Descuento 10%', descripcion: '10% de descuento en tu próxima compra de panificados.', costo_puntos: 100, tipo: 'descuento', icono: '🛍️' },
    { id: 'p2', nombre: 'Delivery Gratis', descripcion: 'Envío sin costo en tu próximo pedido dentro de Encarnación.', costo_puntos: 150, tipo: 'delivery_gratis', icono: '🚚' },
    { id: 'p3', nombre: 'Budín de Naranja', descripcion: 'Budín artesanal de naranja 100% libre de gluten.', costo_puntos: 200, tipo: 'producto_gratis', icono: '🧁' },
    { id: 'p4', nombre: 'Muffin Surtido', descripcion: 'Caja de 6 muffins surtidos sin gluten.', costo_puntos: 250, tipo: 'producto_gratis', icono: '🧁' },
    { id: 'p5', nombre: 'Pan de Campo', descripcion: 'Pan de campo artesanal sin TACC (500g).', costo_puntos: 300, tipo: 'producto_gratis', icono: '🍞' },
]

export default function PremiosPublicosPage() {
    const router = useRouter()
    const { usuario, abrirModal } = useAuth()
    const [premios, setPremios] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const cargarPremios = async () => {
            try {
                const { data, error } = await supabase
                    .from('premios')
                    .select('*')
                    .eq('activo', true)
                    .order('costo_puntos', { ascending: true })

                if (!error && data && data.length > 0) {
                    const adaptados = data.map(p => ({
                        ...p,
                        icono: p.icono || (p.tipo === 'delivery_gratis' ? '🚚' : p.tipo === 'descuento' ? '🛍️' : '🍞')
                    }))
                    setPremios(adaptados)
                } else {
                    setPremios(PREMIOS_DEFAULT)
                }
            } catch (err) {
                console.error('Error al cargar premios públicos:', err)
                setPremios(PREMIOS_DEFAULT)
            } finally {
                setCargando(false)
            }
        }

        cargarPremios()
    }, [])

    const handleAccion = () => {
        if (usuario) {
            router.push('/perfil/puntos')
        } else if (abrirModal) {
            abrirModal()
        } else {
            router.push('/login?redirect=/perfil/puntos')
        }
    }

    return (
        <div className="min-h-screen bg-[#fcfaf7] text-[#2d1f14] py-10 px-4 sm:px-6 antialiased">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header superior */}
                <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#e8dfd3]/80">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#334c2b] hover:text-[#f46e15] transition"
                    >
                        <ArrowLeft size={16} />
                        <span>Volver a la Tienda</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/canjear"
                            className="inline-flex items-center gap-2 bg-white border border-[#e8dfd3] text-[#334c2b] hover:border-[#f46e15] text-xs font-bold px-3.5 py-2 rounded-xl transition"
                        >
                            <QrCode size={15} className="text-[#f46e15]" />
                            <span>Canjear Díptico</span>
                        </Link>

                        <button
                            onClick={handleAccion}
                            className="inline-flex items-center gap-2 bg-[#f46e15] hover:bg-[#e05b0a] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition"
                        >
                            <Sparkles size={15} />
                            <span>{usuario ? 'Ir a Mis Puntos' : 'Ingresar / Registrarme'}</span>
                        </button>
                    </div>
                </div>

                {/* Hero / Banner informativo */}
                <div className="bg-gradient-to-br from-[#334c2b] to-[#25391f] text-white rounded-3xl p-8 sm:p-10 shadow-md relative overflow-hidden">
                    <div className="max-w-2xl space-y-3 relative z-10">
                        <span className="text-xs uppercase tracking-widest font-bold text-[#f46e15] bg-white/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 backdrop-blur-xs">
                            <Gift size={13} /> Club PanFree Fidelidad
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Catálogo de Premios Exclusivos
                        </h1>
                        <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                            Descubrí todos los beneficios, productos sin gluten y descuentos que podés obtener canjeando tus puntos acumulados en PanFree.
                        </p>
                    </div>
                </div>

                {/* Grid de Premios */}
                {cargando ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#334c2b]">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-xs font-bold">Cargando recompensas...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {premios.map((premio) => {
                            const costo = premio.costo_puntos || premio.puntos || 0
                            return (
                                <div
                                    key={premio.id}
                                    className="bg-white rounded-2xl border border-[#e8dfd3] p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#b7996b] transition-all duration-200"
                                >
                                    <div>
                                        <div className="text-4xl mb-3">{premio.icono || '🎁'}</div>
                                        <h2 className="text-lg font-bold text-[#334c2b] mb-1">
                                            {premio.nombre}
                                        </h2>
                                        <p className="text-xs text-[#8a7a6b] leading-relaxed mb-4">
                                            {premio.descripcion}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-[#f0e9df] flex items-center justify-between gap-3">
                                        <div>
                                            <span className="text-[11px] text-[#8a7a6b] block font-medium">Requisito</span>
                                            <span className="text-lg font-extrabold text-[#f46e15]">
                                                {costo} <span className="text-xs font-semibold text-[#8a7a6b]">pts</span>
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAccion}
                                            className="bg-[#334c2b] hover:bg-[#25391f] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1 shadow-xs"
                                        >
                                            <span>Canjear</span>
                                            <ArrowRight size={13} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Footer y bases */}
                <div className="pt-6 text-center text-xs text-[#8a7a6b] space-y-2">
                    <p>
                        ¿Tenés un código de díptico físico?{' '}
                        <Link href="/canjear" className="text-[#f46e15] font-bold hover:underline">
                            Ingresalo aquí para sumar puntos
                        </Link>
                    </p>
                    <div>
                        <Link
                            href="/promocion-dipticos-bases"
                            className="hover:text-[#334c2b] transition underline"
                        >
                            Bases y Condiciones del Programa
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
