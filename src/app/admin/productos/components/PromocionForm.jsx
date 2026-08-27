'use client'

import React from 'react'
import { Tag, Sparkles, Calendar, DollarSign, Percent } from 'lucide-react'

/**
 * 📁 src/app/admin/productos/components/PromocionForm.jsx
 * Subcomponente de formulario para administrar precios promocionales en productos.
 */
export default function PromocionForm({
  enPromocion,
  setEnPromocion,
  precioPromocion,
  setPrecioPromocion,
  precioBase,
  fechaInicioPromo,
  setFechaInicioPromo,
  fechaFinPromo,
  setFechaFinPromo,
}) {
  const precioVentaNum = Number(precioBase) || 0
  const precioPromoNum = Number(precioPromocion) || 0

  const porcentajeDescuento =
    precioVentaNum > 0 && precioPromoNum > 0 && precioPromoNum < precioVentaNum
      ? Math.round((1 - precioPromoNum / precioVentaNum) * 100)
      : 0

  const aplicarDescuentoRapido = (porcentaje) => {
    if (precioVentaNum <= 0) return
    const nuevoPrecio = Math.round(precioVentaNum * (1 - porcentaje / 100))
    setPrecioPromocion(nuevoPrecio)
    setEnPromocion(true)
  }

  return (
    <div
      style={{
        backgroundColor: enPromocion ? '#fef2f2' : '#f9fafb',
        border: `1.5px dashed ${enPromocion ? '#f87171' : '#e5e7eb'}`,
        borderRadius: '8px',
        padding: '1rem',
        marginTop: '1rem',
        marginBottom: '1rem',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            color: enPromocion ? '#991b1b' : '#374151',
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          <input
            type="checkbox"
            checked={enPromocion}
            onChange={(e) => setEnPromocion(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#dc2626' }}
          />
          <Tag size={18} color={enPromocion ? '#dc2626' : '#6b7280'} />
          Activar Precio de Oferta / Promoción
        </label>

        {enPromocion && porcentajeDescuento > 0 && (
          <span
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🔥 {porcentajeDescuento}% OFF
          </span>
        )}
      </div>

      {enPromocion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {/* Precio y Atajos rápidos */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
              Precio de Oferta (₲) *
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                value={precioPromocion}
                onChange={(e) => setPrecioPromocion(e.target.value)}
                placeholder="Ej: 15000"
                min="0"
                step="500"
                required={enPromocion}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #fca5a5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#991b1b',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>

            {/* Accesos rápidos de descuento si hay precio base */}
            {precioVentaNum > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Calculador rápido:</span>
                {[10, 15, 20, 25, 30].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => aplicarDescuentoRapido(pct)}
                    style={{
                      border: '1px solid #fecaca',
                      backgroundColor: '#ffffff',
                      color: '#b91c1c',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fechas de inicio y fin (opcionales) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
                <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Inicio Promo (opcional)
              </label>
              <input
                type="datetime-local"
                value={fechaInicioPromo || ''}
                onChange={(e) => setFechaInicioPromo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
                <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Fin Promo (opcional)
              </label>
              <input
                type="datetime-local"
                value={fechaFinPromo || ''}
                onChange={(e) => setFechaFinPromo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
