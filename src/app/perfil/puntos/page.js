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
import { calcularNivel, NIVELES_GAMIFICACION } from '@/lib/dipticos'
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
    Crown
} from 'lucide-react'

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
                // Crear cliente si no existe
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
                setPremios(premiosData)
            } else {
                // Fallback con premios por defecto
                setPremios([
                    { id: 'p1', nombre: '10% OFF', descripcion: '10% de descuento en tu próxima compra online', costo_puntos: 200, tipo: 'descuento', valor: '10', stock: 999 },
                    { id: 'p2', nombre: 'Pan de Molde Gratis', descripcion: 'Pan de molde artesanal sin gluten totalmente gratis', costo_puntos: 500, tipo: 'producto_gratis', valor: 'Pan de Molde', stock: 999 },
                    { id: 'p3', nombre: 'Delivery Gratis', descripcion: 'Envío gratis en tu próxima compra en Gran Encarnación', costo_puntos: 100, tipo: 'delivery_gratis', valor: '0', stock: 999 },
                    { id: 'p4', nombre: '20% OFF VIP', descripcion: '20% de descuento exclusivo en compras mayores a ₲ 100.000', costo_puntos: 800, tipo: 'descuento', valor: '20', stock: 999 }
                ])
            }

            // 3. Cargar historial de canjes de dípticos
            if (clienteData?.id) {
                const { data: hData } = await supabase
                    .from('canjes_dipticos')
                    .select('id, puntos_ganados, created_at, codigos_dipticos(codigo)')
                    .eq('cliente_id', clienteData.id)
                    .order('created_at', { ascending: false })
                    .limit(20)

                setHistorialCanjes(hData || [])

                // 4. Cargar historial de premios canjeados
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
                    texto: `🎉 ${data.mensaje}`,
                    cupon: data.cupon
                })
                // Actualizar estado local
                setCliente(prev => ({
                    ...prev,
                    puntos_fidelidad: data.puntosRestantes !== undefined ? data.puntosRestantes : (prev.puntos_fidelidad - premio.costo_puntos)
                }))
                // Recargar historiales
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
            <div style={{
                minHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#eee6d9',
                gap: '1rem',
                fontFamily: '"Segoe UI", sans-serif'
            }}>
                <Loader2 size={40} className="animate-spin" color="#334c2b" />
                <p style={{ color: '#334c2b', fontWeight: '600' }}>Cargando tus puntos y premios...</p>
            </div>
        )
    }

    if (!usuario) {
        return (
            <div style={{
                minHeight: '80vh',
                backgroundColor: '#eee6d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
                fontFamily: '"Segoe UI", sans-serif'
            }}>
                <div style={{
                    maxWidth: '440px',
                    width: '100%',
                    backgroundColor: '#ffffff',
                    padding: '2.5rem 2rem',
                    borderRadius: '12px',
                    border: '2px solid #b7996b',
                    textAlign: 'center',
                    boxShadow: '0 8px 30px rgba(51, 76, 43, 0.1)'
                }}>
                    <Award size={52} color="#f46e15" style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ margin: '0 0 0.5rem', color: '#334c2b', fontSize: '1.4rem' }}>
                        Club PanFree Fidelidad
                    </h2>
                    <p style={{ margin: '0 0 1.5rem', color: '#666', fontSize: '0.92rem', lineHeight: '1.5' }}>
                        Iniciá sesión para consultar tus puntos acumulados, subir de nivel y canjear premios exclusivos.
                    </p>
                    <button
                        onClick={() => abrirModal()}
                        style={{
                            width: '100%',
                            padding: '0.85rem',
                            backgroundColor: '#f46e15',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            minHeight: '48px',
                            boxShadow: '0 4px 12px rgba(244, 110, 21, 0.25)'
                        }}
                    >
                        Iniciar Sesión / Registrarme
                    </button>
                </div>
            </div>
        )
    }

    const puntosCliente = cliente?.puntos_fidelidad || 0
    const infoNivel = calcularNivel(puntosCliente)
    const { actual: nivelActual, siguiente: siguienteNivel, progreso, puntosParaSiguiente } = infoNivel

    return (
        <div style={{
            minHeight: '90vh',
            backgroundColor: '#eee6d9',
            padding: '2rem 1rem 4rem',
            fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>

                {/* Barra de navegación superior */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                }}>
                    <Link
                        href="/perfil"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            color: '#334c2b',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '0.9rem'
                        }}
                    >
                        <ArrowLeft size={18} />
                        <span>Volver a Mi Cuenta</span>
                    </Link>

                    <Link
                        href="/canjear"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#f46e15',
                            color: '#ffffff',
                            textDecoration: 'none',
                            padding: '0.6rem 1.1rem',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 8px rgba(244, 110, 21, 0.25)'
                        }}
                    >
                        <QrCode size={18} />
                        <span>Canjear Nuevo Díptico</span>
                    </Link>
                </div>

                {/* Banner Principal de Gamificación y Puntos */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '2px solid #b7996b',
                    padding: '2rem',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 20px rgba(51, 76, 43, 0.08)'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1.5rem',
                        alignItems: 'center'
                    }}>
                        {/* Columna 1: Puntos acumulados */}
                        <div style={{
                            backgroundColor: '#fdfbf7',
                            border: '1.5px solid #e0d5c5',
                            borderRadius: '10px',
                            padding: '1.5rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#8f9a44', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                                Tus Puntos Disponibles
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: '900', color: '#f46e15', lineHeight: '1.1' }}>
                                {puntosCliente.toLocaleString('es-PY')}
                            </div>
                            <div style={{ color: '#666', fontSize: '0.82rem', marginTop: '0.4rem' }}>
                                Cada díptico físico escaneado te suma +100 pts
                            </div>
                        </div>

                        {/* Columna 2: Nivel actual */}
                        <div style={{
                            backgroundColor: nivelActual.bg,
                            border: `1.5px solid ${nivelActual.color}40`,
                            borderRadius: '10px',
                            padding: '1.5rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>
                                {nivelActual.emoji}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#334c2b' }}>
                                Nivel {nivelActual.nombre}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.3rem' }}>
                                {siguienteNivel ? (
                                    <span>Te faltan <strong>{puntosParaSiguiente} pts</strong> para {siguienteNivel.nombre} {siguienteNivel.emoji}</span>
                                ) : (
                                    <span style={{ color: '#7c3aed', fontWeight: '700' }}>¡Has alcanzado el nivel máximo VIP!</span>
                                )}
                            </div>
                        </div>

                        {/* Columna 3: Progreso y Beneficios */}
                        <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '1.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', color: '#334c2b', marginBottom: '0.5rem' }}>
                                <span>Progreso de Nivel</span>
                                <span>{progreso}%</span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '10px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '5px',
                                overflow: 'hidden',
                                marginBottom: '1rem'
                            }}>
                                <div style={{
                                    width: `${progreso}%`,
                                    height: '100%',
                                    backgroundColor: '#f46e15',
                                    borderRadius: '5px',
                                    transition: 'width 0.4s ease'
                                }} />
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Star size={14} color="#f46e15" />
                                    <span>Canjeable por descuentos y productos</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Truck size={14} color="#334c2b" />
                                    <span>Envíos gratis disponibles desde 100 pts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Escala de Niveles */}
                    <div style={{
                        marginTop: '1.75rem',
                        paddingTop: '1.25rem',
                        borderTop: '1px solid #eee',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '0.75rem'
                    }}>
                        {NIVELES_GAMIFICACION.map((n) => {
                            const esNivelActual = n.id === nivelActual.id
                            return (
                                <div
                                    key={n.id}
                                    style={{
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: '8px',
                                        backgroundColor: esNivelActual ? n.bg : '#fafafa',
                                        border: `1.5px solid ${esNivelActual ? n.color : '#e5e7eb'}`,
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '1.2rem' }}>{n.emoji}</div>
                                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: esNivelActual ? '#334c2b' : '#6b7280' }}>
                                        {n.nombre}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                        {n.min} {n.max === Infinity ? '+ pts' : `a ${n.max} pts`}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Notificación de canje de premio */}
                {mensajePremio && (
                    <div style={{
                        backgroundColor: mensajePremio.tipo === 'success' ? '#e8f5e9' : '#ffebee',
                        border: `1px solid ${mensajePremio.tipo === 'success' ? '#a5d6a7' : '#ef9a9a'}`,
                        borderRadius: '8px',
                        padding: '1rem 1.25rem',
                        marginBottom: '1.5rem',
                        color: mensajePremio.tipo === 'success' ? '#1b5e20' : '#c62828',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                    }}>
                        {mensajePremio.tipo === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                {mensajePremio.texto}
                            </div>
                            {mensajePremio.cupon && (
                                <div style={{
                                    marginTop: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    backgroundColor: '#ffffff',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '6px',
                                    border: '1px dashed #2e7d32',
                                    width: 'fit-content'
                                }}>
                                    <Tag size={16} color="#2e7d32" />
                                    <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1rem', letterSpacing: '1px' }}>
                                        {mensajePremio.cupon}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copiarCupon(mensajePremio.cupon)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#2e7d32',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.2rem',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            padding: '0.2rem 0.4rem',
                                            borderRadius: '4px',
                                            backgroundColor: '#e8f5e9'
                                        }}
                                    >
                                        {cuponCopiado === mensajePremio.cupon ? <Check size={14} /> : <Copy size={14} />}
                                        <span>{cuponCopiado === mensajePremio.cupon ? 'Copiado' : 'Copiar'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Catálogo de Premios Canjeables */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                    }}>
                        <div>
                            <h2 style={{ margin: '0 0 0.2rem', color: '#334c2b', fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Gift size={22} color="#f46e15" />
                                <span>Catálogo de Premios</span>
                            </h2>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                                Seleccioná el premio que quieras canjear con tus puntos
                            </p>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1rem'
                    }}>
                        {premios.map((premio) => {
                            const puedeCanjear = puntosCliente >= premio.costo_puntos
                            const procesandoEste = canjeandoPremioId === premio.id

                            return (
                                <div
                                    key={premio.id}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        border: puedeCanjear ? '2px solid #b7996b' : '1px solid #e0d5c5',
                                        borderRadius: '10px',
                                        padding: '1.25rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        boxShadow: puedeCanjear ? '0 4px 12px rgba(183, 153, 107, 0.2)' : 'none',
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {puedeCanjear && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            backgroundColor: '#2e7d32',
                                            color: '#ffffff',
                                            fontSize: '0.68rem',
                                            fontWeight: '800',
                                            padding: '0.2rem 0.6rem',
                                            borderBottomLeftRadius: '8px',
                                            textTransform: 'uppercase'
                                        }}>
                                            ¡Disponible!
                                        </div>
                                    )}

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            {premio.tipo === 'descuento' && <Tag size={20} color="#f46e15" />}
                                            {premio.tipo === 'producto_gratis' && <ShoppingBag size={20} color="#334c2b" />}
                                            {premio.tipo === 'delivery_gratis' && <Truck size={20} color="#1565c0" />}
                                            <h3 style={{ margin: 0, color: '#334c2b', fontSize: '1.1rem', fontWeight: '800' }}>
                                                {premio.nombre}
                                            </h3>
                                        </div>
                                        <p style={{ margin: '0 0 1rem', color: '#555', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                            {premio.descripcion}
                                        </p>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingTop: '0.75rem',
                                        borderTop: '1px solid #f0ebe4'
                                    }}>
                                        <div>
                                            <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#f46e15' }}>
                                                {premio.costo_puntos}
                                            </span>
                                            <span style={{ fontSize: '0.78rem', color: '#888', marginLeft: '3px' }}>pts</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleCanjearPremio(premio)}
                                            disabled={!puedeCanjear || procesandoEste}
                                            style={{
                                                padding: '0.55rem 1rem',
                                                backgroundColor: puedeCanjear ? '#334c2b' : '#e0e0e0',
                                                color: puedeCanjear ? '#eee6d9' : '#9e9e9e',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: '700',
                                                fontSize: '0.85rem',
                                                cursor: puedeCanjear ? 'pointer' : 'not-allowed',
                                                minHeight: '38px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                transition: 'background-color 0.2s ease'
                                            }}
                                        >
                                            {procesandoEste ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                puedeCanjear ? 'Canjear' : `Faltan ${premio.costo_puntos - puntosCliente} pts`
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Historiales */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {/* Historial de Dípticos Canjeados */}
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        border: '1.5px solid #b7996b',
                        padding: '1.25rem',
                        boxShadow: '0 2px 10px rgba(51, 76, 43, 0.05)'
                    }}>
                        <h3 style={{ margin: '0 0 1rem', color: '#334c2b', fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <History size={18} color="#f46e15" />
                            <span>Dípticos Físicos Canjeados</span>
                        </h3>

                        {historialCanjes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#888', fontSize: '0.85rem' }}>
                                <QrCode size={32} color="#b7996b" style={{ margin: '0 auto 0.5rem' }} />
                                <p style={{ margin: '0 0 0.5rem' }}>Aún no has canjeado ningún código de díptico.</p>
                                <Link
                                    href="/canjear"
                                    style={{ color: '#f46e15', fontWeight: '700', textDecoration: 'none' }}
                                >
                                    Canjear mi primer código →
                                </Link>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1.5px solid #eee', color: '#666', textAlign: 'left' }}>
                                            <th style={{ padding: '0.4rem 0.5rem' }}>Fecha</th>
                                            <th style={{ padding: '0.4rem 0.5rem' }}>Código</th>
                                            <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Puntos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historialCanjes.map((item) => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '0.6rem 0.5rem', color: '#666' }}>
                                                    {new Date(item.created_at).toLocaleDateString('es-PY')}
                                                </td>
                                                <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace', fontWeight: '700', color: '#334c2b' }}>
                                                    {item.codigos_dipticos?.codigo || 'DÍPTICO'}
                                                </td>
                                                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: '800', color: '#2e7d32' }}>
                                                    +{item.puntos_ganados}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Historial de Premios Obtenidos */}
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        border: '1.5px solid #b7996b',
                        padding: '1.25rem',
                        boxShadow: '0 2px 10px rgba(51, 76, 43, 0.05)'
                    }}>
                        <h3 style={{ margin: '0 0 1rem', color: '#334c2b', fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Tag size={18} color="#2e7d32" />
                            <span>Premios y Cupones Canjeados</span>
                        </h3>

                        {historialPremios.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#888', fontSize: '0.85rem' }}>
                                <Gift size={32} color="#b7996b" style={{ margin: '0 auto 0.5rem' }} />
                                <p style={{ margin: 0 }}>Cuando canjees premios, aquí verás tus cupones activos.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1.5px solid #eee', color: '#666', textAlign: 'left' }}>
                                            <th style={{ padding: '0.4rem 0.5rem' }}>Premio</th>
                                            <th style={{ padding: '0.4rem 0.5rem' }}>Cupón</th>
                                            <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Puntos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historialPremios.map((item) => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '0.6rem 0.5rem', fontWeight: '600', color: '#334c2b' }}>
                                                    {item.premios?.nombre || 'Premio'}
                                                </td>
                                                <td style={{ padding: '0.6rem 0.5rem' }}>
                                                    {item.cupon_generado ? (
                                                        <button
                                                            onClick={() => copiarCupon(item.cupon_generado)}
                                                            title="Copiar cupón"
                                                            style={{
                                                                fontFamily: 'monospace',
                                                                fontWeight: '700',
                                                                fontSize: '0.78rem',
                                                                backgroundColor: '#f0f5ee',
                                                                color: '#2e7d32',
                                                                border: '1px dashed #a5d6a7',
                                                                padding: '0.2rem 0.4rem',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem'
                                                            }}
                                                        >
                                                            <span>{item.cupon_generado}</span>
                                                            <Copy size={12} />
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: '800', color: '#c62828' }}>
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

            </div>
        </div>
    )
}
