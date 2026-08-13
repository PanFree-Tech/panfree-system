/**
📁 UBICACIÓN: src/app/admin/costos/page.js
📅 ACTUALIZADO: 2026-03-05
📌 DESCRIPCIÓN: Análisis de costos y márgenes de PanFree.
                + Plantilla rodante para costos fijos (copiar mes anterior)
                + Sugerencia de energía basada en producción
PESTAÑA 1 — Margen Bruto: costos de materia prima (como antes)
PESTAÑA 2 — Costos Fijos: carga mensual de alquiler, salarios, etc.
PESTAÑA 3 — Margen Real: margen bruto + costos fijos prorrateados
Todos los importes en PYG (₲)
*/
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const formatPYG  = n => `₲ ${Number(n||0).toLocaleString('es-PY')}`
const formatKG   = n => `${Number(n||0).toLocaleString('es-PY', { minimumFractionDigits:2, maximumFractionDigits:3 })} kg`
const hoy        = new Date()
const primerDiaMes = (y, m) => new Date(y, m, 1).toISOString().slice(0, 10)
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FORM_FIJOS_VACIO = {
  periodo: primerDiaMes(hoy.getFullYear(), hoy.getMonth()),
  alquiler: '', servicios: '', salarios: '',
  depreciacion_equipos: '', licencias_software: '',
  marketing: '', otros: '', notas: '',
}

