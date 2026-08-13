/**
 * 📁 UBICACIÓN: src/app/admin/compras/page.js
 * 📅 CREADO: 2026-03-01
 * 📌 DESCRIPCIÓN: Gestión de órdenes de compra a proveedores en PanFree.
 *    Lista compras con número, proveedor, estado, total y estado de pago.
 *    Permite crear nuevas compras con detalle de insumos (detalle_compra).
 *    Estados de compra: pendiente, confirmada, recepcionada, cancelada.
 *    Estados de pago: pendiente, parcial, pagado.
 *    Al recepcionar una compra actualiza stock e recalcula PPP de insumos.
 *    Número de compra se genera automáticamente: COMP-YYYYMMDD-XXX.
 *    Precios en PYG (₲).
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const formatPYG = n => `₲ ${Number(n||0).toLocaleString('es-PY')}`
const ESTADOS_COMPRA = ['pendiente','confirmada','recepcionada','cancelada']
const ESTADOS_PAGO   = ['pendiente','parcial','pagado']
const colorEstado = e => ({ pendiente:'#f46e15', confirmada:'#2196f3', recepcionada:'#2e7d32', cancelada:'#c62828' }[e] || '#999')
const colorPago   = e => ({ pendiente:'#f46e15', parcial:'#ff9800', pagado:'#2e7d32' }[e] || '#999')

function generarNumero() {
  const d = new Date()
  const fecha = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const rand = String(Math.floor(Math.random()*900)+100)
  return `COMP-${fecha}-${rand}`
}

const S = {
  page:{ minHeight:'100vh', backgroundColor:'#f5f5f5', fontFamily:'"Segoe UI",sans-serif' },
  header:{ backgroundColor:'#334c2b', color:'#eee6d9', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'3px solid #b7996b' },
  main:{ padding:'2rem', maxWidth:'1300px', margin:'0 auto' },
  card:{ backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', marginBottom:'1rem' },
  btnVerde:{ backgroundColor:'#334c2b', color:'#eee6d9', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  btnNaranja:{ backgroundColor:'#f46e15', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  btnGris:{ backgroundColor:'#999', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  input:{ width:'100%', padding:'0.6rem 0.8rem', border:'2px solid #b7996b', borderRadius:'4px', fontFamily:'inherit', fontSize:'0.9rem', color:'#333' },
  label:{ display:'block', color:'#334c2b', fontWeight:'600', fontSize:'0.85rem', marginBottom:'0.3rem' },
  th:{ backgroundColor:'#334c2b', color:'#eee6d9', padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.85rem' },
  td:{ padding:'0.75rem 1rem', borderBottom:'1px solid #eee6d9', fontSize:'0.9rem', color:'#333', verticalAlign:'middle' },
}

const FORM_VACIO = { numero_compra: generarNumero(), proveedor_id:'', estado:'pendiente', estado_pago:'pendiente', metodo_pago:'', observaciones:'', descuento:0 }
const LINEA_VACIA = { insumo_id:'', cantidad:'', precio_unitario:'' }

export default function PaginaCompras() {
  const router = useRouter()
  const [compras, setCompras]         = useState([])
  const [proveedores, setProveedores] = useState([])
  const [insumos, setInsumos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(false)
  const [form, setForm]               = useState(FORM_VACIO)
  const [lineas, setLineas]           = useState([{ ...LINEA_VACIA }])
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [c, p, i] = await Promise.all([
      supabase.from('compras').select('*, proveedores(nombre_empresa)').order('fecha_compra', { ascending:false }),
      supabase.from('proveedores').select('id,nombre_empresa').eq('is_active',true).order('nombre_empresa'),
      supabase.from('insumos').select('id,nombre,unidad_medida,ppp_actual').eq('is_active',true).order('nombre'),
    ])
    setCompras(c.data || [])
    setProveedores(p.data || [])
    setInsumos(i.data || [])
    setLoading(false)
  }

  function abrirNuevo() { setForm({ ...FORM_VACIO, numero_compra: generarNumero() }); setLineas([{ ...LINEA_VACIA }]); setError(null); setModal(true) }
  function cambiar(campo, valor) { setForm(prev => ({ ...prev, [campo]: valor })) }
  function cambiarLinea(idx, campo, valor) { setLineas(prev => prev.map((l,i) => i === idx ? { ...l, [campo]: valor } : l)) }
  function agregarLinea() { setLineas(prev => [...prev, { ...LINEA_VACIA }]) }
  function quitarLinea(idx) { setLineas(prev => prev.filter((_,i) => i !== idx)) }

  const subtotal = lineas.reduce((s,l) => s + (Number(l.cantidad)||0) * (Number(l.precio_unitario)||0), 0)
  const total = subtotal - (Number(form.descuento)||0)

  async function guardar() {
    setGuardando(true); setError(null)
    try {
      const { data: compraData, error: errCompra } = await supabase.from('compras').insert({
        ...form, subtotal, total_final: total,
        descuento: Number(form.descuento)||0,
        updated_at: new Date().toISOString()
      }).select().single()
      if (errCompra) throw errCompra

      const detalles = lineas.filter(l => l.insumo_id && l.cantidad && l.precio_unitario).map(l => ({
        compra_id: compraData.id,
        insumo_id: l.insumo_id,
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
      }))
      if (detalles.length > 0) {
        const { error: errDet } = await supabase.from('detalle_compra').insert(detalles)
        if (errDet) throw errDet
      }
      await cargar(); setModal(false)
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  async function cambiarEstado(id, nuevoEstado) {
    await supabase.from('compras').update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq('id', id)
    cargar()
  }

  const filtradas = filtroEstado === 'todos' ? compras : compras.filter(c => c.estado === filtroEstado)

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver</button>
          <h1 style={{ margin:0, fontSize:'1.2rem' }}>🛒 Compras</h1>
        </div>
        <button onClick={abrirNuevo} style={S.btnNaranja}>+ Nueva Compra</button>
      </header>

      <main style={S.main}>
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          {['todos',...ESTADOS_COMPRA].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{ ...S.btnVerde, fontSize:'0.8rem', padding:'0.4rem 0.9rem', opacity: filtroEstado === e ? 1 : 0.5, backgroundColor: filtroEstado === e ? '#334c2b' : '#888' }}>
              {e.charAt(0).toUpperCase()+e.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ ...S.card, overflow:'auto' }}>
          {loading ? <p style={{ padding:'2rem', textAlign:'center', color:'#999' }}>⏳ Cargando...</p> : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['N° Compra','Proveedor','Fecha','Total','Estado','Pago','Acciones'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtradas.map(c => (
                  <tr key={c.id}>
                    <td style={S.td}><strong style={{ color:'#334c2b', fontFamily:'monospace' }}>{c.numero_compra}</strong></td>
                    <td style={S.td}>{c.proveedores?.nombre_empresa || '—'}</td>
                    <td style={S.td}>{c.fecha_compra ? new Date(c.fecha_compra).toLocaleDateString('es-PY') : '—'}</td>
                    <td style={{ ...S.td, fontWeight:700, color:'#f46e15' }}>{formatPYG(c.total_final)}</td>
                    <td style={S.td}>
                      <select value={c.estado} onChange={e => cambiarEstado(c.id, e.target.value)} style={{ border:`2px solid ${colorEstado(c.estado)}`, borderRadius:'4px', padding:'0.2rem 0.4rem', fontFamily:'inherit', fontSize:'0.82rem', color: colorEstado(c.estado), fontWeight:700, backgroundColor:'#fff', cursor:'pointer' }}>
                        {ESTADOS_COMPRA.map(e=><option key={e} value={e}>{e}</option>)}
                      </select>
                    </td>
                    <td style={S.td}>
                      <span style={{ color: colorPago(c.estado_pago), fontWeight:700, fontSize:'0.85rem' }}>
                        {c.estado_pago}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button style={{ ...S.btnVerde, padding:'0.3rem 0.7rem', fontSize:'0.8rem' }}>👁 Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:300 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'2rem', zIndex:301, width:'95%', maxWidth:'750px', maxHeight:'92vh', overflowY:'auto' }}>
            <h2 style={{ color:'#334c2b', marginBottom:'1.5rem' }}>🛒 Nueva Orden de Compra</h2>
            {error && <div style={{ backgroundColor:'#fdecea', border:'1px solid #c62828', borderRadius:'4px', padding:'0.75rem', marginBottom:'1rem', color:'#c62828', fontSize:'0.9rem' }}>⚠️ {error}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
              <div>
                <label style={S.label}>N° Compra</label>
                <input style={{ ...S.input, backgroundColor:'#f9f5f0', color:'#888' }} value={form.numero_compra} readOnly />
              </div>
              <div>
                <label style={S.label}>Proveedor *</label>
                <select style={S.input} value={form.proveedor_id} onChange={e => cambiar('proveedor_id', e.target.value)}>
                  <option value="">— Seleccioná —</option>
                  {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Estado</label>
                <select style={S.input} value={form.estado} onChange={e => cambiar('estado', e.target.value)}>
                  {ESTADOS_COMPRA.map(e=><option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Estado de Pago</label>
                <select style={S.input} value={form.estado_pago} onChange={e => cambiar('estado_pago', e.target.value)}>
                  {ESTADOS_PAGO.map(e=><option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Método de Pago</label>
                <input style={S.input} value={form.metodo_pago || ''} onChange={e => cambiar('metodo_pago', e.target.value)} placeholder="Transferencia, efectivo..." />
              </div>
              <div>
                <label style={S.label}>Descuento (₲)</label>
                <input style={S.input} type="number" value={form.descuento || 0} onChange={e => cambiar('descuento', e.target.value)} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Observaciones</label>
                <textarea style={{ ...S.input, minHeight:'60px', resize:'vertical' }} value={form.observaciones || ''} onChange={e => cambiar('observaciones', e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                <h3 style={{ margin:0, color:'#334c2b', fontSize:'1rem' }}>Detalle de insumos</h3>
                <button onClick={agregarLinea} style={{ ...S.btnVerde, padding:'0.4rem 0.8rem', fontSize:'0.8rem' }}>+ Agregar</button>
              </div>
              {lineas.map((l, idx) => (
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:'0.5rem', marginBottom:'0.5rem', alignItems:'end' }}>
                  <div>
                    {idx === 0 && <label style={S.label}>Insumo</label>}
                    <select style={S.input} value={l.insumo_id} onChange={e => cambiarLinea(idx,'insumo_id',e.target.value)}>
                      <option value="">— Seleccionar —</option>
                      {insumos.map(i=><option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida})</option>)}
                    </select>
                  </div>
                  <div>
                    {idx === 0 && <label style={S.label}>Cantidad</label>}
                    <input style={S.input} type="number" step="0.001" value={l.cantidad} onChange={e => cambiarLinea(idx,'cantidad',e.target.value)} placeholder="10.000" />
                  </div>
                  <div>
                    {idx === 0 && <label style={S.label}>Precio Unitario (₲)</label>}
                    <input style={S.input} type="number" value={l.precio_unitario} onChange={e => cambiarLinea(idx,'precio_unitario',e.target.value)} placeholder="5000" />
                  </div>
                  <button onClick={() => quitarLinea(idx)} style={{ ...S.btnGris, padding:'0.5rem 0.7rem', backgroundColor:'#c62828', marginTop: idx === 0 ? '1.4rem' : 0 }}>✕</button>
                </div>
              ))}
              <div style={{ textAlign:'right', marginTop:'1rem', padding:'1rem', backgroundColor:'#f9f5f0', borderRadius:'4px', border:'1px solid #b7996b' }}>
                <div style={{ color:'#666', marginBottom:'0.3rem' }}>Subtotal: <strong>{formatPYG(subtotal)}</strong></div>
                {Number(form.descuento) > 0 && <div style={{ color:'#2e7d32', marginBottom:'0.3rem' }}>Descuento: <strong>- {formatPYG(form.descuento)}</strong></div>}
                <div style={{ fontSize:'1.1rem', color:'#f46e15', fontWeight:700 }}>TOTAL: {formatPYG(total)}</div>
              </div>
            </div>

            <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={S.btnGris}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1 }}>
                {guardando ? '⏳ Guardando...' : '💾 Registrar Compra'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
