/**
 * 📁 UBICACIÓN: src/app/admin/marketing/components/DecisionPanel.jsx
 * 📌 COMPONENTE: Panel de Decisiones de Marketing Inteligente
 * 📖 DESCRIPCIÓN: Analiza el catálogo de productos, el calendario de eventos y las reglas de negocio
 *    para sugerir la promoción óptima y generar creatividades y publicaciones con un clic.
 */

'use client'

import { useState, useEffect } from 'react'
import styles from '../styles/marketing.module.css'

export default function DecisionPanel({
  productos = [],
  onApplyToCanvas,
  onPostPublished,
  onNavigateToTab
}) {
  const [cargandoDecision, setCargandoDecision] = useState(false)
  const [generandoContenido, setGenerandoContenido] = useState(false)
  const [procesandoPublicacion, setProcesandoPublicacion] = useState(false)
  
  const [decision, setDecision] = useState(null)
  const [alternativas, setAlternativas] = useState([])
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('')
  const [descuentoManual, setDescuentoManual] = useState(10)
  const [tono, setTono] = useState('persuasivo')
  const [contenidoGenerado, setContenidoGenerado] = useState(null)
  const [notificacion, setNotificacion] = useState(null)
  const [fechaProgramada, setFechaProgramada] = useState('')

  // Cargar decisión inteligente desde la API
  const obtenerDecisionInteligente = async (prodId = '') => {
    try {
      setCargandoDecision(true)
      setNotificacion(null)
      const url = prodId
        ? `/api/admin/marketing/decidir-promocion?producto_id=${prodId}`
        : `/api/admin/marketing/decidir-promocion`

      const res = await fetch(url)
      const json = await res.json()

      if (json.success && json.decision) {
        setDecision(json.decision)
        setAlternativas(json.alternativas || [])
        setProductoSeleccionadoId(json.decision.producto?.id || '')
        setDescuentoManual(json.decision.descuento_sugerido || 10)
      } else {
        throw new Error(json.error || 'No se pudo obtener la decisión')
      }
    } catch (err) {
      console.error('Error al cargar decisión:', err)
      setNotificacion({
        tipo: 'error',
        texto: err.message || 'Error al conectar con el motor de decisiones',
      })
    } finally {
      setCargandoDecision(false)
    }
  }

  useEffect(() => {
    obtenerDecisionInteligente()
  }, [])

  // Generar contenido creativo con Gemini
  const handleGenerarContenido = async () => {
    if (!decision?.producto) return

    try {
      setGenerandoContenido(true)
      setNotificacion(null)

      const payload = {
        producto_id: decision.producto.id,
        descuento: descuentoManual,
        evento: decision.evento?.nombre || '',
        regla_id: decision.regla?.id || '',
        tono: tono,
      }

      const res = await fetch('/api/admin/marketing/generar-contenido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (json.success && json.content) {
        setContenidoGenerado(json.content)
        setNotificacion({
          tipo: 'exito',
          texto: '✨ ¡Contenido generado exitosamente con Gemini AI!',
        })
      } else {
        throw new Error(json.error || 'Fallo la generación de contenido')
      }
    } catch (err) {
      setNotificacion({
        tipo: 'error',
        texto: err.message || 'Error al generar contenido creativo',
      })
    } finally {
      setGenerandoContenido(false)
    }
  }

  // Cargar en el Diseñador Canvas Visual
  const handleCargarEnCanvas = () => {
    if (!decision?.producto) return

    if (onApplyToCanvas) {
      const config = contenidoGenerado?.canvas_config || {
        plantilla: 'promo',
        textoPrincipal: `${decision.producto.nombre}\n${descuentoManual}% OFF`,
        subtitulo: `${decision.evento?.nombre ? decision.evento.nombre + ' · ' : ''}100% Sin Gluten · Encarnación`,
        textoPromo: `★ ${descuentoManual}% OFF · G/ ${(Math.round(decision.precio_original * (1 - descuentoManual / 100))).toLocaleString('es-PY')} ★`,
        textoCTA: 'Pedi en panfree.fit',
        esquema: 'naranja',
      }

      onApplyToCanvas({
        productoId: decision.producto.id,
        ...config,
      })

      setNotificacion({
        tipo: 'exito',
        texto: '🎨 ¡Configuración aplicada al Diseñador Visual! Cambiando de pestaña...',
      })

      if (onNavigateToTab) {
        setTimeout(() => onNavigateToTab('canvas'), 500)
      }
    }
  }

  // Aprobar y Publicar o Programar
  const handleAprobarYPublicar = async (publicarAhora = true) => {
    if (!decision?.producto) return

    try {
      setProcesandoPublicacion(true)
      setNotificacion(null)

      const precioFinalCalculado = Math.round(
        Number(decision.precio_original || decision.producto.precio_venta || 25000) *
          (1 - descuentoManual / 100)
      )

      const captionToSend =
        contenidoGenerado?.fullPost ||
        contenidoGenerado?.caption ||
        `✨ ¡Aprovechá un ${descuentoManual}% OFF en nuestro ${decision.producto.nombre}! 🍞❤️\n\n100% Sin Gluten en Encarnación.\n👉 Pedí en panfree.fit`

      const payload = {
        producto_id: decision.producto.id,
        regla_id: decision.regla?.id || null,
        descuento: descuentoManual,
        precio_final: precioFinalCalculado,
        caption: captionToSend,
        publicar_ahora: publicarAhora,
        fecha_programada: fechaProgramada || null,
        captions_generados: contenidoGenerado || {},
        imagen_url: decision.producto.imagen_url || null,
      }

      const res = await fetch('/api/admin/marketing/programar-publicacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (json.success) {
        setNotificacion({
          tipo: 'exito',
          texto: json.mensaje || '¡Acción ejecutada correctamente!',
        })
        if (onPostPublished) {
          onPostPublished()
        }
      } else {
        throw new Error(json.error || 'Error al procesar la publicación')
      }
    } catch (err) {
      setNotificacion({
        tipo: 'error',
        texto: err.message || 'Error al publicar/programar',
      })
    } finally {
      setProcesandoPublicacion(false)
    }
  }

  const precioOriginal = Number(decision?.precio_original || decision?.producto?.precio_venta || 0)
  const precioFinalCalculado = Math.round(precioOriginal * (1 - descuentoManual / 100))

  return (
    <div className={styles.moduleContainer} id="decision-panel-root">
      {/* Header del módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334c2b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🤖 Decisiones Inteligentes de Marketing</span>
            <span className={styles.badgeAi}>GEMINI AI ENGINE</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#666' }}>
            El motor evalúa automáticamente el calendario gastronómico, demanda y reglas de margen para sugerir la mejor promoción.
          </p>
        </div>

        <button
          onClick={() => obtenerDecisionInteligente(productoSeleccionadoId)}
          disabled={cargandoDecision}
          className={styles.tabButton}
          style={{ backgroundColor: '#334c2b', color: '#eee6d9', border: '1px solid #b7996b' }}
        >
          {cargandoDecision ? '⏳ Evaluando...' : '🔄 Re-evaluar Decisiones'}
        </button>
      </div>

      {/* Notificación Feedback */}
      {notificacion && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 8,
            fontSize: '0.82rem',
            backgroundColor: notificacion.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
            color: notificacion.tipo === 'exito' ? '#166534' : '#991b1b',
            border: `1px solid ${notificacion.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {notificacion.texto}
        </div>
      )}

      {/* Grid Principal: Decisión Sugerida + Preview Contenido */}
      <div className={styles.grid2}>
        {/* Tarjeta Izquierda: Diagnóstico y Decisión */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span className={`${styles.badge} ${styles.badgeGold}`} style={{ marginBottom: '0.4rem' }}>
                ⭐ RECOMENDACIÓN PRINCIPAL
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#334c2b', margin: '0.2rem 0' }}>
                {decision?.producto?.nombre || 'Analizando catálogo...'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#887a66' }}>
                Categoría: <strong>{decision?.producto?.categoria || 'General'}</strong>
              </span>
            </div>

            {decision?.evento && (
              <span className={`${styles.badge} ${styles.badgeOrange}`}>
                🎉 {decision.evento.nombre}
              </span>
            )}
          </div>

          {/* Motivo de la IA */}
          <div
            style={{
              backgroundColor: '#faf7f2',
              borderLeft: '3px solid #b7996b',
              padding: '0.75rem 1rem',
              borderRadius: '0 8px 8px 0',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              color: '#444',
              lineHeight: 1.5,
            }}
          >
            <strong>Justificación del Algoritmo:</strong>
            <br />
            {decision?.motivo || 'Evaluando parámetros óptimos...'}
          </div>

          {/* Selector de Producto Manual */}
          <div style={{ marginBottom: '1rem' }}>
            <label className={styles.label}>Probar con otro producto:</label>
            <select
              className={styles.select}
              value={productoSeleccionadoId}
              onChange={(e) => {
                setProductoSeleccionadoId(e.target.value)
                obtenerDecisionInteligente(e.target.value)
              }}
            >
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — G/ {Number(p.precio_venta || 0).toLocaleString('es-PY')}
                </option>
              ))}
            </select>
          </div>

          {/* Regla Aplicada */}
          <div style={{ marginBottom: '1.25rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Regla de Negocio Aplicada
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginTop: '0.2rem' }}>
              {decision?.regla?.nombre || 'Regla Dinámica de Rentabilidad'}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.2rem' }}>
              Tipo de costo: <strong>{decision?.regla?.tipo_costo || 'competitivo'}</strong> · Rango sugerido: {decision?.regla?.descuento_min || 5}% a {decision?.regla?.descuento_max || 20}%
            </div>
          </div>

          {/* Calculadora de Descuento y Precios */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label className={styles.label}>Descuento Aplicable:</label>
              <strong style={{ color: '#FF6B35', fontSize: '0.95rem' }}>{descuentoManual}% OFF</strong>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={descuentoManual}
              onChange={(e) => setDescuentoManual(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#FF6B35', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#999' }}>
              <span>0% (Sin Descuento)</span>
              <span>15% (Recomendado)</span>
              <span>40% (Liquidación)</span>
            </div>
          </div>

          {/* Precios Comparativos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 8, backgroundColor: '#f5f5f5', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Precio Base</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#666', textDecoration: 'line-through' }}>
                G/ {precioOriginal.toLocaleString('es-PY')}
              </div>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: 8, backgroundColor: '#ecfdf5', textAlign: 'center', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.7rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>Precio Promoción</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#065f46' }}>
                G/ {precioFinalCalculado.toLocaleString('es-PY')}
              </div>
            </div>
          </div>

          {/* Selector de Tono */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className={styles.label}>Tono del Copywriting:</label>
            <select
              className={styles.select}
              value={tono}
              onChange={(e) => setTono(e.target.value)}
            >
              <option value="persuasivo">🎯 Persuasivo / Conversión Comercial</option>
              <option value="artesanal">🥖 Artesanal / Tradicional de Encarnación</option>
              <option value="urgencia">⚡ Urgencia / Oferta por Tiempo Limitado</option>
              <option value="educativo">🌾 Educativo / Comunidad Celíaca y Saludable</option>
            </select>
          </div>

          {/* Botón Principal Generar */}
          <button
            onClick={handleGenerarContenido}
            disabled={generandoContenido || !decision?.producto}
            className={styles.actionBtnPrimary}
            style={{ width: '100%' }}
          >
            {generandoContenido ? '⏳ Generando contenido con IA...' : '✨ Generar Creatividad y Copy con IA'}
          </button>
        </div>

        {/* Tarjeta Derecha: Previsualización de Contenido Multimodal */}
        <div className={styles.cardDark}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#b7996b', margin: 0 }}>
              📱 Vista Previa del Contenido Generado
            </h3>
            {contenidoGenerado && (
              <span className={styles.badgeGreen} style={{ fontSize: '0.65rem' }}>
                LISTO PARA PUBLICAR
              </span>
            )}
          </div>

          {!contenidoGenerado ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#777' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💡</div>
              <p style={{ fontSize: '0.88rem', margin: 0 }}>
                Hacé clic en <strong>"Generar Creatividad y Copy con IA"</strong> para redactar el post optimizado y el diseño visual sugerido.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Prompt de Imagen Sugerido */}
              <div style={{ backgroundColor: '#262626', padding: '0.75rem', borderRadius: 8, border: '1px solid #3a3a3a' }}>
                <div style={{ fontSize: '0.7rem', color: '#b7996b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  🎨 Prompt para Composición Visual / Fotografía
                </div>
                <div style={{ fontSize: '0.76rem', color: '#ccc', fontStyle: 'italic', lineHeight: 1.45 }}>
                  "{contenidoGenerado.image_prompt}"
                </div>
              </div>

              {/* Hook */}
              <div style={{ backgroundColor: '#262626', padding: '0.75rem', borderRadius: 8, border: '1px solid #3a3a3a' }}>
                <div style={{ fontSize: '0.7rem', color: '#FF6B35', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  ⚡ Gancho / Hook Inicial
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  {contenidoGenerado.hook}
                </div>
              </div>

              {/* Caption completo */}
              <div>
                <label style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  Cuerpo del Post (Instagram Caption):
                </label>
                <div className={styles.captionBox} style={{ minHeight: '140px' }}>
                  {contenidoGenerado.caption}
                  {'\n\n'}
                  {contenidoGenerado.callToAction}
                  {'\n\n'}
                  {contenidoGenerado.hashtags}
                </div>
              </div>

              {/* Acciones de Publicación y Carga en Diseñador */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  onClick={handleCargarEnCanvas}
                  className={styles.tabButton}
                  style={{ backgroundColor: '#2a2a2a', color: '#eee6d9', border: '1px solid #555', justifyContent: 'center' }}
                >
                  🎨 Cargar en Diseñador
                </button>

                <button
                  onClick={() => handleAprobarYPublicar(true)}
                  disabled={procesandoPublicacion}
                  className={styles.actionBtnSecondary}
                >
                  {procesandoPublicacion ? '🚀 Publicando...' : '📲 Aprobar y Publicar'}
                </button>
              </div>

              {/* Programación futura */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #2d2d2d' }}>
                <input
                  type="datetime-local"
                  value={fechaProgramada}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ddd',
                    border: '1px solid #444',
                    borderRadius: 6,
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.75rem',
                    flex: 1,
                  }}
                />
                <button
                  onClick={() => handleAprobarYPublicar(false)}
                  disabled={procesandoPublicacion || !fechaProgramada}
                  className={styles.tabButton}
                  style={{ backgroundColor: '#334c2b', color: '#fff', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                >
                  📅 Programar Fecha
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sugerencias Alternativas de Rotación */}
      {alternativas.length > 0 && (
        <div className={styles.card} style={{ marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#334c2b', margin: '0 0 0.85rem 0' }}>
            🔄 Otras Oportunidades de Promoción Detectadas
          </h4>
          <div className={styles.grid3}>
            {alternativas.map((alt) => (
              <div
                key={alt.producto.id}
                onClick={() => {
                  setProductoSeleccionadoId(alt.producto.id)
                  obtenerDecisionInteligente(alt.producto.id)
                }}
                style={{
                  backgroundColor: '#faf7f2',
                  border: '1px solid #e2d9cc',
                  borderRadius: 8,
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#2D2D2D' }}>
                  {alt.producto.nombre}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                  <span style={{ color: '#887a66' }}>{alt.producto.categoria || 'Panadería'}</span>
                  <span style={{ color: '#FF6B35', fontWeight: 700 }}>{alt.descuento_sugerido}% OFF</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
