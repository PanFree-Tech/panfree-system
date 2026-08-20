/**
 * 📁 UBICACIÓN: src/app/admin/marketing/components/EventCalendar.jsx
 * 📌 COMPONENTE: Calendario de Eventos y Festividades Gastronómicas
 * 📖 DESCRIPCIÓN: Permite calendarizar fechas clave (Semana Santa, San Juan, Día del Celíaco, etc.)
 *    y asociar productos para la activación automática de promociones inteligentes.
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '../styles/marketing.module.css'

const EVENTOS_DEFAULT = [
  {
    id: 'evt-semana-santa',
    nombre: 'Semana Santa',
    fecha_inicio: '2026-03-29',
    fecha_fin: '2026-04-05',
    categoria: 'festividad',
    productos_relacionados: ['Chipa Tradicional Sin Gluten', 'Chipa Pirí', 'Rosca de Pascua Sin TACC'],
    activo: true,
  },
  {
    id: 'evt-dia-celiaco',
    nombre: 'Día Internacional del Celíaco',
    fecha_inicio: '2026-05-01',
    fecha_fin: '2026-05-07',
    categoria: 'salud',
    productos_relacionados: ['Pan de Campo Sin Gluten', 'Bizcochuelo Vainilla', 'Masa para Tarta Sin TACC'],
    activo: true,
  },
  {
    id: 'evt-dia-madre',
    nombre: 'Día de la Madre',
    fecha_inicio: '2026-05-10',
    fecha_fin: '2026-05-16',
    categoria: 'familiar',
    productos_relacionados: ['Torta Artesanal de Frutilla', 'Alfajores de Maicena', 'Brownie Sin Gluten'],
    activo: true,
  },
  {
    id: 'evt-san-juan',
    nombre: 'Fiestas de San Juan',
    fecha_inicio: '2026-06-20',
    fecha_fin: '2026-06-26',
    categoria: 'tradicional',
    productos_relacionados: ['Chipa Asador Sin TACC', 'Mbeju Tradicional', "Pastel Mandi'o"],
    activo: true,
  },
]

export default function EventCalendar({ onSelectEventForPromotion }) {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [eventoEditando, setEventoEditando] = useState(null)
  const [notificacion, setNotificacion] = useState(null)

  // Formulario
  const [formNombre, setFormNombre] = useState('')
  const [formFechaInicio, setFormFechaInicio] = useState('')
  const [formFechaFin, setFormFechaFin] = useState('')
  const [formCategoria, setFormCategoria] = useState('festividad')
  const [formProductosRelacionados, setFormProductosRelacionados] = useState('')
  const [formActivo, setFormActivo] = useState(true)

  // Cargar eventos desde Supabase
  const cargarEventos = async () => {
    try {
      setCargando(true)
      const { data, error } = await supabase
        .from('eventos_calendario')
        .select('*')
        .order('fecha_inicio', { ascending: true })

      if (!error && data && data.length > 0) {
        setEventos(data)
      } else {
        setEventos(EVENTOS_DEFAULT)
      }
    } catch (err) {
      console.warn('Error al cargar eventos de Supabase:', err.message)
      setEventos(EVENTOS_DEFAULT)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarEventos()
  }, [])

  // Abrir Modal
  const abrirModal = (evento = null) => {
    if (evento) {
      setEventoEditando(evento)
      setFormNombre(evento.nombre || '')
      setFormFechaInicio(evento.fecha_inicio || '')
      setFormFechaFin(evento.fecha_fin || '')
      setFormCategoria(evento.categoria || 'festividad')
      setFormProductosRelacionados(
        Array.isArray(evento.productos_relacionados)
          ? evento.productos_relacionados.join(', ')
          : ''
      )
      setFormActivo(evento.activo ?? true)
    } else {
      setEventoEditando(null)
      setFormNombre('')
      setFormFechaInicio(new Date().toISOString().split('T')[0])
      setFormFechaFin(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0])
      setFormCategoria('festividad')
      setFormProductosRelacionados('')
      setFormActivo(true)
    }
    setModalAbierto(true)
  }

  // Guardar Evento
  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!formNombre.trim() || !formFechaInicio || !formFechaFin) return

    const prodsArray = formProductosRelacionados
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)

    const payload = {
      nombre: formNombre.trim(),
      fecha_inicio: formFechaInicio,
      fecha_fin: formFechaFin,
      categoria: formCategoria,
      productos_relacionados: prodsArray,
      activo: formActivo,
    }

    try {
      if (eventoEditando && eventoEditando.id && !eventoEditando.id.startsWith('evt-')) {
        // Update Supabase
        const { error } = await supabase
          .from('eventos_calendario')
          .update(payload)
          .eq('id', eventoEditando.id)

        if (error) throw error
      } else {
        // Insert Supabase
        const { error } = await supabase
          .from('eventos_calendario')
          .insert([payload])

        if (error) throw error
      }

      setNotificacion({ tipo: 'exito', texto: '✅ Evento guardado en el calendario' })
      setModalAbierto(false)
      cargarEventos()
    } catch (err) {
      console.warn('Fallo guardado en Supabase, aplicando local:', err.message)
      if (eventoEditando) {
        setEventos((prev) =>
          prev.map((e) => (e.id === eventoEditando.id ? { ...e, ...payload } : e))
        )
      } else {
        setEventos((prev) => [
          ...prev,
          { ...payload, id: `local-evt-${Date.now()}`, created_at: new Date().toISOString() },
        ])
      }
      setNotificacion({ tipo: 'exito', texto: '✅ Evento guardado localmente' })
      setModalAbierto(false)
    }
  }

  // Alternar estado activo / inactivo
  const toggleActivo = async (evento) => {
    const nuevoEstado = !evento.activo
    try {
      if (evento.id && !evento.id.startsWith('evt-') && !evento.id.startsWith('local-')) {
        await supabase
          .from('eventos_calendario')
          .update({ activo: nuevoEstado })
          .eq('id', evento.id)
      }
    } catch (e) {
      console.warn('Error al alternar estado en Supabase:', e.message)
    }
    setEventos((prev) =>
      prev.map((e) => (e.id === evento.id ? { ...e, activo: nuevoEstado } : e))
    )
  }

  const hoyStr = new Date().toISOString().split('T')[0]

  return (
    <div className={styles.moduleContainer} id="event-calendar-root">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334c2b', margin: 0 }}>
            📅 Calendario de Eventos y Festividades
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#666' }}>
            Planificá fechas comerciales y sincronizá productos de panadería sin gluten con antelación.
          </p>
        </div>

        <button
          onClick={() => abrirModal()}
          className={styles.actionBtnPrimary}
          style={{ padding: '0.55rem 1.2rem' }}
        >
          ➕ Nuevo Evento
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

      {/* Grid de Eventos */}
      <div className={styles.grid2}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            Cargando eventos del calendario...
          </div>
        ) : (
          eventos.map((evt) => {
            const esActivoHoy = hoyStr >= evt.fecha_inicio && hoyStr <= evt.fecha_fin
            const esProximo = hoyStr < evt.fecha_inicio

            return (
              <div
                key={evt.id}
                className={styles.card}
                style={{
                  borderLeft: `4px solid ${
                    esActivoHoy ? '#FF6B35' : esProximo ? '#334c2b' : '#999'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#334c2b', margin: 0 }}>
                        {evt.nombre}
                      </h3>
                      {esActivoHoy ? (
                        <span className={`${styles.badge} ${styles.badgeOrange}`}>
                          🔥 EN CURSO HOY
                        </span>
                      ) : esProximo ? (
                        <span className={`${styles.badge} ${styles.badgeGreen}`}>
                          ⏳ PRÓXIMO
                        </span>
                      ) : (
                        <span className={`${styles.badge}`} style={{ backgroundColor: '#eee', color: '#666' }}>
                          FINALIZADO
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#887a66', marginTop: '0.25rem' }}>
                      📅 {new Date(evt.fecha_inicio).toLocaleDateString('es-PY')} al{' '}
                      {new Date(evt.fecha_fin).toLocaleDateString('es-PY')} · Categoría: {evt.categoria}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleActivo(evt)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: evt.activo ? '#16a34a' : '#dc2626',
                      fontWeight: 700,
                    }}
                  >
                    {evt.activo ? '● Habilitado' : '○ Deshabilitado'}
                  </button>
                </div>

                {/* Productos Relacionados */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#777', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Productos Vinculados para Promoción:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {Array.isArray(evt.productos_relacionados) && evt.productos_relacionados.length > 0 ? (
                      evt.productos_relacionados.map((prod, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: '#faf7f2',
                            border: '1px solid #d4c9b5',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            color: '#334c2b',
                            fontWeight: 600,
                          }}
                        >
                          🍞 {prod}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#999' }}>Ningún producto específico vinculado</span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid #f0ebe3', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => abrirModal(evt)}
                    style={{
                      backgroundColor: '#faf7f2',
                      color: '#334c2b',
                      border: '1px solid #d4c9b5',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Editar
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Crear / Editar Evento */}
      {modalAbierto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334c2b', margin: 0 }}>
                {eventoEditando ? '✏️ Editar Evento del Calendario' : '➕ Nuevo Evento de Marketing'}
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
                <label className={styles.label}>Nombre del Evento o Festividad:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Semana Santa, San Juan, Día del Padre"
                  className={styles.input}
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className={styles.label}>Fecha Inicio:</label>
                  <input
                    type="date"
                    required
                    className={styles.input}
                    value={formFechaInicio}
                    onChange={(e) => setFormFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className={styles.label}>Fecha Fin:</label>
                  <input
                    type="date"
                    required
                    className={styles.input}
                    value={formFechaFin}
                    onChange={(e) => setFormFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={styles.label}>Categoría:</label>
                <select
                  className={styles.select}
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                >
                  <option value="festividad">Festividad Religiosa / Tradicional</option>
                  <option value="salud">Día de la Salud / Comunidad Celíaca</option>
                  <option value="familiar">Celebración Familiar / Fechas Especiales</option>
                  <option value="estacion">Temporada / Estación del Año</option>
                  <option value="comercial">Evento Comercial / Aniversario Panfree</option>
                </select>
              </div>

              <div>
                <label className={styles.label}>
                  Productos Relacionados (separados por coma):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Chipa Tradicional, Chipa Pirí, Rosca de Pascua"
                  className={styles.input}
                  value={formProductosRelacionados}
                  onChange={(e) => setFormProductosRelacionados(e.target.value)}
                />
                <span style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.2rem', display: 'block' }}>
                  El motor inteligente buscará estos términos en el catálogo para generar las promociones.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="chk-evt-activo"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#334c2b' }}
                />
                <label htmlFor="chk-evt-activo" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334c2b', cursor: 'pointer' }}>
                  Evento activo para consideración del algoritmo
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
                  💾 Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
