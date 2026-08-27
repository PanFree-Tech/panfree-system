'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Tag, Sparkles, Calendar, DollarSign, Percent, Clock, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'

/**
 * Helper para formatear en Guaraníes con prefijo "Gs."
 */
export const formatGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`

/**
 * 📁 src/app/admin/productos/components/PromocionForm.jsx
 * Componente modular para administrar promociones de productos.
 * Soporta dos modos:
 * 1. Modo Standalone / Modal: recibe `productos` (lista) o `productoSeleccionado` y guarda directo en Supabase.
 * 2. Modo Embebido: recibe los estados del formulario padre (enPromocion, setEnPromocion, etc.).
 */
export default function PromocionForm({
  // Props para modo embebido (en formulario de producto)
  enPromocion: propEnPromocion,
  setEnPromocion: propSetEnPromocion,
  precioPromocion: propPrecioPromocion,
  setPrecioPromocion: propSetPrecioPromocion,
  precioBase: propPrecioBase,
  fechaInicioPromo: propFechaInicioPromo,
  setFechaInicioPromo: propSetFechaInicioPromo,
  fechaFinPromo: propFechaFinPromo,
  setFechaFinPromo: propSetFechaFinPromo,

  // Props para modo Standalone (Selector de producto y guardado directo en Supabase)
  isStandalone = false,
  productos = [],
  productoInicialId = null,
  onGuardado = null,
  onCerrar = null,
}) {
  // Estado local para modo standalone
  const [selectedProdId, setSelectedProdId] = useState(productoInicialId || (productos.length > 0 ? productos[0].id : ''))
  const [localEnPromo, setLocalEnPromo] = useState(false)
  const [localPrecioPromo, setLocalPrecioPromo] = useState('')
  const [localFechaInicio, setLocalFechaInicio] = useState('')
  const [localFechaFin, setLocalFechaFin] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  // Encontrar producto seleccionado en modo standalone
  const currentProd = useMemo(() => {
    if (!isStandalone) return null
    return productos.find((p) => String(p.id) === String(selectedProdId)) || null
  }, [isStandalone, productos, selectedProdId])

  // Cargar valores al seleccionar producto en modo standalone
  useEffect(() => {
    if (isStandalone && currentProd) {
      setLocalEnPromo(!!currentProd.en_promocion)
      setLocalPrecioPromo(currentProd.precio_promocion ? String(currentProd.precio_promocion) : '')
      setLocalFechaInicio(currentProd.fecha_inicio_promo ? currentProd.fecha_inicio_promo.slice(0, 16) : '')
      setLocalFechaFin(currentProd.fecha_fin_promo ? currentProd.fecha_fin_promo.slice(0, 16) : '')
      setMensajeExito(null)
      setErrorMsg(null)
    }
  }, [isStandalone, currentProd])

  // Resolver variables según modo
  const enPromocion = isStandalone ? localEnPromo : propEnPromocion
  const setEnPromocion = isStandalone ? setLocalEnPromo : propSetEnPromocion

  const precioPromocion = isStandalone ? localPrecioPromo : propPrecioPromocion
  const setPrecioPromocion = isStandalone ? setLocalPrecioPromo : propSetPrecioPromocion

  const precioBase = isStandalone ? (currentProd?.precio_venta || currentProd?.precio || 0) : propPrecioBase

  const fechaInicioPromo = isStandalone ? localFechaInicio : propFechaInicioPromo
  const setFechaInicioPromo = isStandalone ? setLocalFechaInicio : propSetFechaInicioPromo

  const fechaFinPromo = isStandalone ? localFechaFin : propFechaFinPromo
  const setFechaFinPromo = isStandalone ? setLocalFechaFin : propSetFechaFinPromo

  const precioVentaNum = Number(precioBase) || 0
  const precioPromoNum = Number(precioPromocion) || 0

  const ahorroGs = precioVentaNum > precioPromoNum && precioPromoNum > 0 ? precioVentaNum - precioPromoNum : 0
  const porcentajeDescuento =
    precioVentaNum > 0 && precioPromoNum > 0 && precioPromoNum < precioVentaNum
      ? Math.round((1 - precioPromoNum / precioVentaNum) * 100)
      : 0

  // Atajos rápidos de descuento porcentual
  const aplicarDescuentoRapido = (porcentaje) => {
    if (precioVentaNum <= 0) return
    const nuevoPrecio = Math.round(precioVentaNum * (1 - porcentaje / 100))
    setPrecioPromocion(nuevoPrecio)
    setEnPromocion(true)
  }

  // Preajustes de fecha
  const aplicarPresetFecha = (tipo) => {
    const ahora = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const formatLocalInput = (d) => {
      const year = d.getFullYear()
      const month = pad(d.getMonth() + 1)
      const day = pad(d.getDate())
      const hours = pad(d.getHours())
      const mins = pad(d.getMinutes())
      return `${year}-${month}-${day}T${hours}:${mins}`
    }

    if (tipo === 'hoy17_7dias') {
      // Desde hoy 17:00 hasta dentro de 7 días
      const inicio = new Date()
      inicio.setHours(17, 0, 0, 0)
      const fin = new Date(inicio)
      fin.setDate(fin.getDate() + 7)
      fin.setHours(23, 59, 0, 0)

      setFechaInicioPromo(formatLocalInput(inicio))
      setFechaFinPromo(formatLocalInput(fin))
      setEnPromocion(true)
    } else if (tipo === '24h') {
      const inicio = new Date()
      const fin = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
      setFechaInicioPromo(formatLocalInput(inicio))
      setFechaFinPromo(formatLocalInput(fin))
      setEnPromocion(true)
    } else if (tipo === '3dias') {
      const inicio = new Date()
      const fin = new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000)
      setFechaInicioPromo(formatLocalInput(inicio))
      setFechaFinPromo(formatLocalInput(fin))
      setEnPromocion(true)
    } else if (tipo === '7dias') {
      const inicio = new Date()
      const fin = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)
      setFechaInicioPromo(formatLocalInput(inicio))
      setFechaFinPromo(formatLocalInput(fin))
      setEnPromocion(true)
    } else if (tipo === 'finde') {
      // Próximo viernes a las 12:00 hasta el domingo a las 23:59
      const inicio = new Date()
      const dayOfWeek = inicio.getDay() // 0=dom, 5=vie
      const diasHastaViernes = (5 - dayOfWeek + 7) % 7
      inicio.setDate(inicio.getDate() + diasHastaViernes)
      inicio.setHours(12, 0, 0, 0)

      const fin = new Date(inicio)
      fin.setDate(inicio.getDate() + 2) // Domingo
      fin.setHours(23, 59, 0, 0)

      setFechaInicioPromo(formatLocalInput(inicio))
      setFechaFinPromo(formatLocalInput(fin))
      setEnPromocion(true)
    } else if (tipo === 'limpiar') {
      setFechaInicioPromo('')
      setFechaFinPromo('')
    }
  }

  // Guardar en Supabase directamente (en modo standalone)
  const guardarPromoEnSupabase = async () => {
    if (!currentProd) {
      setErrorMsg('Por favor seleccioná un producto.')
      return
    }

    if (enPromocion) {
      if (!precioPromocion || Number(precioPromocion) <= 0) {
        setErrorMsg('Ingresá un precio promocional válido mayor a 0.')
        return
      }
      if (Number(precioPromocion) >= precioVentaNum) {
        setErrorMsg(`El precio de oferta (${formatGs(precioPromocion)}) debe ser menor al precio normal (${formatGs(precioVentaNum)}).`)
        return
      }
    }

    setGuardando(true)
    setErrorMsg(null)
    setMensajeExito(null)

    try {
      const payload = {
        en_promocion: !!enPromocion,
        precio_promocion: enPromocion && precioPromocion ? Number(precioPromocion) : null,
        fecha_inicio_promo: enPromocion && fechaInicioPromo ? new Date(fechaInicioPromo).toISOString() : null,
        fecha_fin_promo: enPromocion && fechaFinPromo ? new Date(fechaFinPromo).toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id', currentProd.id)
        .select()

      if (error) throw error

      setMensajeExito(`¡Promoción ${enPromocion ? 'activada' : 'desactivada'} para "${currentProd.nombre}" con éxito!`)
      if (onGuardado) onGuardado(data?.[0] || { ...currentProd, ...payload })
    } catch (err) {
      console.error('Error al guardar promoción en Supabase:', err)
      setErrorMsg(err.message || 'Error al guardar la promoción.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: enPromocion ? '#fff5f5' : '#ffffff',
        border: `2px solid ${enPromocion ? '#ef4444' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '1.25rem',
        marginTop: isStandalone ? '0' : '1rem',
        marginBottom: isStandalone ? '0' : '1rem',
        boxShadow: enPromocion ? '0 4px 12px rgba(239, 68, 68, 0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Selector de Producto en Modo Standalone */}
      {isStandalone && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#334c2b', marginBottom: '0.5rem' }}>
            🏷️ Elegir Producto para la Promoción *
          </label>
          <select
            value={selectedProdId}
            onChange={(e) => setSelectedProdId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              border: '2px solid #b7996b',
              borderRadius: '8px',
              fontSize: '0.95rem',
              backgroundColor: '#fffdfa',
              fontWeight: 600,
              color: '#334c2b',
              cursor: 'pointer',
            }}
          >
            {productos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.nombre} — Normal: {formatGs(prod.precio_venta || prod.precio)}{' '}
                {prod.en_promocion ? `(🔥 Oferta: ${formatGs(prod.precio_promocion)})` : ''}
              </option>
            ))}
          </select>

          {/* Ficha rápida del producto seleccionado */}
          {currentProd && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: '#f5f0ea',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                marginTop: '0.65rem',
                border: '1px solid #e0d5c5',
              }}
            >
              {currentProd.imagen_url ? (
                <img
                  src={currentProd.imagen_url}
                  alt={currentProd.nombre}
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #b7996b' }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#e8ddd0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  🍞
                </div>
              )}
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#334c2b', fontSize: '0.95rem', display: 'block' }}>{currentProd.nombre}</strong>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                  Precio base: <strong style={{ color: '#334c2b' }}>{formatGs(currentProd.precio_venta || currentProd.precio)}</strong>
                </span>
              </div>
              {currentProd.en_promocion && (
                <span
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  🔥 Promo Activa
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header del Interruptor de Promoción */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.75rem',
          borderBottom: enPromocion ? '1px solid #fecaca' : '1px solid #e5e7eb',
          marginBottom: '1rem',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 800,
            color: enPromocion ? '#dc2626' : '#374151',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          <input
            type="checkbox"
            checked={!!enPromocion}
            onChange={(e) => setEnPromocion(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              accentColor: '#dc2626',
            }}
          />
          <Tag size={20} color={enPromocion ? '#dc2626' : '#6b7280'} />
          Activar Precio de Oferta / Promoción
        </label>

        {enPromocion && porcentajeDescuento > 0 && (
          <span
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
            }}
          >
            🔥 {porcentajeDescuento}% OFF
          </span>
        )}
      </div>

      {/* Campos de Configuración de la Promo */}
      {enPromocion ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Precio Promocional y Accesos Rápidos */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#991b1b',
                marginBottom: '0.35rem',
              }}
            >
              Precio Promocional con Descuento (en Guaraníes) *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  fontWeight: 800,
                  color: '#991b1b',
                  fontSize: '0.95rem',
                }}
              >
                Gs.
              </span>
              <input
                type="number"
                value={precioPromocion}
                onChange={(e) => setPrecioPromocion(e.target.value)}
                placeholder="Ej: 40000"
                min="0"
                step="500"
                required={enPromocion}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  border: '2px solid #f87171',
                  borderRadius: '8px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#991b1b',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>

            {/* Calculador rápido por porcentaje */}
            {precioVentaNum > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.35rem',
                  marginTop: '0.5rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Atajo descuento:</span>
                {[10, 15, 20, 25, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => aplicarDescuentoRapido(pct)}
                    style={{
                      border: '1px solid #fca5a5',
                      backgroundColor: '#ffffff',
                      color: '#b91c1c',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fechas de Inicio y Fin de la Promo */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>
                <Calendar size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Vigencia de la Promoción (Fecha y Hora)
              </label>
            </div>

            {/* Presets Rápidos de Fecha */}
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => aplicarPresetFecha('hoy17_7dias')}
                style={presetBtnStyle}
              >
                ⚡ Hoy 17:00 a +7 días
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetFecha('24h')}
                style={presetBtnStyle}
              >
                ⏱️ +24 Horas
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetFecha('3dias')}
                style={presetBtnStyle}
              >
                📅 +3 Días
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetFecha('7dias')}
                style={presetBtnStyle}
              >
                🗓️ +7 Días
              </button>
              <button
                type="button"
                onClick={() => aplicarPresetFecha('finde')}
                style={presetBtnStyle}
              >
                🎉 Fin de Semana
              </button>
              {(fechaInicioPromo || fechaFinPromo) && (
                <button
                  type="button"
                  onClick={() => aplicarPresetFecha('limpiar')}
                  style={{ ...presetBtnStyle, backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }}
                >
                  ✕ Sin límite
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.2rem' }}>
                  Fecha y Hora de Inicio (Opcional):
                </label>
                <input
                  type="datetime-local"
                  value={fechaInicioPromo || ''}
                  onChange={(e) => setFechaInicioPromo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.2rem' }}>
                  Fecha y Hora de Fin (Opcional):
                </label>
                <input
                  type="datetime-local"
                  value={fechaFinPromo || ''}
                  onChange={(e) => setFechaFinPromo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>
            </div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginTop: '0.35rem' }}>
              💡 Si no se especifica fecha de fin, la promo permanecerá activa indefinidamente hasta que la desactives.
            </span>
          </div>

          {/* Vista Previa de Cómo lo verá el Cliente */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px dashed #dc2626',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginTop: '0.25rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              👀 Vista previa de precio para el cliente:
            </div>
            {precioPromoNum > 0 && precioVentaNum > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.95rem', fontWeight: 600 }}>
                  {formatGs(precioVentaNum)}
                </span>
                <span style={{ color: '#dc2626', fontSize: '1.25rem', fontWeight: 800 }}>
                  {formatGs(precioPromoNum)}
                </span>
                {ahorroGs > 0 && (
                  <span
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #fecaca',
                    }}
                  >
                    AHORRAS {formatGs(ahorroGs)} ({porcentajeDescuento}% OFF)
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Ingresá el precio promocional para ver la vista previa.
              </div>
            )}
          </div>

          {/* Mensajes de Alerta / Éxito */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {mensajeExito && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} /> {mensajeExito}
            </div>
          )}

          {/* Botón de Guardado para Modo Standalone */}
          {isStandalone && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              {onCerrar && (
                <button
                  type="button"
                  onClick={onCerrar}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                  }}
                >
                  Cerrar
                </button>
              )}
              <button
                type="button"
                onClick={guardarPromoEnSupabase}
                disabled={guardando}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                }}
              >
                {guardando ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>🔥 Guardar Promoción</>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
            Marcá la casilla superior si querés activar un precio con descuento, configurar fechas límite y mostrar el temporizador en la tienda.
          </p>

          {/* Si está en modo Standalone y se quiere desactivar la promo del producto seleccionado */}
          {isStandalone && currentProd?.en_promocion && (
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={guardarPromoEnSupabase}
                disabled={guardando}
                style={{
                  backgroundColor: '#4b5563',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {guardando ? 'Desactivando...' : 'Desactivar y Guardar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const presetBtnStyle = {
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  color: '#374151',
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '0.25rem 0.55rem',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
}
