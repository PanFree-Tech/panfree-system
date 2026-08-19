/**
 * 📁 UBICACIÓN: src/app/admin/produccion/page.js
 * 📅 ACTUALIZADO: 2026-03-04
 * 📌 DESCRIPCIÓN: Registro y gestión de lotes de producción de PanFree.
 *    - Numeración correcta: PROD-YYYY-NNNN
 *    - Costo MP se precalcula desde la receta al seleccionar el producto
 *    - Detalle de insumos expandible por lote
 *    - KPIs: lotes del mes, unidades producidas, costo total
 *    - Filtros por estado con contadores
 *    - Cambio de estado directo desde la tabla
 *    - Margen estimado por lote vs precio de venta
 */

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { S, COLORS } from '../_styles'
import { formatPYG, formatFecha } from '../lib/helpers'

const ESTADOS      = ['en_proceso','finalizado','mermado','cancelado']
const LABEL_ESTADO = { en_proceso:'En proceso', finalizado:'Finalizado', mermado:'Mermado', cancelado:'Cancelado' }
const COLOR_ESTADO = { en_proceso: COLORS.azul, finalizado: COLORS.verde, mermado:'#ff9800', cancelado: COLORS.rojo }

async function obtenerProximoLote() {
  const anio = new Date().getFullYear()
  const { data } = await supabase
    .from('produccion')
    .select('numero_lote')
    .like('numero_lote', `PROD-${anio}-%`)
    .order('numero_lote', { ascending: false })
    .limit(1)
  const ultimo = data?.[0]?.numero_lote
    ? parseInt(data[0].numero_lote.split('-')[2]) : 0
  return `PROD-${anio}-${String(ultimo + 1).padStart(4, '0')}`
}

const FORM_VACIO = {
  numero_lote:'', producto_id:'', cantidad_producida:'',
  unidad_medida:'unidad', costo_materia_prima:0, costo_mano_obra:0,
  costo_indirectos:0, merma_porcentaje:0, merma_observaciones:'',
  responsable_nombre:'', observaciones:'', estado:'en_proceso',
}

