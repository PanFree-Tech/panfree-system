/**
 * 📁 UBICACIÓN: src/app/admin/insumos/page.js
 * 📅 CREADO: 2026-03-01
 * 📌 DESCRIPCIÓN: CRUD completo de insumos (materias primas) de PanFree.
 *    Lista insumos con stock actual vs mínimo (alerta visual en rojo).
 *    Permite crear y editar insumos con campos: nombre, categoría,
 *    unidad_medida, stock_actual, stock_minimo, precio_compra_actual,
 *    ppp_actual, proveedor_id, is_active, requiere_control_lote.
 *    Categorías: harinas, levaduras, grasas, endulzantes, aditivos, envases, otros.
 *    Precios en PYG (₲).
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Wheat,
  Plus,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Loader2,
  Save,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { S, COLORS } from '../_styles'
import { formatPYG } from '../lib/helpers'

// ✅ Se agregó 'féculas' en la lista
const CATEGORIAS  = ['aditivos','chocolates','condimentos','endulzantes','envases','esencias','féculas','frutas','frutos_secos','grasas','harinas','huevos','lacteos','levaduras','otros']
const UNIDADES    = ['kg','g','lt','ml','unidad','docena','pack']
const FORM_VACIO  = {
  nombre:'', descripcion:'', categoria:'harinas', unidad_medida:'kg',
  factor_conversion:1, stock_actual:0, stock_minimo:1, stock_maximo:'',
  precio_compra_actual:0, ppp_actual:0, proveedor_id:'',
  is_active:true, requiere_control_lote:false,
}

export default function PaginaInsumos() {
  const router = useRouter()
  const [insumos, setInsumos]         = useState([])
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(FORM_VACIO)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState(null)
  const [filtroCategoria, setFiltro]  = useState('todos')
  const [soloStockBajo, setSoloStockBajo] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [ins, prov] = await Promise.all([
      supabase.from('insumos').select('*, proveedores(nombre_empresa)').order('nombre'),
      supabase.from('proveedores').select('id, nombre_empresa').eq('is_active', true).order('nombre_empresa'),
    ])
    setInsumos(ins.data || [])
    setProveedores(prov.data || [])
    setLoading(false)
  }

  function abrirNuevo()  { setEditando(null); setForm(FORM_VACIO); setError(null); setModal(true) }
  function abrirEditar(i){ setEditando(i.id); setForm({ ...i, proveedor_id: i.proveedor_id || '' }); setError(null); setModal(true) }
  function cerrar()      { setModal(false); setError(null) }
  function cambiar(campo, valor){ setForm(prev => ({ ...prev, [campo]: valor })) }

  async function guardar() {
    setGuardando(true); setError(null)
    try {
      const payload = {
        ...form,
        stock_actual:          Number(form.stock_actual)           || 0,
        stock_minimo:          Number(form.stock_minimo)           || 1,
        stock_maximo:          form.stock_maximo ? Number(form.stock_maximo) : null,
        precio_compra_actual:  Number(form.precio_compra_actual)   || 0,
        ppp_actual:            Number(form.ppp_actual)             || 0,
        factor_conversion:     Number(form.factor_conversion)      || 1,
        proveedor_id:          form.proveedor_id || null,
        updated_at:            new Date().toISOString(),
      }
      delete payload.proveedores
      if (editando) {
        const { error } = await supabase.from('insumos').update(payload).eq('id', editando)
        if (error) throw error
      } else {
        const { error } = await supabase.from('insumos').insert(payload)
        if (error) throw error
      }
      await cargar(); cerrar()
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  async function toggleActivo(i) {
    await supabase.from('insumos').update({ is_active: !i.is_active }).eq('id', i.id)
    cargar()
  }

  let filtrados = insumos
  if (filtroCategoria !== 'todos') filtrados = filtrados.filter(i => i.categoria === filtroCategoria)
  if (soloStockBajo) filtrados = filtrados.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo))

  const stockBajoCount = insumos.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo) && i.is_active).length

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 style={{ margin:0, fontSize:'1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wheat size={22} color="#f46e15" /> Insumos
          </h1>
          {stockBajoCount > 0 && (
            <span style={{ backgroundColor:'#c62828', color:'#fff', padding:'0.2rem 0.7rem', borderRadius:'20px', fontSize:'0.8rem', fontWeight:700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertTriangle size={13} /> {stockBajoCount} con stock bajo
            </span>
          )}
        </div>
        <button onClick={abrirNuevo} style={{ ...S.btnNaranja, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Plus size={16} /> Nuevo Insumo
        </button>
      </header>

      <main style={S.main}>
        {/* Filtros */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          <select style={{ ...S.input, width:'auto' }} value={filtroCategoria} onChange={e => setFiltro(e.target.value)}>
            <option value="todos">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer', fontWeight:600, color:'#c62828', fontSize:'0.9rem' }}>
            <input type="checkbox" checked={soloStockBajo} onChange={e => setSoloStockBajo(e.target.checked)} />
            Solo stock bajo <AlertTriangle size={14} style={{ display: 'inline' }} />
          </label>
        </div>

        <div style={{ ...S.card, overflow:'auto' }}>
          {loading ? (
            <p style={{ padding:'2rem', textAlign:'center', color:'#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Loader2 className="animate-spin" size={16} /> Cargando...
            </p>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Insumo','Categoría','Unidad','Stock Actual','Stock Mín','PPP Actual','Proveedor','Estado','Acciones'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtrados.map(i => {
                  const stockBajo = Number(i.stock_actual) <= Number(i.stock_minimo)
                  return (
                    <tr key={i.id} style={{ backgroundColor: stockBajo ? '#fff8f8' : '#fff' }}>
                      <td style={S.td}><strong style={{ color:'#334c2b' }}>{i.nombre}</strong></td>
                      <td style={S.td}><span style={{ backgroundColor:'#f0ebe3', padding:'0.2rem 0.6rem', borderRadius:'20px', fontSize:'0.8rem', color:'#334c2b', fontWeight:600 }}>{i.categoria}</span></td>
                      <td style={S.td}>{i.unidad_medida}</td>
                      <td style={{ ...S.td, fontWeight:700, color: stockBajo ? '#c62828' : '#2e7d32' }}>
                        {i.stock_actual} {stockBajo && <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }} />}
                      </td>
                      <td style={S.td}>{i.stock_minimo}</td>
                      <td style={{ ...S.td, color:'#f46e15', fontWeight:700 }}>{formatPYG(i.ppp_actual)}</td>
                      <td style={S.td}>{i.proveedores?.nombre_empresa || '—'}</td>
                      <td style={S.td}>
                        <button onClick={() => toggleActivo(i)} style={{ ...S.btnVerde, padding:'0.3rem 0.6rem', fontSize:'0.8rem', backgroundColor: i.is_active ? '#2e7d32' : '#c62828', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {i.is_active ? <Check size={14} /> : <X size={14} />}
                        </button>
                      </td>
                      <td style={S.td}>
                        <button onClick={() => abrirEditar(i)} style={{ ...S.btnVerde, padding:'0.3rem 0.6rem', fontSize:'0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modal && (
        <>
          <div onClick={cerrar} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:300 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'2rem', zIndex:301, width:'90%', maxWidth:'620px', maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ color:'#334c2b', marginBottom:'1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {editando ? <><Pencil size={20} /> Editar Insumo</> : <><Plus size={20} /> Nuevo Insumo</>}
            </h2>
            {error && <div style={{ backgroundColor:'#fdecea', border:'1px solid #c62828', borderRadius:'4px', padding:'0.75rem', marginBottom:'1rem', color:'#c62828', fontSize:'0.9rem' }}>⚠️ {error}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Nombre *</label>
                <input style={S.input} value={form.nombre} onChange={e => cambiar('nombre', e.target.value)} placeholder="Harina de arroz" />
              </div>
              <div>
                <label style={S.label}>Categoría *</label>
                <select style={S.input} value={form.categoria} onChange={e => cambiar('categoria', e.target.value)}>
                  {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Unidad de Medida *</label>
                <select style={S.input} value={form.unidad_medida} onChange={e => cambiar('unidad_medida', e.target.value)}>
                  {UNIDADES.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Stock Actual</label>
                <input style={S.input} type="number" step="0.001" value={form.stock_actual} onChange={e => cambiar('stock_actual', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Stock Mínimo</label>
                <input style={S.input} type="number" step="0.001" value={form.stock_minimo} onChange={e => cambiar('stock_minimo', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Stock Máximo</label>
                <input style={S.input} type="number" step="0.001" value={form.stock_maximo || ''} onChange={e => cambiar('stock_maximo', e.target.value)} placeholder="Opcional" />
              </div>
              <div>
                <label style={S.label}>Precio Compra Actual (₲) *</label>
                <input style={S.input} type="number" value={form.precio_compra_actual} onChange={e => cambiar('precio_compra_actual', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>PPP Actual (₲) *</label>
                <input style={S.input} type="number" value={form.ppp_actual} onChange={e => cambiar('ppp_actual', e.target.value)} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Proveedor Principal</label>
                <select style={S.input} value={form.proveedor_id || ''} onChange={e => cambiar('proveedor_id', e.target.value)}>
                  <option value="">— Sin proveedor asignado —</option>
                  {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Descripción</label>
                <textarea style={{ ...S.input, minHeight:'60px', resize:'vertical' }} value={form.descripcion || ''} onChange={e => cambiar('descripcion', e.target.value)} />
              </div>
              <div style={{ display:'flex', gap:'1.5rem', gridColumn:'1/-1' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer', fontWeight:600, color:'#334c2b', fontSize:'0.9rem' }}>
                  <input type="checkbox" checked={!!form.is_active} onChange={e => cambiar('is_active', e.target.checked)} /> Activo
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer', fontWeight:600, color:'#334c2b', fontSize:'0.9rem' }}>
                  <input type="checkbox" checked={!!form.requiere_control_lote} onChange={e => cambiar('requiere_control_lote', e.target.checked)} /> Control de Lote
                </label>
              </div>
            </div>

            <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem', justifyContent:'flex-end' }}>
              <button onClick={cerrar} style={S.btnGris}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                {guardando ? <><Loader2 className="animate-spin" size={14} /> Guardando...</> : <><Save size={14} /> Guardar</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}