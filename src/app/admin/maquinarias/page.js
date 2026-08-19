/**
 * 📁 UBICACIÓN: src/app/admin/maquinarias/page.js
 * 📅 CREADO: 2026-03-05
 * 📌 DESCRIPCIÓN: Gestión de maquinarias y cálculo de costo energético de PanFree.
 *    - CRUD de equipos (horno, amasadora, heladera, freezer, etc.)
 *    - Tipo 'activa': consume solo cuando produce (horno, amasadora)
 *    - Tipo 'permanente': consume 24/7 (heladera, freezer)
 *    - Cálculo automático de costo energético mensual por máquina
 *    - Total de energía listo para cargar en Costos Fijos → Servicios
 *    - Precio kWh actualizable globalmente
 *    Todos los importes en PYG (₲)
 */
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { S, COLORS } from '../_styles'
import { formatPYG } from '../lib/helpers'

const FORM_VACIO = {
  nombre              : '',
  descripcion         : '',
  tipo_uso            : 'activa',
  potencia_kw         : '',
  horas_uso_por_tanda : '',
  tandas_por_mes      : '',
  precio_kwh          : '',
  notas               : '',
  is_active           : true,
}

// Cálculo local (espeja la fórmula GENERATED del SQL)
function calcularCostoMensual(m) {
  const kw    = Number(m.potencia_kw)     || 0
  const kwh   = Number(m.precio_kwh)      || 0
  const horas = Number(m.horas_uso_por_tanda) || 0
  const tandas = Number(m.tandas_por_mes) || 0
  if (m.tipo_uso === 'permanente') return Math.round(kw * 24 * 30 * kwh)
  if (m.tipo_uso === 'activa' && horas > 0 && tandas > 0) return Math.round(kw * horas * tandas * kwh)
  return 0
}

