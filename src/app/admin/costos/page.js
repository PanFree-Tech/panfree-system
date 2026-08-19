/**
 * 📁 UBICACIÓN: src/app/admin/costos/page.js
 * 📅 ACTUALIZADO: 2026-08-19 (Refactor Fase 3 - Modularización)
 * 📌 DESCRIPCIÓN: Controlador principal y layout del módulo de análisis de costos y precios de PanFree.
 *    - Coordina la carga de datos desde Supabase (recetas, costos fijos y unidades producidas)
 *    - Integra las 3 pestañas principales:
 *        * MargenBruto: Costos de materia prima, rendimientos y precios sugeridos
 *        * CostosFijos: Carga contable mensual de alquiler, servicios, salarios, etc.
 *        * MargenReal: Margen bruto + costos fijos prorrateados por unidad producida
 *    - Integra el modal inteligente CostosFijosModal con plantilla rodante y sugerencia de energía
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { hoy, primerDiaMes, labelPeriodo, FORM_FIJOS_VACIO, S } from './lib/calculos'
import MargenBruto from './components/MargenBruto'
import CostosFijos from './components/CostosFijos'
import MargenReal from './components/MargenReal'
import CostosFijosModal from './components/CostosFijosModal'

export default function PaginaCostos() {
  const router = useRouter()
  const [tab, setTab] = useState('bruto') // 'bruto' | 'fijos' | 'real'
  const [datos, setDatos] = useState([])
  const [fijos, setFijos] = useState([]) // Historial de costos fijos
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [vista, setVista] = useState('tabla')

  // Modal costos fijos
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_FIJOS_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // Mes seleccionado para margen real
  const [mesSel, setMesSel] = useState(primerDiaMes(hoy.getFullYear(), hoy.getMonth()))

  // Plantilla rodante y sugerencia de energía
  const [mesAnterior, setMesAnterior] = useState(null)
  const [sugerenciaEnergia, setSugerenciaEnergia] = useState(null)

  // Unidades producidas en el mes seleccionado
  const [unidadesMes, setUnidadesMes] = useState(0)

  // ── Cargar recetas y costos fijos ─────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [recetasRes, costosFRes] = await Promise.all([
        supabase.from('vista_costo_receta').select('*').order('producto_nombre'),
        supabase.from('costos_fijos_mensuales').select('*').order('periodo', { ascending: false }),
      ])

      // Agrupar recetas por producto único
      const porProducto = {}
      ;(recetasRes.data || []).forEach((r) => {
        if (!porProducto[r.producto_id]) {
          porProducto[r.producto_id] = {
            producto_id: r.producto_id,
            producto_nombre: r.producto_nombre,
            precio_venta: r.precio_venta,
            rendimiento_kg: r.rendimiento_kg,
            peso_promedio_unidad: r.peso_promedio_unidad,
            costo_materia_prima: r.costo_materia_prima,
            costo_por_kg: r.costo_por_kg,
            margen_bruto_kg: r.margen_bruto_kg,
            margen_porcentaje: r.margen_porcentaje,
            precio_sugerido_20pct: r.precio_sugerido_20pct,
            precio_sugerido_40pct: r.precio_sugerido_40pct,
            precio_sugerido_60pct: r.precio_sugerido_60pct,
            cantidad_insumos: r.cantidad_insumos,
          }
        }
      })

      setDatos(
        Object.values(porProducto).sort(
          (a, b) => Number(a.margen_porcentaje) - Number(b.margen_porcentaje)
        )
      )
      setFijos(costosFRes.data || [])
    } catch (err) {
      console.error('[PanFree] Error cargando costos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // ── Calcular mes anterior y sugerencia de energía para el modal ──────────
  const calcularSugerenciaEnergia = useCallback(async (periodoForm, anterior) => {
    if (!periodoForm) return
    try {
      const { data: energiaData } = await supabase
        .from('vista_energia_mensual')
        .select('total_energia_mensual, energia_permanente, energia_activa')
        .maybeSingle()

      const energiaMaquinarias = Number(energiaData?.total_energia_mensual || 0)
      const serviciosAnt = anterior ? Number(anterior.servicios || 0) : 0

      setSugerenciaEnergia({
        energiaMaquinarias,
        estimado: energiaMaquinarias,
        anterior: serviciosAnt,
        variacion: energiaMaquinarias - serviciosAnt,
        usaReal: energiaMaquinarias > 0,
      })
    } catch (err) {
      console.error('[PanFree] Error calculando sugerencia de energía:', err)
    }
  }, [])

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
      const anterior = fijos.find((f) => f.periodo === periodoAnt)
      setMesAnterior(anterior || null)
      calcularSugerenciaEnergia(periodoForm, anterior)
    }
  }, [modal, form.periodo, fijos, editando, calcularSugerenciaEnergia])

  // ── Cargar unidades producidas del mes seleccionado ──────────────────────
  useEffect(() => {
    if (!mesSel) return
    const fin = new Date(mesSel)
    fin.setMonth(fin.getMonth() + 1)
    supabase
      .from('produccion')
      .select('cantidad_producida')
      .eq('estado', 'finalizado')
      .gte('fecha_inicio', mesSel)
      .lt('fecha_inicio', fin.toISOString().slice(0, 10))
      .then(({ data }) => {
        const total = (data || []).reduce(
          (s, r) => s + Number(r.cantidad_producida || 0),
          0
        )
        setUnidadesMes(total)
      })
  }, [mesSel])

  // ── Handlers del Modal de Costos Fijos ───────────────────────────────────
  function abrirNuevo() {
    setEditando(null)
    setForm(FORM_FIJOS_VACIO)
    setError(null)
    setModal(true)
  }

  function abrirEditar(f) {
    setEditando(f.id)
    setForm({
      periodo: f.periodo,
      alquiler: f.alquiler || '',
      servicios: f.servicios || '',
      salarios: f.salarios || '',
      depreciacion_equipos: f.depreciacion_equipos || '',
      licencias_software: f.licencias_software || '',
      marketing: f.marketing || '',
      otros: f.otros || '',
      notas: f.notas || '',
    })
    setError(null)
    setModal(true)
  }

  function cerrarModal() {
    setModal(false)
    setError(null)
    setMesAnterior(null)
    setSugerenciaEnergia(null)
  }

  function cambiarCampo(campo, valor) {
    setForm((p) => ({ ...p, [campo]: valor }))
  }

  function copiarMesAnterior() {
    if (!mesAnterior) return
    setForm({
      periodo: form.periodo,
      alquiler: mesAnterior.alquiler || '',
      servicios: mesAnterior.servicios || '',
      salarios: mesAnterior.salarios || '',
      depreciacion_equipos: mesAnterior.depreciacion_equipos || '',
      licencias_software: mesAnterior.licencias_software || '',
      marketing: mesAnterior.marketing || '',
      otros: mesAnterior.otros || '',
      notas: `Copiado de ${labelPeriodo(mesAnterior.periodo)}. `,
    })
  }

  function aplicarSugerenciaEnergia() {
    if (!sugerenciaEnergia) return
    setForm((p) => ({ ...p, servicios: String(sugerenciaEnergia.estimado) }))
  }

  async function guardarCostosFijos() {
    if (!form.periodo) {
      setError('Seleccioná el mes correspondiente.')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const payload = {
        periodo: form.periodo,
        alquiler: Number(form.alquiler) || 0,
        servicios: Number(form.servicios) || 0,
        salarios: Number(form.salarios) || 0,
        depreciacion_equipos: Number(form.depreciacion_equipos) || 0,
        licencias_software: Number(form.licencias_software) || 0,
        marketing: Number(form.marketing) || 0,
        otros: Number(form.otros) || 0,
        notas: form.notas || null,
        updated_at: new Date().toISOString(),
      }

      if (editando) {
        const { error: e } = await supabase
          .from('costos_fijos_mensuales')
          .update(payload)
          .eq('id', editando)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('costos_fijos_mensuales').insert(payload)
        if (e) throw e
      }

      await cargar()
      cerrarModal()
    } catch (err) {
      setError(
        err.message?.includes('unique')
          ? 'Ya existe un registro para ese mes. Editalo en lugar de crear uno nuevo.'
          : err.message || 'Error al guardar los costos fijos.'
      )
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarCostosFijos(id) {
    if (!window.confirm('¿Seguro que deseás eliminar este registro de costos fijos?')) return
    try {
      await supabase.from('costos_fijos_mensuales').delete().eq('id', id)
      cargar()
    } catch (err) {
      console.error('[PanFree] Error eliminando costos fijos:', err)
    }
  }

  return (
    <div style={S.page}>
      {/* Header Principal */}
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            style={{ ...S.btnGris, padding: '0.4rem 0.8rem' }}
          >
            ← Volver
          </button>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
            💰 Costos y Precios
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tab === 'bruto' && (
            <button
              type="button"
              onClick={() => setVista((v) => (v === 'tabla' ? 'tarjetas' : 'tabla'))}
              style={{ ...S.btnGris, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              {vista === 'tabla' ? '🃏 Tarjetas' : '📋 Tabla'}
            </button>
          )}
          <button
            type="button"
            onClick={cargar}
            style={{ ...S.btnVerde, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            title="Refrescar datos"
          >
            🔄 Actualizar
          </button>
        </div>
      </header>

      <main style={S.main}>
        {/* Selector de Pestañas */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            marginBottom: '1.5rem',
            border: '2px solid #b7996b',
            borderRadius: '6px',
            overflow: 'hidden',
            width: 'fit-content',
          }}
        >
          {[
            { id: 'bruto', label: '📊 Margen Bruto' },
            { id: 'fijos', label: '🏗️ Costos Fijos' },
            { id: 'real', label: '🎯 Margen Real' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '0.6rem 1.25rem',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: '600',
                fontSize: '0.9rem',
                backgroundColor: tab === t.id ? '#334c2b' : '#fff',
                color: tab === t.id ? '#eee6d9' : '#334c2b',
                borderRight: '1px solid #b7996b',
                transition: 'background-color 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido según pestaña activa */}
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: '#999', fontSize: '1rem' }}>
            ⏳ Calculando costos y márgenes…
          </p>
        ) : (
          <>
            {tab === 'bruto' && (
              <MargenBruto
                datos={datos}
                filtro={filtro}
                setFiltro={setFiltro}
                vista={vista}
                router={router}
              />
            )}

            {tab === 'fijos' && (
              <CostosFijos
                fijos={fijos}
                onAbrirNuevo={abrirNuevo}
                onAbrirEditar={abrirEditar}
                onEliminar={eliminarCostosFijos}
              />
            )}

            {tab === 'real' && (
              <MargenReal
                datos={datos}
                fijos={fijos}
                mesSel={mesSel}
                setMesSel={setMesSel}
                unidadesMes={unidadesMes}
                onIrAFijos={() => setTab('fijos')}
              />
            )}
          </>
        )}
      </main>

      {/* Modal Cargar/Editar Costos Fijos */}
      {modal && (
        <CostosFijosModal
          editando={editando}
          form={form}
          error={error}
          guardando={guardando}
          mesAnterior={mesAnterior}
          sugerenciaEnergia={sugerenciaEnergia}
          onCambiar={cambiarCampo}
          onCerrar={cerrarModal}
          onGuardar={guardarCostosFijos}
          onCopiarMesAnterior={copiarMesAnterior}
          onAplicarSugerenciaEnergia={aplicarSugerenciaEnergia}
        />
      )}
    </div>
  )
}
