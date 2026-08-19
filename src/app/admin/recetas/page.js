/**
📁 UBICACIÓN: src/app/admin/recetas/page.js
📅 ACTUALIZADO: 2026-03-05
📌 DESCRIPCIÓN: Gestión de recetas de producción de PanFree.
Vista agrupada por producto con costo por KG de producto terminado
Rendimiento: cuántos KG produce cada receta (peso final)
Tiempos: preparación, cocción, reposo
Temperatura de horno
Precios sugeridos por estrategia (20%, 40%, 60% margen)
Notas de producción para operarios
% que representa cada insumo en el costo total
Indicador visual de margen (rojo/naranja/verde)
*/
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { S, COLORS } from '../_styles'
import { formatPYG, formatKG } from '../lib/helpers'

const UNIDADES  = ['kg','g','lt','ml','unidad','docena','pack']
const LINEA_VACIA = { insumo_id:'', cantidad:'', unidad_medida:'kg', es_opcional:false, notas:'' }

function badgeMargen(pct) {
  const n = Number(pct)
  const color = n >= 40 ? COLORS.verde : n >= 20 ? COLORS.naranja : COLORS.rojo
  const label = n >= 40 ? '✅ Bueno' : n >= 20 ? '⚠️ Ajustado' : '🔴 Pérdida'
  return (
    <span style={{ backgroundColor: color, color: COLORS.blanco, padding:'0.25rem 0.7rem', borderRadius:'20px', fontSize:'0.8rem', fontWeight:700 }}>
      {label} {n}%
    </span>
  )
}

