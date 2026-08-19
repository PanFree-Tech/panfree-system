/**
 * 📁 UBICACIÓN: src/app/admin/marketing/components/ScheduledPosts.jsx
 * 📌 Visualizador de historial de publicaciones de Instagram generadas / programadas.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getScheduledPosts } from '../services/instagramService'
import styles from '../styles/marketing.module.css'

export default function ScheduledPosts({ refreshTrigger }) {
  const [posts, setPosts] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarHistorial = useCallback(async () => {
    try {
      setCargando(true)
      const data = await getScheduledPosts()
      setPosts(data || [])
    } catch (err) {
      console.warn('Error al cargar historial:', err)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarHistorial()
  }, [cargarHistorial, refreshTrigger])

  return (
    <div className={styles.historySection} id="scheduled-posts-section">
      <div className={styles.historyTitle}>
        <span>📜 Historial de Publicaciones</span>
        <button
          onClick={cargarHistorial}
          style={{
            background: 'none',
            border: 'none',
            color: '#4ECDC4',
            cursor: 'pointer',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}
        >
          {cargando ? 'Cargando...' : '🔄 Actualizar'}
        </button>
      </div>

      {cargando && posts.length === 0 && (
        <div style={{ color: '#777', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
          Consultando publicaciones...
        </div>
      )}

      {!cargando && posts.length === 0 && (
        <div
          style={{
            backgroundColor: '#1f1f1f',
            borderRadius: 8,
            padding: '1rem',
            textAlign: 'center',
            color: '#777',
            fontSize: '0.76rem',
          }}
        >
          No hay publicaciones registradas todavía. ¡Creá una con el panel de automatización!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 320, overflowY: 'auto' }}>
        {posts.map((post, idx) => {
          const fecha = post.created_at
            ? new Date(post.created_at).toLocaleString('es-PY', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Reciente'

          return (
            <div key={post.id || idx} className={styles.historyItem}>
              {post.thumbnail ? (
                <img
                  src={post.thumbnail}
                  alt="miniatura"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid #444',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    backgroundColor: '#334c2b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  🍞
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.2rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#eee6d9',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {post.product_name || 'Panfree Instagram Post'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: 10,
                      backgroundColor:
                        post.status === 'publicado' ? '#14532d' : '#854d0e',
                      color:
                        post.status === 'publicado' ? '#86efac' : '#fde047',
                      fontWeight: 600,
                    }}
                  >
                    {post.status || 'programado'}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.72rem',
                    color: '#aaa',
                    margin: '0 0 0.35rem 0',
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {post.caption || 'Sin texto'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.68rem',
                    color: '#666',
                  }}
                >
                  <span>{fecha}</span>
                  {post.url && (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#4ECDC4',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Ver en Instagram ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