export default function PaginaMaquinarias() {
  const router = useRouter()
  const [maquinas,  setMaquinas]  = useState([])
  const [resumen,   setResumen]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editando,  setEditando]  = useState(null)
  const [form,      setForm]      = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState(null)
  // Modal actualizar precio kWh global
  const [modalKwh,    setModalKwh]    = useState(false)
  const [nuevoPrecioKwh, setNuevoPrecioKwh] = useState('')
  const [actualizandoKwh, setActualizandoKwh] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [maq, res] = await Promise.all([
      supabase.from('maquinarias').select('*').order('tipo_uso').order('nombre'),
      supabase.from('vista_energia_mensual').select('*').single(),
    ])
    setMaquinas(maq.data || [])
    setResumen(res.data || null)
    setLoading(false)
  }

  function abrirNuevo() {
    // Heredar precio kWh del último registro si existe
    const kwh = maquinas[0]?.precio_kwh || ''
    setEditando(null)
    setForm({ ...FORM_VACIO, precio_kwh: kwh })
    setError(null)
    setModal(true)
  }

  function abrirEditar(m) {
    setEditando(m.id)
    setForm({
      nombre              : m.nombre,
      descripcion         : m.descripcion || '',
      tipo_uso            : m.tipo_uso,
      potencia_kw         : m.potencia_kw,
      horas_uso_por_tanda : m.horas_uso_por_tanda || '',
      tandas_por_mes      : m.tandas_por_mes || '',
      precio_kwh          : m.precio_kwh,
      notas               : m.notas || '',
      is_active           : m.is_active,
    })
    setError(null)
    setModal(true)
  }

  function cerrar() { setModal(false); setError(null) }
  function cambiar(campo, valor) { setForm(p => ({ ...p, [campo]: valor })) }

  async function guardar() {
    if (!form.nombre.trim())  { setError('El nombre es obligatorio'); return }
    if (!form.potencia_kw)    { setError('La potencia en kW es obligatoria'); return }
    if (!form.precio_kwh)     { setError('El precio del kWh es obligatorio'); return }
    if (form.tipo_uso === 'activa' && (!form.horas_uso_por_tanda || !form.tandas_por_mes)) {
      setError('Para maquinaria activa indicá las horas por tanda y las tandas por mes'); return
    }

    setGuardando(true); setError(null)
    try {
      const payload = {
        nombre              : form.nombre.trim(),
        descripcion         : form.descripcion || null,
        tipo_uso            : form.tipo_uso,
        potencia_kw         : Number(form.potencia_kw),
        horas_uso_por_tanda : form.tipo_uso === 'activa' ? Number(form.horas_uso_por_tanda) : 0,
        tandas_por_mes      : form.tipo_uso === 'activa' ? Number(form.tandas_por_mes)      : 0,
        precio_kwh          : Number(form.precio_kwh),
        notas               : form.notas || null,
        is_active           : form.is_active,
        updated_at          : new Date().toISOString(),
      }
      if (editando) {
        const { error: e } = await supabase.from('maquinarias').update(payload).eq('id', editando)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('maquinarias').insert(payload)
        if (e) throw e
      }
      await cargar(); cerrar()
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  async function toggleActivo(m) {
    await supabase.from('maquinarias').update({ is_active: !m.is_active }).eq('id', m.id)
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta maquinaria?')) return
    await supabase.from('maquinarias').delete().eq('id', id)
    cargar()
  }

  // Actualizar precio kWh en TODAS las maquinarias de un golpe
  async function actualizarKwhGlobal() {
    if (!nuevoPrecioKwh || Number(nuevoPrecioKwh) <= 0) return
    setActualizandoKwh(true)
    await supabase.from('maquinarias').update({ precio_kwh: Number(nuevoPrecioKwh), updated_at: new Date().toISOString() }).neq('id', '00000000-0000-0000-0000-000000000000')
    await cargar()
    setModalKwh(false)
    setNuevoPrecioKwh('')
    setActualizandoKwh(false)
  }

  // Preview costo en el modal mientras se edita
  const costoPreview = calcularCostoMensual(form)

  // Precio kWh actual (del primer registro activo)
  const precioKwhActual = maquinas.find(m => m.is_active)?.precio_kwh || 0

  const activas     = maquinas.filter(m => m.tipo_uso === 'activa'     && m.is_active)
  const permanentes = maquinas.filter(m => m.tipo_uso === 'permanente' && m.is_active)

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding: '0.4rem 0.8rem' }}>← Volver</button>
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>⚙️ Maquinarias y Energía</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Botón de ayuda - NUEVO */}
          <button onClick={() => router.push('/admin/ayuda/maquinarias')} 
            style={{ ...S.btnGris, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            ❓ Ayuda
          </button>
          <button onClick={() => setModalKwh(true)}
            style={{ ...S.btnGris, padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            💡 Actualizar precio kWh
          </button>
          <button onClick={abrirNuevo} style={S.btnNaranja}>+ Nueva Maquinaria</button>
        </div>
      </header>

      <main style={S.main}>

        {/* ── Resumen energético ── */}
        {resumen && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total energía/mes',       valor: formatPYG(resumen.total_energia_mensual),  color: '#c62828', big: true },
              { label: 'Consumo permanente (24/7)',valor: formatPYG(resumen.energia_permanente),     color: '#f46e15' },
              { label: 'Consumo activo (producción)',valor: formatPYG(resumen.energia_activa),       color: '#334c2b' },
              { label: 'Equipos registrados',      valor: resumen.cantidad_maquinas,                 color: '#b7996b' },
            ].map(kpi => (
              <div key={kpi.label} style={{ ...S.card, textAlign: 'center', padding: '1.25rem', marginBottom: 0 }}>
                <p style={{ fontSize: kpi.big ? '1.5rem' : '1.3rem', fontWeight: 800, color: kpi.color, margin: 0 }}>{kpi.valor}</p>
                <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.3rem 0 0', lineHeight: 1.3 }}>{kpi.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Banner: llevar a costos fijos ── */}
        {resumen?.total_energia_mensual > 0 && (
          <div style={{ backgroundColor: '#e8f5e9', border: '2px solid #a5d6a7', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong style={{ color: '#2e7d32' }}>✅ Energía calculada: {formatPYG(resumen.total_energia_mensual)}/mes</strong>
              <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.2rem' }}>
                Usá este valor en <strong>Costos Fijos → Servicios</strong> al cargar el mes.
              </div>
            </div>
            <button onClick={() => router.push('/admin/costos')}
              style={{ ...S.btnVerde, padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              → Ir a Costos Fijos
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>⏳ Cargando...</p>
        ) : maquinas.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#999' }}>
            <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>⚙️</p>
            <p style={{ marginBottom: '1rem' }}>Todavía no registraste ninguna maquinaria.</p>
            <button onClick={abrirNuevo} style={S.btnNaranja}>+ Agregar primera maquinaria</button>
          </div>
        ) : (
          <>
            {/* ── Permanentes ── */}
            {permanentes.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#334c2b', fontSize: '1rem', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🧊 Consumo Permanente (24/7)
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#888' }}>— heladera, freezer, etc.</span>
                </h2>
                <TablaEquipos equipos={permanentes} onEditar={abrirEditar} onToggle={toggleActivo} onEliminar={eliminar} S={S} formatPYG={formatPYG} />
              </div>
            )}

            {/* ── Activas ── */}
            {activas.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#334c2b', fontSize: '1rem', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔥 Consumo Activo (solo en producción)
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#888' }}>— horno, amasadora, etc.</span>
                </h2>
                <TablaEquipos equipos={activas} onEditar={abrirEditar} onToggle={toggleActivo} onEliminar={eliminar} S={S} formatPYG={formatPYG} />
              </div>
            )}

            {/* Inactivas */}
            {maquinas.filter(m => !m.is_active).length > 0 && (
              <details style={{ marginBottom: '1.5rem' }}>
                <summary style={{ cursor: 'pointer', color: '#999', fontSize: '0.88rem', padding: '0.5rem 0' }}>
                  Ver maquinarias inactivas ({maquinas.filter(m => !m.is_active).length})
                </summary>
                <div style={{ marginTop: '0.75rem' }}>
                  <TablaEquipos equipos={maquinas.filter(m => !m.is_active)} onEditar={abrirEditar} onToggle={toggleActivo} onEliminar={eliminar} S={S} formatPYG={formatPYG} />
                </div>
              </details>
            )}
          </>
        )}

        {/* ── Nota informativa ── */}
        <div style={{ ...S.card, backgroundColor: '#f9f5f0', fontSize: '0.88rem', color: '#555' }}>
          <strong style={{ color: '#334c2b' }}>📌 ¿Cómo funciona el cálculo?</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem', marginTop: '0.75rem' }}>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e8ddd0', borderRadius: '6px', padding: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: '#334c2b', marginBottom: '0.4rem' }}>🧊 Consumo permanente</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', backgroundColor: '#f5f5f5', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.4rem' }}>
                kW × 24hs × 30 días × ₲/kWh
              </div>
              <div style={{ fontSize: '0.82rem', color: '#777' }}>Ej: Heladera 0.15kW × 720hs × ₲800 = ₲86.400/mes</div>
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e8ddd0', borderRadius: '6px', padding: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: '#334c2b', marginBottom: '0.4rem' }}>🔥 Consumo activo</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', backgroundColor: '#f5f5f5', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.4rem' }}>
                kW × hs/tanda × tandas/mes × ₲/kWh
              </div>
              <div style={{ fontSize: '0.82rem', color: '#777' }}>Ej: Horno 2.5kW × 1.5hs × 20 tandas × ₲800 = ₲60.000/mes</div>
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e8ddd0', borderRadius: '6px', padding: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: '#334c2b', marginBottom: '0.4rem' }}>💡 Precio kWh en Paraguay</div>
              <div style={{ fontSize: '0.82rem', color: '#777', lineHeight: 1.6 }}>
                La ANDE cobra aprox. <strong>₲ 650–900/kWh</strong> según categoría residencial/comercial. Consultá tu factura y actualizalo con el botón "Actualizar precio kWh" cuando cambie.
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ════ MODAL — Agregar/Editar maquinaria ════ */}
      {modal && (
        <>
          <div onClick={cerrar} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: '#fff', border: '2px solid #b7996b', borderRadius: '8px', padding: '2rem', zIndex: 301, width: '92%', maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto' }}>

            <h2 style={{ color: '#334c2b', margin: '0 0 1.5rem' }}>
              {editando ? '✏️ Editar Maquinaria' : '➕ Nueva Maquinaria'}
            </h2>

            {error && (
              <div style={{ backgroundColor: '#fdecea', border: '1px solid #c62828', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem', color: '#c62828', fontSize: '0.9rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

              {/* Nombre */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={S.label}>Nombre *</label>
                <input style={S.input} value={form.nombre}
                  onChange={e => cambiar('nombre', e.target.value)}
                  placeholder="Ej: Horno eléctrico, Amasadora, Heladera grande" />
              </div>

              {/* Tipo de uso */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={S.label}>Tipo de uso *</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[
                    { val: 'activa',     icon: '🔥', label: 'Activa',     desc: 'Solo cuando produce (horno, amasadora)' },
                    { val: 'permanente', icon: '🧊', label: 'Permanente', desc: 'Encendida 24/7 (heladera, freezer)' },
                  ].map(op => (
                    <label key={op.val} style={{ flex: 1, border: `2px solid ${form.tipo_uso === op.val ? '#334c2b' : '#e0d5c5'}`, borderRadius: '6px', padding: '0.75rem', cursor: 'pointer', backgroundColor: form.tipo_uso === op.val ? '#f0ebe3' : '#fff' }}>
                      <input type="radio" name="tipo_uso" value={op.val} checked={form.tipo_uso === op.val} onChange={() => cambiar('tipo_uso', op.val)} style={{ marginRight: '0.5rem' }} />
                      <strong>{op.icon} {op.label}</strong>
                      <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.2rem' }}>{op.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Potencia */}
              <div>
                <label style={S.label}>⚡ Potencia (kW) *</label>
                <input style={S.input} type="number" step="0.001" min="0.001"
                  value={form.potencia_kw}
                  onChange={e => cambiar('potencia_kw', e.target.value)}
                  placeholder="Ej: 2.500" />
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '3px' }}>Figura en la etiqueta del equipo o manual</div>
              </div>

              {/* Precio kWh */}
              <div>
                <label style={S.label}>💡 Precio kWh (₲) *</label>
                <input style={S.input} type="number" step="1" min="1"
                  value={form.precio_kwh}
                  onChange={e => cambiar('precio_kwh', e.target.value)}
                  placeholder="Ej: 800" />
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '3px' }}>Verificá en tu factura ANDE</div>
              </div>

              {/* Campos solo para activas */}
              {form.tipo_uso === 'activa' && (
                <>
                  <div>
                    <label style={S.label}>⏱️ Horas por tanda *</label>
                    <input style={S.input} type="number" step="0.1" min="0.1"
                      value={form.horas_uso_por_tanda}
                      onChange={e => cambiar('horas_uso_por_tanda', e.target.value)}
                      placeholder="Ej: 1.5" />
                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '3px' }}>Cuántas horas usa este equipo por tanda</div>
                  </div>
                  <div>
                    <label style={S.label}>📅 Tandas por mes *</label>
                    <input style={S.input} type="number" step="0.5" min="0.5"
                      value={form.tandas_por_mes}
                      onChange={e => cambiar('tandas_por_mes', e.target.value)}
                      placeholder="Ej: 20" />
                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '3px' }}>Promedio mensual de tandas de producción</div>
                  </div>
                </>
              )}

              {/* Notas */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={S.label}>📝 Notas (opcional)</label>
                <input style={S.input} value={form.notas}
                  onChange={e => cambiar('notas', e.target.value)}
                  placeholder="Ej: Marca Whirlpool, comprado en 2023, 2 años de garantía" />
              </div>

              {/* Activo */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#334c2b', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={!!form.is_active} onChange={e => cambiar('is_active', e.target.checked)} />
                  ✅ Equipo activo (se incluye en el cálculo)
                </label>
              </div>
            </div>

            {/* Preview costo mensual */}
            {costoPreview > 0 && (
              <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '6px', padding: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#334c2b', fontSize: '0.9rem' }}>
                  ⚡ Costo energético estimado:
                </span>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#c62828' }}>
                  {formatPYG(costoPreview)}/mes
                </span>
              </div>
            )}
            {form.tipo_uso === 'activa' && (!form.horas_uso_por_tanda || !form.tandas_por_mes) && form.potencia_kw && form.precio_kwh && (
              <div style={{ backgroundColor: '#fff8e1', border: '1px solid #f9c74f', borderRadius: '6px', padding: '0.6rem 0.75rem', marginTop: '0.75rem', fontSize: '0.83rem', color: '#5a4000' }}>
                ⚠️ Completá horas/tanda y tandas/mes para ver el costo estimado.
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={cerrar} style={S.btnGris}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1 }}>
                {guardando ? '⏳ Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════ MODAL — Actualizar precio kWh global ════ */}
      {modalKwh && (
        <>
          <div onClick={() => setModalKwh(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: '#fff', border: '2px solid #b7996b', borderRadius: '8px', padding: '2rem', zIndex: 301, width: '90%', maxWidth: '420px' }}>
            <h2 style={{ color: '#334c2b', margin: '0 0 0.5rem' }}>💡 Actualizar Precio kWh</h2>
            <p style={{ color: '#666', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>
              Esto actualizará el precio del kWh en <strong>todas las maquinarias</strong> de una vez. Usalo cuando cambie la tarifa de ANDE.
            </p>
            {precioKwhActual > 0 && (
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                Precio actual: <strong style={{ color: '#334c2b' }}>{formatPYG(precioKwhActual)}/kWh</strong>
              </p>
            )}
            <label style={S.label}>Nuevo precio kWh (₲)</label>
            <input style={{ ...S.input, marginBottom: '1.25rem' }}
              type="number" step="1" min="1"
              value={nuevoPrecioKwh}
              onChange={e => setNuevoPrecioKwh(e.target.value)}
              placeholder="Ej: 850" />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalKwh(false)} style={S.btnGris}>Cancelar</button>
              <button onClick={actualizarKwhGlobal} disabled={actualizandoKwh || !nuevoPrecioKwh}
                style={{ ...S.btnNaranja, opacity: actualizandoKwh ? 0.7 : 1 }}>
                {actualizandoKwh ? '⏳ Actualizando...' : '✅ Actualizar todas'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Componente tabla reutilizable ─────────────────────────────────────────────
function TablaEquipos({ equipos, onEditar, onToggle, onEliminar, S, formatPYG }) {
  return (
    <div style={{ ...S.card, padding: 0, overflow: 'auto', marginBottom: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr>
            {['Equipo', 'Potencia', 'Uso', 'Precio kWh', 'Costo/mes', 'Estado', ''].map(h =>
              <th key={h} style={S.th}>{h}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {equipos.map((m, idx) => (
            <tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={S.td}>
                <strong style={{ color: '#334c2b' }}>{m.nombre}</strong>
                {m.notas && <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px' }}>{m.notas}</div>}
              </td>
              <td style={{ ...S.td, textAlign: 'center' }}>
                <strong>{m.potencia_kw} kW</strong>
              </td>
              <td style={S.td}>
                {m.tipo_uso === 'activa'
                  ? <div style={{ fontSize: '0.82rem' }}>
                      <div>{m.horas_uso_por_tanda}hs/tanda</div>
                      <div style={{ color: '#888' }}>{m.tandas_por_mes} tandas/mes</div>
                    </div>
                  : <span style={{ fontSize: '0.82rem', color: '#888' }}>24/7</span>
                }
              </td>
              <td style={{ ...S.td, color: '#666', fontSize: '0.85rem' }}>{formatPYG(m.precio_kwh)}</td>
              <td style={{ ...S.td, fontWeight: 700, color: '#c62828', fontSize: '1rem' }}>
                {formatPYG(m.costo_energia_mensual)}
              </td>
              <td style={S.td}>
                <button onClick={() => onToggle(m)}
                  style={{ ...S.btnVerde, padding: '0.3rem 0.7rem', fontSize: '0.8rem', backgroundColor: m.is_active ? '#2e7d32' : '#c62828' }}>
                  {m.is_active ? '✅' : '❌'}
                </button>
              </td>
              <td style={S.td}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => onEditar(m)} style={{ ...S.btnVerde, padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>✏️</button>
                  <button onClick={() => onEliminar(m.id)} style={{ ...S.btnGris, padding: '0.3rem 0.6rem', fontSize: '0.78rem', backgroundColor: '#c62828' }}>🗑</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}