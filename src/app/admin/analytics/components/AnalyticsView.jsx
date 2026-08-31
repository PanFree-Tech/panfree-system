// src/app/admin/analytics/components/AnalyticsView.jsx
'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

export default function AnalyticsView() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [periodo, setPeriodo] = useState('7d')
  const [metricaGrafico, setMetricaGrafico] = useState('revenue')

  useEffect(() => {
    fetch(`/api/admin/ga-metrics?periodo=${periodo}`)
      .then(res => res.json())
      .then(json => {
        setData(json)
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [periodo])

  // Datos simulados para el gráfico
  const datosGrafico = data?.tendencia || [
    { label: 'Lun', revenue: 120000, usuarios: 12, pedidos: 3, conversiones: 2 },
    { label: 'Mar', revenue: 85000, usuarios: 8, pedidos: 2, conversiones: 1 },
    { label: 'Mié', revenue: 200000, usuarios: 20, pedidos: 5, conversiones: 4 },
    { label: 'Jue', revenue: 150000, usuarios: 15, pedidos: 4, conversiones: 3 },
    { label: 'Vie', revenue: 280000, usuarios: 25, pedidos: 7, conversiones: 5 },
    { label: 'Sáb', revenue: 180000, usuarios: 18, pedidos: 5, conversiones: 4 },
    { label: 'Dom', revenue: 90000, usuarios: 10, pedidos: 2, conversiones: 1 },
  ]

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#334c2b] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando métricas de Google Analytics...</p>
        </div>
      </div>
    )
  }

  const r = data?.resumen || {}

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ─── ENCABEZADO ─── */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#334c2b]">📊 Google Analytics 4</h1>
          <p className="text-gray-500 text-sm">Métricas de rendimiento y conversiones de la tienda</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['today', '7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                periodo === p
                  ? 'bg-[#334c2b] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'today' ? 'Hoy' : p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── FILA 1: MÉTRICAS PRINCIPALES (1-4) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* 1. Usuarios */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">👤 Usuarios</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">{r.usuarios || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Únicos en el período</p>
        </div>

        {/* 2. Sesiones */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">🔄 Sesiones</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">{r.sesiones || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Visitas a la tienda</p>
        </div>

        {/* 3. Interacciones */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">⚡ Interacciones</p>
          <p className="text-2xl font-bold text-[#f46e15] mt-1">{r.interacciones || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Eventos + acciones</p>
        </div>

        {/* 4. Tiempo de interacción */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">⏱️ Tiempo interacción</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">
            {r.tiempo_interaccion || 0}s
          </p>
          <p className="text-xs text-gray-400 mt-1">Promedio por sesión</p>
        </div>
      </div>

      {/* ─── FILA 2: VISTAS, EVENTOS, CONVERSIONES, LTV ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 5. Vistas */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">👁️ Vistas</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">{r.vistas || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Páginas/productos vistos</p>
        </div>

        {/* 6. Eventos */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">📌 Eventos</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">{r.eventos?.total || 0}</p>
          <div className="flex gap-2 text-xs text-gray-400 mt-1">
            <span>Compras: {r.eventos?.compras || 0}</span>
            <span>UTM: {r.eventos?.clicks_utm || 0}</span>
          </div>
        </div>

        {/* 7. Conversiones */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">📈 Conversión</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-bold text-[#f46e15]">{r.conversion_rate || 0}%</p>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#f46e15] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(r.conversion_rate || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {r.conversion_rate >= 5 ? '✅ Excelente' : r.conversion_rate >= 2 ? '📊 En progreso' : '🎯 Meta: 5%'}
          </p>
        </div>

        {/* 8. LTV */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">💰 LTV</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">
            {r.ltv ? `₲ ${r.ltv.toLocaleString()}` : '₲ 0'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Valor de vida del cliente</p>
        </div>
      </div>

      {/* ─── FILA 3: INGRESOS TOTALES Y CLICKS EN ANUNCIOS ─── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 9. Ingresos Totales */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">💰 Ingresos Totales (Histórico)</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">
            {r.ingresos_totales ? `₲ ${r.ingresos_totales.toLocaleString()}` : '₲ 0'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Desde {data?.detalles?.primer_pedido ? new Date(data.detalles.primer_pedido).toLocaleDateString() : 'el inicio'}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
            <span>Clientes: {r.clientes_unicos || 0}</span>
            <span>Pedidos: {r.pedidos || 0}</span>
          </div>
        </div>

        {/* 10. Clicks en Anuncios */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">🖱️ Clicks en Anuncios</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-bold text-[#f46e15]">{r.clicks_anuncios || 0}</p>
            <span className="text-sm text-gray-400 mb-1">clics</span>
          </div>
          
          {r.clicks_por_fuente?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Principales fuentes:</p>
              <div className="flex flex-wrap gap-1">
                {r.clicks_por_fuente.map((item, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {r.clicks_anuncios === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              📊 Configura parámetros UTM en tus enlaces
            </p>
          )}
        </div>
      </div>

      {/* ─── GRÁFICOS ─── */}
      {/* Selector de métrica */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['revenue', 'usuarios', 'pedidos', 'conversiones'].map((m) => (
          <button
            key={m}
            onClick={() => setMetricaGrafico(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              metricaGrafico === m
                ? 'bg-[#f46e15] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {m === 'revenue' ? '📈 Ingresos' :
             m === 'usuarios' ? '👤 Usuarios' :
             m === 'pedidos' ? '📦 Pedidos' :
             '📊 Conversiones'}
          </button>
        ))}
      </div>

      {/* Gráfico de área */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-[#334c2b] mb-4">📈 Evolución diaria</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosGrafico}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#334c2b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#334c2b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" />
              <XAxis dataKey="label" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={metricaGrafico}
                name={metricaGrafico === 'revenue' ? 'Ingresos' :
                      metricaGrafico === 'usuarios' ? 'Usuarios' :
                      metricaGrafico === 'pedidos' ? 'Pedidos' : 'Conversiones'}
                stroke="#334c2b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#334c2b] mb-4">📊 Comparativa diaria</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" />
              <XAxis dataKey="label" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey={metricaGrafico} name="Valor" fill="#334c2b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}