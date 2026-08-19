/**
 * 📁 UBICACIÓN: src/app/admin/costos/components/MargenReal.js
 * 📅 ACTUALIZADO: 2026-08-19 (Fase 3 - Refactor de Costos)
 * 📌 DESCRIPCIÓN: Pestaña 3 del módulo de costos: Margen Real (Materia Prima + Costos Fijos Prorrateados).
 *    - Selector de mes de análisis
 *    - Resumen financiero del mes: Costos fijos totales, unidades producidas y costo fijo por unidad
 *    - Tabla comparativa por producto: Precio de venta, Costo variable, Costo fijo, Costo total y Margen real %
 *    - Badges de rentabilidad real y explicación de la fórmula matemática aplicada
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import {
  formatPYG,
  colorMargen,
  badgeMargen,
  labelPeriodo,
  calcularMargenReal,
  S,
} from '../lib/calculos'

export default function MargenReal({
  datos = [],
  fijos = [],
  mesSel,
  setMesSel,
  unidadesMes = 0,
  onIrAFijos,
}) {
  const fijosMes = fijos.find((f) => f.periodo === mesSel)
  const totalFijosMes = Number(fijosMes?.total_fijos || 0)
  const costoPorUnidadFijo = unidadesMes > 0 ? totalFijosMes / unidadesMes : 0

  return (
    <>
      {/* Selector de Mes */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <label style={S.label}>Mes a analizar</label>
          <select
            style={{ ...S.input, width: 'auto', minWidth: '220px' }}
            value={mesSel}
            onChange={(e) => setMesSel(e.target.value)}
          >
            {fijos.length === 0 ? (
              <option value="">— Sin datos de costos fijos —</option>
            ) : (
              fijos.map((f) => (
                <option key={f.id} value={f.periodo}>
                  {labelPeriodo(f.periodo)}
                </option>
              ))
            )}
          </select>
        </div>
        {fijos.length === 0 && (
          <button type="button" onClick={onIrAFijos} style={S.btnNaranja}>
            + Cargar costos fijos primero
          </button>
        )}
      </div>

      {fijosMes ? (
        <>
          {/* Resumen de costos y producción del mes */}
          <div style={{ ...S.card, backgroundColor: '#f9f5f0', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#334c2b', fontSize: '1rem' }}>
              📊 Resumen — {labelPeriodo(mesSel)}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0d5c5',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                  Total costos fijos
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c62828' }}>
                  {formatPYG(totalFijosMes)}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0d5c5',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                  Unidades producidas
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#334c2b' }}>
                  {unidadesMes > 0 ? (
                    unidadesMes
                  ) : (
                    <span style={{ color: '#f46e15', fontSize: '0.9rem' }}>Sin datos</span>
                  )}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0d5c5',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                  Costo fijo por unidad
                </div>
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: costoPorUnidadFijo > 0 ? '#f46e15' : '#aaa',
                  }}
                >
                  {costoPorUnidadFijo > 0 ? formatPYG(Math.round(costoPorUnidadFijo)) : '—'}
                </div>
              </div>
            </div>

            {unidadesMes === 0 && (
              <div
                style={{
                  backgroundColor: '#fff8e1',
                  border: '1px solid #f9c74f',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginTop: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#5a4000',
                }}
              >
                ⚠️ No se encontraron registros de producción finalizados en {labelPeriodo(mesSel)}. Cargá la producción del mes para prorratear con precisión el costo fijo por unidad.
              </div>
            )}
          </div>

          {/* Tabla de Margen Real */}
          <div style={{ ...S.card, padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr>
                  {[
                    'Producto',
                    'Precio Venta',
                    'Costo Variable',
                    '+ Costo Fijo/u',
                    '= Costo Total',
                    'Margen Real %',
                    'Estado Real',
                  ].map((h) => (
                    <th key={h} style={S.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.map((d, idx) => {
                  const { costoVariable, costoFijo, costoTotal, margen } = calcularMargenReal(
                    d,
                    costoPorUnidadFijo
                  )
                  const badge = badgeMargen(margen)
                  const sinRend = !d.rendimiento_kg || Number(d.rendimiento_kg) <= 0

                  return (
                    <tr
                      key={d.producto_id}
                      style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                    >
                      <td style={S.td}>
                        <strong style={{ color: '#334c2b' }}>{d.producto_nombre}</strong>
                      </td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{formatPYG(d.precio_venta)}</td>
                      <td style={{ ...S.td, color: '#f46e15' }}>
                        {sinRend ? (
                          <span style={{ color: '#aaa' }}>—</span>
                        ) : (
                          formatPYG(Math.round(costoVariable))
                        )}
                      </td>
                      <td style={{ ...S.td, color: '#c62828' }}>
                        {costoPorUnidadFijo > 0 ? formatPYG(Math.round(costoFijo)) : '—'}
                      </td>
                      <td style={{ ...S.td, fontWeight: 700, color: '#c62828' }}>
                        {sinRend || costoPorUnidadFijo === 0
                          ? '—'
                          : formatPYG(Math.round(costoTotal))}
                      </td>
                      <td
                        style={{
                          ...S.td,
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: colorMargen(margen),
                        }}
                      >
                        {sinRend || costoPorUnidadFijo === 0 ? '—' : `${margen}%`}
                      </td>
                      <td style={S.td}>
                        {sinRend || costoPorUnidadFijo === 0 ? (
                          <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Sin datos</span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '20px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {badge.text}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Guía de cálculo */}
          <div
            style={{
              ...S.card,
              backgroundColor: '#f9f5f0',
              fontSize: '0.85rem',
              color: '#555',
              marginTop: '0.5rem',
            }}
          >
            <strong style={{ color: '#334c2b' }}>📌 ¿Cómo se calcula el Margen Real? </strong>
            <div style={{ marginTop: '0.5rem', lineHeight: '1.8' }}>
              <div>
                <strong>Costo variable/unidad</strong> = Costo/kg de materia prima × Peso por unidad (o costo total de la tanda).
              </div>
              <div>
                <strong>Costo fijo/unidad</strong> = Total costos fijos del mes ÷ Unidades totales producidas en el mes.
              </div>
              <div>
                <strong>Margen real %</strong> = ((Precio venta − Costo total) ÷ Precio venta) × 100
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#999' }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>🎯</p>
          <p style={{ marginBottom: '1rem', color: '#666', fontSize: '1rem' }}>
            {fijos.length === 0
              ? 'Primero cargá los costos fijos del mes en la pestaña 🏗️ Costos Fijos.'
              : 'Seleccioná un mes para ver el margen real.'}
          </p>
          <button type="button" onClick={onIrAFijos} style={S.btnNaranja}>
            Ir a Costos Fijos
          </button>
        </div>
      )}
    </>
  )
}
