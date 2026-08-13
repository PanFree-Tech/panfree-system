/**
 * 📁 UBICACIÓN: src/app/admin/proveedores/page.js
 * 📅 CREADO: 2026-03-01
 * 📌 DESCRIPCIÓN: CRUD completo de proveedores de PanFree.
 *    Lista proveedores con su nombre, CUIT/RUC, contacto, ciudad y estado.
 *    Permite crear, editar y activar/desactivar proveedores.
 *    Campos: nombre_empresa, cuit_cuil, contacto_nombre, contacto_email,
 *            contacto_telefono, direccion, ciudad, provincia, categorias[],
 *            calificacion (0-5), notas_internas, is_active.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const FORM_VACIO = {
  nombre_empresa:'', ruc_ci:'', contacto_nombre:'', contacto_email:'',
  contacto_telefono:'', direccion:'', ciudad:'', departamento:'',
  categorias:[], calificacion:'', notas_internas:'', is_active:true,
}

const S = {
  page:{ minHeight:'100vh', backgroundColor:'#f5f5f5', fontFamily:'"Segoe UI",sans-serif' },
  header:{ backgroundColor:'#334c2b', color:'#eee6d9', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'3px solid #b7996b' },
  main:{ padding:'2rem', maxWidth:'1300px', margin:'0 auto' },
  card:{ backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'1.5rem', marginBottom:'1rem' },
  btnVerde:{ backgroundColor:'#334c2b', color:'#eee6d9', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  btnNaranja:{ backgroundColor:'#f46e15', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  btnGris:{ backgroundColor:'#999', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  input:{ width:'100%', padding:'0.6rem 0.8rem', border:'2px solid #b7996b', borderRadius:'4px', fontFamily:'inherit', fontSize:'0.9rem', color:'#333' },
  label:{ display:'block', color:'#334c2b', fontWeight:'600', fontSize:'0.85rem', marginBottom:'0.3rem' },
  th:{ backgroundColor:'#334c2b', color:'#eee6d9', padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.85rem' },
  td:{ padding:'0.75rem 1rem', borderBottom:'1px solid #eee6d9', fontSize:'0.9rem', color:'#333', verticalAlign:'middle' },
}

export default function PaginaProveedores() {
  const router = useRouter()
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(FORM_VACIO)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState(null)
  const [busqueda, setBusqueda]       = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('proveedores').select('*').order('nombre_empresa')
    setProveedores(data || [])
    setLoading(false)
  }

  function abrirNuevo() { setEditando(null); setForm(FORM_VACIO); setError(null); setModal(true) }
  function abrirEditar(p) { setEditando(p.id); setForm({ ...p, categorias: p.categorias || [] }); setError(null); setModal(true) }
  function cerrar() { setModal(false); setError(null) }
  function cambiar(campo, valor) { setForm(prev => ({ ...prev, [campo]: valor })) }

  async function guardar() {
    setGuardando(true); setError(null)
    try {
      const payload = { ...form, calificacion: form.calificacion ? Number(form.calificacion) : null, updated_at: new Date().toISOString() }
      if (editando) {
        const { error } = await supabase.from('proveedores').update(payload).eq('id', editando)
        if (error) throw error
      } else {
        const { error } = await supabase.from('proveedores').insert(payload)
        if (error) throw error
      }
      await cargar(); cerrar()
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  async function toggleActivo(p) {
    await supabase.from('proveedores').update({ is_active: !p.is_active }).eq('id', p.id)
    cargar()
  }

  const filtrados = proveedores.filter(p =>
    p.nombre_empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.contacto_nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  function Estrellas({ val }) {
    const n = Math.round(Number(val) || 0)
    return <span>{Array.from({length:5},(_,i) => i < n ? '⭐' : '☆').join('')}</span>
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver</button>
          <h1 style={{ margin:0, fontSize:'1.2rem' }}>🏭 Proveedores</h1>
        </div>
        <button onClick={abrirNuevo} style={S.btnNaranja}>+ Nuevo Proveedor</button>
      </header>

      <main style={S.main}>
        <div style={{ marginBottom:'1rem' }}>
          <input style={{ ...S.input, maxWidth:'350px' }} placeholder="🔍 Buscar por nombre o contacto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>

        <div style={{ ...S.card, padding:0, overflow:'auto' }}>
          {loading ? <p style={{ padding:'2rem', textAlign:'center', color:'#999' }}>⏳ Cargando...</p> : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Empresa','RUC','Contacto','Ciudad','Calificación','Estado','Acciones'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id}>
                    <td style={S.td}><strong style={{ color:'#334c2b' }}>{p.nombre_empresa}</strong></td>
                    <td style={S.td}>{p.ruc_ci || '—'}</td>
                    <td style={S.td}>
                      {p.contacto_nombre && <div style={{ fontWeight:600 }}>{p.contacto_nombre}</div>}
                      {p.contacto_email && <div style={{ fontSize:'0.8rem', color:'#666' }}>{p.contacto_email}</div>}
                      {p.contacto_telefono && <div style={{ fontSize:'0.8rem', color:'#666' }}>{p.contacto_telefono}</div>}
                    </td>
                    <td style={S.td}>{p.ciudad || '—'}</td>
                    <td style={S.td}><Estrellas val={p.calificacion} /></td>
                    <td style={S.td}>
                      <button onClick={() => toggleActivo(p)} style={{ ...S.btnVerde, padding:'0.3rem 0.8rem', fontSize:'0.8rem', backgroundColor: p.is_active ? '#2e7d32' : '#c62828' }}>
                        {p.is_active ? '✅ Activo' : '❌ Inactivo'}
                      </button>
                    </td>
                    <td style={S.td}>
                      <button onClick={() => abrirEditar(p)} style={{ ...S.btnVerde, padding:'0.3rem 0.8rem', fontSize:'0.8rem' }}>✏️ Editar</button>
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
          <div onClick={cerrar} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:300 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'2rem', zIndex:301, width:'90%', maxWidth:'600px', maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ color:'#334c2b', marginBottom:'1.5rem' }}>{editando ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor'}</h2>
            {error && <div style={{ backgroundColor:'#fdecea', border:'1px solid #c62828', borderRadius:'4px', padding:'0.75rem', marginBottom:'1rem', color:'#c62828', fontSize:'0.9rem' }}>⚠️ {error}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Nombre Empresa *</label>
                <input style={S.input} value={form.nombre_empresa} onChange={e => cambiar('nombre_empresa', e.target.value)} placeholder="Harinas del Paraguay S.A." />
              </div>
              <div>
                <label style={S.label}>RUC</label>
                <input style={S.input} value={form.ruc_ci || ''} onChange={e => cambiar('ruc_ci', e.target.value)} placeholder="80000000-0" />
              </div>
              <div>
                <label style={S.label}>Calificación (0-5)</label>
                <input style={S.input} type="number" min="0" max="5" step="0.5" value={form.calificacion || ''} onChange={e => cambiar('calificacion', e.target.value)} placeholder="4.5" />
              </div>
              <div>
                <label style={S.label}>Contacto Nombre</label>
                <input style={S.input} value={form.contacto_nombre || ''} onChange={e => cambiar('contacto_nombre', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Contacto Email</label>
                <input style={S.input} type="email" value={form.contacto_email || ''} onChange={e => cambiar('contacto_email', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Teléfono</label>
                <input style={S.input} value={form.contacto_telefono || ''} onChange={e => cambiar('contacto_telefono', e.target.value)} placeholder="+595 21 000000" />
              </div>
              <div>
                <label style={S.label}>Ciudad</label>
                <input style={S.input} value={form.ciudad || ''} onChange={e => cambiar('ciudad', e.target.value)} placeholder="Encarnación" />
              </div>
              <div>
                <label style={S.label}>Departamento</label>
                <input style={S.input} value={form.departamento || ''} onChange={e => cambiar('departamento', e.target.value)} placeholder="Itapúa" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Dirección</label>
                <input style={S.input} value={form.direccion || ''} onChange={e => cambiar('direccion', e.target.value)} placeholder="Av. Principal 1234" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Notas Internas</label>
                <textarea style={{ ...S.input, minHeight:'70px', resize:'vertical' }} value={form.notas_internas || ''} onChange={e => cambiar('notas_internas', e.target.value)} placeholder="Observaciones internas sobre el proveedor..." />
              </div>
              <div>
                <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer', fontWeight:600, color:'#334c2b', fontSize:'0.9rem' }}>
                  <input type="checkbox" checked={!!form.is_active} onChange={e => cambiar('is_active', e.target.checked)} />
                  ✅ Proveedor Activo
                </label>
              </div>
            </div>

            <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem', justifyContent:'flex-end' }}>
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