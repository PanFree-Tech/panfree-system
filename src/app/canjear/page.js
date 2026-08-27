/**
 * 📁 src/app/canjear/page.js
 * Landing page para escanear y canjear códigos de dípticos físicos con QR
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase-client'
import {
    QrCode,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Award,
    Gift,
    ShieldCheck,
    Lock,
    LogIn,
    ChevronRight,
    Loader2
} from 'lucide-react'

function CanjearContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { usuario, abrirModal, estaAutenticado, loading: authLoading } = useAuth()

    const [codigo, setCodigo] = useState('')
    const [cargando, setCargando] = useState(false)
    const [mensaje, setMensaje] = useState(null)
    const [cliente, setCliente] = useState(null)
    const [canjeExitoso, setCanjeExitoso] = useState(null)

    // Leer código desde query params si vino por escaneo de QR (ej: /canjear?codigo=A7K3P9)
    useEffect(() => {
        const queryCode = searchParams?.get('codigo')
        if (queryCode) {
            setCodigo(queryCode.trim().toUpperCase().slice(0, 6))
        }
    }, [searchParams])

    // Cargar perfil del cliente si está autenticado
    useEffect(() => {
        if (!usuario) {
            setCliente(null)
            return
        }

        async function cargarCliente() {
            try {
                const { data, error } = await supabase
                    .from('clientes')
                    .select('id, nombre_completo, email, puntos_fidelidad, nivel_cliente')
                    .eq('user_id', usuario.id)
                    .maybeSingle()

                if (!error && data) {
                    setCliente(data)
                }
            } catch (err) {
                console.error('Error cargando datos de cliente:', err)
            }
        }

        cargarCliente()
    }, [usuario])

    const handleCanjear = async (e) => {
        if (e) e.preventDefault()

        const codigoLimpio = codigo.trim().toUpperCase()
        if (codigoLimpio.length !== 6) {
            setMensaje({
                tipo: 'error',
                texto: 'El código debe tener exactamente 6 caracteres alfanuméricos.'
            })
            return
        }

        if (!usuario) {
            setMensaje({
                tipo: 'info',
                texto: 'Iniciá sesión o registrate para acreditar tus puntos a tu cuenta.'
            })
            abrirModal(() => {
                // Callback post-login: reintentar canje
                setMensaje(null)
            })
            return
        }

        setCargando(true)
        setMensaje(null)
        setCanjeExitoso(null)

        try {
            const res = await fetch('/api/dipticos/canjear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigo: codigoLimpio,
                    userId: usuario.id,
                    clienteId: cliente?.id || null
                })
            })

            const data = await res.json()

            if (res.status === 401 || data.requiereLogin) {
                setMensaje({
                    tipo: 'error',
                    texto: 'Tu sesión expiró o debes iniciar sesión para continuar.'
                })
                abrirModal()
                return
            }

            if (data.success) {
                setCanjeExitoso({
                    puntos: data.puntos || 100,
                    codigo: codigoLimpio
                })
                setMensaje({
                    tipo: 'success',
                    texto: `🎉 ¡Felicitaciones! Has canjeado el código ${codigoLimpio} y sumaste +${data.puntos || 100} puntos de fidelidad.`
                })
                setCodigo('')

                // Recargar puntos del cliente
                if (usuario) {
                    const { data: updatedCliente } = await supabase
                        .from('clientes')
                        .select('id, nombre_completo, email, puntos_fidelidad, nivel_cliente')
                        .eq('user_id', usuario.id)
                        .maybeSingle()

                    if (updatedCliente) {
                        setCliente(updatedCliente)
                    }
                }
            } else {
                setMensaje({
                    tipo: 'error',
                    texto: data.mensaje || data.error || 'No se pudo canjear el código ingresado.'
                })
            }
        } catch (error) {
            console.error('Error en handleCanjear:', error)
            setMensaje({
                tipo: 'error',
                texto: 'Ocurrió un error de red al procesar tu solicitud. Verificá tu conexión.'
            })
        } finally {
            setCargando(false)
        }
    }

    return (
        <div style={{
            minHeight: '85vh',
            backgroundColor: '#eee6d9',
            padding: '2rem 1rem 4rem',
            fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            <div style={{
                maxWidth: '540px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '2px solid #b7996b',
                boxShadow: '0 8px 30px rgba(51, 76, 43, 0.12)',
                overflow: 'hidden'
            }}>
                {/* Encabezado Principal */}
                <div style={{
                    backgroundColor: '#334c2b',
                    color: '#eee6d9',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    borderBottom: '3px solid #b7996b'
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(238, 230, 217, 0.15)',
                        border: '2px solid #b7996b',
                        marginBottom: '0.75rem'
                    }}>
                        <QrCode size={34} color="#eee6d9" />
                    </div>
                    <h1 style={{
                        margin: '0 0 0.4rem',
                        fontSize: '1.6rem',
                        fontWeight: '800',
                        color: '#eee6d9',
                        letterSpacing: '-0.3px'
                    }}>
                        PanFree Club
                    </h1>
                    <p style={{
                        margin: 0,
                        color: '#d0c5b4',
                        fontSize: '0.95rem',
                        fontWeight: '500'
                    }}>
                        Canjeá el código de tu díptico y sumá puntos
                    </p>
                </div>

                <div style={{ padding: '1.75rem' }}>
                    {/* Tarjeta de instrucciones paso a paso */}
                    <div style={{
                        backgroundColor: '#fbf8f3',
                        border: '1.5px dashed #b7996b',
                        borderRadius: '8px',
                        padding: '1rem 1.25rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#334c2b',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            marginBottom: '0.6rem'
                        }}>
                            <Sparkles size={18} color="#f46e15" />
                            <span>¿Cómo funciona?</span>
                        </div>
                        <ol style={{
                            margin: 0,
                            paddingLeft: '1.2rem',
                            color: '#4a5540',
                            fontSize: '0.88rem',
                            lineHeight: '1.6'
                        }}>
                            <li>Buscá el código alfanumérico impreso en tu díptico PanFree.</li>
                            <li>Ingresalo en el campo inferior de 6 dígitos.</li>
                            <li>¡Sumás <strong>+100 puntos</strong> inmediatamente para canjear por premios!</li>
                        </ol>
                    </div>

                    {/* Estado del usuario logueado */}
                    {usuario ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#f0f5ee',
                            border: '1px solid #a5d6a7',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#2e7d32', fontWeight: '700' }}>
                                    SESIÓN ACTIVA
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#334c2b', fontWeight: '600' }}>
                                    {usuario.email}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.78rem', color: '#666' }}>Tus puntos</div>
                                <div style={{ fontSize: '1.1rem', color: '#f46e15', fontWeight: '800' }}>
                                    {cliente?.puntos_fidelidad ?? '...'} pts
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: '#fff8e1',
                            border: '1px solid #ffe082',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lock size={18} color="#e65100" />
                                <span style={{ fontSize: '0.86rem', color: '#8d4f00' }}>
                                    Iniciá sesión para guardar tus puntos.
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => abrirModal()}
                                style={{
                                    backgroundColor: '#334c2b',
                                    color: '#eee6d9',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.82rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Ingresar
                            </button>
                        </div>
                    )}

                    {/* Formulario de canje */}
                    <form onSubmit={handleCanjear}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{
                                display: 'block',
                                color: '#334c2b',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.4rem'
                            }}>
                                Código del Díptico (6 caracteres)
                            </label>
                            <input
                                id="input-codigo-diptico"
                                type="text"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 6))}
                                placeholder="Ej: A7K3P9"
                                maxLength={6}
                                autoFocus
                                disabled={cargando}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem 1rem',
                                    fontSize: '1.6rem',
                                    fontWeight: '800',
                                    textAlign: 'center',
                                    letterSpacing: '6px',
                                    fontFamily: 'monospace',
                                    color: '#334c2b',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #b7996b',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    textTransform: 'uppercase',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)'
                                }}
                            />
                        </div>

                        <button
                            id="btn-canjear-diptico"
                            type="submit"
                            disabled={cargando || codigo.trim().length === 0}
                            style={{
                                width: '100%',
                                padding: '0.9rem 1.5rem',
                                backgroundColor: cargando ? '#8f9a44' : '#f46e15',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1.05rem',
                                fontWeight: '800',
                                cursor: (cargando || codigo.trim().length === 0) ? 'not-allowed' : 'pointer',
                                opacity: (cargando || codigo.trim().length === 0) ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.6rem',
                                minHeight: '48px',
                                boxShadow: '0 4px 12px rgba(244, 110, 21, 0.25)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {cargando ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Verificando código...</span>
                                </>
                            ) : (
                                <>
                                    <Gift size={20} />
                                    <span>Canjear y Sumar +100 Pts</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Mensaje de retroalimentación */}
                    {mensaje && (
                        <div style={{
                            marginTop: '1.25rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.6rem',
                            fontSize: '0.9rem',
                            backgroundColor: mensaje.tipo === 'success' ? '#e8f5e9' : mensaje.tipo === 'info' ? '#e3f2fd' : '#ffebee',
                            color: mensaje.tipo === 'success' ? '#1b5e20' : mensaje.tipo === 'info' ? '#0d47a1' : '#c62828',
                            border: `1px solid ${mensaje.tipo === 'success' ? '#a5d6a7' : mensaje.tipo === 'info' ? '#90caf9' : '#ef9a9a'}`
                        }}>
                            {mensaje.tipo === 'success' ? (
                                <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                            ) : (
                                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                            )}
                            <div style={{ flex: 1, lineHeight: '1.4' }}>
                                {mensaje.texto}
                            </div>
                        </div>
                    )}

                    {/* Éxito: Enlaces rápidos a Dashboard de Puntos y Catálogo */}
                    {canjeExitoso && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.25rem',
                            backgroundColor: '#fbf8f3',
                            border: '1.5px solid #b7996b',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <Award size={32} color="#f46e15" style={{ margin: '0 auto 0.5rem' }} />
                            <h3 style={{ margin: '0 0 0.4rem', color: '#334c2b', fontSize: '1.1rem' }}>
                                ¡Tus puntos ya están acreditados!
                            </h3>
                            <p style={{ margin: '0 0 1rem', color: '#666', fontSize: '0.85rem' }}>
                                Podés consultar tu saldo de puntos acumulados, nivel actual y canjear premios exclusivos.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link
                                    href="/perfil/puntos"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.6rem 1.2rem',
                                        backgroundColor: '#334c2b',
                                        color: '#eee6d9',
                                        textDecoration: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '700',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <span>Ver mis puntos y premios</span>
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    href="/"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.6rem 1.2rem',
                                        backgroundColor: 'transparent',
                                        color: '#334c2b',
                                        border: '1.5px solid #334c2b',
                                        textDecoration: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '700',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Ir a la tienda
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Accesos al pie */}
                    <div style={{
                        marginTop: '2rem',
                        paddingTop: '1.25rem',
                        borderTop: '1px solid #e0d5c5',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                    }}>
                        <Link
                            href="/perfil/puntos"
                            style={{
                                color: '#334c2b',
                                textDecoration: 'none',
                                fontSize: '0.88rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                        >
                            <Award size={16} color="#f46e15" />
                            <span>Dashboard de Puntos</span>
                            <ChevronRight size={14} />
                        </Link>

                        <Link
                            href="/"
                            style={{
                                color: '#8f9a44',
                                textDecoration: 'none',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                            }}
                        >
                            Volver a PanFree
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CanjearPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee6d9' }}>
                <Loader2 size={36} className="animate-spin" color="#334c2b" />
            </div>
        }>
            <CanjearContent />
        </Suspense>
    )
}
