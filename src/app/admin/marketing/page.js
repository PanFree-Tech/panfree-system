/**
 * 📁 UBICACIÓN: src/app/admin/marketing/page.js
 * 📅 ACTUALIZADO: 2026-08-22
 * 📌 DESCRIPCIÓN: Panel de Marketing y Automatización IA para PanFree.
 *    - Estructura unificada: Decisiones IA → Generar Contenido con Gemini → Generar Imagen Cloudinary AI → Aprobar y Publicar.
 *    - Spinners de carga interactivos para Gemini, Cloudinary y Publicación en Instagram.
 *    - Botones deshabilitados reactivamente durante cualquier proceso en curso.
 *    - Notificaciones claras de éxito (✅) y error (❌).
 *    - Integración con reglas de negocio, calendario de eventos y programación para Instagram.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Hooks
import { useSupabaseProducts } from './hooks/useSupabaseProducts'

// Components
import ScheduledPosts from './components/ScheduledPosts'
import RulesManager from './components/RulesManager'
import EventCalendar from './components/EventCalendar'
import AnalyticsView from './components/AnalyticsView'
import styles from './styles/marketing.module.css'

// Paleta PanFree
const P = {
  verde: '#334c2b',
  dorado: '#b7996b',
  doradoClaro: '#eddcc7',
  crema: '#f5f1eb',
  oscuro: '#2d2a26',
  naranja: '#c87d32',
  verdeClaro: '#eef6ed',
}

// Catálogo de motores de IA para generación de imágenes
const MOTORES_INFO = {
  gemini: {
    id: 'gemini',
    nombre: 'Google Gemini',
    badge: 'RECOMENDADO',
    plan: 'Créditos prepago (~$0.045/img)',
    descripcion: 'Motor principal de Google. Excelente calidad fotográfica y comprensión semántica de briefs.',
    gratuito: false,
    modelos: [
      { id: 'gemini-3.1-flash-image', nombre: 'Gemini 3.1 Flash Image (Recomendado)' },
      { id: 'gemini-3-pro-image', nombre: 'Gemini 3 Pro Image (Máxima Fidelidad)' },
    ],
  },
  pollinations: {
    id: 'pollinations',
    nombre: 'Pollinations.ai',
    badge: '100% GRATIS',
    plan: 'Gratuito e Ilimitado (Sin API Key requerida)',
    descripcion: 'Acceso libre sin registro ni clave. Ideal para pruebas rápidas y volumen ilimitado.',
    gratuito: true,
    modelos: [
      { id: 'flux', nombre: 'Flux (Ultra Realista)' },
      { id: 'turbo', nombre: 'SDXL Turbo (Rápido)' },
    ],
  },
  leonardo: {
    id: 'leonardo',
    nombre: 'Leonardo AI',
    badge: 'PRODUCT PHOTO',
    plan: '150 tokens/día (~15-30 imágenes gratis)',
    descripcion: 'Especializado en fotografía gastronómica, iluminación de estudio y texturas artesanales.',
    gratuito: false,
    modelos: [
      { id: 'aa77f04e-3eec-4034-9c07-d0f6196846fb', nombre: 'Leonardo Kino XL (Product Photography)' },
      { id: 'b2614464-6028-4b72-8038-83223d2ff6c8', nombre: 'Leonardo Diffusion XL' },
    ],
  },
  agnes: {
    id: 'agnes',
    nombre: 'Agnes AI',
    badge: '100% GRATIS',
    plan: '100% Gratuito e Ilimitado',
    descripcion: 'Motor rápido sin límites de uso. Ideal para publicaciones continuas en Instagram.',
    gratuito: true,
    modelos: [
      { id: 'agnes-image-2.1-flash', nombre: 'Agnes Image 2.1 Flash' },
    ],
  },
  aihubmix: {
    id: 'aihubmix',
    nombre: 'AIHubMix',
    badge: 'E-COMMERCE',
    plan: '10 llamadas gratis / Pago por uso',
    descripcion: 'Optimizado para composiciones de e-commerce y fotografía publicitaria de productos.',
    gratuito: false,
    modelos: [
      { id: 'gpt-image-2-free', nombre: 'GPT Image 2 Free (E-commerce)' },
      { id: 'flux-pro', nombre: 'Flux Pro' },
    ],
  },
  nexa: {
    id: 'nexa',
    nombre: 'NexaAPI',
    badge: 'ULTRA BARATO',
    plan: '$0.003 por imagen',
    descripcion: 'Extremadamente económico para alto volumen con arquitectura Flux de última generación.',
    gratuito: false,
    modelos: [
      { id: 'flux-kontext', nombre: 'Flux Kontext' },
    ],
  },
  cloudflare: {
    id: 'cloudflare',
    nombre: 'Cloudflare Workers AI',
    badge: 'SERVERLESS EDGE',
    plan: '10,000 neuronas/día gratis',
    descripcion: 'Infraestructura global ultra rápida y escalable en el edge de Cloudflare.',
    gratuito: false,
    modelos: [
      { id: '@cf/stabilityai/stable-diffusion-xl-base-1.0', nombre: 'SDXL Base 1.0' },
      { id: '@cf/bytedance/stable-diffusion-xl-lightning', nombre: 'SDXL Lightning' },
    ],
  },
  huggingface: {
    id: 'huggingface',
    nombre: 'Hugging Face Inference',
    badge: 'OPEN SOURCE',
    plan: '$0.10/mes en créditos',
    descripcion: 'Acceso a los mejores modelos de la comunidad de código abierto (SDXL / FLUX).',
    gratuito: false,
    modelos: [
      { id: 'stabilityai/stable-diffusion-xl-base-1.0', nombre: 'Stable Diffusion XL Base 1.0' },
      { id: 'black-forest-labs/FLUX.1-schnell', nombre: 'FLUX.1 Schnell' },
    ],
  },
}

export default function MarketingPage() {
  const router = useRouter()
  const [tabActiva, setTabActiva] = useState('ia_marketing') // 'ia_marketing' | 'reglas' | 'eventos' | 'analisis'
  const [refreshHistory, setRefreshHistory] = useState(0)

  // 1. Cargar productos desde Supabase
  const { productos, loadingProd } = useSupabaseProducts()

  // 2. Estados del Motor de Decisiones y Generación IA
  const [cargandoDecision, setCargandoDecision] = useState(false)
  const [generandoContenido, setGenerandoContenido] = useState(false)
  const [generandoImagenCloudinary, setGenerandoImagenCloudinary] = useState(false)
  const [procesandoPublicacion, setProcesandoPublicacion] = useState(false)

  const [decision, setDecision] = useState(null)
  const [alternativas, setAlternativas] = useState([])
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('')
  const [descuentoManual, setDescuentoManual] = useState(10)
  const [tono, setTono] = useState('persuasivo')
  const [contenidoGenerado, setContenidoGenerado] = useState(null)
  const [promptText, setPromptText] = useState('')
  
  // Motores de IA de imagen
  const [motorSeleccionado, setMotorSeleccionado] = useState('gemini')
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-image')
  const [estadoMotores, setEstadoMotores] = useState({})
  const [modeloUtilizado, setModeloUtilizado] = useState('')
  const [motorUtilizadoNombre, setMotorUtilizadoNombre] = useState('')
  const [tiempoGeneracion, setTiempoGeneracion] = useState(null)
  const [imagenCloudinaryGenerada, setImagenCloudinaryGenerada] = useState(null)
  const [notificacion, setNotificacion] = useState(null)
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [urlCopiada, setUrlCopiada] = useState(false)
  const [captionCopiado, setCaptionCopiado] = useState(false)

  // Consultar disponibilidad y estado de los motores de IA
  useEffect(() => {
    async function cargarEstadoMotores() {
      try {
        const res = await fetch('/api/admin/marketing/generar-imagen-cloudinary')
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.motores)) {
            const mapEstado = {}
            json.motores.forEach((m) => {
              mapEstado[m.id] = m
            })
            setEstadoMotores(mapEstado)
          }
        }
      } catch (err) {
        console.warn('No se pudo obtener estado de los motores:', err?.message)
      }
    }
    cargarEstadoMotores()
  }, [])

  // Al cambiar de motor, ajustar el modelo por defecto del motor
  const handleCambioMotor = (nuevoMotor) => {
    setMotorSeleccionado(nuevoMotor)
    const motorInfo = MOTORES_INFO[nuevoMotor]
    if (motorInfo && motorInfo.modelos && motorInfo.modelos.length > 0) {
      setSelectedModel(motorInfo.modelos[0].id)
    }
  }

  // Variable de bloqueo global cuando hay algún proceso activo
  const algunProcesoActivo =
    cargandoDecision ||
    generandoContenido ||
    generandoImagenCloudinary ||
    procesandoPublicacion

  // Cargar decisión inteligente desde la API
  const obtenerDecisionInteligente = useCallback(async (prodId = '') => {
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
        throw new Error(json.error || 'No se pudo obtener la recomendación')
      }
    } catch (err) {
      console.error('Error al cargar decisión:', err)
      setNotificacion({
        tipo: 'error',
        texto: `❌ Error al conectar con el motor de decisiones: ${err.message || 'Fallo desconocido'}`,
      })
    } finally {
      setCargandoDecision(false)
    }
  }, [])

  useEffect(() => {
    if (productos && productos.length > 0) {
      obtenerDecisionInteligente()
    }
  }, [productos, obtenerDecisionInteligente])

  // 1. GENERAR CONTENIDO CON GEMINI AI
  const handleGenerarContenido = async () => {
    if (!decision?.producto || algunProcesoActivo) return

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
        if (json.content.image_prompt && !promptText) {
          setPromptText(json.content.image_prompt)
        }
        setNotificacion({
          tipo: 'exito',
          texto: '✅ ¡Contenido generado exitosamente con Gemini AI! Ahora puedes generar el arte publicitario con Cloudinary.',
        })
      } else {
        throw new Error(json.error || 'Fallo la generación de contenido')
      }
    } catch (err) {
      setNotificacion({
        tipo: 'error',
        texto: `❌ Error al generar contenido creativo con Gemini: ${err.message || 'Error en el servicio'}`,
      })
    } finally {
      setGenerandoContenido(false)
    }
  }

  // 2. GENERAR IMAGEN CON MOTOR DE IA SELECCIONADO Y CLOUDINARY
  const handleGenerarImagenCloudinary = async () => {
    if (!decision?.producto || algunProcesoActivo) return

    try {
      setGenerandoImagenCloudinary(true)
      setNotificacion(null)

      const briefFinal = promptText.trim() || contenidoGenerado?.image_prompt || ''

      const payload = {
        producto_id: decision.producto.id,
        descuento: descuentoManual,
        evento: decision.evento?.nombre || '',
        brief_creativo: briefFinal,
        motor: motorSeleccionado,
        modelo: selectedModel,
      }

      const res = await fetch('/api/admin/marketing/generar-imagen-cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (json.success && json.imagen_url) {
        setImagenCloudinaryGenerada(json.imagen_url)
        setModeloUtilizado(json.modelo_utilizado || selectedModel)
        setMotorUtilizadoNombre(json.motor_nombre || MOTORES_INFO[motorSeleccionado]?.nombre || motorSeleccionado)
        setTiempoGeneracion(json.tiempo_ms ? (json.tiempo_ms / 1000).toFixed(1) : null)
        
        let mensajeExito = json.mensaje || `✅ ¡Arte generado con éxito usando ${json.motor_nombre || motorSeleccionado}! Guardado en Cloudinary.`
        if (json.advertencia_acceso) {
          mensajeExito += ` ⚠️ Nota: ${json.advertencia_acceso}`
        }

        setNotificacion({
          tipo: json.advertencia_acceso ? 'alerta' : 'exito',
          texto: mensajeExito,
        })
      } else {
        const errorMsg = json.error || 'Error al generar imagen'
        const sugerencia = json.sugerencia ? ` (${json.sugerencia})` : ''
        throw new Error(`${errorMsg}${sugerencia}`)
      }
    } catch (err) {
      setNotificacion({
        tipo: 'error',
        texto: `❌ Error en el generador de imágenes: ${err.message || 'Error en el servicio'}. Puedes probar seleccionando otro motor como Pollinations.ai (100% gratuito sin clave) o Google Gemini.`,
      })
    } finally {
      setGenerandoImagenCloudinary(false)
    }
  }

  // 3. APROBAR Y PUBLICAR / PROGRAMAR
  const handleAprobarYPublicar = async (publicarAhora = true) => {
    if (!decision?.producto || algunProcesoActivo) return

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
        imagen_url: imagenCloudinaryGenerada || decision.producto.imagen_url || null,
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
          texto: `✅ ${json.mensaje || (publicarAhora ? '¡Publicación enviada a Instagram con éxito!' : '¡Publicación programada con éxito!')}`,
        })
        setRefreshHistory((prev) => prev + 1)
      } else {
        throw new Error(json.error || 'Error al procesar la publicación')
      }
    } catch (err) {
      setNotificacion({
        tipo: 'error',
        texto: `❌ Error al publicar en Instagram: ${err.message || 'Error en el servicio'}`,
      })
    } finally {
      setProcesandoPublicacion(false)
    }
  }

  // Copiar URL al portapapeles
  const copiarUrl = () => {
    if (imagenCloudinaryGenerada) {
      navigator.clipboard.writeText(imagenCloudinaryGenerada)
      setUrlCopiada(true)
      setTimeout(() => setUrlCopiada(false), 2500)
    }
  }

  // Copiar Caption completo
  const copiarCaption = () => {
    if (contenidoGenerado) {
      const fullText = `${contenidoGenerado.hook ? contenidoGenerado.hook + '\n\n' : ''}${contenidoGenerado.caption || ''}\n\n${contenidoGenerado.callToAction || ''}\n\n${contenidoGenerado.hashtags || ''}`
      navigator.clipboard.writeText(fullText)
      setCaptionCopiado(true)
      setTimeout(() => setCaptionCopiado(false), 2500)
    }
  }

  const precioOriginal = Number(decision?.precio_original || decision?.producto?.precio_venta || 0)
  const precioFinalCalculado = Math.round(precioOriginal * (1 - descuentoManual / 100))

  if (loadingProd) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', color: P.verde, padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🍞</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Cargando módulo de marketing PanFree…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Estilos globales para animación de spinners */}
      <style>{`
        @keyframes pfSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .pf-spinner {
          display: inline-block;
          border-radius: 50%;
          animation: pfSpin 0.75s linear infinite;
        }
      `}</style>

      {/* HEADER SUPERIOR */}
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
              Decisiones Inteligentes · Gemini AI · Cloudinary Generative AI
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href="/admin/marketing/analytics"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: `1px solid ${P.dorado}`,
              color: '#fff',
              padding: '0.5rem 0.9rem',
              borderRadius: 8,
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            📊 Panel GA4 Live
          </Link>
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
            ❓ Guía
          </button>
        </div>
      </div>

      {/* BARRA DE NAVEGACIÓN POR PESTAÑAS */}
      <div className={styles.tabNav} id="marketing-tab-bar">
        <button
          onClick={() => setTabActiva('ia_marketing')}
          className={`${styles.tabButton} ${tabActiva === 'ia_marketing' ? styles.tabButtonActive : ''}`}
        >
          🤖 Generador IA & Publicación
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
          📊 Historial & Métricas
        </button>
      </div>

      {/* NOTIFICACIÓN GENERAL DE ÉXITO O ERROR */}
      {notificacion && (
        <div
          style={{
            maxWidth: 1200,
            margin: '1rem auto 0 auto',
            padding: '0.85rem 1.25rem',
            borderRadius: 10,
            fontSize: '0.88rem',
            fontWeight: 600,
            backgroundColor: notificacion.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
            color: notificacion.tipo === 'exito' ? '#14532d' : '#7f1d1d',
            border: `1.5px solid ${notificacion.tipo === 'exito' ? '#86efac' : '#fca5a5'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
          }}
        >
          <span style={{ lineHeight: 1.4 }}>{notificacion.texto}</span>
          <button
            onClick={() => setNotificacion(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              fontWeight: 800,
              fontSize: '1rem',
              padding: '0.2rem 0.5rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* CONTENIDO CONDICIONAL POR PESTAÑAS */}
      {tabActiva === 'reglas' && <RulesManager />}
      {tabActiva === 'eventos' && <EventCalendar />}
      {tabActiva === 'analisis' && <AnalyticsView refreshTrigger={refreshHistory} />}

      {/* ─── PESTAÑA PRINCIPAL: FLUJO INTEGRADO MARKETING IA ────────────────── */}
      {tabActiva === 'ia_marketing' && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.25rem 1rem 3rem 1rem' }}>
          
          {/* BANNER INFORMATIVO DEL FLUJO */}
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e4dacb',
              borderRadius: 14,
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: P.verde, margin: 0 }}>
                Flujo Inteligente de Marketing & Publicación
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#666' }}>
                1. Selección y Diagnóstico IA ➔ 2. Copywriting con Gemini ➔ 3. Composición Visual Cloudinary AI ➔ 4. Publicación en Instagram.
              </p>
            </div>

            <button
              onClick={() => obtenerDecisionInteligente(productoSeleccionadoId)}
              disabled={algunProcesoActivo}
              style={{
                backgroundColor: algunProcesoActivo ? '#e5e5e5' : P.verde,
                color: algunProcesoActivo ? '#999' : '#fff',
                border: `1px solid ${P.dorado}`,
                padding: '0.55rem 1rem',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: algunProcesoActivo ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
            >
              {cargandoDecision ? (
                <>
                  <span
                    className="pf-spinner"
                    style={{
                      width: 13,
                      height: 13,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                    }}
                  />
                  <span>⏳ Evaluando...</span>
                </>
              ) : (
                <span>🔄 Re-evaluar Decisiones</span>
              )}
            </button>
          </div>

          {/* GRID DE DOS COLUMNAS: CONFIGURACIÓN IA (IZQ) vs VISTA PREVIA & ARTE (DER) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            
            {/* ── COLUMNA IZQUIERDA: 1. DECISIONES IA Y 2. GEMINI CONTENT ────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 1. SECCIÓN: DECISIONES IA */}
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  border: '1px solid #e4dacb',
                  padding: '1.25rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className={`${styles.badge} ${styles.badgeGold}`} style={{ marginBottom: '0.35rem' }}>
                      🤖 1. DECISIÓN DEL MOTOR IA
                    </span>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: P.verde, margin: '0.2rem 0' }}>
                      {decision?.producto?.nombre || 'Analizando catálogo...'}
                    </h2>
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
                    borderLeft: `3px solid ${P.dorado}`,
                    padding: '0.75rem',
                    borderRadius: '0 8px 8px 0',
                    marginBottom: '1rem',
                    fontSize: '0.82rem',
                    color: '#444',
                    lineHeight: 1.45,
                  }}
                >
                  <strong>Justificación del Algoritmo:</strong>
                  <br />
                  {decision?.motivo || 'Evaluando rotación, márgenes y calendario...'}
                </div>

                {/* Selector de Producto */}
                <div style={{ marginBottom: '1rem' }}>
                  <label className={styles.label}>Producto para la campaña:</label>
                  <select
                    className={styles.select}
                    value={productoSeleccionadoId}
                    disabled={algunProcesoActivo}
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

                {/* Calculadora de Descuento */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label className={styles.label}>Descuento a Aplicar:</label>
                    <strong style={{ color: P.naranja, fontSize: '0.95rem' }}>{descuentoManual}% OFF</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="5"
                    value={descuentoManual}
                    disabled={algunProcesoActivo}
                    onChange={(e) => setDescuentoManual(Number(e.target.value))}
                    style={{ width: '100%', accentColor: P.naranja, cursor: algunProcesoActivo ? 'not-allowed' : 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#888' }}>
                    <span>0% (Sin Descuento)</span>
                    <span>15% (Recomendado)</span>
                    <span>40% (Liquidación)</span>
                  </div>
                </div>

                {/* Comparación de Precios en Guaraníes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.6rem', borderRadius: 8, backgroundColor: '#f5f5f5', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#888', textTransform: 'uppercase' }}>Precio Base</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#666', textDecoration: 'line-through' }}>
                      G/ {precioOriginal.toLocaleString('es-PY')}
                    </div>
                  </div>
                  <div style={{ padding: '0.6rem', borderRadius: 8, backgroundColor: '#ecfdf5', textAlign: 'center', border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>Precio Oferta</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#065f46' }}>
                      G/ {precioFinalCalculado.toLocaleString('es-PY')}
                    </div>
                  </div>
                </div>

                {/* Tono de Copywriting */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className={styles.label}>Tono del Copy:</label>
                  <select
                    className={styles.select}
                    value={tono}
                    disabled={algunProcesoActivo}
                    onChange={(e) => setTono(e.target.value)}
                  >
                    <option value="persuasivo">🎯 Persuasivo / Conversión Comercial</option>
                    <option value="artesanal">🥖 Artesanal / Tradicional de Encarnación</option>
                    <option value="urgencia">⚡ Urgencia / Oferta por Tiempo Limitado</option>
                    <option value="educativo">🌾 Educativo / Comunidad Celíaca y Saludable</option>
                  </select>
                </div>

                {/* Botón: Generar Contenido con Gemini (Con Spinner de Carga) */}
                <button
                  onClick={handleGenerarContenido}
                  disabled={algunProcesoActivo || !decision?.producto}
                  className={styles.actionBtnPrimary}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    cursor: algunProcesoActivo || !decision?.producto ? 'not-allowed' : 'pointer',
                    opacity: algunProcesoActivo && !generandoContenido ? 0.6 : 1,
                  }}
                >
                  {generandoContenido ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span
                        className="pf-spinner"
                        style={{
                          width: 16,
                          height: 16,
                          border: '2.5px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff',
                        }}
                      />
                      <span>⏳ Generando contenido...</span>
                    </span>
                  ) : (
                    <span>✨ Generar Copy y Prompt con Gemini AI</span>
                  )}
                </button>
              </div>

              {/* 2. SECCIÓN: CONTENIDO GENERADO (GEMINI AI) */}
              <div
                style={{
                  backgroundColor: '#1f1f1f',
                  color: '#eee6d9',
                  borderRadius: 14,
                  border: '1px solid #333',
                  padding: '1.25rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>✨</span>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: P.dorado, margin: 0 }}>
                      2. Contenido Generado (Gemini AI)
                    </h3>
                  </div>
                  {contenidoGenerado && (
                    <button
                      onClick={copiarCaption}
                      disabled={algunProcesoActivo}
                      style={{
                        background: 'none',
                        border: '1px solid #555',
                        color: captionCopiado ? '#10b981' : '#bbb',
                        borderRadius: 6,
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.72rem',
                        cursor: algunProcesoActivo ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {captionCopiado ? '✓ Copiado' : '📋 Copiar Post'}
                    </button>
                  )}
                </div>

                {!contenidoGenerado ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#777' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✍️</div>
                    <p style={{ fontSize: '0.82rem', margin: 0 }}>
                      Haz clic en <strong>"Generar Copy y Prompt con Gemini AI"</strong> para redactar el post optimizado y el brief creativo.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Gancho */}
                    <div style={{ backgroundColor: '#2a2a2a', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #3a3a3a' }}>
                      <div style={{ fontSize: '0.68rem', color: P.naranja, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        ⚡ Gancho / Hook
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                        {contenidoGenerado.hook}
                      </div>
                    </div>

                    {/* Caption y CTA */}
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        Caption para Instagram:
                      </div>
                      <div
                        style={{
                          backgroundColor: '#141414',
                          border: '1px solid #333',
                          borderRadius: 8,
                          padding: '0.75rem',
                          fontSize: '0.8rem',
                          lineHeight: 1.5,
                          color: '#ddd',
                          whiteSpace: 'pre-wrap',
                          maxHeight: 160,
                          overflowY: 'auto',
                          fontFamily: 'monospace',
                        }}
                      >
                        {contenidoGenerado.caption}
                        {'\n\n'}
                        {contenidoGenerado.callToAction}
                        {'\n\n'}
                        {contenidoGenerado.hashtags}
                      </div>
                    </div>

                    {/* Brief para Cloudinary */}
                    <div style={{ backgroundColor: '#262626', padding: '0.65rem 0.85rem', borderRadius: 8, border: `1px solid ${P.dorado}40` }}>
                      <div style={{ fontSize: '0.68rem', color: P.dorado, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        🖼️ Prompt Visual Sugerido para Cloudinary:
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#ccc', fontStyle: 'italic' }}>
                        "{contenidoGenerado.image_prompt}"
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ── COLUMNA DERECHA: 3. CLOUDINARY AI & 4. PUBLICACIÓN ────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 3. SECCIÓN: GENERADOR VISUAL CON MULTI-MOTOR DE IA & CLOUDINARY */}
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  border: '1px solid #e4dacb',
                  padding: '1.25rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ede5d8', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🖼️</span>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, color: P.verde, margin: 0 }}>
                      3. Generar Arte con Motores IA & Cloudinary
                    </h2>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeGold}`}>
                    8 MOTORES IA
                  </span>
                </div>

                {/* SELECTOR DE MOTOR DE IA */}
                <div style={{ backgroundColor: '#faf7f2', padding: '0.85rem', borderRadius: 10, border: '1px solid #e4dacb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <label className={styles.label} style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem' }}>
                      🧠 Motor de Generación de Imagen:
                    </label>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        backgroundColor: MOTORES_INFO[motorSeleccionado]?.gratuito ? '#e0f2fe' : '#fef3c7',
                        color: MOTORES_INFO[motorSeleccionado]?.gratuito ? '#0369a1' : '#b45309',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 700,
                      }}
                    >
                      {MOTORES_INFO[motorSeleccionado]?.badge || 'IA'}
                    </span>
                  </div>

                  <select
                    value={motorSeleccionado}
                    onChange={(e) => handleCambioMotor(e.target.value)}
                    disabled={algunProcesoActivo}
                    className={styles.select}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.65rem',
                      borderRadius: 8,
                      border: '1.5px solid #d4c5b3',
                      backgroundColor: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#2d2a26',
                      outline: 'none',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <option value="gemini">🌟 Google Gemini (Créditos Prepago · ~$0.045/img)</option>
                    <option value="pollinations">🆓 Pollinations.ai (100% Gratuito e Ilimitado · Sin API Key)</option>
                    <option value="leonardo">📸 Leonardo AI (150 tokens/día gratis · Fotografía Gastronómica)</option>
                    <option value="agnes">⚡ Agnes AI (100% Gratuito e Ilimitado · Flash)</option>
                    <option value="aihubmix">🛒 AIHubMix (10 gratis / Pago por uso · E-Commerce)</option>
                    <option value="nexa">💰 NexaAPI (Ultra Económico ~$0.003/img · Flux)</option>
                    <option value="cloudflare">☁️ Cloudflare Workers AI (10k neuronas/día gratis · SDXL)</option>
                    <option value="huggingface">🤖 Hugging Face Inference (Créditos mensuales · Open Source)</option>
                  </select>

                  {/* SUB-SELECTOR DE MODELO PARA EL MOTOR SELECCIONADO */}
                  {MOTORES_INFO[motorSeleccionado]?.modelos?.length > 1 && (
                    <div style={{ marginTop: '0.4rem', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.72rem', color: '#555', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                        ⚙️ Variante de Modelo para {MOTORES_INFO[motorSeleccionado].nombre}:
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={algunProcesoActivo}
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.6rem',
                          borderRadius: 6,
                          border: '1px solid #d4c5b3',
                          backgroundColor: '#fff',
                          fontSize: '0.78rem',
                          color: '#2d2a26',
                          outline: 'none',
                        }}
                      >
                        {MOTORES_INFO[motorSeleccionado].modelos.map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* FICHA INFORMATIVA DEL MOTOR */}
                  <div
                    style={{
                      marginTop: '0.45rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 6,
                      backgroundColor: '#f5f0e6',
                      border: '1px solid #e2d4c0',
                      fontSize: '0.73rem',
                      color: '#4a443d',
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: P.verde }}>
                        💳 Plan / Costo: {MOTORES_INFO[motorSeleccionado]?.plan}
                      </span>
                      {estadoMotores[motorSeleccionado]?.disponible ? (
                        <span style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 700 }}>
                          🟢 Listo para usar
                        </span>
                      ) : MOTORES_INFO[motorSeleccionado]?.gratuito ? (
                        <span style={{ fontSize: '0.65rem', color: '#0369a1', fontWeight: 700 }}>
                          🆓 Acceso Abierto
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 600 }}>
                          ⚠️ Requiere API Key en .env
                        </span>
                      )}
                    </div>
                    <div>{MOTORES_INFO[motorSeleccionado]?.descripcion}</div>
                  </div>
                </div>

                {/* Campo editable de Prompt Visual (brief_creativo) */}
                <div>
                  <label className={styles.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span>✍️ Prompt Visual (brief_creativo):</span>
                    {promptText ? (
                      <span style={{ fontSize: '0.7rem', color: P.naranja, fontWeight: 700 }}>
                        ✍️ Editado / Personalizado
                      </span>
                    ) : contenidoGenerado?.image_prompt ? (
                      <span style={{ fontSize: '0.7rem', color: P.dorado, fontWeight: 600 }}>
                        ✨ Sugerencia de Gemini
                      </span>
                    ) : null}
                  </label>
                  <textarea
                    rows={3}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Ej: fotografía publicitaria profesional de Pan de Campo 100% sin gluten, estilo Instagram, iluminación de estudio, fondo elegante y acogedor..."
                    disabled={algunProcesoActivo}
                    style={{
                      width: '100%',
                      backgroundColor: '#faf7f2',
                      color: '#2d2a26',
                      border: '1px solid #d4c5b3',
                      borderRadius: 8,
                      padding: '0.65rem',
                      fontSize: '0.82rem',
                      fontFamily: 'inherit',
                      lineHeight: 1.45,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#888' }}>
                      {promptText.trim()
                        ? `Describe la escena publicitaria para ${MOTORES_INFO[motorSeleccionado]?.nombre || 'el motor seleccionado'}.`
                        : 'Si está vacío, se creará un prompt fotográfico profesional automáticamente para el producto.'}
                    </span>
                    {promptText && (
                      <button
                        onClick={() => setPromptText(contenidoGenerado?.image_prompt || '')}
                        disabled={algunProcesoActivo}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Restablecer
                      </button>
                    )}
                  </div>
                </div>

                {/* Botón de Generación Cloudinary (Con Spinner de Carga) */}
                <button
                  onClick={handleGenerarImagenCloudinary}
                  disabled={algunProcesoActivo || !decision?.producto}
                  style={{
                    backgroundColor: algunProcesoActivo && !generandoImagenCloudinary ? '#ccc' : P.naranja,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '0.85rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: algunProcesoActivo || !decision?.producto ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: algunProcesoActivo ? 'none' : '0 4px 12px rgba(200,125,50,0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {generandoImagenCloudinary ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span
                        className="pf-spinner"
                        style={{
                          width: 18,
                          height: 18,
                          border: '2.5px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff',
                        }}
                      />
                      <span>⏳ Generando arte con {MOTORES_INFO[motorSeleccionado]?.nombre || 'IA'}...</span>
                    </span>
                  ) : (
                    <span>🖼️ Generar Arte con {MOTORES_INFO[motorSeleccionado]?.nombre || 'IA'} & Cloudinary</span>
                  )}
                </button>

                {/* ÁREA DE VISUALIZACIÓN DE IMAGEN GENERADA */}
                <div
                  style={{
                    backgroundColor: '#181818',
                    borderRadius: 12,
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 380,
                    border: '1px solid #333',
                    position: 'relative',
                  }}
                >
                  {/* ESTADO DE CARGA */}
                  {generandoImagenCloudinary && (
                    <div style={{ textAlign: 'center', color: '#eee6d9', padding: '2rem 1rem' }}>
                      <div
                        className="pf-spinner"
                        style={{
                          width: 48,
                          height: 48,
                          border: `4px solid ${P.dorado}`,
                          borderTopColor: 'transparent',
                          margin: '0 auto 1rem auto',
                        }}
                      />
                      <h4 style={{ color: P.dorado, fontSize: '0.95rem', margin: '0 0 0.4rem 0' }}>
                        ⏳ Generando con {MOTORES_INFO[motorSeleccionado]?.nombre || 'Motor IA'} & subiendo a Cloudinary...
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0 }}>
                        Pipeline: Prompt creativo ➔ Generación {MOTORES_INFO[motorSeleccionado]?.nombre} ➔ Optimización & Cloudinary ➔ Registro Supabase.
                      </p>
                    </div>
                  )}

                  {/* IMAGEN GENERADA VISIBLE */}
                  {!generandoImagenCloudinary && imagenCloudinaryGenerada && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 400,
                          height: 400,
                          backgroundColor: '#0a0a0a',
                          borderRadius: 10,
                          overflow: 'hidden',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                          border: `1px solid ${P.dorado}60`,
                          position: 'relative',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagenCloudinaryGenerada}
                          alt="Arte Publicitario Generado con IA y Cloudinary"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      </div>

                      {/* Badges informativos */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <div
                          style={{
                            backgroundColor: '#064e3b',
                            color: '#6ee7b7',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 20,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            border: '1px solid #059669',
                          }}
                        >
                          <span>✅</span> Arte Listo (1080×1350px)
                        </div>

                        {tiempoGeneracion && (
                          <div
                            style={{
                              backgroundColor: '#1e293b',
                              color: '#94a3b8',
                              padding: '0.35rem 0.75rem',
                              borderRadius: 20,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              border: '1px solid #334155',
                            }}
                          >
                            ⏱️ {tiempoGeneracion}s
                          </div>
                        )}
                      </div>

                      {/* Info del Motor y Modelo Utilizado */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 400,
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: 8,
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#065f46', fontWeight: 600 }}>
                          🧠 Motor: <strong style={{ color: '#047857' }}>{motorUtilizadoNombre || MOTORES_INFO[motorSeleccionado]?.nombre || motorSeleccionado}</strong>
                          {modeloUtilizado && ` · Modelo: ${modeloUtilizado}`}
                        </p>
                      </div>

                      {/* URL Y CONTROLES DE IMAGEN */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 400,
                          backgroundColor: '#242424',
                          borderRadius: 8,
                          padding: '0.65rem 0.85rem',
                          border: '1px solid #383838',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#999', textTransform: 'uppercase', fontWeight: 700 }}>
                            URL de Cloudinary:
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={copiarUrl}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: urlCopiada ? '#10b981' : P.dorado,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {urlCopiada ? '✅ Copiada' : '📋 Copiar'}
                            </button>
                            <a
                              href={imagenCloudinaryGenerada}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: '#60a5fa',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                            >
                              ↗ Abrir
                            </a>
                          </div>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={imagenCloudinaryGenerada}
                          style={{
                            width: '100%',
                            backgroundColor: '#121212',
                            color: '#bbb',
                            border: '1px solid #333',
                            borderRadius: 4,
                            padding: '0.35rem 0.5rem',
                            fontSize: '0.68rem',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ESTADO INICIAL SIN IMAGEN */}
                  {!generandoImagenCloudinary && !imagenCloudinaryGenerada && (
                    <div style={{ textAlign: 'center', color: '#777', padding: '2rem 1rem' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🖼️</div>
                      <h4 style={{ color: '#ccc', fontSize: '0.9rem', margin: '0 0 0.35rem 0' }}>
                        Aún no se ha generado la imagen publicitaria
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: '#888', maxWidth: 320, margin: '0 auto' }}>
                        Selecciona tu <strong>motor de IA preferido</strong> y haz clic en <strong>"Generar Arte"</strong> para crear la imagen publicitaria con subida a Cloudinary.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. SECCIÓN: APROBAR Y PUBLICAR EN INSTAGRAM */}
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  border: '1px solid #e4dacb',
                  padding: '1.25rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #ede5d8', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>📲</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: P.verde, margin: 0 }}>
                    4. Aprobar y Publicar en Instagram
                  </h3>
                </div>

                <p style={{ fontSize: '0.78rem', color: '#666', margin: 0 }}>
                  Envía la publicación directamente a la cuenta de Instagram de PanFree o prográmala en el calendario.
                </p>

                {/* Botón Publicar Ahora (Con Spinner de Carga) */}
                <button
                  onClick={() => handleAprobarYPublicar(true)}
                  disabled={algunProcesoActivo || !decision?.producto}
                  className={styles.actionBtnSecondary}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.92rem',
                    cursor: algunProcesoActivo || !decision?.producto ? 'not-allowed' : 'pointer',
                    opacity: algunProcesoActivo && !procesandoPublicacion ? 0.6 : 1,
                  }}
                >
                  {procesandoPublicacion ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span
                        className="pf-spinner"
                        style={{
                          width: 18,
                          height: 18,
                          border: '2.5px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff',
                        }}
                      />
                      <span>⏳ Publicando en Instagram...</span>
                    </span>
                  ) : (
                    <span>📲 Aprobar y Publicar Ahora en Instagram</span>
                  )}
                </button>

                {/* Programación de Fecha */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #ede5d8' }}>
                  <input
                    type="datetime-local"
                    value={fechaProgramada}
                    disabled={algunProcesoActivo}
                    onChange={(e) => setFechaProgramada(e.target.value)}
                    style={{
                      backgroundColor: '#faf7f2',
                      color: '#2d2a26',
                      border: '1px solid #d4c5b3',
                      borderRadius: 8,
                      padding: '0.5rem 0.65rem',
                      fontSize: '0.8rem',
                      flex: 1,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleAprobarYPublicar(false)}
                    disabled={algunProcesoActivo || !fechaProgramada}
                    style={{
                      backgroundColor: algunProcesoActivo || !fechaProgramada ? '#ccc' : P.verde,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '0.55rem 0.9rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: algunProcesoActivo || !fechaProgramada ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {procesandoPublicacion ? (
                      <>
                        <span
                          className="pf-spinner"
                          style={{
                            width: 13,
                            height: 13,
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: '#fff',
                          }}
                        />
                        <span>⏳ Programando...</span>
                      </>
                    ) : (
                      <span>📅 Programar</span>
                    )}
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* HISTORIAL Y PUBLICACIONES PROGRAMADAS DEBAJO */}
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: P.verde, margin: 0 }}>
                🕒 Publicaciones Recientes y Programadas
              </h3>
              <button
                onClick={() => setRefreshHistory((prev) => prev + 1)}
                disabled={algunProcesoActivo}
                style={{
                  background: 'none',
                  border: `1px solid ${P.dorado}`,
                  color: P.verde,
                  padding: '0.35rem 0.75rem',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: algunProcesoActivo ? 'not-allowed' : 'pointer',
                  opacity: algunProcesoActivo ? 0.6 : 1,
                }}
              >
                🔄 Actualizar lista
              </button>
            </div>
            <ScheduledPosts refreshTrigger={refreshHistory} />
          </div>

        </div>
      )}

    </div>
  )
}