export default function PaginaRecetas() {
  const router = useRouter()
  const [vistaRecetas, setVistaRecetas] = useState([])
  const [productos, setProductos]       = useState([])
  const [insumos, setInsumos]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [expandido, setExpandido]       = useState(null)
  const [modalAbierto, setModal]        = useState(false)
  const [productoSel, setProductoSel]   = useState('')
  const [lineas, setLineas]             = useState([{ ...LINEA_VACIA }])
  const [prodData, setProdData]         = useState({
    rendimiento_kg: 1,
    peso_promedio_unidad: '',  // ← NUEVO CAMPO
    tiempo_prep_min: 0,
    tiempo_coccion_min: 0,
    tiempo_reposo_min: 0,
    temperatura_horno_c: '',
    notas_produccion: '',
    dificultad: 'media',
  })
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState(null)
  const [filtro, setFiltro]             = useState('todos')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [v, p, i] = await Promise.all([
      supabase.from('vista_costo_receta').select('*').order('producto_nombre'),
      supabase.from('productos').select('id, nombre, precio_venta, rendimiento_kg, peso_promedio_unidad, tiempo_prep_min, tiempo_coccion_min, tiempo_reposo_min, temperatura_horno_c, notas_produccion, dificultad').eq('is_active', true).order('nombre'),
      supabase.from('insumos').select('id, nombre, unidad_medida, ppp_actual, categoria').eq('is_active', true).order('nombre'),
    ])
    setVistaRecetas(v.data || [])
    setProductos(p.data || [])
    setInsumos(i.data || [])
    setLoading(false)
  }

  // Agrupar vista por producto
  const porProducto = (vistaRecetas || []).reduce((acc, fila) => {
    if (!acc[fila.producto_id]) {
      acc[fila.producto_id] = {
        producto_id          : fila.producto_id,
        producto_nombre      : fila.producto_nombre,
        precio_venta         : fila.precio_venta,
        rendimiento_kg       : fila.rendimiento_kg,
        peso_promedio_unidad : fila.peso_promedio_unidad,
        tiempo_prep_min      : fila.tiempo_prep_min,
        tiempo_coccion_min   : fila.tiempo_coccion_min,
        tiempo_reposo_min    : fila.tiempo_reposo_min,
        temperatura_horno_c  : fila.temperatura_horno_c,
        notas_produccion     : fila.notas_produccion,
        dificultad           : fila.dificultad,
        costo_materia_prima  : fila.costo_materia_prima,
        costo_por_kg         : fila.costo_por_kg,
        margen_porcentaje    : fila.margen_porcentaje,
        precio_sugerido_20pct: fila.precio_sugerido_20pct,
        precio_sugerido_40pct: fila.precio_sugerido_40pct,
        precio_sugerido_60pct: fila.precio_sugerido_60pct,
        cantidad_insumos     : fila.cantidad_insumos,
        lineas               : [],
      }
    }
    acc[fila.producto_id].lineas.push(fila)
    return acc
  }, {})

  const listaProd = Object.values(porProducto)
  const filtrados = filtro === 'perdida' ? listaProd.filter(p => Number(p.margen_porcentaje) < 20)
    : filtro === 'ajustado' ? listaProd.filter(p => Number(p.margen_porcentaje) >= 20 && Number(p.margen_porcentaje) < 40)
    : filtro === 'bueno'    ? listaProd.filter(p => Number(p.margen_porcentaje) >= 40)
    : listaProd

  function abrirModal(productoId = '') {
    const prod = productos.find(p => p.id === productoId)
    setProductoSel(productoId)
    setProdData({
      rendimiento_kg       : prod?.rendimiento_kg || 1,
      peso_promedio_unidad : prod?.peso_promedio_unidad || '',
      tiempo_prep_min      : prod?.tiempo_prep_min      || 0,
      tiempo_coccion_min   : prod?.tiempo_coccion_min   || 0,
      tiempo_reposo_min    : prod?.tiempo_reposo_min    || 0,
      temperatura_horno_c  : prod?.temperatura_horno_c  || '',
      notas_produccion     : prod?.notas_produccion     || '',
      dificultad           : prod?.dificultad           || 'media',
    })
    setLineas(productoId && porProducto[productoId]
      ? porProducto[productoId].lineas.map(l => ({
          insumo_id    : l.insumo_id,
          cantidad     : l.cantidad,
          unidad_medida: l.unidad_medida,
          es_opcional  : l.es_opcional || false,
          notas        : l.notas_linea || '',
        }))
      : [{ ...LINEA_VACIA }]
    )
    setError(null)
    setModal(true)
  }

  function agregarLinea()                         { setLineas(p => [...p, { ...LINEA_VACIA }]) }
  function quitarLinea(idx)                       { setLineas(p => p.filter((_,i) => i !== idx)) }
  function cambiarLinea(idx, campo, valor)        { setLineas(p => p.map((l,i) => i === idx ? { ...l, [campo]: valor } : l)) }
  function cambiarProd(campo, valor)              { setProdData(p => ({ ...p, [campo]: valor })) }

  // Calcular costo preview en el modal
  const costoPreview = lineas.reduce((sum, l) => {
    if (l.es_opcional || !l.insumo_id || !l.cantidad) return sum
    const ins = insumos.find(i => i.id === l.insumo_id)
    return sum + (Number(l.cantidad) * (ins?.ppp_actual || 0))
  }, 0)

  const costoPorKGPreview     = prodData.rendimiento_kg > 0 ? costoPreview / prodData.rendimiento_kg : 0
  const prod40Preview         = costoPorKGPreview > 0 ? Math.round(costoPorKGPreview / 0.60) : 0
  // Precio sugerido por unidad (solo si tiene peso_promedio_unidad cargado)
  const pesoUnidad            = Number(prodData.peso_promedio_unidad) || 0
  const costoXUnidad          = pesoUnidad > 0 ? costoPorKGPreview * pesoUnidad : 0
  const unidadesPorTanda      = pesoUnidad > 0 ? Math.round(Number(prodData.rendimiento_kg) / pesoUnidad) : 0
  const precioUnidad20Preview = costoXUnidad > 0 ? Math.round(costoXUnidad / 0.80) : 0
  const precioUnidad40Preview = costoXUnidad > 0 ? Math.round(costoXUnidad / 0.60) : 0
  const precioUnidad60Preview = costoXUnidad > 0 ? Math.round(costoXUnidad / 0.40) : 0

  async function guardar() {
    if (!productoSel) { setError('Seleccioná un producto'); return }
    if (!prodData.rendimiento_kg || prodData.rendimiento_kg <= 0) { setError('El rendimiento en kg debe ser mayor a 0'); return }
    
    setGuardando(true); setError(null)
    try {
      // 1. Actualizar datos de producción en productos (INCLUYE peso_promedio_unidad)
      const { error: errProd } = await supabase.from('productos').update({
        rendimiento_kg       : Number(prodData.rendimiento_kg),
        peso_promedio_unidad : prodData.peso_promedio_unidad ? Number(prodData.peso_promedio_unidad) : null,
        tiempo_prep_min      : Number(prodData.tiempo_prep_min)    || 0,
        tiempo_coccion_min   : Number(prodData.tiempo_coccion_min) || 0,
        tiempo_reposo_min    : Number(prodData.tiempo_reposo_min)  || 0,
        temperatura_horno_c  : prodData.temperatura_horno_c ? Number(prodData.temperatura_horno_c) : null,
        notas_produccion     : prodData.notas_produccion || null,
        dificultad           : prodData.dificultad,
        updated_at           : new Date().toISOString(),
      }).eq('id', productoSel)
      
      if (errProd) throw errProd

      // 2. Reemplazar líneas de receta
      await supabase.from('recetas').delete().eq('producto_id', productoSel)
      
      const nuevasLineas = lineas
        .filter(l => l.insumo_id && l.cantidad)
        .map(l => {
          const ins = insumos.find(i => i.id === l.insumo_id)
          return {
            producto_id          : productoSel,
            insumo_id            : l.insumo_id,
            cantidad             : Number(l.cantidad),
            unidad_medida        : l.unidad_medida,
            costo_unitario_insumo: ins?.ppp_actual || 0,
            es_opcional          : !!l.es_opcional,
            notas                : l.notas || null,
          }
        })
      
      if (nuevasLineas.length > 0) {
        const { error: errIns } = await supabase.from('recetas').insert(nuevasLineas)
        if (errIns) throw errIns
      }

      await cargar()
      setModal(false)
    } catch (err) { setError(err.message) }
    finally { setGuardando(false) }
  }

  function exportarRecetaTXT() {
    const prod = productos.find(p => p.id === productoSel)
    if (!prod) return

    const ahora = new Date().toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })
    const dificultadLabel = { facil: 'Fácil', media: 'Media', avanzada: 'Avanzada' }[prodData.dificultad] || prodData.dificultad
    const tiempoTotalMin = (Number(prodData.tiempo_prep_min)||0) + (Number(prodData.tiempo_coccion_min)||0) + (Number(prodData.tiempo_reposo_min)||0)

    const lineasValidas = lineas.filter(l => l.insumo_id && l.cantidad)

    const costoTotal = lineasValidas.reduce((sum, l) => {
      if (l.es_opcional) return sum
      const ins = insumos.find(i => i.id === l.insumo_id)
      return sum + (Number(l.cantidad) * (ins?.ppp_actual || 0))
    }, 0)
    const costoPorKG = prodData.rendimiento_kg > 0 ? costoTotal / prodData.rendimiento_kg : 0
    const precioObj = costoPorKG > 0 ? Math.round(costoPorKG / 0.60) : 0

    const sep  = '═'.repeat(52)
    const sep2 = '─'.repeat(52)

    let txt = ''
    txt += `${sep}\n`
    txt += `  RECETA DE PRODUCCIÓN — PANFREE\n`
    txt += `${sep}\n`
    txt += `Producto  : ${prod.nombre}\n`
    txt += `Dificultad: ${dificultadLabel}\n`
    txt += `Exportado : ${ahora}\n`
    txt += `${sep2}\n\n`

    txt += `RENDIMIENTO Y TIEMPOS\n`
    txt += `${sep2}\n`
    txt += `Rendimiento tanda : ${prodData.rendimiento_kg} kg\n`
    if (prodData.peso_promedio_unidad) {
      const unidades = Math.round(prodData.rendimiento_kg / prodData.peso_promedio_unidad)
      txt += `Peso por unidad   : ${prodData.peso_promedio_unidad} kg (${unidades} unidades aprox.)\n`
    }
    if (prodData.tiempo_prep_min > 0)    txt += `Preparación       : ${prodData.tiempo_prep_min} min\n`
    if (prodData.tiempo_coccion_min > 0) txt += `Cocción           : ${prodData.tiempo_coccion_min} min\n`
    if (prodData.tiempo_reposo_min > 0)  txt += `Reposo            : ${prodData.tiempo_reposo_min} min\n`
    if (tiempoTotalMin > 0)              txt += `Tiempo total      : ${tiempoTotalMin} min\n`
    if (prodData.temperatura_horno_c)    txt += `Temperatura horno : ${prodData.temperatura_horno_c}°C\n`
    txt += `\n`

    txt += `INGREDIENTES\n`
    txt += `${sep2}\n`

    const obligatorios = lineasValidas.filter(l => !l.es_opcional)
    const opcionales   = lineasValidas.filter(l => l.es_opcional)

    obligatorios.forEach(l => {
      const ins = insumos.find(i => i.id === l.insumo_id)
      const costo = Math.round(Number(l.cantidad) * (ins?.ppp_actual || 0))
      const nombre = ins?.nombre || '—'
      txt += `  • ${nombre.padEnd(28)} ${String(l.cantidad).padStart(7)} ${l.unidad_medida.padEnd(7)}  (${formatPYG(costo)})\n`
      if (l.notas) txt += `    → ${l.notas}\n`
    })

    if (opcionales.length > 0) {
      txt += `\n  [Opcionales]\n`
      opcionales.forEach(l => {
        const ins = insumos.find(i => i.id === l.insumo_id)
        const nombre = ins?.nombre || '—'
        txt += `  ◦ ${nombre.padEnd(28)} ${String(l.cantidad).padStart(7)} ${l.unidad_medida.padEnd(7)}\n`
        if (l.notas) txt += `    → ${l.notas}\n`
      })
    }

    txt += `\n`
    txt += `COSTOS\n`
    txt += `${sep2}\n`
    txt += `Costo materia prima : ${formatPYG(Math.round(costoTotal))}\n`
    txt += `Costo por kg        : ${formatPYG(Math.round(costoPorKG))}\n`
    if (precioObj > 0) {
      txt += `Precio sugerido/kg 20% : ${formatPYG(Math.round(costoPorKG / 0.80))}\n`
      txt += `Precio sugerido/kg 40% : ${formatPYG(precioObj)}\n`
      txt += `Precio sugerido/kg 60% : ${formatPYG(Math.round(costoPorKG / 0.40))}\n`
    }
    if (prodData.peso_promedio_unidad) {
      const cu = costoPorKG * Number(prodData.peso_promedio_unidad)
      if (cu > 0) {
        txt += `\n`
        txt += `Precio sugerido/unidad 20% : ${formatPYG(Math.round(cu / 0.80))}\n`
        txt += `Precio sugerido/unidad 40% : ${formatPYG(Math.round(cu / 0.60))}\n`
        txt += `Precio sugerido/unidad 60% : ${formatPYG(Math.round(cu / 0.40))}\n`
      }
    }
    txt += `\n`

    if (prodData.notas_produccion) {
      txt += `NOTAS PARA EL OPERARIO\n`
      txt += `${sep2}\n`
      txt += `${prodData.notas_produccion}\n`
      txt += `\n`
    }

    txt += `${sep}\n`
    txt += `  PanFree — Encarnación, Paraguay\n`
    txt += `  +595 984 589845\n`
    txt += `${sep}\n`

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `receta_${prod.nombre.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tiempoTotal = (prep, coc, rep) => {
    const t = (Number(prep)||0) + (Number(coc)||0) + (Number(rep)||0)
    return t > 0 ? `${t} min` : '—'
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver</button>
          <h1 style={{ margin:0, fontSize:'1.2rem' }}>📋 Recetas de Producción</h1>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button onClick={() => router.push('/admin/ayuda/recetas')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>❓ Ayuda</button>
          <button onClick={() => abrirModal()} style={S.btnNaranja}>+ Nueva Receta</button>
        </div>
      </header>

      <main style={S.main}>
        {/* Filtros por margen */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
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

        {loading ? (
          <p style={{ padding:'2rem', textAlign:'center', color:'#999' }}>⏳ Cargando recetas...</p>
        ) : filtrados.length === 0 ? (
          <div style={{ ...S.card, textAlign:'center', color:'#999', padding:'3rem' }}>
            <p style={{ fontSize:'2rem' }}>📋</p>
            <p>No hay recetas para este filtro.</p>
            <button onClick={() => abrirModal()} style={{ ...S.btnNaranja, marginTop:'1rem' }}>Crear primera receta</button>
          </div>
        ) : (
          filtrados.map(prod => {
            const abierto = expandido === prod.producto_id
            return (
              <div key={prod.producto_id} style={S.card}>
                {/* Cabecera del producto */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', cursor:'pointer' }}
                  onClick={() => setExpandido(abierto ? null : prod.producto_id)}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
                      <h3 style={{ margin:0, color:'#334c2b', fontSize:'1.05rem' }}>{prod.producto_nombre}</h3>
                      {badgeMargen(prod.margen_porcentaje)}
                      {prod.dificultad && (
                        <span style={{ backgroundColor:'#f0ebe3', color:'#334c2b', padding:'0.2rem 0.6rem', borderRadius:'20px', fontSize:'0.78rem', fontWeight:600 }}>
                          { prod.dificultad === 'facil' ? '🟢 Fácil' : prod.dificultad === 'avanzada' ? '🔴 Avanzada' : '🟡 Media' }
                        </span>
                      )}
                    </div>

                    {/* Datos clave en una fila */}
                    <div style={{ display:'flex', gap:'1.5rem', marginTop:'0.6rem', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.83rem', color:'#666' }}>
                        ⚖️ Rinde: <strong style={{ color:'#334c2b' }}>{formatKG(prod.rendimiento_kg)}</strong>
                      </span>
                      {prod.peso_promedio_unidad && (
                        <span style={{ fontSize:'0.83rem', color:'#666' }}>
                          🍞 Peso/unidad: <strong>{formatKG(prod.peso_promedio_unidad)}</strong>
                        </span>
                      )}
                      <span style={{ fontSize:'0.83rem', color:'#666' }}>
                        💰 Costo/kg: <strong style={{ color:'#c62828' }}>{formatPYG(prod.costo_por_kg)}</strong>
                      </span>
                      <span style={{ fontSize:'0.83rem', color:'#666' }}>
                        🏷️ Precio venta: <strong style={{ color:'#334c2b' }}>{formatPYG(prod.precio_venta)}</strong>
                      </span>
                      <span style={{ fontSize:'0.83rem', color:'#666' }}>
                        📦 Costo tanda: <strong style={{ color:'#f46e15' }}>{formatPYG(prod.costo_materia_prima)}</strong>
                      </span>
                      {(prod.tiempo_prep_min || prod.tiempo_coccion_min) > 0 && (
                        <span style={{ fontSize:'0.83rem', color:'#666' }}>
                          ⏱️ Tiempo total: <strong>{tiempoTotal(prod.tiempo_prep_min, prod.tiempo_coccion_min, prod.tiempo_reposo_min)}</strong>
                        </span>
                      )}
                      {prod.temperatura_horno_c && (
                        <span style={{ fontSize:'0.83rem', color:'#666' }}>
                          🌡️ <strong>{prod.temperatura_horno_c}°C</strong>
                        </span>
                      )}
                    </div>

                    {/* Precios sugeridos por kg */}
                    <div style={{ display:'flex', gap:'1rem', marginTop:'0.5rem', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.8rem', color:'#888' }}>
                        Precio/kg → Competitivo: <strong style={{ color:'#2e7d32' }}>{formatPYG(prod.precio_sugerido_20pct)}</strong>
                        {' | '} Objetivo: <strong style={{ color:'#f46e15' }}>{formatPYG(prod.precio_sugerido_40pct)}</strong>
                        {' | '} Premium: <strong style={{ color:'#b7996b' }}>{formatPYG(prod.precio_sugerido_60pct)}</strong>
                      </span>
                    </div>
                    {/* Precios sugeridos por unidad — solo si tiene peso_promedio_unidad */}
                    {prod.peso_promedio_unidad > 0 && (() => {
                      const cpkg = Number(prod.costo_por_kg) || 0
                      const cu   = cpkg * Number(prod.peso_promedio_unidad)
                      if (cu <= 0) return null
                      return (
                        <div style={{ display:'flex', gap:'1rem', marginTop:'0.3rem', flexWrap:'wrap' }}>
                          <span style={{ fontSize:'0.8rem', color:'#888' }}>
                            Precio/unidad → Competitivo: <strong style={{ color:'#2e7d32' }}>{formatPYG(Math.round(cu / 0.80))}</strong>
                            {' | '} Objetivo: <strong style={{ color:'#f46e15' }}>{formatPYG(Math.round(cu / 0.60))}</strong>
                            {' | '} Premium: <strong style={{ color:'#b7996b' }}>{formatPYG(Math.round(cu / 0.40))}</strong>
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', marginLeft:'1rem' }}>
                    <button onClick={e => { e.stopPropagation(); abrirModal(prod.producto_id) }}
                      style={{ ...S.btnVerde, padding:'0.4rem 0.8rem', fontSize:'0.8rem' }}>✏️ Editar</button>
                    <span style={{ fontSize:'1.2rem', color:'#b7996b' }}>{abierto ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Detalle expandible */}
                {abierto && (
                  <div style={{ marginTop:'1rem' }}>
                    {/* Notas de producción */}
                    {prod.notas_produccion && (
                      <div style={{ backgroundColor:'#fffbf0', border:'1px solid #f0d080', borderRadius:'6px', padding:'0.75rem', marginBottom:'1rem', fontSize:'0.88rem', color:'#5a4a00' }}>
                        📝 <strong>Notas:</strong> {prod.notas_produccion}
                      </div>
                    )}

                    {/* Tiempos */}
                    {(prod.tiempo_prep_min || prod.tiempo_coccion_min || prod.tiempo_reposo_min) > 0 && (
                      <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
                        {prod.tiempo_prep_min > 0 && (
                          <div style={{ backgroundColor:'#f0ebe3', borderRadius:'6px', padding:'0.5rem 1rem', fontSize:'0.85rem', textAlign:'center' }}>
                            <div style={{ color:'#666', fontSize:'0.75rem' }}>Preparación</div>
                            <div style={{ fontWeight:700, color:'#334c2b' }}>{prod.tiempo_prep_min} min</div>
                          </div>
                        )}
                        {prod.tiempo_coccion_min > 0 && (
                          <div style={{ backgroundColor:'#fff3e0', borderRadius:'6px', padding:'0.5rem 1rem', fontSize:'0.85rem', textAlign:'center' }}>
                            <div style={{ color:'#666', fontSize:'0.75rem' }}>Cocción</div>
                            <div style={{ fontWeight:700, color:'#f46e15' }}>{prod.tiempo_coccion_min} min</div>
                          </div>
                        )}
                        {prod.tiempo_reposo_min > 0 && (
                          <div style={{ backgroundColor:'#e8f5e9', borderRadius:'6px', padding:'0.5rem 1rem', fontSize:'0.85rem', textAlign:'center' }}>
                            <div style={{ color:'#666', fontSize:'0.75rem' }}>Reposo</div>
                            <div style={{ fontWeight:700, color:'#2e7d32' }}>{prod.tiempo_reposo_min} min</div>
                          </div>
                        )}
                        {prod.temperatura_horno_c && (
                          <div style={{ backgroundColor:'#fdecea', borderRadius:'6px', padding:'0.5rem 1rem', fontSize:'0.85rem', textAlign:'center' }}>
                            <div style={{ color:'#666', fontSize:'0.75rem' }}>Temperatura</div>
                            <div style={{ fontWeight:700, color:'#c62828' }}>{prod.temperatura_horno_c}°C</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tabla de insumos */}
                    <div style={{ overflow:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                          <tr>
                            {['Insumo','Cat.','Cantidad','Unidad','PPP Actual','Costo Item','% Costo','Opcional'].map(h =>
                              <th key={h} style={S.th}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {prod.lineas.sort((a,b) => Number(b.costo_total_item) - Number(a.costo_total_item)).map(l => (
                            <tr key={l.receta_id} style={{ backgroundColor: l.es_opcional ? '#fafafa' : '#fff', opacity: l.es_opcional ? 0.75 : 1 }}>
                              <td style={S.td}>
                                <strong style={{ color:'#334c2b' }}>{l.insumo_nombre}</strong>
                                {l.notas_linea && <div style={{ fontSize:'0.75rem', color:'#999', marginTop:'2px' }}>{l.notas_linea}</div>}
                              </td>
                              <td style={S.td}>
                                <span style={{ backgroundColor:'#f0ebe3', padding:'0.15rem 0.5rem', borderRadius:'10px', fontSize:'0.75rem', color:'#334c2b' }}>{l.insumo_categoria}</span>
                              </td>
                              <td style={S.td}>{l.cantidad}</td>
                              <td style={S.td}>{l.unidad_medida}</td>
                              <td style={S.td}>{formatPYG(l.costo_unitario_insumo)}</td>
                              <td style={{ ...S.td, fontWeight:700, color: l.es_opcional ? '#aaa' : '#f46e15' }}>{formatPYG(l.costo_total_item)}</td>
                              <td style={S.td}>
                                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                                  <div style={{ width:'60px', height:'6px', backgroundColor:'#eee', borderRadius:'3px', overflow:'hidden' }}>
                                    <div style={{ width:`${Math.min(Number(l.porcentaje_costo),100)}%`, height:'100%', backgroundColor: Number(l.porcentaje_costo) > 30 ? '#c62828' : '#f46e15', borderRadius:'3px' }} />
                                  </div>
                                  <span style={{ fontSize:'0.8rem' }}>{l.porcentaje_costo}%</span>
                                </div>
                              </td>
                              <td style={S.td}>{l.es_opcional ? '⭕ Opcional' : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </main>

      {/* MODAL */}
      {modalAbierto && (
        <>
          <div onClick={() => setModal(false)} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:300 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'2rem', zIndex:301, width:'95%', maxWidth:'780px', maxHeight:'92vh', overflowY:'auto' }}>
            <h2 style={{ color:'#334c2b', marginBottom:'1.5rem', margin:'0 0 1.5rem' }}>
              {productoSel ? '✏️ Editar Receta' : '➕ Nueva Receta'}
            </h2>
            {error && (
              <div style={{ backgroundColor:'#fdecea', border:'1px solid #c62828', borderRadius:'4px', padding:'0.75rem', marginBottom:'1rem', color:'#c62828', fontSize:'0.9rem' }}>⚠️ {error}</div>
            )}

            {/* Selección de producto */}
            <div style={{ ...S.seccion, marginBottom:'1rem' }}>
              <div style={S.seccionTit}>🛍️ Producto</div>
              <select style={S.input} value={productoSel} onChange={e => {
                const pid = e.target.value
                const prod = productos.find(p => p.id === pid)
                setProductoSel(pid)
                if (prod) {
                  setProdData({
                    rendimiento_kg       : prod.rendimiento_kg || 1,
                    peso_promedio_unidad : prod.peso_promedio_unidad || '',
                    tiempo_prep_min      : prod.tiempo_prep_min      || 0,
                    tiempo_coccion_min   : prod.tiempo_coccion_min   || 0,
                    tiempo_reposo_min    : prod.tiempo_reposo_min    || 0,
                    temperatura_horno_c  : prod.temperatura_horno_c  || '',
                    notas_produccion     : prod.notas_produccion     || '',
                    dificultad           : prod.dificultad           || 'media',
                  })
                }
              }}>
                <option value="">— Seleccioná un producto —</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            {/* Datos de producción */}
            <div style={S.seccion}>
              <div style={S.seccionTit}>⚙️ Datos de Producción</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.75rem' }}>
                <div>
                  <label style={S.label}>⚖️ Rendimiento (kg) *</label>
                  <input style={S.input} type="number" min="0.001" step="0.001"
                    value={prodData.rendimiento_kg}
                    onChange={e => cambiarProd('rendimiento_kg', e.target.value)}
                    placeholder="Ej: 2.5" />
                  <div style={{ fontSize:'0.75rem', color:'#999', marginTop:'3px' }}>Peso total obtenido de esta tanda</div>
                </div>
                
                {/* NUEVO CAMPO: Peso por unidad */}
                <div>
                  <label style={S.label}>⚖️ Peso por unidad (kg)</label>
                  <input style={S.input} type="number" min="0.001" step="0.001"
                    value={prodData.peso_promedio_unidad}
                    onChange={e => cambiarProd('peso_promedio_unidad', e.target.value)}
                    placeholder="Ej: 0.050 (50g)" />
                  <div style={{ fontSize:'0.75rem', color:'#999', marginTop:'3px' }}>
                    Dejar vacío si se vende por kg
                  </div>
                </div>

                <div>
                  <label style={S.label}>⏱️ Prep. (min)</label>
                  <input style={S.input} type="number" min="0"
                    value={prodData.tiempo_prep_min}
                    onChange={e => cambiarProd('tiempo_prep_min', e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>🔥 Cocción (min)</label>
                  <input style={S.input} type="number" min="0"
                    value={prodData.tiempo_coccion_min}
                    onChange={e => cambiarProd('tiempo_coccion_min', e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>❄️ Reposo (min)</label>
                  <input style={S.input} type="number" min="0"
                    value={prodData.tiempo_reposo_min}
                    onChange={e => cambiarProd('tiempo_reposo_min', e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>🌡️ Temperatura (°C)</label>
                  <input style={S.input} type="number" min="0"
                    value={prodData.temperatura_horno_c}
                    onChange={e => cambiarProd('temperatura_horno_c', e.target.value)}
                    placeholder="180" />
                </div>
                <div>
                  <label style={S.label}>⭐ Dificultad</label>
                  <select style={S.input} value={prodData.dificultad} onChange={e => cambiarProd('dificultad', e.target.value)}>
                    <option value="facil">🟢 Fácil</option>
                    <option value="media">🟡 Media</option>
                    <option value="avanzada">🔴 Avanzada</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop:'0.75rem' }}>
                <label style={S.label}>📝 Notas de producción (para el operario)</label>
                <textarea style={{ ...S.input, minHeight:'60px', resize:'vertical' }}
                  value={prodData.notas_produccion}
                  onChange={e => cambiarProd('notas_produccion', e.target.value)}
                  placeholder="Ej: Amasar hasta obtener textura lisa. Hornear en molde engrasado. No abrir el horno en los primeros 15 minutos." />
              </div>
            </div>

            {/* Preview de costo */}
            {costoPreview > 0 && (
              <div style={{ backgroundColor:'#e8f5e9', border:'1px solid #a5d6a7', borderRadius:'6px', padding:'0.75rem', marginBottom:'1rem' }}>
                {/* Fila 1: costos base */}
                <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap', marginBottom: costoXUnidad > 0 ? '0.6rem' : 0 }}>
                  <span style={{ fontSize:'0.88rem' }}>💰 Costo tanda: <strong style={{ color:'#c62828' }}>{formatPYG(Math.round(costoPreview))}</strong></span>
                  <span style={{ fontSize:'0.88rem' }}>⚖️ Costo/kg: <strong style={{ color:'#c62828' }}>{formatPYG(Math.round(costoPorKGPreview))}</strong></span>
                  <span style={{ fontSize:'0.88rem' }}>🎯 Precio/kg 40%: <strong style={{ color:'#2e7d32' }}>{formatPYG(prod40Preview)}</strong></span>
                </div>
                {/* Fila 2: por unidad — solo si hay peso_promedio_unidad */}
                {costoXUnidad > 0 && (
                  <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap', borderTop:'1px solid #c8e6c9', paddingTop:'0.6rem' }}>
                    <span style={{ fontSize:'0.88rem', color:'#555' }}>
                      🍞 Unidades por tanda: <strong style={{ color:'#334c2b' }}>{unidadesPorTanda}</strong>
                    </span>
                    <span style={{ fontSize:'0.88rem', color:'#555' }}>
                      Costo/unidad: <strong style={{ color:'#c62828' }}>{formatPYG(Math.round(costoXUnidad))}</strong>
                    </span>
                    <span style={{ fontSize:'0.88rem' }}>
                      💲 Precio/unidad 20%: <strong style={{ color:'#888' }}>{formatPYG(precioUnidad20Preview)}</strong>
                    </span>
                    <span style={{ fontSize:'0.88rem' }}>
                      💲 Precio/unidad 40%: <strong style={{ color:'#2e7d32' }}>{formatPYG(precioUnidad40Preview)}</strong>
                    </span>
                    <span style={{ fontSize:'0.88rem' }}>
                      💲 Precio/unidad 60%: <strong style={{ color:'#b7996b' }}>{formatPYG(precioUnidad60Preview)}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Líneas de insumos */}
            <div style={S.seccion}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                <div style={S.seccionTit}>🌾 Insumos</div>
                <button onClick={agregarLinea} style={{ ...S.btnVerde, padding:'0.35rem 0.8rem', fontSize:'0.8rem' }}>+ Agregar</button>
              </div>

              {lineas.map((linea, idx) => (
                <div key={idx} style={{ backgroundColor: linea.es_opcional ? '#fafafa' : '#fff', border:'1px solid #e8ddd0', borderRadius:'6px', padding:'0.75rem', marginBottom:'0.5rem' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr auto', gap:'0.5rem', alignItems:'end' }}>
                    <div>
                      {idx === 0 && <label style={S.label}>Insumo</label>}
                      <select style={S.input} value={linea.insumo_id} onChange={e => {
                        const ins = insumos.find(i => i.id === e.target.value)
                        cambiarLinea(idx, 'insumo_id', e.target.value)
                        if (ins) cambiarLinea(idx, 'unidad_medida', ins.unidad_medida)
                      }}>
                        <option value="">— Seleccionar insumo —</option>
                        {insumos.map(i => (
                          <option key={i.id} value={i.id}>{i.nombre} ({formatPYG(i.ppp_actual)}/{i.unidad_medida})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {idx === 0 && <label style={S.label}>Cantidad</label>}
                      <input style={S.input} type="number" step="0.001" min="0"
                        value={linea.cantidad}
                        onChange={e => cambiarLinea(idx, 'cantidad', e.target.value)}
                        placeholder="0.500" />
                    </div>
                    <div>
                      {idx === 0 && <label style={S.label}>Unidad</label>}
                      <select style={S.input} value={linea.unidad_medida} onChange={e => cambiarLinea(idx, 'unidad_medida', e.target.value)}>
                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <button onClick={() => quitarLinea(idx)}
                      style={{ ...S.btnGris, padding:'0.5rem 0.7rem', backgroundColor:'#c62828', marginTop: idx === 0 ? '1.4rem' : 0 }}>✕</button>
                  </div>
                  <div style={{ display:'flex', gap:'1rem', marginTop:'0.4rem', alignItems:'center' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer', fontSize:'0.82rem', color:'#666' }}>
                      <input type="checkbox" checked={!!linea.es_opcional} onChange={e => cambiarLinea(idx, 'es_opcional', e.target.checked)} />
                      Ingrediente opcional
                    </label>
                    <input style={{ ...S.input, fontSize:'0.82rem', padding:'0.3rem 0.6rem' }}
                      value={linea.notas || ''}
                      onChange={e => cambiarLinea(idx, 'notas', e.target.value)}
                      placeholder="Nota sobre este ingrediente (opcional)" />
                  </div>
                  {/* Preview costo de esta línea */}
                  {linea.insumo_id && linea.cantidad && (
                    <div style={{ fontSize:'0.78rem', color:'#f46e15', marginTop:'3px', textAlign:'right' }}>
                      Costo: {formatPYG(Math.round(Number(linea.cantidad) * (insumos.find(i=>i.id===linea.insumo_id)?.ppp_actual||0)))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end', marginTop:'1.5rem' }}>
              <button onClick={() => setModal(false)} style={S.btnGris}>Cancelar</button>
              {productoSel && (
                <button onClick={exportarRecetaTXT}
                  style={{ ...S.btnVerde, backgroundColor:'#5a7a52', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  📄 Exportar TXT
                </button>
              )}
              <button onClick={guardar} disabled={guardando} style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1 }}>
                {guardando ? '⏳ Guardando...' : '💾 Guardar Receta'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}