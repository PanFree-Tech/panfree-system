/**
 * 📁 UBICACIÓN: src/app/admin/marketing/components/AutomationPanel.jsx
 * 📌 Panel de automatización para generar captions con IA (Gemini) y publicar en Instagram.
 */

'use client'

import { useState } from 'react'
import { generateInstagramContent } from '../services/geminiService'
import { publishToInstagram } from '../services/instagramService'
import styles from '../styles/marketing.module.css'

export default function AutomationPanel({ selectedProduct, canvasRef, onPostPublished }) {
  const [generandoIA, setGenerandoIA] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [captionGenerado, setCaptionGenerado] = useState('')
  const [tono, setTono] = useState('persuasivo')
  const [notificacion, setNotificacion] = useState(null)
  const [copiado, setCopiado] = useState(false)

  // 1. Generar contenido con Gemini
  const handleGenerarIA = async () => {
    try {
      setGenerandoIA(true)
      setNotificacion(null)
      const data = await generateInstagramContent(selectedProduct, { tone: tono })
      setCaptionGenerado(data.fullPost || data.caption)
      setNotificacion({
        tipo: 'exito',
        texto: '✨ ¡Copy generado exitosamente con IA!',
      })
    } catch (err) {
      setNotificacion({
        tipo: 'error',
        texto: err?.message || 'No se pudo generar el texto con IA.',
      })
    } finally {
      setGenerandoIA(false)
    }
  }

  // 2. Publicar en Instagram
  const handlePublicar = async () => {
    if (!captionGenerado.trim()) {
      setNotificacion({
        tipo: 'alerta',
        texto: '⚠️ Por favor generá o escribí un caption antes de publicar.',
      })
      return
    }

    try {
      setPublicando(true)
      setNotificacion(null)

      let imageData = null
      if (canvasRef?.current) {
        try {
          imageData = canvasRef.current.toDataURL('image/jpeg', 0.92)
        } catch {
          imageData = null
        }
      }

      const res = await publishToInstagram(imageData, captionGenerado, {
        productName: selectedProduct?.nombre || 'Panfree Especialidades',
        productId: selectedProduct?.id,
      })

      setNotificacion({
        tipo: 'exito',
        texto: `🎉 ${res.message || 'Publicación procesada'} (ID: ${res.postId})`,
      })

      if (onPostPublished) {
        onPostPublished()
      }
    } catch (err) {
      setNotificacion({
        tipo: 'error',
        texto: err?.message || 'Error al enviar publicación a Instagram.',
      })
    } finally {
      setPublicando(false)
    }
  }

  // 3. Copiar caption al portapapeles
  const handleCopiar = () => {
    if (!captionGenerado) return
    navigator.clipboard.writeText(captionGenerado)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className={styles.automationCard} id="automation-panel">
      {/* Encabezado */}
      <div className={styles.automationHeader}>
        <div className={styles.automationTitle}>
          <span>⚡ Automatización Instagram</span>
          <span className={styles.badgeAi}>GEMINI AI</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <select
            value={tono}
            onChange={(e) => setTono(e.target.value)}
            style={{
              backgroundColor: '#262626',
              color: '#eee6d9',
              border: '1px solid #444',
              borderRadius: 6,
              fontSize: '0.72rem',
              padding: '0.2rem 0.5rem',
            }}
          >
            <option value="persuasivo">Tono Persuasivo</option>
            <option value="artesanal">Tono Artesanal / Cercano</option>
            <option value="urgencia">Tono Oferta / Urgencia</option>
            <option value="educativo">Tono Celíaco / Sin TACC</option>
          </select>
        </div>
      </div>

      {/* Producto referenciado */}
      <div
        style={{
          fontSize: '0.74rem',
          color: '#aaa',
          marginBottom: '0.7rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          Producto:{' '}
          <strong style={{ color: '#FF6B35' }}>
            {selectedProduct?.nombre || 'General Panfree'}
          </strong>
        </span>
        {selectedProduct?.precio_venta && (
          <span style={{ color: '#4ECDC4', fontWeight: 600 }}>
            G/ {Number(selectedProduct.precio_venta).toLocaleString('es-PY')}
          </span>
        )}
      </div>

      {/* Botones de acción superior */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <button
          id="btn-generar-ia"
          onClick={handleGenerarIA}
          disabled={generandoIA}
          className={styles.actionBtnPrimary}
          style={{ flex: 1 }}
        >
          {generandoIA ? '⏳ Generando copy...' : '✨ Generar con IA'}
        </button>

        <button
          id="btn-copiar-caption"
          onClick={handleCopiar}
          disabled={!captionGenerado}
          style={{
            backgroundColor: '#2a2a2a',
            color: copiado ? '#4ECDC4' : '#eee6d9',
            border: '1px solid #444',
            borderRadius: 8,
            padding: '0.55rem 0.8rem',
            fontSize: '0.8rem',
            cursor: captionGenerado ? 'pointer' : 'not-allowed',
            fontWeight: 600,
          }}
        >
          {copiado ? '✓ Copiado' : '📋 Copiar'}
        </button>
      </div>

      {/* Caja de texto del caption */}
      <textarea
        id="textarea-instagram-caption"
        className={styles.captionBox}
        placeholder="Hacé clic en 'Generar con IA' para redactar un caption profesional optimizado con emojis y hashtags, o escribilo directamente acá..."
        value={captionGenerado}
        onChange={(e) => setCaptionGenerado(e.target.value)}
        rows={6}
        style={{ width: '100%' }}
      />

      {/* Botón publicar en Instagram */}
      <button
        id="btn-publicar-instagram"
        onClick={handlePublicar}
        disabled={publicando || !captionGenerado}
        className={styles.actionBtnSecondary}
        style={{ width: '100%', marginTop: '0.2rem' }}
      >
        {publicando ? '🚀 Enviando a Instagram...' : '📲 Publicar en Instagram'}
      </button>

      {/* Mensaje de estado */}
      {notificacion && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
            fontSize: '0.75rem',
            backgroundColor:
              notificacion.tipo === 'exito'
                ? '#1e3822'
                : notificacion.tipo === 'alerta'
                ? '#423315'
                : '#3f1b1b',
            color:
              notificacion.tipo === 'exito'
                ? '#a3e635'
                : notificacion.tipo === 'alerta'
                ? '#facc15'
                : '#f87171',
            border: `1px solid ${
              notificacion.tipo === 'exito'
                ? '#22c55e40'
                : notificacion.tipo === 'alerta'
                ? '#eab30840'
                : '#ef444440'
            }`,
          }}
        >
          {notificacion.texto}
        </div>
      )}
    </div>
  )
}
