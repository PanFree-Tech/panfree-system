/**
 * 📁 UBICACIÓN: src/app/admin/reportes/page.js
 * 📅 ACTUALIZADO: 2026-03-07
 * 📌 DESCRIPCIÓN: Panel de reportes y estadísticas generales de PanFree.
 *    Muestra resumen ejecutivo con contadores de todas las entidades.
 *    Ventas del día / semana / mes en PYG.
 *    Pedidos por estado (pendiente, confirmado, entregado, cancelado).
 *    Productos más vendidos (desde detalle_pedido).
 *    Disponibilidad actual (vista_disponibilidad_productos).
 *    Insumos con stock bajo (stock_actual <= stock_minimo).
 *    Últimos 5 lotes de producción (vista_resumen_produccion).
 *    Compras pendientes de recepción.
 *    Todos los valores en PYG (₲).
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const formatPYG = n => `₲ ${Number(n||0).toLocaleString('es-PY')}`

const ESTADO_COLOR = {
  pendiente  : '#f46e15',
  confirmado : '#2196f3',
  en_camino  : '#9c27b0',
  entregado  : '#2e7d32',
  cancelado  : '#c62828',
}

const S = {
  page    : { minHeight:'100vh', backgroundColor:'#f5f5f5', fontFamily:'"Segoe UI",sans-serif' },
  header  : { backgroundColor:'#334c2b', color:'#eee6d9', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'3px solid #b7996b' },
  main    : { padding:'2rem', maxWidth:'1200px', margin:'0 auto' },
  card    : { backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem' },
  cardTitle: { color:'#334c2b', marginBottom:'1rem', fontSize:'1rem', fontWeight:700 },
  th      : { backgroundColor:'#334c2b', color:'#eee6d9', padding:'0.6rem 0.9rem', textAlign:'left', fontSize:'0.82rem' },
  td      : { padding:'0.6rem 0.9rem', borderBottom:'1px solid #eee6d9', fontSize:'0.88rem', color:'#333' },
  btnGris : { backgroundColor:'#999', color:'#fff', border:'none', padding:'0.6rem 1.2rem', borderRadius:'4px', cursor:'pointer', fontFamily:'inherit', fontWeight:'600', fontSize:'0.9rem' },
  kpiGrid : { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px,1fr))', gap:'1rem', marginBottom:'2rem' },
  kpiCard : { backgroundColor:'#fff', border:'2px solid #b7996b', borderRadius:'8px', padding:'1.25rem', textAlign:'center' },
}

export default function PaginaReportes() {
  const router = useRouter()
  const [loading, setLoading]                 = useState(true)
  const [resumen, setResumen]                 = useState({})
  const [ventasPeriodo, setVentasPeriodo]     = useState({ hoy:0, semana:0, mes:0 })
  const [pedidosEstado, setPedidosEstado]     = useState([])
  const [masVendidos, setMasVendidos]         = useState([])
  const [disponibilidad, setDisponibilidad]   = useState([])
  const [stockBajo, setStockBajo]             = useState([])
  const [ultimosLotes, setUltimosLotes]       = useState([])
  const [comprasPendientes, setComprasPendientes] = useState([])

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)

    const hoy      = new Date()
    const inicioHoy     = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
    const inicioSemana  = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6).toISOString()
    const inicioMes     = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()

    const [
      prods, provs, ins, compras, lotes,
      pedidosHoy, pedidosSemana, pedidosMes,
      todosPedidos, detalles, dispData,
    ] = await Promise.all([
      supabase.from('productos').select('id, is_active'),
      supabase.from('proveedores').select('id, is_active'),
      supabase.from('insumos').select('id, nombre, categoria, stock_actual, stock_minimo, unidad_medida').eq('is_active', true),
      supabase.from('compras').select('id, numero_compra, estado, total_final, proveedores(nombre_empresa)').neq('estado','cancelada').order('fecha_compra', { ascending:false }).limit(10),
      supabase.from('vista_resumen_produccion').select('*').order('fecha_inicio', { ascending:false }).limit(5),

      // Ventas por período — solo pedidos no cancelados
      supabase.from('pedidos').select('total_final').neq('estado','cancelado').gte('fecha_pedido', inicioHoy),
      supabase.from('pedidos').select('total_final').neq('estado','cancelado').gte('fecha_pedido', inicioSemana),
      supabase.from('pedidos').select('total_final').neq('estado','cancelado').gte('fecha_pedido', inicioMes),

      // Pedidos por estado
      supabase.from('pedidos').select('estado'),

      // Productos más vendidos
      supabase.from('detalle_pedido')
        .select('producto_id, cantidad, productos(nombre)')
        .limit(200),

      // Disponibilidad actual
      supabase.from('vista_disponibilidad_productos')
        .select('producto_nombre, disponible, tandas_posibles, ingredientes_faltantes, requiere_anticipacion'),
    ])

    // ── Ventas por período ──
    const sumar = arr => (arr || []).reduce((acc, r) => acc + Number(r.total_final || 0), 0)
    setVentasPeriodo({
      hoy    : sumar(pedidosHoy.data),
      semana : sumar(pedidosSemana.data),
      mes    : sumar(pedidosMes.data),
    })

    // ── Pedidos por estado ──
    const estadoMap = {}
    ;(todosPedidos.data || []).forEach(p => {
      estadoMap[p.estado] = (estadoMap[p.estado] || 0) + 1
    })
    setPedidosEstado(
      Object.entries(estadoMap)
        .map(([estado, cantidad]) => ({ estado, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
    )

    // ── Productos más vendidos ──
    const vendidosMap = {}
    ;(detalles.data || []).forEach(d => {
      const nombre = d.productos?.nombre || d.producto_id
      vendidosMap[nombre] = (vendidosMap[nombre] || 0) + Number(d.cantidad || 0)
    })
    setMasVendidos(
      Object.entries(vendidosMap)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 8)
    )

    // ── Disponibilidad actual ──
    setDisponibilidad(dispData.data || [])

    // ── Resto ──
    setResumen({
      totalProductos   : prods.data?.length || 0,
      productosActivos : prods.data?.filter(p => p.is_active).length || 0,
      totalProveedores : provs.data?.filter(p => p.is_active).length || 0,
      totalInsumos     : ins.data?.length || 0,
      comprasActivas   : compras.data?.filter(c => c.estado !== 'cancelada').length || 0,
    })
    setStockBajo((ins.data || []).filter(i => Number(i.stock_actual) <= Number(i.stock_minimo)))
    setUltimosLotes(lotes.data || [])
    setComprasPendientes((compras.data || []).filter(c => c.estado === 'pendiente' || c.estado === 'confirmada'))

    setLoading(false)
  }

  if (loading) return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver</button>
          <h1 style={{ margin:0, fontSize:'1.2rem' }}>📊 Reportes</h1>
        </div>
      </header>
      <p style={{ padding:'3rem', textAlign:'center', color:'#999' }}>⏳ Cargando reportes...</p>
    </div>
  )

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => router.push('/admin')} style={{ ...S.btnGris, padding:'0.4rem 0.8rem' }}>← Volver</button>
          <h1 style={{ margin:0, fontSize:'1.2rem' }}>📊 Reportes</h1>
        </div>
        <button onClick={cargar} style={{ ...S.btnGris, padding:'0.4rem 0.9rem', fontSize:'0.85rem' }}>🔄 Actualizar</button>
      </header>

      <main style={S.main}>

        {/* ── VENTAS ── */}
        <div style={S.kpiGrid}>
          {[
            { label:'Ventas hoy',        valor: formatPYG(ventasPeriodo.hoy),    emoji:'📅', color:'#f46e15' },
            { label:'Ventas últimos 7d', valor: formatPYG(ventasPeriodo.semana), emoji:'📈', color:'#f46e15' },
            { label:'Ventas este mes',   valor: formatPYG(ventasPeriodo.mes),    emoji:'💰', color:'#f46e15' },
            { label:'Productos activos', valor: resumen.productosActivos, emoji:'🍞', color:'#334c2b' },
            { label:'Stock bajo ⚠️',     valor: stockBajo.length, emoji:'📉', color: stockBajo.length > 0 ? '#c62828' : '#2e7d32' },
            { label:'Compras pendientes',valor: comprasPendientes.length, emoji:'🛒', color: comprasPendientes.length > 0 ? '#f46e15' : '#2e7d32' },
          ].map(k => (
            <div key={k.label} style={S.kpiCard}>
              <div style={{ fontSize:'1.5rem' }}>{k.emoji}</div>
              <p style={{ fontSize: k.label.startsWith('Ventas') ? '1.1rem' : '2rem', fontWeight:700, color:k.color, margin:'0.25rem 0' }}>{k.valor}</p>
              <p style={{ color:'#666', fontSize:'0.8rem', margin:0 }}>{k.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 480px), 1fr))', gap:'1.5rem' }}>

          {/* ── PEDIDOS POR ESTADO ── */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>📦 Pedidos por Estado</h3>
            {pedidosEstado.length === 0 ? (
              <p style={{ color:'#999', fontSize:'0.9rem' }}>No hay pedidos registrados todavía.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                {pedidosEstado.map(({ estado, cantidad }) => (
                  <div key={estado} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', backgroundColor:'#f9f6f1', borderRadius:'4px', borderLeft:`4px solid ${ESTADO_COLOR[estado] || '#999'}` }}>
                    <span style={{ fontWeight:600, color:'#334c2b', textTransform:'capitalize' }}>{estado}</span>
                    <span style={{ fontWeight:800, color: ESTADO_COLOR[estado] || '#999', fontSize:'1.1rem' }}>{cantidad}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PRODUCTOS MÁS VENDIDOS ── */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>🏆 Productos Más Vendidos</h3>
            {masVendidos.length === 0 ? (
              <p style={{ color:'#999', fontSize:'0.9rem' }}>Sin ventas registradas todavía.</p>
            ) : (
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'280px' }}>
                <thead><tr><th style={S.th}>Producto</th><th style={{ ...S.th, textAlign:'right' }}>Unidades</th></tr></thead>
                <tbody>
                  {masVendidos.map((p, i) => (
                    <tr key={p.nombre}>
                      <td style={S.td}>
                        <span style={{ color:'#b7996b', fontWeight:700, marginRight:'0.5rem' }}>#{i+1}</span>
                        {p.nombre}
                      </td>
                      <td style={{ ...S.td, textAlign:'right', fontWeight:700, color:'#f46e15' }}>{p.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* ── DISPONIBILIDAD ACTUAL ── */}
          <div style={{ ...S.card, gridColumn:'1/-1' }}>
            <h3 style={S.cardTitle}>🟢 Disponibilidad Actual de Productos</h3>
            <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'520px' }}>
              <thead>
                <tr>
                  {['Producto','Disponible','Tandas posibles','Anticipación','Faltantes'].map(h =>
                    <th key={h} style={S.th}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {disponibilidad.map(d => (
                  <tr key={d.producto_nombre}>
                    <td style={S.td}><strong style={{ color:'#334c2b' }}>{d.producto_nombre}</strong></td>
                    <td style={S.td}>
                      <span style={{ fontWeight:700, color: d.disponible ? '#2e7d32' : '#c62828' }}>
                        {d.disponible ? '✅ Sí' : '❌ No'}
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign:'center', fontWeight:700, color:'#334c2b' }}>
                      {d.tandas_posibles ?? '—'}
                    </td>
                    <td style={S.td}>
                      {d.requiere_anticipacion
                        ? <span style={{ backgroundColor:'#fff8e1', border:'1px solid #ffe082', borderRadius:'4px', padding:'0.2rem 0.5rem', fontSize:'0.78rem', color:'#5d4037', fontWeight:600 }}>⏰ 24hs</span>
                        : <span style={{ color:'#2e7d32', fontSize:'0.85rem' }}>Mismo día</span>
                      }
                    </td>
                    <td style={{ ...S.td, fontSize:'0.8rem', color:'#c62828' }}>
                      {d.ingredientes_faltantes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* ── STOCK BAJO ── */}
          <div style={S.card}>
            <h3 style={{ ...S.cardTitle, color:'#c62828' }}>⚠️ Insumos con Stock Bajo ({stockBajo.length})</h3>
            {stockBajo.length === 0 ? (
              <p style={{ color:'#2e7d32', fontWeight:600 }}>✅ Todos los insumos tienen stock suficiente</p>
            ) : (
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'280px' }}>
                <thead><tr><th style={S.th}>Insumo</th><th style={S.th}>Stock</th><th style={S.th}>Mínimo</th></tr></thead>
                <tbody>
                  {stockBajo.map(i => (
                    <tr key={i.id}>
                      <td style={S.td}>{i.nombre}</td>
                      <td style={{ ...S.td, color:'#c62828', fontWeight:700 }}>{i.stock_actual} {i.unidad_medida}</td>
                      <td style={S.td}>{i.stock_minimo} {i.unidad_medida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* ── COMPRAS PENDIENTES ── */}
          <div style={S.card}>
            <h3 style={{ ...S.cardTitle, color:'#f46e15' }}>🛒 Compras Pendientes ({comprasPendientes.length})</h3>
            {comprasPendientes.length === 0 ? (
              <p style={{ color:'#2e7d32', fontWeight:600 }}>✅ No hay compras pendientes</p>
            ) : (
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'340px' }}>
                <thead><tr><th style={S.th}>N° Compra</th><th style={S.th}>Proveedor</th><th style={S.th}>Total</th><th style={S.th}>Estado</th></tr></thead>
                <tbody>
                  {comprasPendientes.map(c => (
                    <tr key={c.id}>
                      <td style={{ ...S.td, fontFamily:'monospace', fontSize:'0.82rem' }}>{c.numero_compra}</td>
                      <td style={S.td}>{c.proveedores?.nombre_empresa || '—'}</td>
                      <td style={{ ...S.td, color:'#f46e15', fontWeight:700 }}>{formatPYG(c.total_final)}</td>
                      <td style={S.td}><span style={{ fontWeight:700, color: c.estado === 'pendiente' ? '#f46e15' : '#2196f3' }}>{c.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* ── ÚLTIMOS LOTES ── */}
          <div style={{ ...S.card, gridColumn:'1/-1' }}>
            <h3 style={S.cardTitle}>🍞 Últimos Lotes de Producción</h3>
            {ultimosLotes.length === 0 ? (
              <p style={{ color:'#999' }}>No hay lotes registrados todavía.</p>
            ) : (
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'600px' }}>
                <thead>
                  <tr>{['Lote','Producto','Fecha','Cantidad','Costo Unit.','Margen Est.','Estado'].map(h =>
                    <th key={h} style={S.th}>{h}</th>
                  )}</tr>
                </thead>
                <tbody>
                  {ultimosLotes.map(l => (
                    <tr key={l.produccion_id}>
                      <td style={{ ...S.td, fontFamily:'monospace', fontSize:'0.82rem' }}>{l.numero_lote}</td>
                      <td style={S.td}>{l.producto_nombre}</td>
                      <td style={S.td}>{l.fecha_inicio ? new Date(l.fecha_inicio).toLocaleDateString('es-PY') : '—'}</td>
                      <td style={S.td}>{l.cantidad_producida} {l.unidad_medida}</td>
                      <td style={{ ...S.td, color:'#f46e15', fontWeight:700 }}>{formatPYG(l.costo_unitario)}</td>
                      <td style={{ ...S.td, fontWeight:700, color: Number(l.margen_estimado) >= 30 ? '#2e7d32' : '#c62828' }}>{l.margen_estimado}%</td>
                      <td style={S.td}><span style={{ fontWeight:700 }}>{l.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}