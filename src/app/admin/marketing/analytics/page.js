'use client'
/**
 * 📁 UBICACIÓN: src/app/admin/marketing/analytics/page.js
 * 📅 CREADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Panel de Control de Analítica GA4 y E-commerce para Marketing de PanFree.
 *    - Métricas clave: Usuarios, Sesiones, Conversiones, Revenue (PYG), Tasa de Conversión, Ticket Promedio.
 *    - Gráficos visuales de tendencias cronológicas (Tráfico e Ingresos).
 *    - Desglose de fuentes de tráfico y campañas UTM (Instagram, WhatsApp, Orgánico, Directo).
 *    - Rendimiento por producto y desglose de eventos GA4 (E-commerce + Marketing).
 *    - Estado de sincronización de Measurement Protocol y Consent Mode.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Percent,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Globe,
  Share2,
  Package,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sliders,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'

// Formateador de moneda en Guaraníes
const formatPYG = (n) => `₲ ${Number(n || 0).toLocaleString('es-PY')}`

export default function AdminGA4AnalyticsPage() {
  const [periodo, setPeriodo] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [tabGrafico, setTabGrafico] = useState('revenue') // 'revenue' | 'traffic'
  const [testEventStatus, setTestEventStatus] = useState(null)
  const [enviandoTest, setEnviandoTest] = useState(false)

  const cargarMetricas = useCallback(async (p = periodo) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/ga-metrics?periodo=${p}`)
      if (!res.ok) throw new Error('Error al obtener datos de analítica')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Respuesta no válida')
      setData(json)
    } catch (err) {
      console.error('[GA4 Analytics Page] Error:', err)
      setError(err.message || 'Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    cargarMetricas(periodo)
  }, [periodo, cargarMetricas])

  // Envío de evento de prueba a través de Measurement Protocol
  const dispararEventoPrueba = async () => {
    setEnviandoTest(true)
    setTestEventStatus(null)
    try {
      const res = await fetch('/api/ga4/measurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debug: true,
          events: [
            {
              name: 'admin_test_ping',
              params: {
                source: 'admin_analytics_dashboard',
                timestamp: new Date().toISOString(),
              },
            },
          ],
        }),
      })
      const result = await res.json()
      setTestEventStatus(result)
    } catch (err) {
      setTestEventStatus({ success: false, error: err.message })
    } finally {
      setEnviandoTest(false)
    }
  }

  const resumen = data?.resumen || {}
  const tendencias = data?.tendencias || []
  const fuentes = data?.fuentesTrafico || []
  const topProductos = data?.topProductos || []
  const topEventos = data?.topEventos || []
  const config = data?.configStatus || {}

  // Encontrar valor máximo para escalar barras del gráfico
  const maxRevenue = Math.max(...tendencias.map((t) => t.revenue || 0), 1)
  const maxSesiones = Math.max(...tendencias.map((t) => t.sesiones || 0), 1)

  return (
    <div className="min-h-screen bg-[#f5f1eb] text-[#2c3e24] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-[#d6cbbe] shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#b7996b]">
              <Link href="/admin" className="hover:underline flex items-center gap-1">
                Admin <ChevronRight size={12} />
              </Link>
              <Link href="/admin/marketing" className="hover:underline flex items-center gap-1">
                Marketing <ChevronRight size={12} />
              </Link>
              <span className="text-[#334c2b]">GA4 Analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#334c2b] text-[#eee6d9] rounded-lg">
                <BarChart3 size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#334c2b] tracking-tight">
                  Google Analytics 4 & E-Commerce
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600">
                  Panel de conversión, ingresos y comportamiento de usuarios en tiempo real
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Selector de Rango */}
            <div className="inline-flex items-center bg-[#eee6d9] p-1 rounded-lg border border-[#d6cbbe]">
              <button
                onClick={() => setPeriodo('today')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  periodo === 'today'
                    ? 'bg-[#334c2b] text-white shadow-xs'
                    : 'text-[#334c2b] hover:bg-[#e4dbcc]'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setPeriodo('7d')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  periodo === '7d'
                    ? 'bg-[#334c2b] text-white shadow-xs'
                    : 'text-[#334c2b] hover:bg-[#e4dbcc]'
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => setPeriodo('30d')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  periodo === '30d'
                    ? 'bg-[#334c2b] text-white shadow-xs'
                    : 'text-[#334c2b] hover:bg-[#e4dbcc]'
                }`}
              >
                30 días
              </button>
              <button
                onClick={() => setPeriodo('90d')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  periodo === '90d'
                    ? 'bg-[#334c2b] text-white shadow-xs'
                    : 'text-[#334c2b] hover:bg-[#e4dbcc]'
                }`}
              >
                90 días
              </button>
            </div>

            {/* Botón Refrescar */}
            <button
              onClick={() => cargarMetricas(periodo)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-[#334c2b] border border-[#d6cbbe] hover:bg-[#faf7f2] rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              title="Refrescar métricas"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {/* Volver a Marketing */}
            <Link
              href="/admin/marketing"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#334c2b] text-[#eee6d9] hover:bg-[#273a21] rounded-lg text-xs font-semibold transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Volver a Marketing</span>
            </Link>
          </div>
        </div>

        {/* ALERTA DE ERROR SI EXISTE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => cargarMetricas(periodo)}
              className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* KPI CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* Card: Revenue */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-[#d6cbbe] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b7996b]">Ingresos Totales</span>
              <div className="p-1.5 bg-[#f5f8f4] text-[#334c2b] rounded-md">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#334c2b] tracking-tight">
              {loading ? '…' : formatPYG(resumen.revenue)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                <TrendingUp size={12} /> {resumen.conversiones || 0} pedidos
              </span>
              <span>en el período</span>
            </div>
          </div>

          {/* Card: Conversiones */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d6cbbe] shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b7996b]">Conversiones</span>
              <div className="p-1.5 bg-[#fff8f0] text-[#f46e15] rounded-md">
                <ShoppingCart size={16} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#334c2b]">
              {loading ? '…' : resumen.conversiones || 0}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              {resumen.pedidosTotales ? `${resumen.pedidosTotales} registrados` : 'Ventas finalizadas'}
            </div>
          </div>

          {/* Card: Tasa de Conversión */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d6cbbe] shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b7996b]">Tasa Conv.</span>
              <div className="p-1.5 bg-[#f0f7ff] text-blue-700 rounded-md">
                <Percent size={16} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#334c2b]">
              {loading ? '…' : resumen.tasaConversion || '0.00%'}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Sesiones a compra
            </div>
          </div>

          {/* Card: Usuarios Activos */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d6cbbe] shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b7996b]">Usuarios</span>
              <div className="p-1.5 bg-[#f8f5ff] text-purple-700 rounded-md">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#334c2b]">
              {loading ? '…' : Number(resumen.usuarios || 0).toLocaleString('es-PY')}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              {Number(resumen.sesiones || 0).toLocaleString('es-PY')} sesiones
            </div>
          </div>

          {/* Card: Ticket Promedio */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d6cbbe] shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b7996b]">Ticket Prom.</span>
              <div className="p-1.5 bg-[#f5f8f4] text-[#334c2b] rounded-md">
                <Package size={16} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#334c2b]">
              {loading ? '…' : formatPYG(resumen.ticketPromedio)}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Valor medio de orden
            </div>
          </div>

        </div>

        {/* SECCIÓN PRINCIPAL: GRÁFICO DE TENDENCIAS */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#d6cbbe] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#334c2b]">Tendencia Cronológica</h2>
              <p className="text-xs text-neutral-500">
                Evolución diaria de actividad comercial y visitas durante el período seleccionado
              </p>
            </div>
            <div className="inline-flex bg-[#eee6d9] p-1 rounded-lg">
              <button
                onClick={() => setTabGrafico('revenue')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  tabGrafico === 'revenue'
                    ? 'bg-[#334c2b] text-white'
                    : 'text-[#334c2b] hover:bg-[#e4dbcc]'
                }`}
              >
                Ingresos (₲)
              </button>
              <button
                onClick={() => setTabGrafico('traffic')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  tabGrafico === 'traffic'
                    ? 'bg-[#334c2b] text-white'
                    : 'text-[#334c2b] hover:bg-[#e4dbcc]'
                }`}
              >
                Sesiones & Usuarios
              </button>
            </div>
          </div>

          {/* Visualizador de Barras de Tendencias */}
          <div className="mt-6">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-neutral-400 text-sm">
                Cargando datos de tendencia…
              </div>
            ) : tendencias.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-neutral-400 text-sm">
                No hay datos en el rango seleccionado
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-56 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 overflow-x-auto">
                  {tendencias.map((item, idx) => {
                    const valorPrincipal = tabGrafico === 'revenue' ? item.revenue : item.sesiones
                    const maxValor = tabGrafico === 'revenue' ? maxRevenue : maxSesiones
                    const porcentaje = Math.max(Math.min(Math.round((valorPrincipal / maxValor) * 100), 100), 4)

                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center gap-1 group relative h-full justify-end"
                      >
                        {/* Tooltip Hover */}
                        <div className="absolute -top-12 bg-[#334c2b] text-white text-[11px] py-1 px-2 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          <div className="font-bold">{item.label || item.fecha}</div>
                          <div>{tabGrafico === 'revenue' ? formatPYG(item.revenue) : `${item.sesiones} sesiones (${item.usuarios} usuarios)`}</div>
                          {item.conversiones > 0 && <div>{item.conversiones} pedidos</div>}
                        </div>

                        {/* Barra */}
                        <div
                          style={{ height: `${porcentaje}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            tabGrafico === 'revenue'
                              ? item.revenue > 0
                                ? 'bg-[#334c2b] group-hover:bg-[#f46e15]'
                                : 'bg-[#e4dbcc]'
                              : 'bg-[#b7996b] group-hover:bg-[#334c2b]'
                          }`}
                        />

                        {/* Label Fecha */}
                        <span className="text-[10px] text-neutral-500 truncate w-full text-center group-hover:font-bold">
                          {item.label?.split(' ')[0] || item.fecha.slice(8)}
                        </span>
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-xs bg-[#334c2b]" />
                      <span>{tabGrafico === 'revenue' ? 'Días con ventas' : 'Sesiones registradas'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-xs bg-[#e4dbcc]" />
                      <span>Sin actividad</span>
                    </div>
                  </div>
                  <span>Rango: {periodo}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GRID DE DOS COLUMNAS: FUENTES DE TRÁFICO Y TOP PRODUCTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* TABLA: FUENTES DE TRÁFICO Y CAMPAÑAS UTM */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#d6cbbe] shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-[#334c2b]" />
                <h3 className="font-bold text-[#334c2b]">Fuentes de Tráfico & UTM</h3>
              </div>
              <span className="text-xs text-neutral-500">Atribución de Canal</span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-500 font-semibold">
                    <th className="pb-2">Fuente / Medio</th>
                    <th className="pb-2 text-right">Sesiones</th>
                    <th className="pb-2 text-right">Pedidos</th>
                    <th className="pb-2 text-right">Ingresos</th>
                    <th className="pb-2 text-right">Conv. %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {fuentes.map((f, i) => (
                    <tr key={i} className="hover:bg-[#faf7f2] transition-colors">
                      <td className="py-2.5 font-medium text-[#334c2b] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#b7996b]" />
                        {f.fuente}
                      </td>
                      <td className="py-2.5 text-right text-neutral-600">{f.sesiones}</td>
                      <td className="py-2.5 text-right font-semibold text-[#334c2b]">{f.conversiones}</td>
                      <td className="py-2.5 text-right font-medium text-emerald-800">{formatPYG(f.revenue)}</td>
                      <td className="py-2.5 text-right font-bold text-[#f46e15]">{f.tasa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-[#f5f8f4] rounded-lg border border-[#e2ebd9] text-xs text-[#334c2b] flex items-start gap-2">
              <Sparkles size={16} className="text-[#334c2b] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tip de Atribución:</strong> Creá enlaces con etiquetas UTM como <code className="bg-white px-1 py-0.5 rounded-sm border">?utm_source=instagram&utm_medium=bio</code> en tus posts para medir exactamente qué publicación genera más ventas.
              </span>
            </div>
          </div>

          {/* TABLA: PRODUCTOS MÁS VENDIDOS */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#d6cbbe] shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#334c2b]" />
                <h3 className="font-bold text-[#334c2b]">Productos Más Vendidos</h3>
              </div>
              <span className="text-xs text-neutral-500">Rendimiento en Carrito</span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-500 font-semibold">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2">Categoría</th>
                    <th className="pb-2 text-right">Unidades</th>
                    <th className="pb-2 text-right">Total Generado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {topProductos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-neutral-400">
                        No hay registros de ventas para el período seleccionado
                      </td>
                    </tr>
                  ) : (
                    topProductos.map((p, i) => (
                      <tr key={i} className="hover:bg-[#faf7f2] transition-colors">
                        <td className="py-2.5 font-medium text-[#334c2b]">{p.nombre}</td>
                        <td className="py-2.5 text-neutral-500 text-xs">
                          <span className="bg-[#eee6d9] px-2 py-0.5 rounded-md text-[#334c2b]">
                            {p.categoria || 'Panadería'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-[#334c2b]">{p.ventas} un.</td>
                        <td className="py-2.5 text-right font-semibold text-emerald-800">
                          {formatPYG(p.ingresos)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <span>Registrados en Supabase / detalle_pedido</span>
              <Link href="/admin/productos" className="text-[#334c2b] font-bold hover:underline">
                Gestionar inventario →
              </Link>
            </div>
          </div>

        </div>

        {/* TABLA DE EVENTOS GA4 Y EMBUDO DE CONVERSIÓN */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#d6cbbe] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#334c2b]" />
              <h3 className="font-bold text-[#334c2b]">Eventos de GA4 y Embudo de Marketing</h3>
            </div>
            <span className="text-xs text-neutral-500">Telemetría de Navegación</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topEventos.map((ev, i) => (
              <div
                key={i}
                className="p-3.5 rounded-lg border border-neutral-200 bg-[#faf7f2] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-[#334c2b] bg-white px-2 py-0.5 rounded-md border border-[#d6cbbe]">
                    {ev.evento}
                  </span>
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase">
                    {ev.categoria}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-[#334c2b] my-1">
                  {Number(ev.conteo || 0).toLocaleString('es-PY')}
                </div>
                <p className="text-xs text-neutral-600 mt-1">{ev.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL TÉCNICO DE ESTADO DE GA4 Y MEASUREMENT PROTOCOL */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#d6cbbe] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#334c2b]" />
              <h3 className="font-bold text-[#334c2b]">Estado de la Infraestructura de Medición</h3>
            </div>
            <span className="text-xs text-neutral-500">Google Analytics 4 Protocol & Consent</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            <div className="p-3 bg-[#faf7f2] rounded-lg border border-neutral-200 space-y-1.5">
              <div className="font-semibold text-neutral-500 uppercase">Measurement ID (Cliente)</div>
              <div className="font-mono font-bold text-sm text-[#334c2b] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-700" />
                {config.measurementId || 'G-QE8GQS3MSR'}
              </div>
              <p className="text-neutral-500">Configurado en NEXT_PUBLIC_GA_MEASUREMENT_ID</p>
            </div>

            <div className="p-3 bg-[#faf7f2] rounded-lg border border-neutral-200 space-y-1.5">
              <div className="font-semibold text-neutral-500 uppercase">Measurement Protocol (Server)</div>
              <div className="font-mono font-bold text-sm text-[#334c2b] flex items-center gap-1.5">
                {config.apiSecretOk ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={14} /> GA4_API_SECRET Activo
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <AlertTriangle size={14} /> Modo Servidor Simulado
                  </span>
                )}
              </div>
              <p className="text-neutral-500">Envío directo de pedidos y conversiones server-side</p>
            </div>

            <div className="p-3 bg-[#faf7f2] rounded-lg border border-neutral-200 space-y-1.5">
              <div className="font-semibold text-neutral-500 uppercase">Consent Mode & UTM</div>
              <div className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-700" />
                Activo (panfree_ga_consent)
              </div>
              <p className="text-neutral-500">Respeta Do Not Track y opt-out del usuario</p>
            </div>

          </div>

          {/* Test de Measurement Protocol */}
          <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-[#334c2b]">Probar conexión con Google Analytics 4</div>
              <div className="text-xs text-neutral-500">
                Dispara un evento de prueba a través del endpoint server-side <code className="bg-neutral-100 px-1 py-0.5 rounded-sm">/api/ga4/measurement</code>
              </div>
            </div>

            <button
              onClick={dispararEventoPrueba}
              disabled={enviandoTest}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#334c2b] text-[#eee6d9] hover:bg-[#273a21] rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0"
            >
              <Send size={14} className={enviandoTest ? 'animate-pulse' : ''} />
              {enviandoTest ? 'Enviando ping…' : 'Enviar Ping de Prueba'}
            </button>
          </div>

          {/* Resultado de prueba */}
          {testEventStatus && (
            <div className={`p-3 rounded-lg text-xs font-mono ${
              testEventStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}>
              <div className="font-bold mb-1">
                {testEventStatus.success ? '✅ Ping exitoso a GA4' : '⚠️ Información del ping:'}
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(testEventStatus, null, 2)}
              </pre>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
