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

  // Datos simulados para el gráfico (cuando no hay datos reales)
  const datosGrafico = data?.tendencia || [
    { label: 'Lun', revenue: 120000, pedidos: 3, usuarios: 12 },
    { label: 'Mar', revenue: 85000, pedidos: 2, usuarios: 8 },
    { label: 'Mié', revenue: 200000, pedidos: 5, usuarios: 20 },
    { label: 'Jue', revenue: 150000, pedidos: 4, usuarios: 15 },
    { label: 'Vie', revenue: 280000, pedidos: 7, usuarios: 25 },
    { label: 'Sáb', revenue: 180000, pedidos: 5, usuarios: 18 },
    { label: 'Dom', revenue: 90000, pedidos: 2, usuarios: 10 },
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Ingresos</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">
            {data?.resumen?.revenue ? `₲ ${data.resumen.revenue.toLocaleString()}` : '₲ 0'}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Pedidos</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">
            {data?.resumen?.pedidos || 0}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Usuarios</p>
          <p className="text-2xl font-bold text-[#334c2b] mt-1">
            {data?.resumen?.usuarios || 0}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Ticket Promedio</p>
          <p className="text-2xl font-bold text-[#f46e15] mt-1">
            {data?.resumen?.ticketPromedio ? `₲ ${data.resumen.ticketPromedio.toLocaleString()}` : '₲ 0'}
          </p>
        </div>
      </div>

      {/* Selector de métrica para el gráfico */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setMetricaGrafico('revenue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            metricaGrafico === 'revenue'
              ? 'bg-[#f46e15] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📈 Ingresos
        </button>
        <button
          onClick={() => setMetricaGrafico('pedidos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            metricaGrafico === 'pedidos'
              ? 'bg-[#f46e15] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📦 Pedidos
        </button>
        <button
          onClick={() => setMetricaGrafico('usuarios')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            metricaGrafico === 'usuarios'
              ? 'bg-[#f46e15] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          👥 Usuarios
        </button>
      </div>

      {/* Gráfico de área con Recharts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-[#334c2b] mb-4">
          📈 Evolución por día
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datosGrafico}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#334c2b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#334c2b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f46e15" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f46e15" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" />
              <XAxis dataKey="label" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'revenue' || name === 'Ingresos') {
                    return [`₲ ${Number(value).toLocaleString()}`, 'Ingresos']
                  }
                  return [value, name]
                }}
              />
              <Legend />
              {metricaGrafico === 'revenue' && (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Ingresos"
                  stroke="#334c2b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              )}
              {metricaGrafico === 'pedidos' && (
                <Area
                  type="monotone"
                  dataKey="pedidos"
                  name="Pedidos"
                  stroke="#f46e15"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPedidos)"
                />
              )}
              {metricaGrafico === 'usuarios' && (
                <Area
                  type="monotone"
                  dataKey="usuarios"
                  name="Usuarios"
                  stroke="#b7996b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPedidos)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de barras para comparación */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#334c2b] mb-4">
          📊 Comparativa por día
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" />
              <XAxis dataKey="label" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'revenue' || name === 'Ingresos') {
                    return [`₲ ${Number(value).toLocaleString()}`, 'Ingresos']
                  }
                  return [value, name]
                }}
              />
              <Legend />
              <Bar dataKey={metricaGrafico} name="Valor" fill="#334c2b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}