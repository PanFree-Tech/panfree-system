/**
 * 📁 UBICACIÓN: src/app/admin/marketing/components/AnalyticsView.jsx
 * 📌 COMPONENTE: Panel de Analítica y Rendimiento de Marketing
 * 📖 DESCRIPCIÓN: Consume el endpoint /api/admin/marketing/analizar-resultados para mostrar
 *    KPIs de conversión, engagement, reglas más efectivas y promociones recientes.
 */

'use client'

import { useState, useEffect } from 'react'
import styles from '../styles/marketing.module.css'
import ScheduledPosts from './ScheduledPosts'

export default function AnalyticsView({ refreshTrigger }) {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [notificacion, setNotificacion] = useState(null)

  const cargarAnaliticas = async () => {
    try {
      setCargando(true)
      const res = await fetch('/api/admin/marketing/analizar-resultados')
      const json = await res.json()

      if (json.success && json.analytics) {
        setData(json.analytics)
      } else {
        throw new Error(json.error || 'Error al cargar analíticas')
      }
    } catch (err) {
      console.warn('Error al cargar analíticas de marketing:', err.message)
      setNotificacion({
        tipo: 'error',
        texto: err.message,
      })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarAnaliticas()
  }, [refreshTrigger])

  return (
    <div className={styles.moduleContainer} id="analytics-view-root">
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334c2b', margin: 0 }}>
            📊 Rendimiento y Analítica de Campañas
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#666' }}>
            Métricas de engagement, efectividad de reglas de descuento y registro de publicaciones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a
            href="/admin/marketing/analytics"
            className={styles.tabButton}
            style={{
              backgroundColor: '#f46e15',
              color: '#fff',
              border: 'none',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: '700'
            }}
          >
            📈 Abrir Panel GA4 Completo
          </a>
          <button
            onClick={cargarAnaliticas}
            disabled={cargando}
            className={styles.tabButton}
            style={{ backgroundColor: '#334c2b', color: '#eee6d9', border: '1px solid #b7996b' }}
          >
            {cargando ? '⏳ Actualizando...' : '🔄 Actualizar Métricas'}
          </button>
        </div>
      </div>

      {/* Grid de KPIs Principales */}
      <div className={styles.grid4}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Promociones</span>
          <span className={styles.kpiVal}>{data?.total_promociones || 0}</span>
          <span style={{ fontSize: '0.72rem', color: '#666' }}>Generadas por el sistema</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Publicadas en Instagram</span>
          <span className={styles.kpiVal} style={{ color: '#059669' }}>{data?.publicadas || 0}</span>
          <span style={{ fontSize: '0.72rem', color: '#059669' }}>100% Sin Gluten</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Descuento Promedio</span>
          <span className={styles.kpiVal} style={{ color: '#FF6B35' }}>{data?.descuento_promedio || 0}%</span>
          <span style={{ fontSize: '0.72rem', color: '#888' }}>Rentabilidad cuidada</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Engagement Total</span>
          <span className={styles.kpiVal} style={{ color: '#2563eb' }}>{data?.engagement_total || 0}</span>
          <span style={{ fontSize: '0.72rem', color: '#2563eb' }}>Interacciones registradas</span>
        </div>
      </div>

      {/* Grid de Desglose: Top Reglas y Top Productos */}
      <div className={styles.grid2}>
        {/* Top Reglas */}
        <div className={styles.card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#334c2b', margin: '0 0 1rem 0' }}>
            🏆 Reglas con Mayor Frecuencia
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {data?.top_reglas && data.top_reglas.length > 0 ? (
              data.top_reglas.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#faf7f2',
                    borderRadius: 6,
                    border: '1px solid #e6dcd0',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2D2D2D' }}>
                    {r.nombre}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeGold}`}>
                    {r.total} promociones
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#888' }}>Sin datos suficientes aún</div>
            )}
          </div>
        </div>

        {/* Top Productos */}
        <div className={styles.card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#334c2b', margin: '0 0 1rem 0' }}>
            🥖 Productos Más Promocionados
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {data?.top_productos && data.top_productos.length > 0 ? (
              data.top_productos.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#faf7f2',
                    borderRadius: 6,
                    border: '1px solid #e6dcd0',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2D2D2D' }}>
                    {p.nombre}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeGreen}`}>
                    {p.total} campañas
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#888' }}>Sin datos suficientes aún</div>
            )}
          </div>
        </div>
      </div>

      {/* Historial Detallado de Publicaciones */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ScheduledPosts refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}
