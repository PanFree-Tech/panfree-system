/**
 * 📁 UBICACIÓN: src/app/admin/marketing/page.js
 * 📅 CREADO: 2026-03-07 v3 | REFACTORIZADO: Modular con Automatización IA & Instagram
 * 📌 Generador de imágenes publicitarias y automatización para Instagram.
 *    Carga productos reales de Supabase. Canvas HTML5 client-side.
 *    Generación de copy con Gemini AI y publicación a Instagram.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Utils & Config
import { P, ESQUEMAS } from './utils/colorSchemes'
import { FORMATOS } from './utils/formats'
import { PLANTILLAS } from './utils/templates'
import { fmt2PYG } from './utils/canvasUtils'

// Hooks
import { useSupabaseProducts } from './hooks/useSupabaseProducts'
import { useMarketingState } from './hooks/useMarketingState'
import { useCanvasRenderer } from './hooks/useCanvasRenderer'

// Components
import AutomationPanel from './components/AutomationPanel'
import ScheduledPosts from './components/ScheduledPosts'
import DecisionPanel from './components/DecisionPanel'
import RulesManager from './components/RulesManager'
import EventCalendar from './components/EventCalendar'
import AnalyticsView from './components/AnalyticsView'
import styles from './styles/marketing.module.css'

// ─── SIMULADOR DE CELULAR ─────────────────────────────────────────────────────
function SimuladorCelular({ dataUrl, formato, productoActual, P }) {
  const esStories = formato === 'stories'
  const dispW = esStories ? 248 : 290
  const dispH = esStories ? 440 : formato === 'feed_1_1' ? 290 : 362
  const hora = new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
  const nombre = productoActual?.nombre || 'PanFree'

  const ImgPost = ({ style }) =>
    dataUrl ? (
      <img
        src={dataUrl}
        alt="preview"
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', ...style }}
      />
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#333', fontSize: '0.7rem' }}>Generando…</span>
      </div>
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div
        style={{
          position: 'relative',
          width: dispW + 44,
          height: dispH + (esStories ? 148 : 168),
          backgroundColor: '#1a1a1a',
          borderRadius: 44,
          boxShadow: `0 0 0 2px #333, 0 0 0 4px #111, 0 24px 64px rgba(0,0,0,0.8), inset 0 0 0 1px #333`,
          flexShrink: 0,
        }}
      >
        {/* Botones laterales */}
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 90,
            width: 3,
            height: 32,
            backgroundColor: '#2a2a2a',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 132,
            width: 3,
            height: 32,
            backgroundColor: '#2a2a2a',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -3,
            top: 110,
            width: 3,
            height: 48,
            backgroundColor: '#2a2a2a',
            borderRadius: '0 2px 2px 0',
          }}
        />

        {/* Pantalla */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: dispW + 24,
            height: dispH + (esStories ? 128 : 148),
            backgroundColor: '#000',
            borderRadius: 36,
            overflow: 'hidden',
          }}
        >
          {/* Status bar */}
          <div
            style={{
              height: 28,
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 18px',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {hora}
            </span>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {[3, 5, 7, 9].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: h,
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    opacity: i < 3 ? 1 : 0.35,
                  }}
                />
              ))}
              <svg width="14" height="10" viewBox="0 0 14 10" style={{ marginLeft: 2 }}>
                <path d="M7 8.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" fill="white" />
                <path
                  d="M4.5 6.5a3.5 3.5 0 0 1 5 0"
                  stroke="white"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M2.2 4.2a6.5 6.5 0 0 1 9.6 0"
                  stroke="white"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <div
                  style={{
                    width: 18,
                    height: 9,
                    border: '1.5px solid #fff',
                    borderRadius: 2,
                    padding: '1.5px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ width: '75%', height: '100%', backgroundColor: '#fff', borderRadius: 1 }} />
                </div>
                <div style={{ width: 2, height: 5, backgroundColor: '#fff', borderRadius: 1, opacity: 0.6 }} />
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div style={{ backgroundColor: '#000', height: dispH + (esStories ? 100 : 120), overflow: 'hidden' }}>
            {/* STORIES */}
            {esStories && (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <ImgPost style={{ width: dispW + 24, height: '100%' }} />
                {/* Barras de progreso */}
                <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', gap: 3, zIndex: 2 }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 2.5,
                        borderRadius: 2,
                        backgroundColor: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)',
                      }}
                    />
                  ))}
                </div>
                {/* Header stories */}
                <div
                  style={{
                    position: 'absolute',
                    top: 18,
                    left: 8,
                    right: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#f46e15,#334c2b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#fff',
                        border: '1.5px solid #fff',
                      }}
                    >
                      PF
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700, lineHeight: 1.2 }}>
                        panfree.fit
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.52rem' }}>Hace 2 min</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>⋯</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>✕</span>
                  </div>
                </div>
                {/* Barra inferior */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 28,
                      border: '1.5px solid rgba(255,255,255,0.5)',
                      borderRadius: 20,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 10,
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.55rem' }}>Enviar mensaje</span>
                  </div>
                  <span style={{ fontSize: '1.1rem' }}>❤️</span>
                  <span style={{ fontSize: '1rem' }}>↗</span>
                </div>
              </div>
            )}

            {/* FEED */}
            {!esStories && (
              <div style={{ backgroundColor: '#000' }}>
                {/* Barra superior Instagram */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    height: 36,
                    borderBottom: '0.5px solid #222',
                  }}
                >
                  <span
                    style={{
                      color: '#fff',
                      fontFamily: 'serif',
                      fontSize: '1rem',
                      fontStyle: 'italic',
                      fontWeight: 700,
                    }}
                  >
                    Instagram
                  </span>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem' }}>♡</span>
                    <span style={{ fontSize: '0.9rem' }}>✈</span>
                  </div>
                </div>
                {/* Header del post */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        padding: 2,
                        background: 'linear-gradient(135deg,#f46e15,#c8007a)',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg,#334c2b,#b7996b)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid #000',
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          color: '#eee6d9',
                        }}
                      >
                        PF
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}>panfree.fit</div>
                      <div style={{ color: '#888', fontSize: '0.5rem' }}>Encarnación, Paraguay</div>
                    </div>
                  </div>
                  <span style={{ color: '#fff', fontSize: '1.1rem' }}>⋯</span>
                </div>
                {/* Imagen */}
                <div style={{ width: '100%', height: dispH, backgroundColor: '#111', overflow: 'hidden' }}>
                  <ImgPost />
                </div>
                {/* Acciones */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px 4px',
                  }}
                >
                  <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem' }}>🤍</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff' }}>💬</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff' }}>↗</span>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#fff' }}>🔖</span>
                </div>
                <div style={{ padding: '0 10px 3px' }}>
                  <span style={{ color: '#fff', fontSize: '0.58rem', fontWeight: 700 }}>
                    A 247 personas les gusta esto
                  </span>
                </div>
                <div style={{ padding: '0 10px 4px' }}>
                  <span style={{ color: '#fff', fontSize: '0.58rem' }}>
                    <strong>panfree.fit</strong>{' '}
                    {nombre.length > 22 ? nombre.slice(0, 22) + '…' : nombre} 🍞 Sin gluten · Sin TACC
                  </span>
                </div>
                <div style={{ padding: '0 10px 8px' }}>
                  <span style={{ color: '#555', fontSize: '0.52rem' }}>HACE 2 HORAS</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic island */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 72,
            height: 22,
            backgroundColor: '#000',
            borderRadius: 12,
            zIndex: 10,
          }}
        />
      </div>

      <div style={{ color: '#444', fontSize: '0.68rem', textAlign: 'center' }}>
        Vista simulada · {esStories ? 'Stories / Reels' : 'Feed'}
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL REFACTORIZADO ───────────────────────────────────────
export default function MarketingPage() {
  const router = useRouter()
  const [refreshHistory, setRefreshHistory] = useState(0)
  const [tabActiva, setTabActiva] = useState('decisiones')

  // 1. Cargar productos de Supabase
  const { productos, loadingProd } = useSupabaseProducts()

  // 2. Manejo de estado del marketing
  const state = useMarketingState(productos)

  // 3. Orquestador de Canvas y exportaciones
  const {
    canvasRef,
    dataUrl,
    exportando,
    imgProdLista,
    exportar,
  } = useCanvasRenderer(state, loadingProd)

  const productoActual = state.selectedProduct
  const F = FORMATOS[state.formato] || FORMATOS.feed_4_5
  const preH = 560
  const scale = preH / F.h
  const preW = F.w * scale

  // ── ESTILOS DEL MÓDULO ──────────────────────────────────────────────────────
  const S = {
    page: { minHeight: '100vh', backgroundColor: '#f0ebe3', fontFamily: '"Segoe UI",sans-serif' },
    header: {
      backgroundColor: P.verde,
      color: P.crema,
      padding: '0.85rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `3px solid ${P.dorado}`,
    },
    body: { display: 'grid', gridTemplateColumns: '355px 1fr', minHeight: 'calc(100vh - 62px)' },
    panel: {
      backgroundColor: '#fff',
      borderRight: `2px solid #e0d5c5`,
      overflowY: 'auto',
      padding: '1.25rem',
    },
    preview: {
      backgroundColor: '#141414',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      gap: '1.5rem',
      overflowY: 'auto',
    },
    sec: { marginBottom: '1.2rem', borderBottom: '1px solid #ede5d8', paddingBottom: '1rem' },
    secTit: {
      fontSize: '0.74rem',
      fontWeight: 700,
      color: P.dorado,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: '0.55rem',
    },
    label: {
      display: 'block',
      fontSize: '0.74rem',
      fontWeight: 700,
      color: P.verde,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.28rem',
    },
    select: {
      width: '100%',
      padding: '0.44rem 0.7rem',
      borderRadius: 6,
      border: `1.5px solid ${P.dorado}`,
      backgroundColor: '#faf7f2',
      fontFamily: 'inherit',
      fontSize: '0.87rem',
      color: P.verde,
      cursor: 'pointer',
      outline: 'none',
    },
    input: {
      width: '100%',
      padding: '0.44rem 0.7rem',
      borderRadius: 6,
      border: '1.5px solid #d4c9b5',
      backgroundColor: '#faf7f2',
      fontFamily: 'inherit',
      fontSize: '0.87rem',
      color: P.verde,
      outline: 'none',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '0.44rem 0.7rem',
      borderRadius: 6,
      border: '1.5px solid #d4c9b5',
      backgroundColor: '#faf7f2',
      fontFamily: 'inherit',
      fontSize: '0.84rem',
      color: P.verde,
      outline: 'none',
      resize: 'vertical',
      boxSizing: 'border-box',
    },
    radio: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5rem',
      marginBottom: '0.55rem',
      cursor: 'pointer',
    },
    toggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.86rem',
      color: '#444',
      cursor: 'pointer',
      marginBottom: '0.32rem',
    },
    btnV: {
      flex: 1,
      padding: '0.68rem',
      backgroundColor: P.verde,
      color: P.crema,
      border: 'none',
      borderRadius: 7,
      fontWeight: 700,
      fontSize: '0.9rem',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    btnN: {
      flex: 1,
      padding: '0.68rem',
      backgroundColor: P.naranja,
      color: '#fff',
      border: 'none',
      borderRadius: 7,
      fontWeight: 700,
      fontSize: '0.9rem',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    hint: { fontSize: '0.72rem', color: '#999', marginTop: '0.2rem', lineHeight: 1.45 },
    badge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: '0.7rem',
      fontWeight: 700,
    },
    backBtn: {
      background: 'none',
      border: `1px solid ${P.dorado}50`,
      color: P.crema,
      padding: '0.3rem 0.75rem',
      borderRadius: 6,
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: '0.82rem',
    },
    helpBtn: {
      background: 'none',
      border: `1px solid ${P.dorado}50`,
      color: P.doradoClaro,
      padding: '0.3rem 0.75rem',
      borderRadius: 6,
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: '0.82rem',
    },
  }

  if (loadingProd) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: P.verde }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍞</div>
          <p style={{ fontWeight: 700 }}>Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button onClick={() => router.push('/admin')} style={S.backBtn}>
            ← Admin
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>📸 Marketing & Redes Sociales</div>
            <div style={{ fontSize: '0.73rem', color: P.dorado, opacity: 0.85 }}>
              PanFree · Sistema de Marketing Inteligente & Canvas Creativo
            </div>
          </div>
        </div>
        <button onClick={() => router.push('/admin/ayuda/marketing')} style={S.helpBtn}>
          ❓ Guía de uso
        </button>
      </div>

      {/* BARRA DE PESTAÑAS */}
      <div className={styles.tabNav} id="marketing-tab-bar">
        <button
          onClick={() => setTabActiva('decisiones')}
          className={`${styles.tabButton} ${tabActiva === 'decisiones' ? styles.tabButtonActive : ''}`}
        >
          🤖 Decisiones Inteligentes (IA)
        </button>

        <button
          onClick={() => setTabActiva('canvas')}
          className={`${styles.tabButton} ${tabActiva === 'canvas' ? styles.tabButtonActive : ''}`}
        >
          🎨 Diseñador Visual (Canvas)
        </button>

        <button
          onClick={() => setTabActiva('reglas')}
          className={`${styles.tabButton} ${tabActiva === 'reglas' ? styles.tabButtonActive : ''}`}
        >
          📋 Reglas de Promoción
        </button>

        <button
          onClick={() => setTabActiva('eventos')}
          className={`${styles.tabButton} ${tabActiva === 'eventos' ? styles.tabButtonActive : ''}`}
        >
          📅 Calendario de Eventos
        </button>

        <button
          onClick={() => setTabActiva('analisis')}
          className={`${styles.tabButton} ${tabActiva === 'analisis' ? styles.tabButtonActive : ''}`}
        >
          📊 Métricas & Historial
        </button>
      </div>

      {/* CONTENIDO CONDICIONAL POR PESTAÑA */}
      {tabActiva === 'decisiones' && (
        <DecisionPanel
          productos={productos}
          onApplyToCanvas={(cfg) => {
            state.applyIntelligentConfig(cfg)
            setTabActiva('canvas')
          }}
          onPostPublished={() => setRefreshHistory((prev) => prev + 1)}
          onNavigateToTab={setTabActiva}
        />
      )}

      {tabActiva === 'reglas' && <RulesManager />}

      {tabActiva === 'eventos' && <EventCalendar />}

      {tabActiva === 'analisis' && <AnalyticsView refreshTrigger={refreshHistory} />}

      {/* PESTAÑA: DISEÑADOR VISUAL & CANVAS */}
      <div style={{ ...S.body, display: tabActiva === 'canvas' ? 'grid' : 'none' }}>
        {/* ── PANEL DE CONTROL ─────────────────────────────────────────── */}
        <div style={S.panel}>
          {/* FORMATO */}
          <div style={S.sec}>
            <div style={S.secTit}>📐 Formato</div>
            {Object.entries(FORMATOS).map(([k, f]) => (
              <label key={k} style={S.radio}>
                <input
                  type="radio"
                  name="fmt"
                  checked={state.formato === k}
                  onChange={() => state.setFormato(k)}
                  style={{ accentColor: P.verde, marginTop: 3 }}
                />
                <span>
                  <strong style={{ fontSize: '0.87rem' }}>
                    {f.tag} {f.label}
                  </strong>
                  <br />
                  <span style={{ fontSize: '0.72rem', color: '#888' }}>
                    {f.w}×{f.h}px · {f.desc}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {/* PLANTILLA */}
          <div style={S.sec}>
            <div style={S.secTit}>🎨 Plantilla</div>
            {Object.entries(PLANTILLAS).map(([k, p]) => (
              <label key={k} style={S.radio}>
                <input
                  type="radio"
                  name="plt"
                  checked={state.plantilla === k}
                  onChange={() => state.setPlantilla(k)}
                  style={{ accentColor: P.verde, marginTop: 3 }}
                />
                <span>
                  <strong style={{ fontSize: '0.87rem' }}>{p.label}</strong>
                  <br />
                  <span style={{ fontSize: '0.72rem', color: '#888' }}>{p.desc}</span>
                </span>
              </label>
            ))}
          </div>

          {/* ESQUEMA DE COLOR */}
          <div style={S.sec}>
            <div style={S.secTit}>🎭 Esquema de color</div>
            <select
              style={S.select}
              value={state.esquema}
              onChange={(e) => state.setEsquema(e.target.value)}
            >
              {Object.entries(ESQUEMAS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* PRODUCTO */}
          <div style={S.sec}>
            <div style={S.secTit}>🍞 Producto</div>
            <select
              style={S.select}
              value={state.productoId}
              onChange={(e) => state.setProductoId(e.target.value)}
            >
              <option value="">— Sin producto específico —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {fmt2PYG(p.precio_venta)}
                </option>
              ))}
            </select>
            {productoActual && (
              <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                <span style={{ ...S.badge, backgroundColor: '#e8f4e9', color: P.verde }}>
                  {productoActual.categoria}
                </span>
                <span
                  style={{
                    ...S.badge,
                    backgroundColor: productoActual.imagen_url
                      ? imgProdLista
                        ? '#e8f4e9'
                        : '#fff8e0'
                      : '#fff0e0',
                    color: productoActual.imagen_url
                      ? imgProdLista
                        ? P.verde
                        : P.naranja
                      : P.naranja,
                  }}
                >
                  {productoActual.imagen_url
                    ? imgProdLista
                      ? '✓ imagen OK'
                      : '⏳ cargando...'
                    : 'sin imagen'}
                </span>
              </div>
            )}
          </div>

          {/* TEXTOS */}
          <div style={S.sec}>
            <div style={S.secTit}>✏️ Textos</div>

            {state.plantilla === 'promo' && (
              <div style={{ marginBottom: '0.65rem' }}>
                <label style={S.label}>Etiqueta de oferta</label>
                <input
                  style={S.input}
                  value={state.textoPromo}
                  onChange={(e) => state.setTextoPromo(e.target.value)}
                />
              </div>
            )}

            <label style={S.label}>Texto principal</label>
            <textarea
              style={{ ...S.textarea, height: state.plantilla === 'catalogo' ? 88 : 52 }}
              value={state.textoPrincipal}
              onChange={(e) => state.setTextoPrincipal(e.target.value)}
            />
            <p style={S.hint}>Enter = nueva línea. Cada línea tiene tamaño y color diferente.</p>

            {state.plantilla === 'hero' && (
              <div style={{ marginTop: '0.65rem' }}>
                <label style={S.label}>Subtítulo</label>
                <input
                  style={S.input}
                  value={state.subtitulo}
                  onChange={(e) => state.setSubtitulo(e.target.value)}
                  placeholder="Artesanal · Sin Gluten · Sin TACC"
                />
              </div>
            )}

            <div style={{ marginTop: '0.65rem' }}>
              <label style={S.label}>Texto del botón CTA</label>
              <input
                style={S.input}
                value={state.textoCTA}
                onChange={(e) => state.setTextoCTA(e.target.value)}
              />
            </div>
          </div>

          {/* OPCIONES VISUALES */}
          <div style={S.sec}>
            <div style={S.secTit}>⚙️ Mostrar en la imagen</div>
            {[
              [state.mostrarPrecio, state.setMostrarPrecio, 'Precio del producto'],
              [state.mostrarSlogan, state.setMostrarSlogan, 'Slogan de PanFree'],
              [state.mostrarDelivery, state.setMostrarDelivery, 'Info de entrega'],
            ].map(([val, set, lbl]) => (
              <label key={lbl} style={S.toggle}>
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => set(e.target.checked)}
                  style={{ accentColor: P.verde, width: 15, height: 15 }}
                />
                {lbl}
              </label>
            ))}
          </div>

          {/* HASHTAGS */}
          <div style={S.sec}>
            <div style={S.secTit}># Hashtags</div>
            <label style={S.toggle}>
              <input
                type="checkbox"
                checked={state.mostrarHashtags}
                onChange={(e) => state.setMostrarHashtags(e.target.checked)}
                style={{ accentColor: P.verde, width: 15, height: 15 }}
              />
              Incluir hashtags en la imagen
            </label>
            {state.mostrarHashtags && (
              <>
                <textarea
                  style={{ ...S.textarea, height: 70, marginTop: '0.45rem' }}
                  value={state.hashtags}
                  onChange={(e) => state.setHashtags(e.target.value)}
                />
                <p style={S.hint}>
                  Separados por espacios. Máx. recomendado: 6–8 en imagen.
                  <br />
                  Podés agregar más en el caption de Instagram al publicar.
                </p>
              </>
            )}
            {!state.mostrarHashtags && (
              <p style={S.hint}>
                Los hashtags se pueden agregar automáticamente en el caption de Instagram con IA. La imagen queda más limpia.
              </p>
            )}
          </div>

          {/* LOGO */}
          <div style={S.sec}>
            <div style={S.secTit}>🖼️ Logo</div>

            <label style={S.label}>Tamaño — {state.logoAltura}px</label>
            <input
              type="range"
              min={60}
              max={280}
              step={4}
              value={state.logoAltura}
              onChange={(e) => state.setLogoAltura(Number(e.target.value))}
              style={{ width: '100%', accentColor: P.verde, marginBottom: '0.75rem', cursor: 'pointer' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: '#aaa',
                marginTop: '-0.55rem',
                marginBottom: '0.75rem',
              }}
            >
              <span>Pequeño</span>
              <span>Mediano</span>
              <span>Grande</span>
            </div>

            <label style={S.label}>Espacio vertical — {state.logoPaddingV}px</label>
            <input
              type="range"
              min={8}
              max={60}
              step={2}
              value={state.logoPaddingV}
              onChange={(e) => state.setLogoPaddingV(Number(e.target.value))}
              style={{ width: '100%', accentColor: P.verde, cursor: 'pointer' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: '#aaa',
                marginTop: '-0.1rem',
                marginBottom: '0.5rem',
              }}
            >
              <span>Compacto</span>
              <span>Amplio</span>
            </div>

            <button
              onClick={state.resetLogoConfig}
              style={{
                fontSize: '0.72rem',
                color: P.dorado,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Restaurar valores por defecto
            </button>
          </div>

          {/* EXPORTAR */}
          <div>
            <div style={S.secTit}>⬇️ Exportar</div>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <button style={S.btnV} onClick={() => exportar('png')} disabled={exportando}>
                {exportando ? '...' : 'PNG'} <span style={{ fontSize: '0.71rem', opacity: 0.7 }}>lossless</span>
              </button>
              <button style={S.btnN} onClick={() => exportar('jpg')} disabled={exportando}>
                {exportando ? '...' : 'JPG'} <span style={{ fontSize: '0.71rem', opacity: 0.7 }}>97%</span>
              </button>
            </div>
            <p style={S.hint}>
              Resolución completa: {F.w}×{F.h}px.
              <br />
              Descargala en alta resolución o publicala con el panel de automatización.
            </p>
          </div>
        </div>

        {/* ── PREVIEW & AUTOMATIZACIÓN ─────────────────────────────────── */}
        <div style={S.preview}>
          {/* Barra superior: info resolución + toggle vista */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: 520,
            }}
          >
            <div style={{ color: '#555', fontSize: '0.75rem' }}>
              {F.w}×{F.h}px · {F.label}
            </div>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {['celular', 'canvas'].map((v) => (
                <button
                  key={v}
                  onClick={() => state.setVistaPreview(v)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: 5,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: state.vistaPreview === v ? P.dorado : '#2a2a2a',
                    color: state.vistaPreview === v ? '#1a1a1a' : '#666',
                    transition: 'all 0.15s',
                  }}
                >
                  {v === 'celular' ? '📱 Celular' : '🖼 Imagen'}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas SIEMPRE en el DOM — visible solo en vista imagen */}
          <div
            style={{
              display: state.vistaPreview === 'canvas' ? 'flex' : 'none',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
            }}
          >
            <div
              style={{
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
                width: preW,
                height: preH,
                flexShrink: 0,
              }}
            >
              <canvas ref={canvasRef} style={{ width: preW, height: preH, display: 'block' }} />
            </div>
            <div
              style={{
                backgroundColor: '#1e1e1e',
                borderRadius: 8,
                padding: '0.85rem 1rem',
                maxWidth: preW,
                width: '100%',
                fontSize: '0.74rem',
                color: '#666',
                lineHeight: 1.65,
              }}
            >
              <span style={{ color: P.dorado, fontWeight: 700 }}>Resolución completa</span> — exportá PNG/JPG o
              usá la automatización con IA.
            </div>
          </div>

          {/* ── VISTA SIMULADOR CELULAR ── */}
          {state.vistaPreview === 'celular' && (
            <SimuladorCelular
              dataUrl={dataUrl}
              formato={state.formato}
              productoActual={productoActual}
              P={P}
            />
          )}

          {/* Nota zonas seguras */}
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 7,
              padding: '0.75rem 1rem',
              maxWidth: 520,
              width: '100%',
              fontSize: '0.72rem',
              color: '#555',
              lineHeight: 1.65,
            }}
          >
            <div style={{ color: P.dorado, fontWeight: 700, marginBottom: '0.25rem' }}>
              Zonas seguras Instagram
            </div>
            <div>↑ Header reservado para UI · ↓ Footer con hashtags opcionales</div>
            {state.formato === 'stories' && (
              <div style={{ marginTop: '0.3rem', color: '#555' }}>
                📌 Sticker de link: se mueve libremente en la app de Instagram.
              </div>
            )}
          </div>

          {/* ── SECCIÓN DE AUTOMATIZACIÓN E HISTORIAL DE PUBLICACIONES ── */}
          <section
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <AutomationPanel
              selectedProduct={state.selectedProduct}
              canvasRef={canvasRef}
              onPostPublished={() => setRefreshHistory((prev) => prev + 1)}
            />
            <ScheduledPosts refreshTrigger={refreshHistory} />
          </section>
        </div>
      </div>
    </div>
  )
}
