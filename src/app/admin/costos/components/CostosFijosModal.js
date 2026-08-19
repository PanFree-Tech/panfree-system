/**
 * 📁 UBICACIÓN: src/app/admin/costos/components/CostosFijosModal.js
 * 📅 ACTUALIZADO: 2026-08-19 (Fase 3 - Refactor de Costos)
 * 📌 DESCRIPCIÓN: Modal para cargar o editar costos fijos mensuales.
 *    - Selector de mes
 *    - Plantilla rodante: opción de copiar valores del mes inmediatamente anterior
 *    - Sugerencia de energía automática calculada desde el módulo de maquinarias
 *    - Desglose detallado por rubro (alquiler, servicios, salarios, depreciación, software, marketing, otros)
 *    - Vista previa en tiempo real de la sumatoria total del mes
 *    - Campo opcional para notas explicativas (ej: aguinaldo, mantenimiento extraordinario)
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { formatPYG, labelPeriodo, S } from '../lib/calculos'

export default function CostosFijosModal({
  editando,
  form,
  error,
  guardando,
  mesAnterior,
  sugerenciaEnergia,
  onCambiar,
  onCerrar,
  onGuardar,
  onCopiarMesAnterior,
  onAplicarSugerenciaEnergia,
}) {
  const camposCostos = [
    { campo: 'alquiler', label: '🏠 Alquiler (₲)', placeholder: '3.000.000' },
    { campo: 'servicios', label: '💡 Servicios (₲)', placeholder: '800.000' },
    { campo: 'salarios', label: '👷 Salarios (₲)', placeholder: '5.000.000' },
    { campo: 'depreciacion_equipos', label: '⚙️ Depreciación (₲)', placeholder: '500.000' },
    { campo: 'licencias_software', label: '💻 Software (₲)', placeholder: '200.000' },
    { campo: 'marketing', label: '📣 Marketing (₲)', placeholder: '300.000' },
    { campo: 'otros', label: '📦 Otros (₲)', placeholder: '100.000' },
  ]

  const totalCalculado = camposCostos.reduce(
    (acc, f) => acc + (Number(form[f.campo]) || 0),
    0
  )

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCerrar}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 300,
        }}
      />

      {/* Contenedor del Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          backgroundColor: '#fff',
          border: '2px solid #b7996b',
          borderRadius: '8px',
          padding: '2rem',
          zIndex: 301,
          width: '92%',
          maxWidth: '620px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        <h2 style={{ color: '#334c2b', margin: '0 0 1.5rem', fontSize: '1.25rem' }}>
          {editando ? '✏️ Editar Costos Fijos' : '➕ Cargar Costos Fijos'}
        </h2>

        {error && (
          <div
            style={{
              backgroundColor: '#fdecea',
              border: '1px solid #c62828',
              borderRadius: '4px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#c62828',
              fontSize: '0.9rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Banner de plantilla rodante: copiar mes anterior */}
        {!editando && mesAnterior && (
          <div
            style={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #90caf9',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1565c0', fontWeight: 600 }}>
                  📋 Hay datos de {labelPeriodo(mesAnterior.periodo)} disponibles
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>
                  Copiá los valores y solo editá lo que cambió para ahorrar tiempo.
                </p>
              </div>
              <button
                type="button"
                onClick={onCopiarMesAnterior}
                style={{ ...S.btnAzul, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                📄 Copiar mes anterior
              </button>
            </div>
          </div>
        )}

        {/* Banner de sugerencia de energía desde maquinarias */}
        {!editando && sugerenciaEnergia && sugerenciaEnergia.estimado > 0 && (
          <div
            style={{
              backgroundColor: '#fff3e0',
              border: '1px solid #ffb74d',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#e65100', fontWeight: 600 }}>
                  ⚡ Energía calculada desde Maquinarias: {formatPYG(sugerenciaEnergia.estimado)}/mes
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>
                  Basado en tus equipos registrados · Se cargará en el campo Servicios
                  {sugerenciaEnergia.anterior > 0 && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        color: sugerenciaEnergia.variacion >= 0 ? '#c62828' : '#2e7d32',
                        fontWeight: 'bold',
                      }}
                    >
                      ({sugerenciaEnergia.variacion >= 0 ? '+' : ''}
                      {formatPYG(sugerenciaEnergia.variacion)} vs mes anterior)
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onAplicarSugerenciaEnergia}
                style={{ ...S.btnNaranja, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                ✅ Usar este valor
              </button>
            </div>
          </div>
        )}

        {/* Selector de mes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={S.label}>📅 Mes *</label>
          <input
            style={S.input}
            type="month"
            value={form.periodo ? form.periodo.slice(0, 7) : ''}
            onChange={(e) =>
              onCambiar('periodo', e.target.value ? `${e.target.value}-01` : '')
            }
          />
          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '3px' }}>
            Un registro contable por mes
          </div>
        </div>

        {/* Campos de rubros de costos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          {camposCostos.map((f) => (
            <div key={f.campo}>
              <label style={S.label}>{f.label}</label>
              <input
                style={S.input}
                type="number"
                min="0"
                step="1000"
                value={form[f.campo]}
                onChange={(e) => onCambiar(f.campo, e.target.value)}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>

        {/* Total preview en vivo */}
        <div
          style={{
            backgroundColor: '#e8f5e9',
            border: '1px solid #a5d6a7',
            borderRadius: '6px',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 600, color: '#334c2b', fontSize: '0.95rem' }}>
            Total de costos fijos del mes:
          </span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#c62828' }}>
            {formatPYG(totalCalculado)}
          </span>
        </div>

        {/* Notas */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={S.label}>📝 Notas (opcional)</label>
          <textarea
            style={{ ...S.input, minHeight: '60px', resize: 'vertical' }}
            value={form.notas || ''}
            onChange={(e) => onCambiar('notas', e.target.value)}
            placeholder="Ej: Mes con pago de aguinaldo. Mantenimiento anual del horno rotativo."
          />
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCerrar} style={S.btnGris}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={onGuardar}
            disabled={guardando}
            style={{ ...S.btnNaranja, opacity: guardando ? 0.7 : 1 }}
          >
            {guardando ? '⏳ Guardando…' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </>
  )
}