export default function PaginaProduccion() {
  const router = useRouter()
  const [lotes,          setLotes]          = useState([])
  const [productos,      setProductos]      = useState([])
  const [costosPorProd,  setCostosPorProd]  = useState({})
  const [loading,        setLoading]        = useState(true)
  const [modal,          setModal]          = useState(false)
  const [form,           setForm]           = useState(FORM_VACIO)
  const [guardando,      setGuardando]      = useState(false)
  const [error,          setError]          = useState(null)
  const [filtroEstado,   setFiltroEstado]   = useState('todos')
  const [expandido,      setExpandido]      = useState(null)
  const [detalle,        setDetalle]        = useState({})

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [l, p, c] = await Promise.all([
      supabase.from('vista_resumen_produccion').select('*').limit(200),
      supabase.from('productos').select('id, nombre, precio_venta').eq('is_active', true).order('nombre'),
      supabase.from('vista_costo_receta').select('producto_id, costo_materia_prima, costo_por_unidad, rendimiento_unidades').order('producto_id'),
    ])
    setLotes(l.data || [])
    setProductos(p.data || [])
    // Mapear costos por producto_id
    const costos = {}
    ;(c.data || []).forEach(r => {
      if (!costos[r.producto_id]) costos[r.producto_id] = r
    })
    setCostosPorProd(costos)
    setLoading(false)
  }

  async function abrirNuevo() {
    const lote = await obtenerProximoLote()
    setForm({ ...FORM_VACIO, numero_lote: lote })
    setError(null)
    setModal(true)
  }

  function cambiar(campo, valor) { setForm(prev => ({ ...prev, [campo]: valor })) }

  // Al seleccionar producto, precalcular costo MP desde la receta
  function seleccionarProducto(productoId) {
    const costoReceta = costosPorProd[productoId]
    cambiar('producto_id', productoId)
    if (costoReceta) {
      setForm(prev => ({
        ...prev,
        producto_id         : productoId,
        costo_materia_prima : Math.round(Number(costoReceta.costo_materia_prima) || 0),
      }))
    }
  }

  const costoTotal     = (Number(form.costo_materia_prima)||0) + (Number(form.costo_mano_obra)||0) + (Number(form.costo_indirectos)||0)
  const costoUnitario  = Number(form.cantidad_producida) > 0 ? costoTotal / Number(form.cantidad_producida) : 0
  const precioVenta    = productos.find(p => p.id === form.producto_id)?.precio_venta || 0
  const margenPreview  = precioVenta > 0 ? Math.round((precioVenta - costoUnitario) / precioVenta * 100) : 0

  async function guardar() {
    if (!form.producto_id)        { setError('Seleccioná un producto'); return }
    if (!form.cantidad_producida) { setError('Ingresá la cantidad producida'); return }
    setGuardando(true); setError(null)
    try {
      const { error } = await supabase.from('produccion').insert({
        ...form,
        cantidad_producida  : Number(form.cantidad_producida),
        costo_materia_prima : Number(form.costo_materia_prima) || 0,
        costo_mano_obra     : Number(form.costo_mano_obra)     || 0,
        costo_indirectos    : Number(form.costo_indirectos)    || 0,
        merma_porcentaje    : Number(form.merma_porcentaje)    || 0,
      })
      if (error) throw error
      await cargar(); setModal(false)
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  async function cambiarEstado(id, nuevoEstado) {
    await supabase.from('produccion').update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq('id', id)
    cargar()
  }

  async function verDetalle(produccionId) {
    if (expandido === produccionId) { setExpandido(null); return }
    setExpandido(produccionId)
    if (!detalle[produccionId]) {
      const { data } = await supabase
        .from('detalle_produccion')
        .select('*, insumos(nombre, unidad_medida)')
        .eq('produccion_id', produccionId)
      setDetalle(prev => ({ ...prev, [produccionId]: data || [] }))
    }
  }

  const filtrados = filtroEstado === 'todos' ? lotes : lotes.filter(l => l.estado === filtroEstado)

  // KPIs del mes actual
  const hoy     = new Date()
  const delMes  = lotes.filter(l => {
    const f = new Date(l.fecha_inicio)
    return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
  })
  const unidadesMes = delMes.reduce((s,l) => s + Number(l.cantidad_producida||0), 0)
  const costoMes    = delMes.reduce((s,l) => s + Number(l.costo_total_lote||0), 0)

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver</button>
          <h1 style={{ margin:0, fontSize:'1.2rem' }}>🏭 Producción</h1>
        </div>
        <button onClick={abrirNuevo} style={S.btnNaranja}>+ Registrar Lote</button>
      </header>

      <main style={S.main}>

        {/* KPIs del mes */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:`Lotes este mes`,         valor: delMes.length,                    color:'#334c2b' },
            { label:`Unidades producidas`,     valor: unidadesMes.toLocaleString('es-PY'), color:'#334c2b' },
            { label:`Costo MP del mes`,        valor: formatPYG(costoMes),              color:'#f46e15' },
            { label:`Lotes en proceso`,        valor: lotes.filter(l=>l.estado==='en_proceso').length, color:'#2196f3' },
          ].map(kpi => (
            <div key={kpi.label} style={{ backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'1.1rem', textAlign:'center' }}>
              <p style={{ fontSize:'1.4rem', fontWeight:700, color:kpi.color, margin:0 }}>{kpi.valor}</p>
              <p style={{ color:'#666', fontSize:'0.8rem', margin:'0.3rem 0 0' }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          {['todos', ...ESTADOS].map(e => {
            const count = e === 'todos' ? lotes.length : lotes.filter(l => l.estado === e).length
            return (
              <button key={e} onClick={() => setFiltroEstado(e)}
                style={{ ...S.btnVerde, fontSize:'0.82rem', padding:'0.4rem 0.9rem',
                  backgroundColor: filtroEstado === e ? (COLOR_ESTADO[e] || '#f46e15') : '#888' }}>
                {e === 'todos' ? '📋 Todos' : LABEL_ESTADO[e]} ({count})
              </button>
            )
          })}
        </div>

        {/* Tabla */}
        <div style={{ ...S.card, overflow:'auto' }}>
          {loading ? (
            <p style={{ padding:'2rem', textAlign:'center', color:'#999' }}>⏳ Cargando...</p>
          ) : filtrados.length === 0 ? (
            <p style={{ padding:'2rem', textAlign:'center', color:'#999' }}>No hay lotes para este filtro.</p>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['N° Lote','Producto','Fecha','Cant.','Costo Unit.','Costo Total','Margen Est.','Estado','Responsable',''].map(h =>
                    <th key={h} style={S.th}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(l => {
                  const margenColor = Number(l.margen_estimado) >= 40 ? '#2e7d32' : Number(l.margen_estimado) >= 20 ? '#f46e15' : '#c62828'
                  const abierto     = expandido === l.produccion_id
                  return (
                    <>
                      <tr key={l.produccion_id} style={{ backgroundColor: abierto ? '#f9f6f1' : '#fff' }}>
                        <td style={S.td}>
                          <span style={{ fontFamily:'monospace', fontWeight:700, color:'#334c2b', fontSize:'0.83rem' }}>{l.numero_lote}</span>
                        </td>
                        <td style={S.td}><strong style={{ color:'#334c2b' }}>{l.producto_nombre}</strong></td>
                        <td style={S.td}>{formatFecha(l.fecha_inicio)}</td>
                        <td style={{ ...S.td, textAlign:'center', fontWeight:700 }}>{l.cantidad_producida} <span style={{ color:'#999', fontWeight:400 }}>{l.unidad_medida}</span></td>
                        <td style={{ ...S.td, color:'#f46e15', fontWeight:700 }}>{formatPYG(l.costo_unitario)}</td>
                        <td style={S.td}>{formatPYG(l.costo_total_lote)}</td>
                        <td style={{ ...S.td, fontWeight:700, color: margenColor }}>
                          {l.margen_estimado}%
                        </td>
                        <td style={S.td}>
                          <select value={l.estado}
                            onChange={e => cambiarEstado(l.produccion_id, e.target.value)}
                            style={{ border:`2px solid ${COLOR_ESTADO[l.estado]}`, borderRadius:'4px', padding:'0.2rem 0.4rem', fontFamily:'inherit', fontSize:'0.82rem', color: COLOR_ESTADO[l.estado], fontWeight:700, backgroundColor:'#fff', cursor:'pointer' }}>
                            {ESTADOS.map(e => <option key={e} value={e}>{LABEL_ESTADO[e]}</option>)}
                          </select>
                        </td>
                        <td style={S.td}>{l.responsable_nombre || '—'}</td>
                        <td style={S.td}>
                          <button onClick={() => verDetalle(l.produccion_id)}
                            style={{ ...S.btnVerde, padding:'0.3rem 0.6rem', fontSize:'0.78rem', backgroundColor: abierto ? '#f46e15' : '#334c2b' }}>
                            {abierto ? '▲' : '▼'} Detalle
                          </button>
                        </td>
                      </tr>

                      {/* Detalle expandible */}
                      {abierto && (
                        <tr key={`det-${l.produccion_id}`}>
                          <td colSpan={10} style={{ padding:'0.75rem 1.5rem', backgroundColor:'#f9f6f1', borderBottom:'2px solid #b7996b' }}>
                            {l.observaciones && (
                              <div style={{ backgroundColor:'#fffbf0', border:'1px solid #f0d080', borderRadius:'4px', padding:'0.5rem 0.75rem', marginBottom:'0.75rem', fontSize:'0.85rem', color:'#5a4000' }}>
                                📝 {l.observaciones}
                              </div>
                            )}
                            <div style={{ display:'flex', gap:'2rem', marginBottom:'0.75rem', flexWrap:'wrap', fontSize:'0.85rem' }}>
                              {l.costo_mano_obra > 0 && <span>👷 Mano de obra: <strong>{formatPYG(l.costo_mano_obra)}</strong></span>}
                              {l.costo_indirectos > 0 && <span>⚙️ Indirectos: <strong>{formatPYG(l.costo_indirectos)}</strong></span>}
                              {Number(l.merma_porcentaje) > 0 && <span>⚠️ Merma: <strong>{l.merma_porcentaje}%</strong></span>}
                              <span>💰 Ganancia estimada lote: <strong style={{ color:'#2e7d32' }}>{formatPYG(l.ganancia_bruta_lote)}</strong></span>
                            </div>
                            {detalle[l.produccion_id]?.length > 0 ? (
                              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
                                <thead>
                                  <tr>
                                    {['Insumo','Cantidad','Unidad','PPP Congelado','Costo Item'].map(h =>
                                      <th key={h} style={{ ...S.th, backgroundColor:'#555', padding:'0.4rem 0.7rem', fontSize:'0.8rem' }}>{h}</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {detalle[l.produccion_id].map(d => (
                                    <tr key={d.id}>
                                      <td style={{ ...S.td, padding:'0.4rem 0.7rem' }}>{d.insumos?.nombre || '—'}</td>
                                      <td style={{ ...S.td, padding:'0.4rem 0.7rem' }}>{d.cantidad_usada}</td>
                                      <td style={{ ...S.td, padding:'0.4rem 0.7rem' }}>{d.unidad_medida}</td>
                                      <td style={{ ...S.td, padding:'0.4rem 0.7rem' }}>{formatPYG(d.ppp_congelado)}</td>
                                      <td style={{ ...S.td, padding:'0.4rem 0.7rem', fontWeight:700, color:'#f46e15' }}>{formatPYG(d.costo_item)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p style={{ color:'#999', fontSize:'0.85rem', margin:0 }}>Sin detalle de insumos registrado para este lote.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* MODAL */}
      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:300 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'2rem', zIndex:301, width:'90%', maxWidth:'660px', maxHeight:'92vh', overflowY:'auto' }}>
            <h2 style={{ color:'#334c2b', margin:'0 0 1.5rem' }}>🏭 Registrar Lote de Producción</h2>
            {error && (
              <div style={{ backgroundColor:'#fdecea', border:'1px solid #c62828', borderRadius:'4px', padding:'0.75rem', marginBottom:'1rem', color:'#c62828', fontSize:'0.9rem' }}>⚠️ {error}</div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <label style={S.label}>N° Lote (automático)</label>
                <input style={{ ...S.input, backgroundColor:'#f9f5f0', color:'#888' }} value={form.numero_lote} readOnly />
              </div>
              <div>
                <label style={S.label}>Estado inicial</label>
                <select style={S.input} value={form.estado} onChange={e => cambiar('estado', e.target.value)}>
                  {ESTADOS.map(e => <option key={e} value={e}>{LABEL_ESTADO[e]}</option>)}
                </select>
              </div>

              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Producto *</label>
                <select style={S.input} value={form.producto_id} onChange={e => seleccionarProducto(e.target.value)}>
                  <option value="">— Seleccioná un producto —</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={S.label}>Cantidad Producida *</label>
                <input style={S.input} type="number" min="1" value={form.cantidad_producida}
                  onChange={e => cambiar('cantidad_producida', e.target.value)} placeholder="Ej: 20" />
              </div>
              <div>
                <label style={S.label}>Unidad</label>
                <select style={S.input} value={form.unidad_medida} onChange={e => cambiar('unidad_medida', e.target.value)}>
                  {['unidad','kg','docena','pack'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Costos */}
              <div style={{ gridColumn:'1/-1', backgroundColor:'#f9f5f0', padding:'1rem', borderRadius:'6px', border:'1px solid #b7996b' }}>
                <h4 style={{ color:'#334c2b', margin:'0 0 0.75rem', fontSize:'0.95rem' }}>💰 Costos del Lote (₲)</h4>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
                  <div>
                    <label style={S.label}>
                      Materia Prima
                      {costosPorProd[form.producto_id] && (
                        <span style={{ color:'#2e7d32', fontSize:'0.75rem', fontWeight:400, marginLeft:'0.4rem' }}>✓ de receta</span>
                      )}
                    </label>
                    <input style={S.input} type="number" value={form.costo_materia_prima}
                      onChange={e => cambiar('costo_materia_prima', e.target.value)} />
                  </div>
                  <div>
                    <label style={S.label}>Mano de Obra</label>
                    <input style={S.input} type="number" value={form.costo_mano_obra}
                      onChange={e => cambiar('costo_mano_obra', e.target.value)} />
                  </div>
                  <div>
                    <label style={S.label}>Indirectos</label>
                    <input style={S.input} type="number" value={form.costo_indirectos}
                      onChange={e => cambiar('costo_indirectos', e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop:'0.75rem', display:'flex', gap:'2rem', flexWrap:'wrap', fontSize:'0.88rem' }}>
                  <span>Costo total lote: <strong style={{ color:'#f46e15' }}>{formatPYG(costoTotal)}</strong></span>
                  <span>Costo unitario: <strong style={{ color:'#f46e15' }}>{formatPYG(Math.round(costoUnitario))}</strong></span>
                  {precioVenta > 0 && (
                    <span>Margen estimado: <strong style={{ color: margenPreview >= 40 ? '#2e7d32' : margenPreview >= 20 ? '#f46e15' : '#c62828' }}>{margenPreview}%</strong></span>
                  )}
                </div>
              </div>

              <div>
                <label style={S.label}>Merma %</label>
                <input style={S.input} type="number" step="0.01" max="100" value={form.merma_porcentaje}
                  onChange={e => cambiar('merma_porcentaje', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label style={S.label}>Responsable</label>
                <input style={S.input} value={form.responsable_nombre}
                  onChange={e => cambiar('responsable_nombre', e.target.value)} placeholder="Nombre" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Observaciones</label>
                <textarea style={{ ...S.input, minHeight:'65px', resize:'vertical' }}
                  value={form.observaciones || ''}
                  onChange={e => cambiar('observaciones', e.target.value)}
                  placeholder="Ej: Producción matutina — horno principal" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Observaciones de merma</label>
                <input style={S.input} value={form.merma_observaciones || ''}
                  onChange={e => cambiar('merma_observaciones', e.target.value)}
                  placeholder="Ej: 2 unidades quemadas en el primer horneado" />
              </div>
            </div>

            <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end', marginTop:'1.5rem' }}>
              <button onClick={() => setModal(false)} style={S.btnGris}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1 }}>
                {guardando ? '⏳ Guardando...' : '💾 Registrar Lote'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}