const S = {
  page      : { minHeight:'100vh', backgroundColor:'#f5f5f5', fontFamily:'"Segoe UI",sans-serif' },
  header    : { backgroundColor:'#334c2b', color:'#eee6d9', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'3px solid #b7996b' },
  main      : { padding:'2rem', maxWidth:'1200px', margin:'0 auto' },
  card      : { backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem' },
  th        : { backgroundColor:'#334c2b', color:'#eee6d9', padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.83rem' },
  td        : { padding:'0.75rem 1rem', borderBottom:'1px solid #eee6d9', fontSize:'0.88rem', color:'#333', verticalAlign:'middle' },
  btnVerde  : { backgroundColor:'#334c2b', color:'#eee6d9', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  btnNaranja: { backgroundColor:'#f46e15', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  btnGris   : { backgroundColor:'#999', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  btnAzul   : { backgroundColor:'#1976d2', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  input     : { width:'100%', padding:'0.6rem 0.8rem', border:'2px solid #b7996b', borderRadius:'4px', fontFamily:'inherit', fontSize:'0.9rem', color:'#333', boxSizing:'border-box' },
  label     : { display:'block', color:'#334c2b', fontWeight:'600', fontSize:'0.85rem', marginBottom:'0.3rem' },
}

const colorMargen = pct => {
  const n = Number(pct)
  if (n >= 50) return '#2e7d32'
  if (n >= 40) return '#388e3c'
  if (n >= 20) return '#f46e15'
  return '#c62828'
}

const badgeMargen = (pct) => {
  const n = Number(pct)
  if (n >= 50) return { text:'✅ Excelente', bg:'#e8f5e9', color:'#2e7d32' }
  if (n >= 40) return { text:'✅ Bueno',     bg:'#f1f8e9', color:'#388e3c' }
  if (n >= 20) return { text:'⚠️ Ajustado',  bg:'#fff8e1', color:'#f46e15' }
  if (n >= 0)  return { text:'🔴 Bajo',      bg:'#fdecea', color:'#c62828' }
  return             { text:'❌ Pérdida',    bg:'#fdecea', color:'#c62828' }
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function PaginaCostos() {
  const router = useRouter()
  const [tab,      setTab]      = useState('bruto')   // 'bruto' | 'fijos' | 'real'
  const [datos,    setDatos]    = useState([])
  const [fijos,    setFijos]    = useState([])         // historial costos fijos
  const [loading,  setLoading]  = useState(true)
  const [filtro,   setFiltro]   = useState('todos')
  const [vista,    setVista]    = useState('tabla')
  
  // Modal costos fijos
  const [modal,    setModal]    = useState(false)
  const [editando, setEditando] = useState(null)
  const [form,     setForm]     = useState(FORM_FIJOS_VACIO)
  const [guardando,setGuardando]= useState(false)
  const [error,    setError]    = useState(null)
  
  // Mes seleccionado para margen real
  const [mesSel,   setMesSel]   = useState(primerDiaMes(hoy.getFullYear(), hoy.getMonth()))
  
  // ─── NUEVO: Mes anterior para plantilla rodante ───────────────────────────
  const [mesAnterior, setMesAnterior] = useState(null)
  const [sugerenciaEnergia, setSugerenciaEnergia] = useState(null)
  
  useEffect(() => { cargar() }, [])
  
  async function cargar() {
    setLoading(true)
    const [recetas, costosF] = await Promise.all([
      supabase.from('vista_costo_receta').select('*').order('producto_nombre'),
      supabase.from('costos_fijos_mensuales').select('*').order('periodo', { ascending: false }),
    ])
    
    // Agrupar recetas por producto
    const porProducto = {}
    ;(recetas.data || []).forEach(r => {
      if (!porProducto[r.producto_id]) {
        porProducto[r.producto_id] = {
          producto_id          : r.producto_id,
          producto_nombre      : r.producto_nombre,
          precio_venta         : r.precio_venta,
          rendimiento_kg       : r.rendimiento_kg,
          peso_promedio_unidad : r.peso_promedio_unidad,
          costo_materia_prima  : r.costo_materia_prima,
          costo_por_kg         : r.costo_por_kg,
          margen_bruto_kg      : r.margen_bruto_kg,
          margen_porcentaje    : r.margen_porcentaje,
          precio_sugerido_20pct: r.precio_sugerido_20pct,
          precio_sugerido_40pct: r.precio_sugerido_40pct,
          precio_sugerido_60pct: r.precio_sugerido_60pct,
          cantidad_insumos     : r.cantidad_insumos,
        }
      }
    })
    
    setDatos(Object.values(porProducto).sort((a,b) => Number(a.margen_porcentaje) - Number(b.margen_porcentaje)))
    setFijos(costosF.data || [])
    setLoading(false)
  }
  
  // ─── NUEVO: Calcular mes anterior y sugerencia de energía ─────────────────
  useEffect(() => {
    if (!modal || editando) {
      setMesAnterior(null)
      setSugerenciaEnergia(null)
      return
    }
    if (form.periodo) {
      const periodoForm = form.periodo
      const fechaForm = new Date(periodoForm)
      const fechaAnt = new Date(fechaForm.getFullYear(), fechaForm.getMonth() - 1, 1)
      const periodoAnt = fechaAnt.toISOString().slice(0, 10)
      const anterior = fijos.find(f => f.periodo === periodoAnt)
      setMesAnterior(anterior || null)
      calcularSugerenciaEnergia(periodoAnt, periodoForm, anterior)
    }
  }, [modal, form.periodo, fijos, editando])

  async function calcularSugerenciaEnergia(periodoAnt, periodoForm, anterior) {
    if (!periodoForm) return

    // Leer energía real desde tabla maquinarias (vista_energia_mensual)
    const { data: energiaData } = await supabase
      .from('vista_energia_mensual')
      .select('total_energia_mensual, energia_permanente, energia_activa')
      .single()

    const energiaMaquinarias = Number(energiaData?.total_energia_mensual || 0)
    const serviciosAnt = anterior ? Number(anterior.servicios || 0) : 0

    setSugerenciaEnergia({
      energiaMaquinarias,
      estimado: energiaMaquinarias,
      anterior: serviciosAnt,
      variacion: energiaMaquinarias - serviciosAnt,
      usaReal: energiaMaquinarias > 0,
    })
  }
  
  // ── Helpers ────────────────────────────────────────────────────────────────
  const filtrados   = filtro === 'perdida'  ? datos.filter(d => Number(d.margen_porcentaje) < 20)
                    : filtro === 'ajustado' ? datos.filter(d => Number(d.margen_porcentaje) >= 20 && Number(d.margen_porcentaje) < 40)
                    : filtro === 'bueno'    ? datos.filter(d => Number(d.margen_porcentaje) >= 40)
                    : datos
  
  const margenProm  = datos.length ? datos.reduce((s,d) => s + Number(d.margen_porcentaje||0), 0) / datos.length : 0
  const sinRendim   = datos.filter(d => !d.rendimiento_kg || Number(d.rendimiento_kg) <= 0).length
  const conPerdida  = datos.filter(d => Number(d.margen_porcentaje) < 20).length
  const conBuenMarg = datos.filter(d => Number(d.margen_porcentaje) >= 40).length
  
  // Costos fijos del mes seleccionado
  const fijosMes    = fijos.find(f => f.periodo === mesSel)
  const totalFijosMes = Number(fijosMes?.total_fijos || 0)
  
  // Total unidades producidas en el mes (estimado desde producción)
  const [unidadesMes, setUnidadesMes] = useState(0)
  
  useEffect(() => {
    if (!mesSel) return
    const fin = new Date(mesSel)
    fin.setMonth(fin.getMonth() + 1)
    supabase
      .from('produccion')
      .select('cantidad_producida')
      .eq('estado', 'finalizado')
      .gte('fecha_inicio', mesSel)
      .lt('fecha_inicio', fin.toISOString().slice(0,10))
      .then(({ data }) => {
        const total = (data || []).reduce((s, r) => s + Number(r.cantidad_producida||0), 0)
        setUnidadesMes(total)
      })
  }, [mesSel])
  
  const costoPorUnidadFijo = unidadesMes > 0 ? totalFijosMes / unidadesMes : 0
  
  // Margen real = precio_venta - (costo_por_unidad_variable + costo_fijo_por_unidad)
  function margenRealProducto(d) {
    const pv   = Number(d.precio_venta || 0)
    const cpu  = d.peso_promedio_unidad
      ? Number(d.costo_por_kg || 0) * Number(d.peso_promedio_unidad)
      : Number(d.costo_materia_prima || 0)
    const cTotal = cpu + costoPorUnidadFijo
    const margen = pv > 0 ? ((pv - cTotal) / pv * 100) : 0
    return { costoVariable: cpu, costoFijo: costoPorUnidadFijo, costoTotal: cTotal, margen: margen.toFixed(1) }
  }
  
  // ── Modal costos fijos ─────────────────────────────────────────────────────
  function abrirNuevo() {
    setEditando(null)
    setForm(FORM_FIJOS_VACIO)
    setError(null)
    setModal(true)
  }
  
  function abrirEditar(f) {
    setEditando(f.id)
    setForm({
      periodo              : f.periodo,
      alquiler             : f.alquiler || '',
      servicios            : f.servicios || '',
      salarios             : f.salarios || '',
      depreciacion_equipos : f.depreciacion_equipos || '',
      licencias_software   : f.licencias_software || '',
      marketing            : f.marketing || '',
      otros                : f.otros || '',
      notas                : f.notas || '',
    })
    setError(null)
    setModal(true)
  }
  
  function cerrar() { 
    setModal(false)
    setError(null)
    setMesAnterior(null)
    setSugerenciaEnergia(null)
  }
  
  function cambiar(campo, valor) { 
    setForm(p => ({ ...p, [campo]: valor })) 
  }
  
  // ─── NUEVO: Copiar mes anterior ────────────────────────────────────────────
  function copiarMesAnterior() {
    if (!mesAnterior) return
    
    setForm({
      periodo              : form.periodo,
      alquiler             : mesAnterior.alquiler || '',
      servicios            : mesAnterior.servicios || '',
      salarios             : mesAnterior.salarios || '',
      depreciacion_equipos : mesAnterior.depreciacion_equipos || '',
      licencias_software   : mesAnterior.licencias_software || '',
      marketing            : mesAnterior.marketing || '',
      otros                : mesAnterior.otros || '',
      notas                : `Copiado de ${labelPeriodo(mesAnterior.periodo)}. `,
    })
  }
  
  // ─── NUEVO: Aplicar sugerencia de energía ──────────────────────────────────
  function aplicarSugerenciaEnergia() {
    if (!sugerenciaEnergia) return
    setForm(p => ({ ...p, servicios: String(sugerenciaEnergia.estimado) }))
  }
  
  async function guardar() {
    if (!form.periodo) { setError('Seleccioná el mes'); return }
    setGuardando(true); setError(null)
    try {
      const payload = {
        periodo              : form.periodo,
        alquiler             : Number(form.alquiler)             || 0,
        servicios            : Number(form.servicios)            || 0,
        salarios             : Number(form.salarios)             || 0,
        depreciacion_equipos : Number(form.depreciacion_equipos) || 0,
        licencias_software   : Number(form.licencias_software)   || 0,
        marketing            : Number(form.marketing)            || 0,
        otros                : Number(form.otros)                || 0,
        notas                : form.notas || null,
        updated_at           : new Date().toISOString(),
      }
      if (editando) {
        const { error: e } = await supabase.from('costos_fijos_mensuales').update(payload).eq('id', editando)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('costos_fijos_mensuales').insert(payload)
        if (e) throw e
      }
      await cargar(); cerrar()
    } catch (err) {
      setError(err.message?.includes('unique') ? 'Ya existe un registro para ese mes. Editalo en lugar de crear uno nuevo.' : err.message)
    } finally { 
      setGuardando(false) 
    }
  }
  
  async function eliminar(id) {
    if (!confirm('¿Eliminar este registro de costos fijos?')) return
    await supabase.from('costos_fijos_mensuales').delete().eq('id', id)
    cargar()
  }
  
  // ── Label de período ───────────────────────────────────────────────────────
  function labelPeriodo(periodo) {
    const d = new Date(periodo + 'T12:00:00')
    return `${MESES[d.getMonth()]} ${d.getFullYear()}`
  }
  
  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver</button>
          <h1 style={{ margin:0, fontSize:'1.2rem' }}>💰 Costos y Precios</h1>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button onClick={() => setVista(v => v === 'tabla' ? 'tarjetas' : 'tabla')}
            style={{ ...S.btnGris, padding:'0.4rem 0.8rem', fontSize:'0.85rem' }}>
            {vista === 'tabla' ? '🃏 Tarjetas' : '📋 Tabla'}
          </button>
          <button onClick={cargar} style={{ ...S.btnVerde, padding:'0.4rem 0.8rem', fontSize:'0.85rem' }}>🔄 Actualizar</button>
        </div>
      </header>
      
      <main style={S.main}>
        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:0, marginBottom:'1.5rem', border:'2px solid #b7996b', borderRadius:'6px', overflow:'hidden', width:'fit-content' }}>
          {[
            { id:'bruto', label:'📊 Margen Bruto' },
            { id:'fijos', label:'🏗️ Costos Fijos' },
            { id:'real',  label:'🎯 Margen Real'  },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'0.6rem 1.25rem', border:'none', cursor:'pointer',
              fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem',
              backgroundColor: tab === t.id ? '#334c2b' : '#fff',
              color: tab === t.id ? '#eee6d9' : '#334c2b',
              borderRight: '1px solid #b7996b',
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <p style={{ padding:'2rem', textAlign:'center', color:'#999' }}>⏳ Calculando costos...</p>
        ) : (
          <>
            {/* ════════════════════════════════════════════
                TAB 1 — MARGEN BRUTO (igual que antes)
            ════════════════════════════════════════════ */}
            {tab === 'bruto' && (
              <>
                {sinRendim > 0 && (
                  <div style={{ backgroundColor:'#fff8e1', border:'2px solid #f9c74f', borderRadius:'8px', padding:'1rem 1.25rem', marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
                    <span style={{ color:'#5a4000', fontSize:'0.92rem' }}>
                      ⚠️  <strong>{sinRendim} producto{sinRendim > 1 ? 's' : ''}</strong> sin rendimiento en kg — los costos no son exactos todavía.
                    </span>
                    <button onClick={() => router.push('/admin/recetas')} style={{ ...S.btnNaranja, padding:'0.4rem 0.9rem', fontSize:'0.85rem' }}>
                      ✏️ Completar en Recetas
                    </button>
                  </div>
                )}

                {/* KPIs */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
                  {[
                    { label:'Productos con receta',     valor: datos.length,               color:'#334c2b' },
                    { label:'Margen bruto promedio',     valor:`${margenProm.toFixed(1)}%`, color: colorMargen(margenProm) },
                    { label:'Con pérdida o margen bajo', valor: conPerdida,                 color:'#c62828' },
                    { label:'Con buen margen (≥40%)',    valor: conBuenMarg,                color:'#2e7d32' },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ ...S.card, textAlign:'center', padding:'1.25rem', marginBottom:0 }}>
                      <p style={{ fontSize:'2rem', fontWeight:700, color:kpi.color, margin:0 }}>{kpi.valor}</p>
                      <p style={{ fontSize:'0.82rem', color:'#666', margin:'0.3rem 0 0' }}>{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* Filtros */}
                <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
                  {[
                    { val:'todos',    label:'📋 Todos' },
                    { val:'bueno',    label:'✅ Buen margen (≥40%)' },
                    { val:'ajustado', label:'⚠️ Ajustado (20-40%)' },
                    { val:'perdida',  label:'🔴 Con pérdida (<20%)' },
                  ].map(f => (
                    <button key={f.val} onClick={() => setFiltro(f.val)}
                      style={{ ...S.btnVerde, backgroundColor: filtro === f.val ? '#f46e15' : '#334c2b', fontSize:'0.85rem', padding:'0.4rem 0.9rem' }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {vista === 'tabla' ? (
                  <div style={{ ...S.card, padding:0, overflow:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'900px' }}>
                      <thead>
                        <tr>
                          {['Producto','Rinde','Costo/KG','Precio Venta','Margen ₲','Margen %','P. 20%','🎯 P. 40%','P. 60%','Estado',''].map(h =>
                            <th key={h} style={S.th}>{h}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filtrados.map((d, idx) => {
                          const badge   = badgeMargen(d.margen_porcentaje)
                          const sinRend = !d.rendimiento_kg || Number(d.rendimiento_kg) <= 0
                          return (
                            <tr key={d.producto_id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={S.td}><strong style={{ color:'#334c2b' }}>{d.producto_nombre}</strong></td>
                              <td style={{ ...S.td, textAlign:'center' }}>
                                {sinRend ? <span style={{ color:'#f46e15', fontSize:'0.8rem', fontWeight:600 }}>⚠️ Sin dato</span>
                                         : <strong>{formatKG(d.rendimiento_kg)}</strong>}
                              </td>
                              <td style={{ ...S.td, fontWeight:700, color: sinRend ? '#aaa' : '#c62828' }}>
                                {sinRend ? '—' : formatPYG(d.costo_por_kg)}
                              </td>
                              <td style={S.td}>{formatPYG(d.precio_venta)}</td>
                              <td style={{ ...S.td, fontWeight:700, color: colorMargen(d.margen_porcentaje) }}>
                                {sinRend ? '—' : formatPYG(d.margen_bruto_kg)}
                              </td>
                              <td style={{ ...S.td, fontWeight:700, fontSize:'1rem', color: colorMargen(d.margen_porcentaje) }}>
                                {d.margen_porcentaje}%
                              </td>
                              <td style={{ ...S.td, color:'#555', fontSize:'0.85rem' }}>{sinRend ? '—' : formatPYG(d.precio_sugerido_20pct)}</td>
                              <td style={{ ...S.td, color:'#f46e15', fontWeight:700, backgroundColor:'#fff8f0' }}>{sinRend ? '—' : formatPYG(d.precio_sugerido_40pct)}</td>
                              <td style={{ ...S.td, color:'#b7996b', fontWeight:700 }}>{sinRend ? '—' : formatPYG(d.precio_sugerido_60pct)}</td>
                              <td style={S.td}>
                                <span style={{ backgroundColor:badge.bg, color:badge.color, padding:'0.2rem 0.6rem', borderRadius:'20px', fontSize:'0.78rem', fontWeight:700, whiteSpace:'nowrap' }}>
                                  {badge.text}
                                </span>
                              </td>
                              <td style={S.td}>
                                <button onClick={() => router.push('/admin/recetas')} style={{ ...S.btnVerde, padding:'0.3rem 0.6rem', fontSize:'0.78rem' }}>✏️</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:'1rem' }}>
                    {filtrados.map(d => {
                      const badge   = badgeMargen(d.margen_porcentaje)
                      const sinRend = !d.rendimiento_kg || Number(d.rendimiento_kg) <= 0
                      return (
                        <div key={d.producto_id} style={{ ...S.card, marginBottom:0, borderLeft:`4px solid ${colorMargen(d.margen_porcentaje)}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                            <h3 style={{ margin:0, color:'#334c2b', fontSize:'0.95rem', flex:1, paddingRight:'0.5rem' }}>{d.producto_nombre}</h3>
                            <span style={{ backgroundColor:badge.bg, color:badge.color, padding:'0.2rem 0.5rem', borderRadius:'20px', fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap' }}>{badge.text}</span>
                          </div>
                          {sinRend && (
                            <div style={{ backgroundColor:'#fff8e1', borderRadius:'4px', padding:'0.4rem 0.6rem', marginBottom:'0.6rem', fontSize:'0.8rem', color:'#5a4000' }}>
                              ⚠️ Falta cargar rendimiento en Recetas
                            </div>
                          )}
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem', fontSize:'0.85rem' }}>
                            <div style={{ color:'#666' }}>Rinde: </div>
                            <div style={{ fontWeight:700, color:'#334c2b' }}>{sinRend ? '—' : formatKG(d.rendimiento_kg)}</div>
                            <div style={{ color:'#666' }}>Costo/kg: </div>
                            <div style={{ fontWeight:700, color:'#c62828' }}>{sinRend ? '—' : formatPYG(d.costo_por_kg)}</div>
                            <div style={{ color:'#666' }}>Precio actual: </div>
                            <div style={{ fontWeight:700 }}>{formatPYG(d.precio_venta)}</div>
                            <div style={{ color:'#666' }}>Margen bruto: </div>
                            <div style={{ fontWeight:700, color: colorMargen(d.margen_porcentaje) }}>{d.margen_porcentaje}%</div>
                          </div>
                          {!sinRend && (
                            <div style={{ marginTop:'0.75rem', borderTop:'1px solid #f0ebe3', paddingTop:'0.75rem' }}>
                              <div style={{ fontSize:'0.78rem', color:'#888', marginBottom:'0.3rem' }}>Precios sugeridos: </div>
                              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                                <span style={{ fontSize:'0.8rem', backgroundColor:'#f0ebe3', padding:'0.2rem 0.5rem', borderRadius:'4px' }}>20% →  <strong>{formatPYG(d.precio_sugerido_20pct)}</strong></span>
                                <span style={{ fontSize:'0.8rem', backgroundColor:'#fff3e0', padding:'0.2rem 0.5rem', borderRadius:'4px' }}>🎯 40% →  <strong style={{ color:'#f46e15' }}>{formatPYG(d.precio_sugerido_40pct)}</strong></span>
                                <span style={{ fontSize:'0.8rem', backgroundColor:'#f9f0e0', padding:'0.2rem 0.5rem', borderRadius:'4px' }}>60% →  <strong style={{ color:'#b7996b' }}>{formatPYG(d.precio_sugerido_60pct)}</strong></span>
                              </div>
                            </div>
                          )}
                          <button onClick={() => router.push('/admin/recetas')}
                            style={{ ...S.btnVerde, width:'100%', marginTop:'0.75rem', padding:'0.4rem', fontSize:'0.82rem' }}>
                            ✏️ Editar receta
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div style={{ ...S.card, backgroundColor:'#f9f5f0', fontSize:'0.88rem', color:'#555', marginTop:'0.5rem' }}>
                  <strong style={{ color:'#334c2b' }}>📌 Margen bruto — solo materia prima: </strong>
                  <ul style={{ marginTop:'0.5rem', paddingLeft:'1.5rem', lineHeight:'1.8' }}>
                    <li><strong>Costo/kg</strong> = Costo total de ingredientes ÷ Rendimiento en kg.</li>
                    <li>El margen mostrado <strong>NO incluye</strong> mano de obra, gas, luz, alquiler ni costos fijos.</li>
                    <li>Para ver el margen real con todos los costos usá la pestaña <strong>🎯 Margen Real</strong>.</li>
                  </ul>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════
                TAB 2 — COSTOS FIJOS MENSUALES
            ════════════════════════════════════════════ */}
            {tab === 'fijos' && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
                  <div>
                    <h2 style={{ margin:0, color:'#334c2b', fontSize:'1.1rem' }}>🏗️ Costos Fijos Mensuales</h2>
                    <p style={{ margin:'0.25rem 0 0', fontSize:'0.85rem', color:'#888' }}>
                      Alquiler, salarios, servicios, depreciación, etc.
                    </p>
                  </div>
                  <button onClick={abrirNuevo} style={S.btnNaranja}>+ Cargar mes</button>
                </div>

                {fijos.length === 0 ? (
                  <div style={{ ...S.card, textAlign:'center', padding:'3rem', color:'#999' }}>
                    <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🏗️</p>
                    <p style={{ marginBottom:'1rem' }}>Todavía no cargaste ningún mes de costos fijos.</p>
                    <button onClick={abrirNuevo} style={S.btnNaranja}>+ Cargar primer mes</button>
                  </div>
                ) : (
                  <div style={{ ...S.card, padding:0, overflow:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'900px' }}>
                      <thead>
                        <tr>
                          {['Mes','Alquiler','Servicios','Salarios','Depreciación','Software','Marketing','Otros','TOTAL',''].map(h =>
                            <th key={h} style={S.th}>{h}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {fijos.map((f, idx) => (
                          <tr key={f.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ ...S.td, fontWeight:700, color:'#334c2b', whiteSpace:'nowrap' }}>
                              {labelPeriodo(f.periodo)}
                            </td>
                            <td style={S.td}>{f.alquiler > 0 ? formatPYG(f.alquiler) : '—'}</td>
                            <td style={S.td}>{f.servicios > 0 ? formatPYG(f.servicios) : '—'}</td>
                            <td style={S.td}>{f.salarios > 0 ? formatPYG(f.salarios) : '—'}</td>
                            <td style={S.td}>{f.depreciacion_equipos > 0 ? formatPYG(f.depreciacion_equipos) : '—'}</td>
                            <td style={S.td}>{f.licencias_software > 0 ? formatPYG(f.licencias_software) : '—'}</td>
                            <td style={S.td}>{f.marketing > 0 ? formatPYG(f.marketing) : '—'}</td>
                            <td style={S.td}>{f.otros > 0 ? formatPYG(f.otros) : '—'}</td>
                            <td style={{ ...S.td, fontWeight:800, color:'#c62828', fontSize:'1rem' }}>
                              {formatPYG(f.total_fijos)}
                            </td>
                            <td style={S.td}>
                              <div style={{ display:'flex', gap:'0.4rem' }}>
                                <button onClick={() => abrirEditar(f)}
                                  style={{ ...S.btnVerde, padding:'0.3rem 0.6rem', fontSize:'0.78rem' }}>✏️</button>
                                <button onClick={() => eliminar(f.id)}
                                  style={{ ...S.btnGris, padding:'0.3rem 0.6rem', fontSize:'0.78rem', backgroundColor:'#c62828' }}>🗑</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Info */}
                <div style={{ ...S.card, backgroundColor:'#f9f5f0', fontSize:'0.88rem', color:'#555', marginTop:'0.5rem' }}>
                  <strong style={{ color:'#334c2b' }}>📌 ¿Qué incluir en cada rubro? </strong>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:'0.5rem', marginTop:'0.75rem' }}>
                    {[
                      { icon:'🏠', label:'Alquiler',      desc:'Local de producción/ventas' },
                      { icon:'💡', label:'Servicios',     desc:'Luz, agua, gas, internet' },
                      { icon:'👷', label:'Salarios',      desc:'Sueldos + aportes IPS' },
                      { icon:'⚙️',  label:'Depreciación',  desc:'Hornos, amasadoras, equipos' },
                      { icon:'💻', label:'Software',      desc:'Supabase, apps, dominio' },
                      { icon:'📣', label:'Marketing',     desc:'Publicidad, redes, impresiones' },
                      { icon:'📦', label:'Otros',         desc:'Gastos varios no categorizados' },
                    ].map(r => (
                      <div key={r.label} style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start' }}>
                        <span>{r.icon}</span>
                        <span><strong>{r.label}: </strong>{r.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════
                TAB 3 — MARGEN REAL
            ════════════════════════════════════════════ */}
            {tab === 'real' && (
              <>
                <div style={{ display:'flex', gap:'1rem', alignItems:'flex-end', marginBottom:'1.25rem', flexWrap:'wrap' }}>
                  <div>
                    <label style={S.label}>Mes a analizar</label>
                    <select style={{ ...S.input, width:'auto', minWidth:'200px' }}
                      value={mesSel} onChange={e => setMesSel(e.target.value)}>
                      {fijos.length === 0
                        ? <option value="">— Sin datos de costos fijos —</option>
                        : fijos.map(f => (
                            <option key={f.id} value={f.periodo}>{labelPeriodo(f.periodo)}</option>
                          ))
                      }
                    </select>
                  </div>
                  {fijos.length === 0 && (
                    <button onClick={() => setTab('fijos')} style={S.btnNaranja}>
                      + Cargar costos fijos primero
                    </button>
                  )}
                </div>

                {fijosMes ? (
                  <>
                    {/* Resumen del mes */}
                    <div style={{ ...S.card, backgroundColor:'#f9f5f0', marginBottom:'1.25rem' }}>
                      <h3 style={{ margin:'0 0 1rem', color:'#334c2b', fontSize:'1rem' }}>
                        📊 Resumen — {labelPeriodo(mesSel)}
                      </h3>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'0.75rem' }}>
                        <div style={{ backgroundColor:'#fff', border:'1px solid #e0d5c5', borderRadius:'6px', padding:'0.75rem', textAlign:'center' }}>
                          <div style={{ fontSize:'0.75rem', color:'#888', marginBottom:'0.25rem' }}>Total costos fijos</div>
                          <div style={{ fontSize:'1.3rem', fontWeight:800, color:'#c62828' }}>{formatPYG(totalFijosMes)}</div>
                        </div>
                        <div style={{ backgroundColor:'#fff', border:'1px solid #e0d5c5', borderRadius:'6px', padding:'0.75rem', textAlign:'center' }}>
                          <div style={{ fontSize:'0.75rem', color:'#888', marginBottom:'0.25rem' }}>Unidades producidas</div>
                          <div style={{ fontSize:'1.3rem', fontWeight:800, color:'#334c2b' }}>
                            {unidadesMes > 0 ? unidadesMes : <span style={{ color:'#f46e15', fontSize:'0.9rem' }}>Sin datos</span>}
                          </div>
                        </div>
                        <div style={{ backgroundColor:'#fff', border:'1px solid #e0d5c5', borderRadius:'6px', padding:'0.75rem', textAlign:'center' }}>
                          <div style={{ fontSize:'0.75rem', color:'#888', marginBottom:'0.25rem' }}>Costo fijo por unidad</div>
                          <div style={{ fontSize:'1.3rem', fontWeight:800, color: costoPorUnidadFijo > 0 ? '#f46e15' : '#aaa' }}>
                            {costoPorUnidadFijo > 0 ? formatPYG(Math.round(costoPorUnidadFijo)) : '—'}
                          </div>
                        </div>
                      </div>
                      {unidadesMes === 0 && (
                        <div style={{ backgroundColor:'#fff8e1', border:'1px solid #f9c74f', borderRadius:'6px', padding:'0.75rem', marginTop:'0.75rem', fontSize:'0.85rem', color:'#5a4000' }}>
                          ⚠️ No se encontraron registros de producción finalizados en {labelPeriodo(mesSel)}. Cargá la producción del mes para calcular el costo fijo por unidad.
                        </div>
                      )}
                    </div>

                    {/* Tabla margen real */}
                    <div style={{ ...S.card, padding:0, overflow:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'900px' }}>
                        <thead>
                          <tr>
                            {['Producto','Precio Venta','Costo Variable','+ Costo Fijo/u','= Costo Total','Margen Real %','Estado Real'].map(h =>
                              <th key={h} style={S.th}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {datos.map((d, idx) => {
                            const { costoVariable, costoFijo, costoTotal, margen } = margenRealProducto(d)
                            const badge = badgeMargen(margen)
                            const sinRend = !d.rendimiento_kg || Number(d.rendimiento_kg) <= 0
                            return (
                              <tr key={d.producto_id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={S.td}><strong style={{ color:'#334c2b' }}>{d.producto_nombre}</strong></td>
                                <td style={{ ...S.td, fontWeight:700 }}>{formatPYG(d.precio_venta)}</td>
                                <td style={{ ...S.td, color:'#f46e15' }}>
                                  {sinRend ? <span style={{ color:'#aaa' }}>—</span> : formatPYG(Math.round(costoVariable))}
                                </td>
                                <td style={{ ...S.td, color:'#c62828' }}>
                                  {costoPorUnidadFijo > 0 ? formatPYG(Math.round(costoFijo)) : '—'}
                                </td>
                                <td style={{ ...S.td, fontWeight:700, color:'#c62828' }}>
                                  {sinRend || costoPorUnidadFijo === 0 ? '—' : formatPYG(Math.round(costoTotal))}
                                </td>
                                <td style={{ ...S.td, fontWeight:800, fontSize:'1.05rem', color: colorMargen(margen) }}>
                                  {sinRend || costoPorUnidadFijo === 0 ? '—' : `${margen}%`}
                                </td>
                                <td style={S.td}>
                                  {sinRend || costoPorUnidadFijo === 0
                                    ? <span style={{ color:'#aaa', fontSize:'0.8rem' }}>Sin datos</span>
                                    : <span style={{ backgroundColor:badge.bg, color:badge.color, padding:'0.2rem 0.6rem', borderRadius:'20px', fontSize:'0.78rem', fontWeight:700, whiteSpace:'nowrap' }}>{badge.text}</span>
                                  }
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ ...S.card, backgroundColor:'#f9f5f0', fontSize:'0.85rem', color:'#555', marginTop:'0.5rem' }}>
                      <strong style={{ color:'#334c2b' }}>📌 ¿Cómo se calcula el Margen Real? </strong>
                      <div style={{ marginTop:'0.5rem', lineHeight:'1.8' }}>
                        <div>Costo variable/unidad = Costo/kg de materia prima × Peso por unidad (o costo total de tanda)</div>
                        <div>Costo fijo/unidad = Total costos fijos del mes ÷ Unidades producidas ese mes</div>
                        <div>Margen real = (Precio venta − Costo total) ÷ Precio venta × 100</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ ...S.card, textAlign:'center', padding:'3rem', color:'#999' }}>
                    <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🎯</p>
                    <p style={{ marginBottom:'1rem' }}>
                      {fijos.length === 0
                        ? 'Primero cargá los costos fijos del mes en la pestaña 🏗️ Costos Fijos.'
                        : 'Seleccioná un mes para ver el margen real.'}
                    </p>
                    <button onClick={() => setTab('fijos')} style={S.btnNaranja}>
                      Ir a Costos Fijos
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ════ MODAL — Cargar/Editar costos fijos ════ */}
      {modal && (
        <>
          <div onClick={cerrar} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:300 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'2rem', zIndex:301, width:'92%', maxWidth:'620px', maxHeight:'92vh', overflowY:'auto' }}>

            <h2 style={{ color:'#334c2b', margin:'0 0 1.5rem' }}>
              {editando ? '✏️ Editar Costos Fijos' : '➕ Cargar Costos Fijos'}
            </h2>

            {error && (
              <div style={{ backgroundColor:'#fdecea', border:'1px solid #c62828', borderRadius:'4px', padding:'0.75rem', marginBottom:'1rem', color:'#c62828', fontSize:'0.9rem' }}>
                ⚠️ {error}
              </div>
            )}

            {/* ─── NUEVO: Banner de plantilla rodante ────────────────────────── */}
            {!editando && mesAnterior && (
              <div style={{ backgroundColor:'#e3f2fd', border:'1px solid #90caf9', borderRadius:'6px', padding:'1rem', marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
                  <div>
                    <p style={{ margin:0, fontSize:'0.9rem', color:'#1565c0', fontWeight:600 }}>
                      📋 Hay datos de {labelPeriodo(mesAnterior.periodo)} disponibles
                    </p>
                    <p style={{ margin:'0.25rem 0 0', fontSize:'0.8rem', color:'#666' }}>
                      Copiá los valores y solo editá lo que cambió (ahorra tiempo)
                    </p>
                  </div>
                  <button onClick={copiarMesAnterior} style={{ ...S.btnAzul, padding:'0.5rem 1rem', fontSize:'0.85rem' }}>
                    📄 Copiar mes anterior
                  </button>
                </div>
              </div>
            )}

            {/* ─── NUEVO: Banner de sugerencia de energía ────────────────────── */}
            {!editando && sugerenciaEnergia && sugerenciaEnergia.estimado > 0 && (
              <div style={{ backgroundColor:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'6px', padding:'1rem', marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
                  <div>
                    <p style={{ margin:0, fontSize:'0.9rem', color:'#e65100', fontWeight:600 }}>
                      ⚡ Energía calculada desde Maquinarias: {formatPYG(sugerenciaEnergia.estimado)}/mes
                    </p>
                    <p style={{ margin:'0.25rem 0 0', fontSize:'0.8rem', color:'#666' }}>
                      Basado en tus equipos registrados · Este valor se cargará en el campo Servicios
                      {sugerenciaEnergia.anterior > 0 && (
                        <span style={{ marginLeft:'0.5rem', color: sugerenciaEnergia.variacion >= 0 ? '#c62828' : '#2e7d32' }}>
                          ({sugerenciaEnergia.variacion >= 0 ? '+' : ''}{formatPYG(sugerenciaEnergia.variacion)} vs mes anterior)
                        </span>
                      )}
                    </p>
                  </div>
                  <button onClick={aplicarSugerenciaEnergia} style={{ ...S.btnNaranja, padding:'0.5rem 1rem', fontSize:'0.85rem' }}>
                    ✅ Usar este valor
                  </button>
                </div>
              </div>
            )}

            {/* Selector de mes */}
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={S.label}>📅 Mes *</label>
              <input
                style={S.input}
                type="month"
                value={form.periodo ? form.periodo.slice(0,7) : ''}
                onChange={e => cambiar('periodo', e.target.value ? e.target.value + '-01' : '')}
              />
              <div style={{ fontSize:'0.75rem', color:'#999', marginTop:'3px' }}>Un registro por mes</div>
            </div>

            {/* Campos de costos */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
              {[
                { campo:'alquiler',             label:'🏠 Alquiler (₲)',      placeholder:'3.000.000' },
                { campo:'servicios',            label:'💡 Servicios (₲)',      placeholder:'800.000'   },
                { campo:'salarios',             label:'👷 Salarios (₲)',       placeholder:'5.000.000' },
                { campo:'depreciacion_equipos', label:'⚙️ Depreciación (₲)',   placeholder:'500.000'   },
                { campo:'licencias_software',   label:'💻 Software (₲)',       placeholder:'200.000'   },
                { campo:'marketing',            label:'📣 Marketing (₲)',      placeholder:'300.000'   },
                { campo:'otros',                label:'📦 Otros (₲)',          placeholder:'100.000'   },
              ].map(f => (
                <div key={f.campo}>
                  <label style={S.label}>{f.label}</label>
                  <input
                    style={S.input}
                    type="number"
                    min="0"
                    step="1000"
                    value={form[f.campo]}
                    onChange={e => cambiar(f.campo, e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>

            {/* Total preview */}
            <div style={{ backgroundColor:'#e8f5e9', border:'1px solid #a5d6a7', borderRadius:'6px', padding:'0.75rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:600, color:'#334c2b' }}>Total del mes: </span>
              <span style={{ fontWeight:800, fontSize:'1.2rem', color:'#c62828' }}>
                {formatPYG(
                  ['alquiler','servicios','salarios','depreciacion_equipos','licencias_software','marketing','otros']
                    .reduce((s, k) => s + (Number(form[k]) || 0), 0)
                )}
              </span>
            </div>

            {/* Notas */}
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={S.label}>📝 Notas (opcional)</label>
              <textarea
                style={{ ...S.input, minHeight:'60px', resize:'vertical' }}
                value={form.notas}
                onChange={e => cambiar('notas', e.target.value)}
                placeholder="Ej: Mes con pago de aguinaldo. Alquiler aumentó en marzo."
              />
            </div>

            <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end' }}>
              <button onClick={cerrar} style={S.btnGris}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1 }}>
                {guardando ? '⏳ Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}