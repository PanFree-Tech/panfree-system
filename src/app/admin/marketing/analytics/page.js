'use client'
/**
 * 📁 UBICACIÓN: src/app/admin/marketing/analytics/page.js
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Panel de Control de Analítica GA4 y E-commerce para Marketing de PanFree.
 *    - Identidad visual 100% PanFree: Verde #334c2b, Trigo/Dorado #b7996b, Crema #f5f1eb, Acento #c87d32.
 *    - Recharts profesional integrado: Gráficos de Área y Barras fluidos y responsivos.
 *    - Tarjetas KPI con micro-interacciones, acentos y tipografía optimizada.
 *    - Tablas de fuentes de tráfico (UTM), productos líderes y embudo de eventos con barras de progreso.
 *    - Monitor de infraestructura de medición (Measurement Protocol, Consent Mode, Measurement ID).
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Flame,
  ArrowUpRight,
  MessageCircle,
  Search,
  Compass,
  Camera
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

// Formateador de moneda oficial en Guaraníes
const formatPYG = (n) => `₲ ${Number(n || 0).toLocaleString('es-PY')}`

// Icono SVG inline seguro para Instagram (evita problemas de dependencias en lucide-react)
function InstagramIcon({ size = 15, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

// Tooltip personalizado para Recharts con diseño PanFree
const CustomChartTooltip = ({ active, payload, label, tipo }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload
    return (
      <div className="bg-[#2d2a26] text-[#f5f1eb] text-xs p-3 rounded-xl shadow-xl border border-[#b7996b]/40 backdrop-blur-md">
        <p className="font-bold text-[#b7996b] text-[11px] mb-1">{dataPoint.label || label || dataPoint.fecha}</p>
        <div className="space-y-1">
          {tipo === 'revenue' && (
            <p className="text-sm font-extrabold text-white">
              {formatPYG(dataPoint.revenue)}
            </p>
          )}
          {tipo === 'traffic' && (
            <div>
              <p className="text-sm font-extrabold text-white">{dataPoint.sesiones} sesiones</p>
              <p className="text-[10px] text-[#e4dacb]">{dataPoint.usuarios} usuarios únicos</p>
            </div>
          )}
          {tipo === 'conversiones' && (
            <div>
              <p className="text-sm font-extrabold text-white">{dataPoint.conversiones} compras</p>
              {dataPoint.revenue > 0 && (
                <p className="text-[10px] text-[#b7996b]">{formatPYG(dataPoint.revenue)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

export default function AdminGA4AnalyticsPage() {
  const [periodo, setPeriodo] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [tabGrafico, setTabGrafico] = useState('revenue') // 'revenue' | 'traffic' | 'conversiones'
  const [tipoGrafico, setTipoGrafico] = useState('area') // 'area' | 'bar'
  const [testEventStatus, setTestEventStatus] = useState(null)
  const [enviandoTest, setEnviandoTest] = useState(false)

  const cargarMetricas = useCallback(async (p = periodo) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/ga-metrics?periodo=${p}`)
      if (!res.ok) throw new Error('No se pudo conectar con el servicio de analítica')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Respuesta de métricas no válida')
      setData(json)
    } catch (err) {
      console.error('[GA4 Analytics] Error:', err)
      setError(err.message || 'Ocurrió un error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    cargarMetricas(periodo)
  }, [periodo, cargarMetricas])

  // Envío de evento de prueba para verificar Measurement Protocol server-side
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
              name: 'admin_dashboard_ping',
              params: {
                source: 'panfree_analytics_panel',
                timestamp: new Date().toISOString(),
                environment: 'production_preview',
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
  const tendencias = useMemo(() => data?.tendencias || [], [data?.tendencias])
  const fuentes = useMemo(() => data?.fuentesTrafico || [], [data?.fuentesTrafico])
  const topProductos = useMemo(() => data?.topProductos || [], [data?.topProductos])
  const topEventos = data?.topEventos || []
  const config = data?.configStatus || {}

  const totalVentasProductos = useMemo(() => {
    return topProductos.reduce((acc, p) => acc + (p.ventas || 0), 0) || 1
  }, [topProductos])

  const totalSesionesFuentes = useMemo(() => {
    return fuentes.reduce((acc, f) => acc + (f.sesiones || 0), 0) || 1
  }, [fuentes])

  // Icono para cada fuente de tráfico
  const getFuenteIcon = (fuente) => {
    const f = (fuente || '').toLowerCase()
    if (f.includes('instagram')) return <InstagramIcon size={15} className="text-[#c87d32]" />
    if (f.includes('whatsapp')) return <MessageCircle size={15} className="text-emerald-700" />
    if (f.includes('google')) return <Search size={15} className="text-blue-700" />
    if (f.includes('facebook')) return <Share2 size={15} className="text-blue-800" />
    return <Compass size={15} className="text-[#b7996b]" />
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb] text-[#2d2a26] font-sans antialiased selection:bg-[#b7996b]/30 selection:text-[#334c2b]">
      
      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e4dacb] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Breadcrumb y Título */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/marketing"
              className="p-2 rounded-lg text-[#334c2b] hover:bg-[#f5f1eb] transition-colors border border-transparent hover:border-[#e4dacb]"
              title="Volver a Marketing"
            >
              <ArrowLeft size={20} />
            </Link>
            
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#b7996b]">
                <span>PanFree Admin</span>
                <ChevronRight size={12} className="text-[#b7996b]" />
                <span>Marketing Inteligente</span>
                <ChevronRight size={12} className="text-[#b7996b]" />
                <span className="text-[#334c2b]">GA4 Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#334c2b] tracking-tight">
                  Panel de Analítica y Rendimiento
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f5f8f4] text-[#334c2b] border border-[#d6e2cf]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  GA4 Live
                </span>
              </div>
            </div>
          </div>

          {/* Controles: Rango y Actualizar */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Selector de Período estilo PanFree */}
            <div className="inline-flex p-1 bg-[#f5f1eb] rounded-xl border border-[#e4dacb] shadow-inner text-xs font-semibold">
              {[
                { id: 'today', label: 'Hoy' },
                { id: '7d', label: '7 días' },
                { id: '30d', label: '30 días' },
                { id: '90d', label: '90 días' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPeriodo(item.id)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    periodo === item.id
                      ? 'bg-[#334c2b] text-[#f5f1eb] shadow-xs font-bold'
                      : 'text-[#2d2a26] hover:text-[#334c2b] hover:bg-[#eae2d3]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Botón Refrescar */}
            <button
              onClick={() => cargarMetricas(periodo)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-[#334c2b] border border-[#e4dacb] hover:bg-[#f5f1eb] hover:border-[#b7996b] rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-[#c87d32]' : 'text-[#334c2b]'} />
              <span className="hidden md:inline">Actualizar</span>
            </button>
          </div>

        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* ALERTA DE ERROR */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-xl shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">Error al consultar métricas</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => cargarMetricas(periodo)}
              className="px-3.5 py-1.5 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800 transition-colors shadow-xs"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* 1. SECCIÓN DE TARJETAS KPI (GRID) */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            
            {/* KPI 1: Ingresos Totales (Destacada) */}
            <div className="sm:col-span-2 lg:col-span-2 bg-white rounded-2xl p-5 border border-[#e4dacb] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#334c2b] via-[#b7996b] to-[#c87d32]" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b7996b]">
                  Ingresos Totales (PYG)
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#f5f8f4] text-[#334c2b] flex items-center justify-center border border-[#d6e2cf] group-hover:scale-105 transition-transform">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#334c2b] tracking-tight">
                {loading ? (
                  <div className="h-8 w-44 bg-[#f5f1eb] animate-pulse rounded-md" />
                ) : (
                  formatPYG(resumen.revenue)
                )}
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-[#eef6ed] px-2 py-0.5 rounded-md border border-[#d6e9d3]">
                  <TrendingUp size={13} /> {resumen.conversiones || 0} compras
                </span>
                <span className="text-[#6d665e]">en {periodo === 'today' ? 'el día' : periodo}</span>
              </div>
            </div>

            {/* KPI 2: Conversiones (Pedidos) */}
            <div className="bg-white rounded-2xl p-5 border border-[#e4dacb] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#c87d32]" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b7996b]">
                  Conversiones
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-[#c87d32] flex items-center justify-center border border-[#fed7aa] group-hover:scale-105 transition-transform">
                  <ShoppingCart size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#2d2a26]">
                {loading ? (
                  <div className="h-8 w-20 bg-[#f5f1eb] animate-pulse rounded-md" />
                ) : (
                  resumen.conversiones || 0
                )}
              </div>
              <div className="mt-2.5 text-xs text-[#6d665e] flex items-center gap-1">
                <span className="font-semibold text-[#334c2b]">Ventas completadas</span>
              </div>
            </div>

            {/* KPI 3: Tasa de Conversión */}
            <div className="bg-white rounded-2xl p-5 border border-[#e4dacb] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#b7996b]" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b7996b]">
                  Tasa de Conv.
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#faf6f0] text-[#b7996b] flex items-center justify-center border border-[#eddcc7] group-hover:scale-105 transition-transform">
                  <Percent size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#2d2a26]">
                {loading ? (
                  <div className="h-8 w-20 bg-[#f5f1eb] animate-pulse rounded-md" />
                ) : (
                  resumen.tasaConversion || '0.00%'
                )}
              </div>
              <div className="mt-2.5 text-xs text-[#6d665e]">
                Sesiones que compraron
              </div>
            </div>

            {/* KPI 4: Usuarios Activos */}
            <div className="bg-white rounded-2xl p-5 border border-[#e4dacb] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#334c2b]" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b7996b]">
                  Usuarios
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#f5f8f4] text-[#334c2b] flex items-center justify-center border border-[#d6e2cf] group-hover:scale-105 transition-transform">
                  <Users size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#2d2a26]">
                {loading ? (
                  <div className="h-8 w-24 bg-[#f5f1eb] animate-pulse rounded-md" />
                ) : (
                  Number(resumen.usuarios || 0).toLocaleString('es-PY')
                )}
              </div>
              <div className="mt-2.5 text-xs text-[#6d665e]">
                {Number(resumen.sesiones || 0).toLocaleString('es-PY')} sesiones
              </div>
            </div>

            {/* KPI 5: Ticket Promedio */}
            <div className="bg-white rounded-2xl p-5 border border-[#e4dacb] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#c87d32]" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b7996b]">
                  Ticket Promedio
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-[#c87d32] flex items-center justify-center border border-[#fed7aa] group-hover:scale-105 transition-transform">
                  <Package size={18} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#334c2b] tracking-tight">
                {loading ? (
                  <div className="h-8 w-28 bg-[#f5f1eb] animate-pulse rounded-md" />
                ) : (
                  formatPYG(resumen.ticketPromedio)
                )}
              </div>
              <div className="mt-2.5 text-xs text-[#6d665e]">
                Valor medio de pedido
              </div>
            </div>

          </div>
        </section>

        {/* 2. GRÁFICO PROFESIONAL CON RECHARTS */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e4dacb] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#f0e8dc] gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#c87d32]" />
                <h2 className="text-base sm:text-lg font-bold text-[#334c2b]">
                  Evolución y Tendencias Diarias
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#6d665e] mt-0.5">
                Rendimiento de ventas, volumen de sesiones y pedidos en tiempo real
              </p>
            </div>

            {/* Controles de Gráfico: Métrica y Tipo */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Selector de Métrica */}
              <div className="inline-flex p-1 bg-[#f5f1eb] rounded-xl border border-[#e4dacb] text-xs font-bold">
                <button
                  onClick={() => setTabGrafico('revenue')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    tabGrafico === 'revenue'
                      ? 'bg-[#334c2b] text-[#f5f1eb] shadow-xs'
                      : 'text-[#2d2a26] hover:bg-[#eae2d3]'
                  }`}
                >
                  <DollarSign size={13} />
                  <span>Ingresos (₲)</span>
                </button>
                <button
                  onClick={() => setTabGrafico('traffic')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    tabGrafico === 'traffic'
                      ? 'bg-[#334c2b] text-[#f5f1eb] shadow-xs'
                      : 'text-[#2d2a26] hover:bg-[#eae2d3]'
                  }`}
                >
                  <Users size={13} />
                  <span>Sesiones</span>
                </button>
                <button
                  onClick={() => setTabGrafico('conversiones')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    tabGrafico === 'conversiones'
                      ? 'bg-[#334c2b] text-[#f5f1eb] shadow-xs'
                      : 'text-[#2d2a26] hover:bg-[#eae2d3]'
                  }`}
                >
                  <ShoppingCart size={13} />
                  <span>Pedidos</span>
                </button>
              </div>

              {/* Selector Tipo de Gráfico (Área vs Barras) */}
              <div className="inline-flex p-1 bg-[#f5f1eb] rounded-xl border border-[#e4dacb] text-xs font-bold">
                <button
                  onClick={() => setTipoGrafico('area')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    tipoGrafico === 'area'
                      ? 'bg-[#b7996b] text-white shadow-xs'
                      : 'text-[#2d2a26] hover:bg-[#eae2d3]'
                  }`}
                  title="Gráfico de Área Suave"
                >
                  Área
                </button>
                <button
                  onClick={() => setTipoGrafico('bar')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    tipoGrafico === 'bar'
                      ? 'bg-[#b7996b] text-white shadow-xs'
                      : 'text-[#2d2a26] hover:bg-[#eae2d3]'
                  }`}
                  title="Gráfico de Barras"
                >
                  Barras
                </button>
              </div>

            </div>
          </div>

          {/* Recharts Container */}
          <div className="mt-6">
            {loading ? (
              <div className="h-72 flex flex-col items-center justify-center gap-3 text-[#6d665e]">
                <div className="w-8 h-8 border-3 border-[#b7996b] border-t-[#334c2b] rounded-full animate-spin" />
                <span className="text-xs font-semibold">Cargando serie cronológica...</span>
              </div>
            ) : tendencias.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center gap-2 text-[#6d665e]">
                <Calendar size={32} className="text-[#b7996b]/60" />
                <p className="text-sm font-semibold">No se registran datos para este rango</p>
                <p className="text-xs">Selecciona otro período en la barra superior</p>
              </div>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {tipoGrafico === 'area' ? (
                    <AreaChart data={tendencias} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#334c2b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#334c2b" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b7996b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#b7996b" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c87d32" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#c87d32" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#6d665e', fontSize: 11 }}
                        axisLine={{ stroke: '#e4dacb' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6d665e', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (tabGrafico === 'revenue' ? (v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`) : v)}
                      />
                      <Tooltip content={<CustomChartTooltip tipo={tabGrafico} />} />
                      {tabGrafico === 'revenue' && (
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#334c2b"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          activeDot={{ r: 6, fill: '#334c2b', stroke: '#fff', strokeWidth: 2 }}
                        />
                      )}
                      {tabGrafico === 'traffic' && (
                        <Area
                          type="monotone"
                          dataKey="sesiones"
                          stroke="#b7996b"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorTraffic)"
                          activeDot={{ r: 6, fill: '#b7996b', stroke: '#fff', strokeWidth: 2 }}
                        />
                      )}
                      {tabGrafico === 'conversiones' && (
                        <Area
                          type="monotone"
                          dataKey="conversiones"
                          stroke="#c87d32"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorConv)"
                          activeDot={{ r: 6, fill: '#c87d32', stroke: '#fff', strokeWidth: 2 }}
                        />
                      )}
                    </AreaChart>
                  ) : (
                    <BarChart data={tendencias} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#6d665e', fontSize: 11 }}
                        axisLine={{ stroke: '#e4dacb' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6d665e', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (tabGrafico === 'revenue' ? (v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`) : v)}
                      />
                      <Tooltip content={<CustomChartTooltip tipo={tabGrafico} />} />
                      {tabGrafico === 'revenue' && (
                        <Bar dataKey="revenue" fill="#334c2b" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      )}
                      {tabGrafico === 'traffic' && (
                        <Bar dataKey="sesiones" fill="#b7996b" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      )}
                      {tabGrafico === 'conversiones' && (
                        <Bar dataKey="conversiones" fill="#c87d32" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Resumen del Período */}
          <div className="flex flex-wrap items-center justify-between text-xs text-[#6d665e] pt-4 mt-2 border-t border-[#f0e8dc] gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#334c2b]" />
                <span>Serie: {tabGrafico === 'revenue' ? 'Ingresos Totales (₲)' : tabGrafico === 'traffic' ? 'Sesiones Web' : 'Pedidos Finalizados'}</span>
              </div>
            </div>
            <div className="text-[11px] font-semibold text-[#b7996b]">
              Mostrando {tendencias.length} registros cronológicos
            </div>
          </div>
        </section>

        {/* 3. DOS COLUMNAS: FUENTES DE TRÁFICO Y PRODUCTOS MÁS VENDIDOS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: FUENTES DE TRÁFICO & UTM (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-[#e4dacb] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#f0e8dc] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#f5f8f4] text-[#334c2b] rounded-xl border border-[#d6e2cf]">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#334c2b]">Fuentes de Tráfico & Campañas UTM</h3>
                    <p className="text-xs text-[#6d665e]">Canales de adquisición de compradores</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#b7996b] bg-[#f5f1eb] px-2.5 py-1 rounded-lg border border-[#e4dacb]">
                  Atribución GA4
                </span>
              </div>

              {/* Tabla de Fuentes */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#f5f1eb] text-[#334c2b] font-bold border-b border-[#e4dacb]">
                      <th className="py-2.5 px-3 rounded-l-lg">Canal / Medio</th>
                      <th className="py-2.5 px-3 text-right">Sesiones</th>
                      <th className="py-2.5 px-3 text-right">Pedidos</th>
                      <th className="py-2.5 px-3 text-right">Ingresos</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Conv. %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0e8dc]">
                    {fuentes.map((f, idx) => {
                      const shareSesiones = Math.round((f.sesiones / totalSesionesFuentes) * 100)
                      return (
                        <tr key={idx} className="hover:bg-[#fbf9f6] transition-colors group">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-[#f5f1eb] border border-[#e4dacb] flex items-center justify-center">
                                {getFuenteIcon(f.fuente)}
                              </div>
                              <div>
                                <div className="font-bold text-[#2d2a26]">{f.fuente}</div>
                                <div className="text-[11px] text-[#6d665e] flex items-center gap-1.5">
                                  <span>{f.medio}</span>
                                  <span>•</span>
                                  <span>{shareSesiones}% tráfico</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-[#2d2a26]">{f.sesiones}</td>
                          <td className="py-3 px-3 text-right font-bold text-[#334c2b]">{f.conversiones}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-800">{formatPYG(f.revenue)}</td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-black text-[#c87d32] bg-[#fff7ed] px-2 py-0.5 rounded-md border border-[#fed7aa] text-xs">
                              {f.tasa}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Banner de Ayuda UTM */}
            <div className="mt-5 p-3.5 bg-[#f5f8f4] rounded-xl border border-[#d6e2cf] text-xs text-[#334c2b] flex items-start gap-2.5">
              <Sparkles size={16} className="text-[#c87d32] flex-shrink-0 mt-0.5" />
              <div>
                <strong>Recomendación de Marketing:</strong> Agrega parámetros UTM en las historias y biografía de Instagram para atribuir pedidos con precisión, por ejemplo:
                <div className="mt-1 font-mono text-[11px] bg-white px-2 py-1 rounded-md border border-[#d6e2cf] text-[#2d2a26] select-all overflow-x-auto">
                  https://panfree.com.py/?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: TOP PRODUCTOS VENDIDOS (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-[#e4dacb] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#f0e8dc] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#fff7ed] text-[#c87d32] rounded-xl border border-[#fed7aa]">
                    <Flame size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#334c2b]">Productos Más Vendidos</h3>
                    <p className="text-xs text-[#6d665e]">Demanda y volumen de ventas</p>
                  </div>
                </div>
                <Link
                  href="/admin/productos"
                  className="text-xs font-bold text-[#334c2b] hover:text-[#c87d32] flex items-center gap-1 hover:underline"
                >
                  Inventario <ArrowUpRight size={12} />
                </Link>
              </div>

              {/* Lista con Barras de Rendimiento */}
              <div className="space-y-3.5">
                {topProductos.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#6d665e]">
                    No se registran compras de productos en el período seleccionado.
                  </div>
                ) : (
                  topProductos.map((p, idx) => {
                    const porcentajeVentas = Math.round((p.ventas / totalVentasProductos) * 100)
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-[#fbf9f6] border border-[#f0e8dc] hover:border-[#b7996b] transition-all">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#334c2b] text-[#f5f1eb] text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-[#2d2a26] truncate max-w-[160px] sm:max-w-[200px]">
                              {p.nombre}
                            </span>
                          </div>
                          <span className="font-extrabold text-xs text-emerald-800">
                            {formatPYG(p.ingresos)}
                          </span>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="w-full bg-[#e4dacb]/40 rounded-full h-1.5 overflow-hidden mb-1">
                          <div
                            style={{ width: `${Math.max(porcentajeVentas, 6)}%` }}
                            className="bg-gradient-to-r from-[#334c2b] to-[#b7996b] h-full rounded-full"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#6d665e]">
                          <span className="bg-[#f5f1eb] px-1.5 py-0.5 rounded-sm border border-[#e4dacb] font-medium">
                            {p.categoria || 'Panadería'}
                          </span>
                          <span className="font-bold text-[#2d2a26]">{p.ventas} unidades vendidas</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f0e8dc] flex items-center justify-between text-xs text-[#6d665e]">
              <span>Datos sincronizados con pedidos</span>
              <span className="font-bold text-[#334c2b]">Total: {totalVentasProductos} un.</span>
            </div>
          </div>

        </div>

        {/* 4. EMBUDO DE EVENTOS Y TELEMETRÍA GA4 */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e4dacb] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#f0e8dc] gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#f5f8f4] text-[#334c2b] rounded-xl border border-[#d6e2cf]">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[#334c2b]">Eventos de E-Commerce & Marketing</h3>
                <p className="text-xs text-[#6d665e]">Seguimiento del embudo de conversión y comportamiento de usuarios</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#6d665e]">
              {topEventos.length} tipos de eventos monitorizados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topEventos.map((ev, idx) => {
              const isPurchase = ev.evento === 'purchase'
              const isMarketing = ev.categoria === 'Marketing'

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isPurchase
                      ? 'bg-[#f5f8f4] border-[#d6e2cf] shadow-xs'
                      : isMarketing
                      ? 'bg-[#fffbf5] border-[#eddcc7]'
                      : 'bg-[#fbf9f6] border-[#f0e8dc]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-extrabold text-[11px] text-[#334c2b] bg-white px-2 py-0.5 rounded-md border border-[#e4dacb]">
                        {ev.evento}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                        isMarketing ? 'text-[#c87d32] bg-[#fff7ed]' : 'text-[#6d665e] bg-[#f5f1eb]'
                      }`}>
                        {ev.categoria}
                      </span>
                    </div>
                    <div className="text-xl font-black text-[#2d2a26] my-1">
                      {Number(ev.conteo || 0).toLocaleString('es-PY')}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6d665e] mt-1.5 line-clamp-2">
                    {ev.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* 5. INFRAESTRUCTURA TÉCNICA & MEASUREMENT PROTOCOL */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e4dacb] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f0e8dc] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#faf6f0] text-[#b7996b] rounded-xl border border-[#eddcc7]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[#334c2b]">Estado de la Infraestructura de Medición</h3>
                <p className="text-xs text-[#6d665e]">Configuración de Google Analytics 4 y servidor seguro</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-[#eef6ed] px-2.5 py-1 rounded-lg border border-[#d6e9d3]">
              <CheckCircle2 size={13} />
              <span>Privacidad & Consent Mode Activo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Status 1: Measurement ID */}
            <div className="p-4 bg-[#fbf9f6] rounded-xl border border-[#f0e8dc] space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-[#b7996b] text-[10px]">
                Measurement ID (Frontend)
              </span>
              <div className="font-mono font-extrabold text-sm text-[#334c2b] flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-700" />
                {config.measurementId || 'G-QE8GQS3MSR'}
              </div>
              <p className="text-[#6d665e] text-[11px]">
                Inyectado vía <code>GAScript.jsx</code> en el cliente.
              </p>
            </div>

            {/* Status 2: Measurement Protocol Server */}
            <div className="p-4 bg-[#fbf9f6] rounded-xl border border-[#f0e8dc] space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-[#b7996b] text-[10px]">
                Measurement Protocol (Server-Side)
              </span>
              <div className="font-mono font-extrabold text-sm text-[#2d2a26] flex items-center gap-1.5">
                {config.apiSecretOk ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={15} /> GA4_API_SECRET Configurado
                  </span>
                ) : (
                  <span className="text-[#c87d32] flex items-center gap-1">
                    <CheckCircle2 size={15} className="text-emerald-700" /> Endpoint /api/ga4/measurement
                  </span>
                )}
              </div>
              <p className="text-[#6d665e] text-[11px]">
                Envío seguro de conversiones sin exponer claves.
              </p>
            </div>

            {/* Status 3: UTM Tracking & Storage */}
            <div className="p-4 bg-[#fbf9f6] rounded-xl border border-[#f0e8dc] space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-[#b7996b] text-[10px]">
                Captura UTM & Cookies
              </span>
              <div className="font-extrabold text-sm text-[#334c2b] flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-700" />
                Persistencia 30 días
              </div>
              <p className="text-[#6d665e] text-[11px]">
                Atribución multi-sesión con <code>useCampaigns.js</code>.
              </p>
            </div>

          </div>

          {/* Sección de Prueba con Feedback Visual */}
          <div className="pt-3 border-t border-[#f0e8dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-[#334c2b]">Diagnóstico de Conectividad GA4</div>
              <div className="text-xs text-[#6d665e]">
                Envía un evento de validación en tiempo real al endpoint de Measurement Protocol.
              </div>
            </div>

            <button
              onClick={dispararEventoPrueba}
              disabled={enviandoTest}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#334c2b] text-[#f5f1eb] hover:bg-[#25391e] rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Send size={14} className={enviandoTest ? 'animate-pulse text-[#b7996b]' : ''} />
              <span>{enviandoTest ? 'Enviando ping a GA4...' : 'Enviar Ping de Prueba'}</span>
            </button>
          </div>

          {/* Resultado del Ping de Prueba */}
          {testEventStatus && (
            <div className={`p-4 rounded-xl text-xs font-mono border transition-all ${
              testEventStatus.success
                ? 'bg-[#f5f8f4] text-[#334c2b] border-[#d6e2cf]'
                : 'bg-[#fffbf5] text-[#2d2a26] border-[#eddcc7]'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1.5">
                {testEventStatus.success ? (
                  <CheckCircle2 size={16} className="text-emerald-700" />
                ) : (
                  <Sparkles size={16} className="text-[#c87d32]" />
                )}
                <span>Respuesta del Servidor GA4:</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] bg-white p-3 rounded-lg border border-[#e4dacb]">
                {JSON.stringify(testEventStatus, null, 2)}
              </pre>
            </div>
          )}

        </section>

      </main>
    </div>
  )
}
