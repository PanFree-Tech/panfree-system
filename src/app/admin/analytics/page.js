// src/app/admin/analytics/page.js
'use client'

import { useState, useEffect } from 'react'

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/admin/ga-metrics?periodo=7d')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [])

  if (cargando) return <div className="p-8 text-center">Cargando métricas GA4...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#334c2b] mb-6">📊 Google Analytics 4</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Ingresos</p>
          <p className="text-2xl font-bold text-[#334c2b]">
            {data?.resumen?.revenue ? `₲ ${data.resumen.revenue.toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Pedidos</p>
          <p className="text-2xl font-bold text-[#334c2b]">
            {data?.resumen?.pedidos || '—'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Usuarios</p>
          <p className="text-2xl font-bold text-[#334c2b]">
            {data?.resumen?.usuarios || '—'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Conversión</p>
          <p className="text-2xl font-bold text-[#334c2b]">
            {data?.resumen?.conversion_rate || '—'}%
          </p>
        </div>
      </div>

      {/* Aquí irían los gráficos (Recharts) */}
    </div>
  )
}