/**
 * 📁 UBICACIÓN: src/app/admin/marketing/components/RulesManager.jsx
 * 📌 COMPONENTE: Gestor de Reglas de Promoción
 * 📖 DESCRIPCIÓN: Permite configurar, crear, editar y activar/desactivar las reglas de negocio
 *    utilizadas por el motor de decisiones inteligentes de PanFree.
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '../styles/marketing.module.css'

const REGLAS_DEFAULT = [
  {
    id: 'reg-evento',
    nombre: 'Impulso por Festividad o Evento',
    descripcion: 'Aplica cuando hay un evento activo en el calendario con productos relacionados',
    condicion: { tipo: 'evento_calendario', dias_antelacion: 7 },
    tipo_costo: 'competitivo',
    descuento_min: 10,
    descuento_max: 15,
    prioridad: 10,
    activo: true,
  },
  {
    id: 'reg-stock',
    nombre: 'Promoción de Exceso de Stock / Inventario',
    descripcion: 'Aplica cuando el inventario supera el umbral de rotación',
    condicion: { tipo: 'stock', operador: '>=', umbral: 30 },
    tipo_costo: 'competitivo',
    descuento_min: 15,
    descuento_max: 20,
    prioridad: 8,
    activo: true,
  },
  {
    id: 'reg-finde',
    nombre: 'Fidelización Fin de Semana',
    descripcion: 'Descuento especial viernes y sábados para pedidos anticipados',
    condicion: { tipo: 'dia_semana', dias: ['Friday', 'Saturday'] },
    tipo_costo: 'objetivo',
    descuento_min: 10,
    descuento_max: 15,
    prioridad: 5,
    activo: true,
  },
  {
    id: 'reg-premium',
    nombre: 'Producto Estrella Premium (Calidad Artesanal)',
    descripcion: 'Posicionamiento sin descuento agresivo para proteger margen',
    condicion: { tipo: 'producto_estrella', destacado: true },
    tipo_costo: 'premium',
    descuento_min: 0,
    descuento_max: 5,
    prioridad: 3,
    activo: true,
  },
]

export default function RulesManager() {
  const [reglas, setReglas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [reglaEditando, setReglaEditando] = useState(null)
  const [notificacion, setNotificacion] = useState(null)

  // Estado del formulario
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formTipoCosto, setFormTipoCosto] = useState('competitivo')
  const [formDescuentoMin, setFormDescuentoMin] = useState(5)
  const [formDescuentoMax, setFormDescuentoMax] = useState(15)
  const [formPrioridad, setFormPrioridad] = useState(5)
  const [formTipoCondicion, setFormTipoCondicion] = useState('evento_calendario')
  const [formActivo, setFormActivo] = useState(true)

  // Cargar reglas desde Supabase
  const cargarReglas = async () => {
    try {
      setCargando(true)
      const { data, error } = await supabase
        .from('reglas_promocion')
        .select('*')
        .order('prioridad', { ascending: false })

      if (!error && data && data.length > 0) {
        setReglas(data)
      } else {
        setReglas(REGLAS_DEFAULT)
      }
    } catch (err) {
      console.warn('Error al cargar reglas_promocion de Supabase:', err.message)
      setReglas(REGLAS_DEFAULT)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarReglas()
  }, [])

  // Abrir modal de creación o edición
  const abrirModal = (regla = null) => {
    if (regla) {
      setReglaEditando(regla)
      setFormNombre(regla.nombre || '')
      setFormDescripcion(regla.descripcion || '')
      setFormTipoCosto(regla.tipo_costo || 'competitivo')
      setFormDescuentoMin(regla.descuento_min || 5)
      setFormDescuentoMax(regla.descuento_max || 15)
      setFormPrioridad(regla.prioridad || 5)
      setFormTipoCondicion(regla.condicion?.tipo || 'evento_calendario')
      setFormActivo(regla.activo ?? true)
    } else {
      setReglaEditando(null)
      setFormNombre('')
      setFormDescripcion('')
      setFormTipoCosto('competitivo')
      setFormDescuentoMin(5)
      setFormDescuentoMax(15)
      setFormPrioridad(5)
      setFormTipoCondicion('evento_calendario')
      setFormActivo(true)
    }
    setModalAbierto(true)
  }

  // Guardar regla (Insert o Update)
  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!formNombre.trim()) return

    const payload = {
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim(),
      tipo_costo: formTipoCosto,
      descuento_min: Number(formDescuentoMin),
      descuento_max: Number(formDescuentoMax),
      prioridad: Number(formPrioridad),
      condicion: { tipo: formTipoCondicion },
      activo: formActivo,
    }

    try {
      if (reglaEditando && reglaEditando.id && !reglaEditando.id.startsWith('reg-')) {
        // Update Supabase
        const { error } = await supabase
          .from('reglas_promocion')
          .update(payload)
          .eq('id', reglaEditando.id)

        if (error) throw error
      } else {
        // Insert Supabase
        const { error } = await supabase
          .from('reglas_promocion')
          .insert([payload])

        if (error) throw error
      }

      setNotificacion({ tipo: 'exito', texto: '✅ Regla guardada exitosamente' })
      setModalAbierto(false)
      cargarReglas()
    } catch (err) {
      console.warn('Fallo guardado en Supabase, aplicando local:', err.message)
      // Fallback local
      if (reglaEditando) {
        setReglas((prev) =>
          prev.map((r) => (r.id === reglaEditando.id ? { ...r, ...payload } : r))
        )
      } else {
        setReglas((prev) => [
          ...prev,
          { ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() },
        ])
      }
      setNotificacion({ tipo: 'exito', texto: '✅ Regla guardada en memoria local' })
      setModalAbierto(false)
    }
  }

  // Alternar estado activo / inactivo
  const toggleActivo = async (regla) => {
    const nuevoEstado = !regla.activo
    try {
      if (regla.id && !regla.id.startsWith('reg-') && !regla.id.startsWith('local-')) {
        await supabase
          .from('reglas_promocion')
          .update({ activo: nuevoEstado })
          .eq('id', regla.id)
      }
    } catch (e) {
      console.warn('Error al alternar estado en Supabase:', e.message)
    }
    setReglas((prev) =>
      prev.map((r) => (r.id === regla.id ? { ...r, activo: nuevoEstado } : r))
    )
  }

  return (
    <div className={styles.moduleContainer} id="rules-manager-root">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334c2b', margin: 0 }}>
            📋 Gestor de Reglas de Promoción
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#666' }}>
            Definí las políticas automáticas de descuento, márgenes de rentabilidad y prioridades comerciales.
          </p>
        </div>

        <button
          onClick={() => abrirModal()}
          className={styles.actionBtnPrimary}
          style={{ padding: '0.55rem 1.2rem' }}
        >
          ➕ Nueva Regla
        </button>
      </div>

      {/* Notificación */}
      {notificacion && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 8,
            fontSize: '0.82rem',
            backgroundColor: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
          }}
        >
          {notificacion.texto}
        </div>
      )}

      {/* Lista de Reglas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            Cargando reglas de promoción...
          </div>
        ) : (
          reglas.map((regla) => (
            <div
              key={regla.id}
              className={styles.card}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                opacity: regla.activo ? 1 : 0.65,
                borderLeft: `4px solid ${regla.activo ? '#334c2b' : '#999'}`,
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#2D2D2D' }}>
                    {regla.nombre}
                  </h3>
                  <span className={`${styles.badge} ${styles.badgeGold}`}>
                    Prioridad {regla.prioridad}
                  </span>
                  <span
                    className={`${styles.badge} ${
                      regla.tipo_costo === 'premium'
                        ? styles.badgeOrange
                        : regla.tipo_costo === 'objetivo'
                        ? styles.badgeBlue
                        : styles.badgeGreen
                    }`}
                  >
                    {regla.tipo_costo}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#666', margin: '0.2rem 0 0.5rem 0' }}>
                  {regla.descripcion || 'Sin descripción'}
                </p>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#777' }}>
                  <span>
                    Descuento: <strong>{regla.descuento_min}% - {regla.descuento_max}%</strong>
                  </span>
                  <span>
                    Condición: <strong>{regla.condicion?.tipo || 'Personalizada'}</strong>
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  onClick={() => toggleActivo(regla)}
                  style={{
                    backgroundColor: regla.activo ? '#dcfce7' : '#fee2e2',
                    color: regla.activo ? '#166534' : '#991b1b',
                    border: `1px solid ${regla.activo ? '#bbf7d0' : '#fecaca'}`,
                    padding: '0.4rem 0.8rem',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {regla.activo ? '✓ Activa' : '✕ Inactiva'}
                </button>

                <button
                  onClick={() => abrirModal(regla)}
                  style={{
                    backgroundColor: '#faf7f2',
                    color: '#334c2b',
                    border: '1px solid #d4c9b5',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Creación / Edición */}
      {modalAbierto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334c2b', margin: 0 }}>
                {reglaEditando ? '✏️ Editar Regla de Promoción' : '➕ Nueva Regla de Promoción'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className={styles.label}>Nombre de la Regla:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Impulso por Fin de Semana"
                  className={styles.input}
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                />
              </div>

              <div>
                <label className={styles.label}>Descripción:</label>
                <textarea
                  rows={2}
                  placeholder="Explica cuándo y cómo actúa esta regla..."
                  className={styles.textarea}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className={styles.label}>Tipo de Costo:</label>
                  <select
                    className={styles.select}
                    value={formTipoCosto}
                    onChange={(e) => setFormTipoCosto(e.target.value)}
                  >
                    <option value="competitivo">Competitivo (Volumen)</option>
                    <option value="objetivo">Objetivo (Equilibrado)</option>
                    <option value="premium">Premium (Margen Alto)</option>
                  </select>
                </div>

                <div>
                  <label className={styles.label}>Tipo de Condición:</label>
                  <select
                    className={styles.select}
                    value={formTipoCondicion}
                    onChange={(e) => setFormTipoCondicion(e.target.value)}
                  >
                    <option value="evento_calendario">Evento en Calendario</option>
                    <option value="stock">Nivel de Stock / Inventario</option>
                    <option value="dia_semana">Día de la Semana</option>
                    <option value="producto_estrella">Producto Destacado</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className={styles.label}>Desc. Mín (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={styles.input}
                    value={formDescuentoMin}
                    onChange={(e) => setFormDescuentoMin(e.target.value)}
                  />
                </div>
                <div>
                  <label className={styles.label}>Desc. Máx (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={styles.input}
                    value={formDescuentoMax}
                    onChange={(e) => setFormDescuentoMax(e.target.value)}
                  />
                </div>
                <div>
                  <label className={styles.label}>Prioridad (1-10):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className={styles.input}
                    value={formPrioridad}
                    onChange={(e) => setFormPrioridad(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="chk-activo"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#334c2b' }}
                />
                <label htmlFor="chk-activo" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334c2b', cursor: 'pointer' }}>
                  Regla activa para el motor inteligente
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{
                    backgroundColor: '#e5e5e5',
                    color: '#333',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.6rem 1.2rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.actionBtnPrimary}
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  💾 Guardar Regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
