/**
 * 📁 UBICACIÓN: src/app/admin/marketing/page.js
 * 📅 ACTUALIZADO: 2026-08-20 (OPTIMIZACIÓN RESPONSIVE MOBILE & TABLET)
 * 📌 Generador de imágenes publicitarias y automatización para Instagram.
 *    - Diseño adaptable: controles arriba y previsualización abajo en celular/tablet
 *    - Grid responsivo de formatos (2 columnas en móviles)
 *    - Inputs con font-size de 16px para evitar auto-zoom en iOS
 *    - Sliders y botones táctiles optimizados (>44-48px)
 *    - Canvas HTML5 client-side, generación de copy con Gemini AI y publicación a Instagram.
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
import { useMobile } from '../../../hooks/useMobile'

// Components
import AutomationPanel from './components/AutomationPanel'
import ScheduledPosts from './components/ScheduledPosts'
import DecisionPanel from './components/DecisionPanel'
import RulesManager from './components/RulesManager'
import EventCalendar from './components/EventCalendar'
import AnalyticsView from './components/AnalyticsView'
import styles from './styles/marketing.module.css'

// ─── SIMULADOR DE CELULAR RESPONSIVO ──────────────────────────────────────────
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
        <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>Generando…</span>
      </div>
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
      <div
        style={{
          position: 'relative',
          width: dispW + 44,
          maxWidth: '92vw',
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
            right: 10,
            bottom: 10,
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
            <span style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
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
                <ImgPost style={{ width: '100%', height: '100%' }} />
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
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#fff',
                        border: '1.5px solid #fff',
                      }}
                    >
                      PF
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.2 }}>
                        panfree.fit
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.58rem' }}>Hace 2 min</div>
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
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem' }}>Enviar mensaje</span>
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
                    <span style={{ fontSize: '0.95rem' }}>♡</span>
                    <span style={{ fontSize: '0.95rem' }}>✈</span>
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
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: '#eee6d9',
                        }}
                      >
                        PF
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 700 }}>panfree.fit</div>
                      <div style={{ color: '#888', fontSize: '0.55rem' }}>Encarnación, Paraguay</div>
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
                    <span style={{ fontSize: '0.95rem', color: '#fff' }}>💬</span>
                    <span style={{ fontSize: '0.95rem', color: '#fff' }}>↗</span>
                  </div>
                  <span style={{ fontSize: '0.95rem', color: '#fff' }}>🔖</span>
                </div>
                <div style={{ padding: '0 10px 3px' }}>
                  <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
                    A 247 personas les gusta esto
                  </span>
                </div>
                <div style={{ padding: '0 10px 4px' }}>
                  <span style={{ color: '#fff', fontSize: '0.65rem' }}>
                    <strong>panfree.fit</strong>{' '}
                    {nombre.length > 22 ? nombre.slice(0, 22) + '…' : nombre} 🍞 Sin gluten · Sin TACC
                  </span>
                </div>
                <div style={{ padding: '0 10px 8px' }}>
                  <span style={{ color: '#555', fontSize: '0.58rem' }}>HACE 2 HORAS</span>
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

      <div style={{ color: '#888', fontSize: '0.75rem', textAlign: 'center', fontWeight: 500 }}>
        Vista previa simulada · {esStories ? 'Stories / Reels (9:16)' : 'Feed Instagram'}
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL REFACTORIZADO ───────────────────────────────────────
export default function MarketingPage() {
  const router = useRouter()
  const [refreshHistory, setRefreshHistory] = useState(0)
  const [tabActiva, setTabActiva] = useState('decisiones')
  const { isMobile } = useMobile(768)

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
  
  // Escalar proporcionalmente según pantalla móvil o desktop
  const maxCanvasW = isMobile ? 320 : 440
  const scale = Math.min(1, maxCanvasW / F.w)
  const preW = Math.round(F.w * scale)
  const preH = Math.round(F.h * scale)

  if (loadingProd) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: P.verde, padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🍞</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Cargando módulo de marketing…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => router.push('/admin')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${P.dorado}80`,
              color: P.crema,
              padding: '0.5rem 0.9rem',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.88rem',
              fontWeight: 600,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            ← Volver a Admin
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#eee6d9' }}>
              📸 Marketing & Redes Sociales
            </div>
            <div style={{ fontSize: '0.78rem', color: P.dorado }}>
              Generador Visual & Automatización IA
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/admin/ayuda/marketing')}
          style={{
            background: 'none',
            border: `1px solid ${P.dorado}80`,
            color: P.doradoClaro,
            padding: '0.5rem 0.9rem',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.85rem',
            fontWeight: 600,
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          ❓ Guía de uso
        </button>
      </div>

      {/* BARRA DE PESTAÑAS RESPONSIVA CON SCROLL SUAVE */}
      <div className={styles.tabNav} id="marketing-tab-bar">
        <button
          onClick={() => setTabActiva('decisiones')}
          className={`${styles.tabButton} ${tabActiva === 'decisiones' ? styles.tabButtonActive : ''}`}
        >
          🤖 Decisiones IA
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
      <div
        className={styles.mainLayout}
        style={{ display: tabActiva === 'canvas' ? (isMobile ? 'flex' : 'grid') : 'none' }}
      >
        {/* ── PANEL DE CONTROL (ARRIBA EN MÓVIL) ─────────────────────────────────── */}
        <div className={styles.controlPanel}>
          {/* FORMATO */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>📐 Formato de Publicación</div>
            <div className={styles.formatGrid}>
              {Object.entries(FORMATOS).map(([k, f]) => {
                const esSeleccionado = state.formato === k
                return (
                  <label
                    key={k}
                    className={`${styles.formatOption} ${esSeleccionado ? styles.formatOptionActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="fmt"
                      checked={esSeleccionado}
                      onChange={() => state.setFormato(k)}
                      style={{ accentColor: P.naranja, marginTop: 3, width: 18, height: 18 }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: '#334c2b' }}>
                        {f.tag} {f.label}
                      </strong>
                      <div style={{ fontSize: '0.76rem', color: '#666', marginTop: 2 }}>
                        {f.w}×{f.h}px · {f.desc}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* PLANTILLA */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>🎨 Plantilla Visual</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(PLANTILLAS).map(([k, p]) => {
                const esSeleccionada = state.plantilla === k
                return (
                  <label
                    key={k}
                    className={`${styles.formatOption} ${esSeleccionada ? styles.formatOptionActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="plt"
                      checked={esSeleccionada}
                      onChange={() => state.setPlantilla(k)}
                      style={{ accentColor: P.naranja, marginTop: 3, width: 18, height: 18 }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: '#334c2b' }}>{p.label}</strong>
                      <div style={{ fontSize: '0.76rem', color: '#666', marginTop: 2 }}>{p.desc}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* ESQUEMA DE COLOR */}
          <div className={styles.section}>
            <label className={styles.label}>🎭 Esquema de color</label>
            <select
              className={styles.select}
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
          <div className={styles.section}>
            <label className={styles.label}>🍞 Producto Destacado</label>
            <select
              className={styles.select}
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
              <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className={`${styles.badge} ${styles.badgeGreen}`}>
                  {productoActual.categoria}
                </span>
                <span
                  className={`${styles.badge} ${
                    productoActual.imagen_url && imgProdLista ? styles.badgeGreen : styles.badgeOrange
                  }`}
                >
                  {productoActual.imagen_url
                    ? imgProdLista
                      ? '✓ Imagen cargada'
                      : '⏳ Cargando imagen...'
                    : 'Sin imagen'}
                </span>
              </div>
            )}
          </div>

          {/* TEXTOS */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>✏️ Textos de la Publicación</div>

            {state.plantilla === 'promo' && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label className={styles.label}>Etiqueta de oferta</label>
                <input
                  className={styles.input}
                  value={state.textoPromo}
                  onChange={(e) => state.setTextoPromo(e.target.value)}
                />
              </div>
            )}

            <label className={styles.label}>Texto principal</label>
            <textarea
              className={styles.textarea}
              style={{ minHeight: state.plantilla === 'catalogo' ? 100 : 75 }}
              value={state.textoPrincipal}
              onChange={(e) => state.setTextoPrincipal(e.target.value)}
              placeholder="Escribí el texto aquí..."
            />
            <p style={{ fontSize: '0.78rem', color: '#777', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Enter = nueva línea. Cada línea se renderiza con jerarquía visual calculada.
            </p>

            {state.plantilla === 'hero' && (
              <div style={{ marginTop: '0.85rem' }}>
                <label className={styles.label}>Subtítulo</label>
                <input
                  className={styles.input}
                  value={state.subtitulo}
                  onChange={(e) => state.setSubtitulo(e.target.value)}
                  placeholder="Artesanal · Sin Gluten · Sin TACC"
                />
              </div>
            )}

            <div style={{ marginTop: '0.85rem' }}>
              <label className={styles.label}>Texto del botón CTA</label>
              <input
                className={styles.input}
                value={state.textoCTA}
                onChange={(e) => state.setTextoCTA(e.target.value)}
              />
            </div>
          </div>

          {/* OPCIONES VISUALES */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>⚙️ Elementos Visibles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                [state.mostrarPrecio, state.setMostrarPrecio, 'Precio del producto'],
                [state.mostrarSlogan, state.setMostrarSlogan, 'Slogan de PanFree'],
                [state.mostrarDelivery, state.setMostrarDelivery, 'Información de delivery'],
              ].map(([val, set, lbl]) => (
                <label
                  key={lbl}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    fontSize: '0.92rem',
                    color: '#334c2b',
                    cursor: 'pointer',
                    minHeight: 38,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) => set(e.target.checked)}
                    style={{ accentColor: P.naranja, width: 20, height: 20 }}
                  />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          {/* HASHTAGS */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}># Hashtags</div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.92rem',
                color: '#334c2b',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                minHeight: 38,
              }}
            >
              <input
                type="checkbox"
                checked={state.mostrarHashtags}
                onChange={(e) => state.setMostrarHashtags(e.target.checked)}
                style={{ accentColor: P.naranja, width: 20, height: 20 }}
              />
              Incluir hashtags en la imagen
            </label>
            {state.mostrarHashtags && (
              <>
                <textarea
                  className={styles.textarea}
                  style={{ minHeight: 80, marginTop: '0.5rem' }}
                  value={state.hashtags}
                  onChange={(e) => state.setHashtags(e.target.value)}
                />
                <p style={{ fontSize: '0.78rem', color: '#777', marginTop: '0.35rem' }}>
                  Separados por espacios. Máx. recomendado: 6–8 en imagen.
                </p>
              </>
            )}
          </div>

          {/* AJUSTES DE LOGO */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>🖼️ Control de Logo</div>

            <label className={styles.label}>Tamaño del Logo: {state.logoAltura}px</label>
            <input
              type="range"
              min={60}
              max={280}
              step={4}
              value={state.logoAltura}
              onChange={(e) => state.setLogoAltura(Number(e.target.value))}
              className={styles.rangeInput}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#888',
                marginBottom: '0.85rem',
              }}
            >
              <span>Pequeño</span>
              <span>Mediano</span>
              <span>Grande</span>
            </div>

            <label className={styles.label}>Espacio Vertical: {state.logoPaddingV}px</label>
            <input
              type="range"
              min={8}
              max={60}
              step={2}
              value={state.logoPaddingV}
              onChange={(e) => state.setLogoPaddingV(Number(e.target.value))}
              className={styles.rangeInput}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#888',
                marginBottom: '0.75rem',
              }}
            >
              <span>Compacto</span>
              <span>Amplio</span>
            </div>

            <button
              onClick={state.resetLogoConfig}
              style={{
                fontSize: '0.82rem',
                color: P.dorado,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '0.4rem 0',
                textDecoration: 'underline',
                fontWeight: 600,
                minHeight: 36,
              }}
            >
              Restaurar valores por defecto
            </button>
          </div>

          {/* EXPORTAR */}
          <div>
            <div className={styles.sectionTitle}>⬇️ Descargar Imagen</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <button className={styles.btnPrimary} onClick={() => exportar('png')} disabled={exportando}>
                {exportando ? '...' : 'PNG Alta Calidad'}
              </button>
              <button className={styles.btnAccent} onClick={() => exportar('jpg')} disabled={exportando}>
                {exportando ? '...' : 'JPG Comprimido'}
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#777', margin: 0, lineHeight: 1.4 }}>
              Resolución completa: {F.w}×{F.h}px. Descargala o programala directamente a Instagram con IA.
            </p>
          </div>
        </div>

        {/* ── PREVIEW & AUTOMATIZACIÓN (ABAJO EN MÓVIL) ─────────────────────────────────── */}
        <div className={styles.previewArea}>
          {/* Barra superior de previsualización */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: 520,
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ color: '#999', fontSize: '0.85rem', fontWeight: 600 }}>
              {F.w}×{F.h}px · {F.label}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['celular', 'canvas'].map((v) => (
                <button
                  key={v}
                  onClick={() => state.setVistaPreview(v)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: state.vistaPreview === v ? P.dorado : '#2a2a2a',
                    color: state.vistaPreview === v ? '#1a1a1a' : '#888',
                    transition: 'all 0.15s',
                    minHeight: 40,
                  }}
                >
                  {v === 'celular' ? '📱 Simulador Móvil' : '🖼 Canvas Real'}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas SIEMPRE en el DOM — visible en vista imagen */}
          <div
            style={{
              display: state.vistaPreview === 'canvas' ? 'flex' : 'none',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
              maxWidth: '100%',
              overflowX: 'auto',
            }}
          >
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
                width: preW,
                height: preH,
                flexShrink: 0,
                backgroundColor: '#1a1a1a',
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
                fontSize: '0.82rem',
                color: '#aaa',
                lineHeight: 1.5,
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ color: P.dorado, fontWeight: 700 }}>Resolución original: {F.w}×{F.h}px</span>
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
              borderRadius: 10,
              padding: '0.85rem 1rem',
              maxWidth: 520,
              width: '100%',
              fontSize: '0.82rem',
              color: '#aaa',
              lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ color: P.dorado, fontWeight: 700, marginBottom: '0.3rem' }}>
              ℹ️ Guía de Zonas Seguras de Instagram
            </div>
            <div>Encabezado y pie de imagen están optimizados para no ser tapados por la interfaz de Instagram.</div>
          </div>

          {/* ── SECCIÓN DE AUTOMATIZACIÓN E HISTORIAL DE PUBLICACIONES ── */}
          <section
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
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
