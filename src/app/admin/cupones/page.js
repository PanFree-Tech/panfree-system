'use client'

/**
 * 📁 src/app/admin/cupones/page.js
 * Panel de Administración de Cupones de Descuento y Fidelización PanFree
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Tag,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Pencil,
  Copy,
  Sparkles,
  Percent,
  DollarSign,
  AlertCircle,
  Users,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../../../lib/supabase-client'
import { S, COLORS } from '../_styles'
import { formatPYG } from '../lib/helpers'

const FORM_VACIO = {
  codigo: '',
  descripcion: '',
  tipo_descuento: 'porcentaje',
  valor_descuento: '',
  monto_minimo_compra: '0',
  limite_usos_total: '',
  limite_por_cliente: '1',
  fecha_expiracion: '',
  activo: true,
}

export default function PaginaCuponesAdmin() {
  const router = useRouter()
  const [cupones, setCupones] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos') // todos | activos | inactivos
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)
  const [canjesModal, setCanjesModal] = useState(null)
  const [canjesData, setCanjesData] = useState([])
  const [cargandoCanjes, setCargandoCanjes] = useState(false)

  useEffect(() => {
    cargarCupones()
  }, [])

  async function cargarCupones() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cupones_descuento')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCupones(data || [])
    } catch (err) {
      console.error('Error cargando cupones:', err)
      mostrarToast('Error al cargar la lista de cupones', 'error')
    } finally {
      setLoading(false)
    }
  }

  function mostrarToast(texto, tipo = 'info') {
    setToastMsg({ texto, tipo })
    setTimeout(() => setToastMsg(null), 3500)
  }

  function abrirNuevo() {
    setEditandoId(null)
    setForm(FORM_VACIO)
    setErrorModal(null)
    setModalAbierto(true)
  }

  function abrirEditar(c) {
    setEditandoId(c.id)
    setForm({
      codigo: c.codigo || '',
      descripcion: c.descripcion || '',
      tipo_descuento: c.tipo_descuento || 'porcentaje',
      valor_descuento: c.valor_descuento || '',
      monto_minimo_compra: c.monto_minimo_compra || '0',
      limite_usos_total: c.limite_usos_total || '',
      limite_por_cliente: c.limite_por_cliente || '1',
      fecha_expiracion: c.fecha_expiracion ? c.fecha_expiracion.slice(0, 16) : '',
      activo: c.activo !== false,
    })
    setErrorModal(null)
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setEditandoId(null)
    setErrorModal(null)
  }

  function generarCodigoAleatorio() {
    const prefijos = ['PAN', 'PROMO', 'FREE', 'GLUTEN', 'OFERTA', 'DELI']
    const pref = prefijos[Math.floor(Math.random() * prefijos.length)]
    const num = Math.floor(1000 + Math.random() * 9000)
    setForm(prev => ({ ...prev, codigo: `${pref}${num}` }))
  }

  async function guardarCupon(e) {
    e?.preventDefault?.()
    setErrorModal(null)

    if (!form.codigo.trim()) {
      setErrorModal('El código es obligatorio.')
      return
    }
    if (!form.valor_descuento || Number(form.valor_descuento) <= 0) {
      setErrorModal('El valor del descuento debe ser mayor a 0.')
      return
    }
    if (form.tipo_descuento === 'porcentaje' && Number(form.valor_descuento) > 100) {
      setErrorModal('El porcentaje no puede ser mayor a 100%.')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        codigo: form.codigo.toUpperCase().trim(),
        descripcion: form.descripcion?.trim() || null,
        tipo_descuento: form.tipo_descuento,
        valor_descuento: Number(form.valor_descuento),
        monto_minimo_compra: Number(form.monto_minimo_compra) || 0,
        limite_usos_total: form.limite_usos_total ? Number(form.limite_usos_total) : null,
        limite_por_cliente: form.limite_por_cliente ? Number(form.limite_por_cliente) : 1,
        fecha_expiracion: form.fecha_expiracion ? new Date(form.fecha_expiracion).toISOString() : null,
        activo: form.activo,
      }

      if (editandoId) {
        const { error } = await supabase
          .from('cupones_descuento')
          .update(payload)
          .eq('id', editandoId)

        if (error) throw error
        mostrarToast('Cupón actualizado correctamente', 'success')
      } else {
        const { error } = await supabase
          .from('cupones_descuento')
          .insert(payload)

        if (error) throw error
        mostrarToast('Cupón creado exitosamente', 'success')
      }

      await cargarCupones()
      cerrarModal()
    } catch (err) {
      console.error('Error guardando cupón:', err)
      setErrorModal(err.message || 'Error al guardar el cupón')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(cupon) {
    try {
      const nuevoEstado = !cupon.activo
      const { error } = await supabase
        .from('cupones_descuento')
        .update({ activo: nuevoEstado })
        .eq('id', cupon.id)

      if (error) throw error
      setCupones(prev => prev.map(c => (c.id === cupon.id ? { ...c, activo: nuevoEstado } : c)))
      mostrarToast(`Cupón ${cupon.codigo} ${nuevoEstado ? 'activado' : 'desactivado'}`)
    } catch (err) {
      console.error('Error cambiando estado:', err)
      mostrarToast('No se pudo cambiar el estado', 'error')
    }
  }

  async function eliminarCupon(id, codigo) {
    if (!window.confirm(`¿Estás seguro de eliminar el cupón ${codigo}?`)) return

    try {
      const { error } = await supabase
        .from('cupones_descuento')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCupones(prev => prev.filter(c => c.id !== id))
      mostrarToast(`Cupón ${codigo} eliminado`, 'success')
    } catch (err) {
      console.error('Error eliminando cupón:', err)
      mostrarToast('Error al eliminar cupón', 'error')
    }
  }

  async function verCanjes(cupon) {
    setCanjesModal(cupon)
    setCargandoCanjes(true)
    try {
      const { data, error } = await supabase
        .from('cupones_canjeados')
        .select(`
          id,
          descuento_obtenido,
          created_at,
          clientes:cliente_id (nombre_completo, email, telefono),
          pedidos:pedido_id (numero_pedido, total_final)
        `)
        .eq('cupon_id', cupon.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCanjesData(data || [])
    } catch (err) {
      console.error('Error cargando canjes:', err)
      setCanjesData([])
    } finally {
      setCargandoCanjes(false)
    }
  }

  const cuponesFiltrados = cupones.filter(c => {
    const coincideTexto =
      c.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(busqueda.toLowerCase()))

    if (!coincideTexto) return false

    if (filtro === 'activos') return c.activo
    if (filtro === 'inactivos') return !c.activo
    return true
  })

  return (
    <div style={S.page}>
      {/* Toast flotante */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: toastMsg.tipo === 'error' ? '#dc2626' : '#2e7d32',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {toastMsg.texto}
        </div>
      )}

      {/* Header */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/admin')}
            style={{ ...S.btnGris, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={22} color="#f46e15" /> Cupones & Descuentos
          </h1>
        </div>
        <button
          onClick={abrirNuevo}
          style={{ ...S.btnNaranja, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} /> Nuevo cupón
        </button>
      </header>

      <main style={S.main}>
        {/* Barra de Filtros y Búsqueda */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={18}
              color="#888"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Buscar por código o descripción…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                ...S.input,
                paddingLeft: '35px',
                marginBottom: 0,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['todos', 'activos', 'inactivos'].map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  ...(filtro === f ? S.btnVerde : S.btnGris),
                  textTransform: 'capitalize',
                  fontSize: '0.85rem',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <span style={{ marginLeft: 'auto', color: '#666', fontSize: '0.85rem' }}>
            {cuponesFiltrados.length} cupón{cuponesFiltrados.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Tabla de Cupones */}
        <div style={S.card}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>Cargando cupones…</p>
          ) : cuponesFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Tag size={40} color="#b7996b" style={{ margin: '0 auto 1rem', display: 'block' }} />
              <p style={{ color: '#666', fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
                No se encontraron cupones
              </p>
              <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>
                Creá un nuevo cupón para ofrecer descuentos a tus clientes en el checkout.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={S.tabla}>
                <thead>
                  <tr>
                    <th style={S.th}>Código</th>
                    <th style={S.th}>Descuento</th>
                    <th style={S.th}>Monto Mínimo</th>
                    <th style={S.th}>Usos / Límite</th>
                    <th style={S.th}>Expiración</th>
                    <th style={S.th}>Estado</th>
                    <th style={S.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuponesFiltrados.map(c => {
                    const expirado = c.fecha_expiracion && new Date() > new Date(c.fecha_expiracion)
                    const limiteAlcanzado = c.limite_usos_total && c.usos_actuales >= c.limite_usos_total

                    return (
                      <tr key={c.id}>
                        {/* Código */}
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong
                              style={{
                                color: '#334c2b',
                                fontFamily: 'monospace',
                                fontSize: '0.95rem',
                                backgroundColor: '#fdfbf8',
                                border: '1px dashed #b7996b',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {c.codigo}
                            </strong>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(c.codigo)
                                mostrarToast(`Código ${c.codigo} copiado`)
                              }}
                              title="Copiar código"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                color: '#888',
                              }}
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                          {c.descripcion && (
                            <span style={{ fontSize: '0.78rem', color: '#777', display: 'block', marginTop: '3px' }}>
                              {c.descripcion}
                            </span>
                          )}
                        </td>

                        {/* Descuento */}
                        <td style={S.td}>
                          <span
                            style={{
                              backgroundColor: c.tipo_descuento === 'porcentaje' ? '#e0f2fe' : '#fef3c7',
                              color: c.tipo_descuento === 'porcentaje' ? '#0369a1' : '#b45309',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '12px',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            {c.tipo_descuento === 'porcentaje'
                              ? `${c.valor_descuento}% OFF`
                              : `-${formatPYG(c.valor_descuento)}`}
                          </span>
                        </td>

                        {/* Mínimo */}
                        <td style={S.td}>
                          {Number(c.monto_minimo_compra) > 0 ? (
                            <span>{formatPYG(c.monto_minimo_compra)}</span>
                          ) : (
                            <span style={{ color: '#999', fontSize: '0.85rem' }}>Sin mínimo</span>
                          )}
                        </td>

                        {/* Usos */}
                        <td style={S.td}>
                          <button
                            onClick={() => verCanjes(c)}
                            title="Ver historial de canjes"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#334c2b',
                              cursor: 'pointer',
                              fontWeight: 600,
                              textDecoration: 'underline',
                              fontSize: '0.85rem',
                              padding: 0,
                            }}
                          >
                            {c.usos_actuales || 0}
                            {c.limite_usos_total ? ` / ${c.limite_usos_total}` : ' usos'}
                          </button>
                          {limiteAlcanzado && (
                            <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'block' }}>
                              Límite alcanzado
                            </span>
                          )}
                        </td>

                        {/* Expiración */}
                        <td style={S.td}>
                          {c.fecha_expiracion ? (
                            <div>
                              <span style={{ fontSize: '0.82rem', color: expirado ? '#dc2626' : '#334c2b' }}>
                                {new Date(c.fecha_expiracion).toLocaleDateString('es-PY', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </span>
                              {expirado && (
                                <span style={{ fontSize: '0.72rem', color: '#dc2626', display: 'block', fontWeight: 600 }}>
                                  Expirado
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontSize: '0.85rem' }}>Sin límite</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td style={S.td}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              backgroundColor: c.activo && !expirado && !limiteAlcanzado ? '#e8f5e9' : '#ffebee',
                              color: c.activo && !expirado && !limiteAlcanzado ? '#2e7d32' : '#c62828',
                            }}
                          >
                            {c.activo && !expirado && !limiteAlcanzado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => abrirEditar(c)}
                              style={{
                                ...S.btnVerde,
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.78rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                            <button
                              onClick={() => toggleActivo(c)}
                              style={{ ...S.btnGris, padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                            >
                              {c.activo ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => eliminarCupon(c.id, c.codigo)}
                              style={{
                                background: 'none',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                borderRadius: '4px',
                                padding: '0.3rem 0.5rem',
                                cursor: 'pointer',
                              }}
                              title="Eliminar cupón"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div style={{ ...S.modal, maxWidth: '550px' }}>
            <h2
              style={{
                color: '#334c2b',
                marginTop: 0,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {editandoId ? (
                <>
                  <Pencil size={20} /> Editar cupón
                </>
              ) : (
                <>
                  <Tag size={20} /> Crear nuevo cupón
                </>
              )}
            </h2>

            <form onSubmit={guardarCupon}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Código con botón de autogenerar */}
                <div>
                  <label style={S.label}>Código del cupón *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      style={{
                        ...S.input,
                        marginBottom: 0,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                      value={form.codigo}
                      onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                      placeholder="Ej: BIENVENIDO15"
                      required
                    />
                    <button
                      type="button"
                      onClick={generarCodigoAleatorio}
                      style={{
                        ...S.btnGris,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Sparkles size={14} /> Generar
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label style={S.label}>Descripción o Nota interna (opcional)</label>
                  <input
                    style={S.input}
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Ej: Promo 15% descuento para clientes nuevos"
                  />
                </div>

                {/* Tipo de Descuento y Valor */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={S.label}>Tipo de descuento *</label>
                    <select
                      style={S.input}
                      value={form.tipo_descuento}
                      onChange={e => setForm({ ...form, tipo_descuento: e.target.value })}
                    >
                      <option value="porcentaje">Porcentaje (%)</option>
                      <option value="monto_fijo">Monto Fijo (₲)</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>
                      {form.tipo_descuento === 'porcentaje' ? 'Porcentaje (%) *' : 'Monto (₲) *'}
                    </label>
                    <input
                      style={S.input}
                      type="number"
                      value={form.valor_descuento}
                      onChange={e => setForm({ ...form, valor_descuento: e.target.value })}
                      placeholder={form.tipo_descuento === 'porcentaje' ? '15' : '15000'}
                      min="1"
                      max={form.tipo_descuento === 'porcentaje' ? '100' : undefined}
                      required
                    />
                  </div>
                </div>

                {/* Monto mínimo y límite por cliente */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={S.label}>Monto mínimo de compra (₲)</label>
                    <input
                      style={S.input}
                      type="number"
                      value={form.monto_minimo_compra}
                      onChange={e => setForm({ ...form, monto_minimo_compra: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                  </div>
                  <div>
                    <label style={S.label}>Límite por cliente</label>
                    <input
                      style={S.input}
                      type="number"
                      value={form.limite_por_cliente}
                      onChange={e => setForm({ ...form, limite_por_cliente: e.target.value })}
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>

                {/* Límite total y Expiración */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={S.label}>Límite de usos total (opcional)</label>
                    <input
                      style={S.input}
                      type="number"
                      value={form.limite_usos_total}
                      onChange={e => setForm({ ...form, limite_usos_total: e.target.value })}
                      placeholder="Sin límite"
                      min="1"
                    />
                  </div>
                  <div>
                    <label style={S.label}>Fecha de expiración (opcional)</label>
                    <input
                      style={S.input}
                      type="datetime-local"
                      value={form.fecha_expiracion}
                      onChange={e => setForm({ ...form, fecha_expiracion: e.target.value })}
                    />
                  </div>
                </div>

                {/* Activo Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={e => setForm({ ...form, activo: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#2e7d32' }}
                  />
                  <span style={{ fontWeight: 600, color: '#334c2b', fontSize: '0.9rem' }}>Cupón activo</span>
                </label>
              </div>

              {errorModal && (
                <div
                  style={{
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    border: '1px solid #ef9a9a',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    marginTop: '1rem',
                    fontSize: '0.88rem',
                  }}
                >
                  {errorModal}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={cerrarModal} style={S.btnGris}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1 }}
                >
                  {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear cupón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Canjes */}
      {canjesModal && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setCanjesModal(null)}>
          <div style={{ ...S.modal, maxWidth: '650px' }}>
            <h2
              style={{
                color: '#334c2b',
                marginTop: 0,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Users size={20} /> Historial de canjes: {canjesModal.codigo}
            </h2>

            {cargandoCanjes ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>Cargando canjes…</p>
            ) : canjesData.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                Este cupón aún no ha sido canjeado por ningún cliente.
              </p>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={S.tabla}>
                  <thead>
                    <tr>
                      <th style={S.th}>Fecha</th>
                      <th style={S.th}>Cliente</th>
                      <th style={S.th}>Pedido</th>
                      <th style={S.th}>Descuento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canjesData.map(item => (
                      <tr key={item.id}>
                        <td style={S.td}>
                          {new Date(item.created_at).toLocaleString('es-PY', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td style={S.td}>
                          <strong>{item.clientes?.nombre_completo || 'Cliente'}</strong>
                          <br />
                          <span style={{ fontSize: '0.78rem', color: '#777' }}>
                            {item.clientes?.telefono || item.clientes?.email || ''}
                          </span>
                        </td>
                        <td style={S.td}>{item.pedidos?.numero_pedido || 'N/A'}</td>
                        <td style={S.td}>
                          <strong style={{ color: '#2e7d32' }}>-{formatPYG(item.descuento_obtenido)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setCanjesModal(null)} style={S.btnGris}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
