/**
 * 📁 src/app/admin/dipticos/page.js
 * Panel administrativo completo para gestión, generación por lotes,
 * exportación, impresión QR y analíticas de Códigos de Dípticos PanFree.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase-client'
import { generarLoteCantidad, getEstadisticas } from '@/lib/dipticos'
import {
    QrCode,
    Plus,
    Download,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    Printer,
    Copy,
    Check,
    RefreshCw,
    Loader2,
    FileSpreadsheet,
    Calendar,
    Users,
    Gift,
    Sparkles,
    AlertCircle,
    ExternalLink
} from 'lucide-react'

export default function DipticosAdminPage() {
    const [codigos, setCodigos] = useState([])
    const [estadisticas, setEstadisticas] = useState({ total: 0, activos: 0, canjeados: 0, lotes: 0, tasaCanje: '0%' })
    const [cantidad, setCantidad] = useState(50)
    const [nombreLote, setNombreLote] = useState('')
    const [diasValidez, setDiasValidez] = useState(365)
    const [cargando, setCargando] = useState(true)
    const [generando, setGenerando] = useState(false)
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [loteSeleccionado, setLoteSeleccionado] = useState('todos')
    const [modalImprimir, setModalImprimir] = useState(false)
    const [copiadoId, setCopiadoId] = useState(null)
    const [notificacion, setNotificacion] = useState(null)

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const { data, error } = await supabase
                .from('codigos_dipticos')
                .select(`
                    *,
                    clientes:canjeado_por (
                        id,
                        nombre_completo,
                        email
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(500)

            if (!error && data) {
                setCodigos(data)
            }

            const stats = await getEstadisticas()
            setEstadisticas(stats)
        } catch (err) {
            console.error('Error cargando códigos de dípticos:', err)
        } finally {
            setCargando(false)
        }
    }

    const generarLote = async (e) => {
        if (e) e.preventDefault()
        const cant = Math.max(1, Math.min(1000, Number(cantidad) || 50))
        setGenerando(true)
        setNotificacion(null)

        try {
            const lotePersonalizado = nombreLote.trim() || `LOTE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
            const { codigos: codigosAGuardar } = await generarLoteCantidad(cant, lotePersonalizado, diasValidez)

            const { data, error } = await supabase
                .from('codigos_dipticos')
                .insert(codigosAGuardar)
                .select()

            if (error) {
                console.error('Error insertando lote en BD:', error)
                alert(`Error al generar lote: ${error.message}`)
            } else {
                setNotificacion({
                    tipo: 'success',
                    texto: `✅ Se generó con éxito el lote "${lotePersonalizado}" con ${cant} códigos de 6 caracteres.`
                })
                setNombreLote('')
                cargarDatos()
            }
        } catch (err) {
            console.error('Error en generación de lote:', err)
            alert('Ocurrió un error al generar los códigos.')
        } finally {
            setGenerando(false)
        }
    }

    // Lista única de lotes existentes
    const listaLotes = useMemo(() => {
        const lotes = new Set()
        codigos.forEach(c => {
            if (c.lote_id) lotes.add(c.lote_id)
        })
        return Array.from(lotes)
    }, [codigos])

    // Filtrado de códigos
    const codigosFiltrados = useMemo(() => {
        return codigos.filter(c => {
            if (filtroEstado === 'activos' && c.canjeado) return false
            if (filtroEstado === 'canjeados' && !c.canjeado) return false
            if (loteSeleccionado !== 'todos' && c.lote_id !== loteSeleccionado) return false

            if (busqueda.trim()) {
                const q = busqueda.toLowerCase().trim()
                const matchCodigo = c.codigo.toLowerCase().includes(q)
                const matchLote = (c.lote_id || '').toLowerCase().includes(q)
                const matchCliente = (c.clientes?.nombre_completo || c.clientes?.email || '').toLowerCase().includes(q)
                if (!matchCodigo && !matchLote && !matchCliente) return false
            }

            return true
        })
    }, [codigos, filtroEstado, loteSeleccionado, busqueda])

    // Exportar CSV
    const exportarCSV = () => {
        if (codigosFiltrados.length === 0) {
            alert('No hay códigos para exportar con los filtros seleccionados.')
            return
        }

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://panfree.com'
        const encabezados = ['Codigo', 'Lote', 'Estado', 'URL_Canje_QR', 'Canjeado_Por', 'Fecha_Canje', 'Fecha_Expiracion', 'Fecha_Creacion']
        const filas = codigosFiltrados.map(c => [
            c.codigo,
            c.lote_id || 'N/A',
            c.canjeado ? 'Canjeado' : 'Activo',
            `${baseUrl}/canjear?codigo=${c.codigo}`,
            c.clientes?.email || c.clientes?.nombre_completo || c.canjeado_por || '',
            c.canjeado_en ? new Date(c.canjeado_en).toLocaleString('es-PY') : '',
            c.fecha_expiracion ? new Date(c.fecha_expiracion).toLocaleDateString('es-PY') : '',
            new Date(c.created_at).toLocaleString('es-PY')
        ])

        const csvContent = 'data:text/csv;charset=utf-8,' + [
            encabezados.join(','),
            ...filas.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n')

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `panfree_codigos_dipticos_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const copiarAlPortapapeles = (texto, id) => {
        navigator.clipboard.writeText(texto)
        setCopiadoId(id)
        setTimeout(() => setCopiadoId(null), 2500)
    }

    return (
        <div style={{ padding: '1.5rem', fontFamily: '"Segoe UI", sans-serif', maxWidth: '1300px', margin: '0 auto' }}>
            {/* Header del Panel */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div>
                    <h1 style={{
                        margin: '0 0 0.25rem',
                        fontSize: '1.75rem',
                        fontWeight: '800',
                        color: '#334c2b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                    }}>
                        <QrCode size={28} color="#f46e15" />
                        <span>Gestión de Dípticos y Fidelidad</span>
                    </h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                        Generación de lotes con códigos de 6 dígitos para dípticos impresos y seguimiento de canjes.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={cargarDatos}
                        disabled={cargando}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.6rem 1rem',
                            backgroundColor: '#ffffff',
                            color: '#334c2b',
                            border: '1.5px solid #b7996b',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.88rem',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
                        <span>Actualizar</span>
                    </button>

                    <button
                        onClick={exportarCSV}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.6rem 1rem',
                            backgroundColor: '#334c2b',
                            color: '#eee6d9',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '0.88rem',
                            cursor: 'pointer'
                        }}
                    >
                        <FileSpreadsheet size={16} />
                        <span>Exportar CSV ({codigosFiltrados.length})</span>
                    </button>

                    <button
                        onClick={() => setModalImprimir(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.6rem 1rem',
                            backgroundColor: '#f46e15',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '0.88rem',
                            cursor: 'pointer'
                        }}
                    >
                        <Printer size={16} />
                        <span>Vista Imprimible QR</span>
                    </button>
                </div>
            </div>

            {/* Notificación de éxito */}
            {notificacion && (
                <div style={{
                    backgroundColor: '#e8f5e9',
                    border: '1px solid #a5d6a7',
                    borderRadius: '8px',
                    padding: '0.85rem 1.25rem',
                    marginBottom: '1.5rem',
                    color: '#1b5e20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span>{notificacion.texto}</span>
                    <button
                        onClick={() => setNotificacion(null)}
                        style={{ background: 'none', border: 'none', color: '#1b5e20', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Métricas Principales */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.75rem'
            }}>
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '1.5px solid #e0d5c5',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ fontSize: '0.82rem', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>
                        Total Códigos
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#334c2b', marginTop: '0.2rem' }}>
                        {estadisticas.total}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.2rem' }}>
                        En {estadisticas.lotes} lotes generados
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '1.5px solid #a5d6a7',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ fontSize: '0.82rem', color: '#2e7d32', fontWeight: '700', textTransform: 'uppercase' }}>
                        Activos (Disponibles)
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2e7d32', marginTop: '0.2rem' }}>
                        {estadisticas.activos}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.2rem' }}>
                        Listos para escanear en dípticos
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '1.5px solid #b7996b',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ fontSize: '0.82rem', color: '#f46e15', fontWeight: '700', textTransform: 'uppercase' }}>
                        Canjeados
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f46e15', marginTop: '0.2rem' }}>
                        {estadisticas.canjeados}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.2rem' }}>
                        Tasa de canje: <strong>{estadisticas.tasaCanje}</strong>
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '1.5px solid #e0d5c5',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ fontSize: '0.82rem', color: '#8f9a44', fontWeight: '700', textTransform: 'uppercase' }}>
                        Puntos Distribuidos
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#8f9a44', marginTop: '0.2rem' }}>
                        {(estadisticas.canjeados * 100).toLocaleString('es-PY')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.2rem' }}>
                        +100 pts por cada canje realizado
                    </div>
                </div>
            </div>

            {/* Generador de Lote de Códigos */}
            <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #b7996b',
                borderRadius: '10px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 12px rgba(51, 76, 43, 0.05)'
            }}>
                <h2 style={{
                    margin: '0 0 1rem',
                    fontSize: '1.15rem',
                    fontWeight: '800',
                    color: '#334c2b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Sparkles size={20} color="#f46e15" />
                    <span>Generador de Lotes para Impresión de Dípticos</span>
                </h2>

                <form onSubmit={generarLote} style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem',
                    alignItems: 'flex-end'
                }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334c2b', marginBottom: '0.3rem' }}>
                            Cantidad de Códigos
                        </label>
                        <select
                            value={cantidad}
                            onChange={(e) => setCantidad(Number(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '0.65rem 0.8rem',
                                border: '1.5px solid #b7996b',
                                borderRadius: '6px',
                                fontSize: '0.92rem',
                                backgroundColor: '#ffffff',
                                color: '#334c2b',
                                fontWeight: '600'
                            }}
                        >
                            <option value={10}>10 códigos (Prueba)</option>
                            <option value={50}>50 códigos (Estándar)</option>
                            <option value={100}>100 códigos (Recomendado)</option>
                            <option value={250}>250 códigos (Tirada mediana)</option>
                            <option value={500}>500 códigos (Gran tirada)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334c2b', marginBottom: '0.3rem' }}>
                            Identificador de Lote (Opcional)
                        </label>
                        <input
                            type="text"
                            value={nombreLote}
                            onChange={(e) => setNombreLote(e.target.value)}
                            placeholder="Ej: LOTE-PAN-SEPTIEMBRE"
                            style={{
                                width: '100%',
                                padding: '0.65rem 0.8rem',
                                border: '1.5px solid #b7996b',
                                borderRadius: '6px',
                                fontSize: '0.92rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334c2b', marginBottom: '0.3rem' }}>
                            Validez del Código
                        </label>
                        <select
                            value={diasValidez}
                            onChange={(e) => setDiasValidez(Number(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '0.65rem 0.8rem',
                                border: '1.5px solid #b7996b',
                                borderRadius: '6px',
                                fontSize: '0.92rem',
                                backgroundColor: '#ffffff',
                                color: '#334c2b'
                            }}
                        >
                            <option value={90}>90 días (3 meses)</option>
                            <option value={180}>180 días (6 meses)</option>
                            <option value={365}>365 días (1 año)</option>
                            <option value={730}>730 días (2 años)</option>
                        </select>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={generando}
                            style={{
                                width: '100%',
                                padding: '0.7rem 1.2rem',
                                backgroundColor: generando ? '#999' : '#f46e15',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                cursor: generando ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                minHeight: '42px',
                                boxShadow: '0 2px 8px rgba(244, 110, 21, 0.25)'
                            }}
                        >
                            {generando ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Generando...</span>
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    <span>Generar {cantidad} Códigos</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Filtros y Búsqueda */}
            <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e0d5c5',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                    {/* Input búsqueda */}
                    <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
                        <Search size={16} color="#999" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar código, lote o cliente..."
                            style={{
                                width: '100%',
                                padding: '0.55rem 0.8rem 0.55rem 2.2rem',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                fontSize: '0.88rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Filtro estado */}
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {[
                            { id: 'todos', label: 'Todos' },
                            { id: 'activos', label: 'Activos' },
                            { id: 'canjeados', label: 'Canjeados' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFiltroEstado(f.id)}
                                style={{
                                    padding: '0.45rem 0.8rem',
                                    border: '1px solid #b7996b',
                                    borderRadius: '6px',
                                    fontSize: '0.82rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: filtroEstado === f.id ? '#334c2b' : '#ffffff',
                                    color: filtroEstado === f.id ? '#eee6d9' : '#334c2b'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Filtro Lote */}
                    {listaLotes.length > 0 && (
                        <select
                            value={loteSeleccionado}
                            onChange={(e) => setLoteSeleccionado(e.target.value)}
                            style={{
                                padding: '0.5rem 0.8rem',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                backgroundColor: '#ffffff',
                                color: '#334c2b'
                            }}
                        >
                            <option value="todos">Todos los lotes ({listaLotes.length})</option>
                            {listaLotes.map(lote => (
                                <option key={lote} value={lote}>{lote}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                    Mostrando {codigosFiltrados.length} de {codigos.length} códigos
                </div>
            </div>

            {/* Tabla de Códigos */}
            <div style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #b7996b',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#334c2b', color: '#eee6d9', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Código</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Lote</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Canjeado Por</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Fecha Canje</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Expiración</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#666' }}>
                                        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                                        <span>Cargando códigos de dípticos...</span>
                                    </td>
                                </tr>
                            ) : codigosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                                        <QrCode size={36} color="#ccc" style={{ margin: '0 auto 0.5rem' }} />
                                        <p style={{ margin: 0, fontWeight: '600' }}>No se encontraron códigos con los filtros seleccionados.</p>
                                    </td>
                                </tr>
                            ) : (
                                codigosFiltrados.map((c) => {
                                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                                    const urlCanje = `${baseUrl}/canjear?codigo=${c.codigo}`
                                    const copiado = copiadoId === c.id

                                    return (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                                            {/* Código */}
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{
                                                        fontFamily: 'monospace',
                                                        fontWeight: '800',
                                                        fontSize: '1rem',
                                                        letterSpacing: '1px',
                                                        color: '#334c2b',
                                                        backgroundColor: '#f5f0e8',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '4px',
                                                        border: '1px solid #e0d5c5'
                                                    }}>
                                                        {c.codigo}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copiarAlPortapapeles(c.codigo, c.id)}
                                                        title="Copiar código"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '2px' }}
                                                    >
                                                        {copiado ? <Check size={14} color="#2e7d32" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Estado */}
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    padding: '0.25rem 0.65rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: '700',
                                                    backgroundColor: c.canjeado ? '#e8f5e9' : '#e3f2fd',
                                                    color: c.canjeado ? '#2e7d32' : '#1565c0'
                                                }}>
                                                    {c.canjeado ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                                                    <span>{c.canjeado ? 'Canjeado (+100 pts)' : 'Activo'}</span>
                                                </span>
                                            </td>

                                            {/* Lote */}
                                            <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '0.82rem' }}>
                                                {c.lote_id || '—'}
                                            </td>

                                            {/* Canjeado Por */}
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {c.clientes ? (
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#334c2b' }}>
                                                            {c.clientes.nombre_completo || 'Cliente'}
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', color: '#888' }}>
                                                            {c.clientes.email}
                                                        </div>
                                                    </div>
                                                ) : c.canjeado_por ? (
                                                    <span style={{ fontSize: '0.8rem', color: '#888', fontFamily: 'monospace' }}>
                                                        {c.canjeado_por.slice(0, 8)}...
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#aaa' }}>—</span>
                                                )}
                                            </td>

                                            {/* Fecha Canje */}
                                            <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '0.82rem' }}>
                                                {c.canjeado_en ? new Date(c.canjeado_en).toLocaleString('es-PY') : '—'}
                                            </td>

                                            {/* Fecha Expiración */}
                                            <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '0.82rem' }}>
                                                {c.fecha_expiracion ? new Date(c.fecha_expiracion).toLocaleDateString('es-PY') : '—'}
                                            </td>

                                            {/* Acciones */}
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                <a
                                                    href={urlCanje}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Probar landing de canje"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.2rem',
                                                        color: '#f46e15',
                                                        textDecoration: 'none',
                                                        fontWeight: '600',
                                                        fontSize: '0.82rem'
                                                    }}
                                                >
                                                    <span>Probar</span>
                                                    <ExternalLink size={13} />
                                                </a>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal / Vista de Impresión para Dípticos */}
            {modalImprimir && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        maxWidth: '850px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '2rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#334c2b', fontSize: '1.3rem', fontWeight: '800' }}>
                                    🖨️ Formato de Tarjetas para Dípticos Físicos
                                </h2>
                                <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.85rem' }}>
                                    Mostrando {Math.min(24, codigosFiltrados.length)} tarjetas listas para corte e inserción en dípticos.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => window.print()}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#334c2b',
                                        color: '#eee6d9',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Imprimir
                                </button>
                                <button
                                    onClick={() => setModalImprimir(false)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#eee',
                                        color: '#333',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        {/* Grilla imprimible de tarjetas */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '1rem'
                        }}>
                            {codigosFiltrados.slice(0, 24).map(c => {
                                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'https://panfree.com'}/canjear?codigo=${c.codigo}`)}`
                                return (
                                    <div
                                        key={c.id}
                                        style={{
                                            border: '1.5px dashed #b7996b',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            textAlign: 'center',
                                            backgroundColor: '#fdfbf7',
                                            pageBreakInside: 'avoid'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#334c2b', letterSpacing: '0.5px' }}>
                                            PANFREE SIN GLUTEN
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#f46e15', fontWeight: '700', marginBottom: '0.4rem' }}>
                                            ¡GANÁ 100 PUNTOS DE REGALO!
                                        </div>

                                        {/* QR */}
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}>
                                            <img
                                                src={qrUrl}
                                                alt={`QR ${c.codigo}`}
                                                width={100}
                                                height={100}
                                                style={{ border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff', padding: '4px' }}
                                            />
                                        </div>

                                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>
                                            Escaneá o ingresá en <strong>/canjear</strong>
                                        </div>
                                        <div style={{
                                            fontFamily: 'monospace',
                                            fontWeight: '900',
                                            fontSize: '1.15rem',
                                            color: '#334c2b',
                                            letterSpacing: '2px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #b7996b',
                                            borderRadius: '4px',
                                            padding: '0.2rem'
                                        }}>
                                            {c.codigo}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
