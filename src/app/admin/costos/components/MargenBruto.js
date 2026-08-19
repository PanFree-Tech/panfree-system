/**
 * 📁 UBICACIÓN: src/app/admin/costos/components/MargenBruto.js
 * 📅 ACTUALIZADO: 2026-08-19 (Fase 3 - Refactor de Costos)
 * 📌 DESCRIPCIÓN: Pestaña 1 del módulo de costos: Margen Bruto basado en costo de materias primas.
 *    - KPIs generales (productos con receta, margen promedio, alertas de pérdida/ajustado)
 *    - Filtros por nivel de margen (todos, bueno ≥40%, ajustado 20-40%, pérdida <20%)
 *    - Vista en tabla y vista en tarjetas
 *    - Precios sugeridos de venta (20%, 40%, 60%) y acceso rápido a edición de recetas
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { formatPYG, formatKG, colorMargen, badgeMargen, S } from '../lib/calculos'

export default function MargenBruto({ datos = [], filtro, setFiltro, vista, router }) {
  const filtrados =
    filtro === 'perdida'
      ? datos.filter((d) => Number(d.margen_porcentaje) < 20)
      : filtro === 'ajustado'
      ? datos.filter(
          (d) => Number(d.margen_porcentaje) >= 20 && Number(d.margen_porcentaje) < 40
        )
      : filtro === 'bueno'
      ? datos.filter((d) => Number(d.margen_porcentaje) >= 40)
      : datos

  const margenProm = datos.length
    ? datos.reduce((s, d) => s + Number(d.margen_porcentaje || 0), 0) / datos.length
    : 0
  const sinRendim = datos.filter((d) => !d.rendimiento_kg || Number(d.rendimiento_kg) <= 0).length
  const conPerdida = datos.filter((d) => Number(d.margen_porcentaje) < 20).length
  const conBuenMarg = datos.filter((d) => Number(d.margen_porcentaje) >= 40).length

  return (
    <>
      {/* Alerta de productos sin rendimiento cargado */}
      {sinRendim > 0 && (
        <div
          style={{
            backgroundColor: '#fff8e1',
            border: '2px solid #f9c74f',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ color: '#5a4000', fontSize: '0.92rem' }}>
            ⚠️ <strong>{sinRendim} producto{sinRendim > 1 ? 's' : ''}</strong> sin rendimiento en kg — los costos no son exactos todavía.
          </span>
          <button
            type="button"
            onClick={() => router.push('/admin/recetas')}
            style={{ ...S.btnNaranja, padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
          >
            ✏️ Completar en Recetas
          </button>
        </div>
      )}

      {/* KPIs de Margen Bruto */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          { label: 'Productos con receta', valor: datos.length, color: '#334c2b' },
          {
            label: 'Margen bruto promedio',
            valor: `${margenProm.toFixed(1)}%`,
            color: colorMargen(margenProm),
          },
          { label: 'Con pérdida o margen bajo', valor: conPerdida, color: '#c62828' },
          { label: 'Con buen margen (≥40%)', valor: conBuenMarg, color: '#2e7d32' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{ ...S.card, textAlign: 'center', padding: '1.25rem', marginBottom: 0 }}
          >
            <p style={{ fontSize: '2rem', fontWeight: 700, color: kpi.color, margin: 0 }}>
              {kpi.valor}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#666', margin: '0.3rem 0 0' }}>
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Botones de Filtro */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { val: 'todos', label: '📋 Todos' },
          { val: 'bueno', label: '✅ Buen margen (≥40%)' },
          { val: 'ajustado', label: '⚠️ Ajustado (20-40%)' },
          { val: 'perdida', label: '🔴 Con pérdida (<20%)' },
        ].map((f) => (
          <button
            key={f.val}
            type="button"
            onClick={() => setFiltro(f.val)}
            style={{
              ...S.btnVerde,
              backgroundColor: filtro === f.val ? '#f46e15' : '#334c2b',
              fontSize: '0.85rem',
              padding: '0.4rem 0.9rem',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Vista en Tabla */}
      {vista === 'tabla' ? (
        <div style={{ ...S.card, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr>
                {[
                  'Producto',
                  'Rinde',
                  'Costo/KG',
                  'Precio Venta',
                  'Margen ₲',
                  'Margen %',
                  'P. 20%',
                  '🎯 P. 40%',
                  'P. 60%',
                  'Estado',
                  '',
                ].map((h) => (
                  <th key={h} style={S.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((d, idx) => {
                const badge = badgeMargen(d.margen_porcentaje)
                const sinRend = !d.rendimiento_kg || Number(d.rendimiento_kg) <= 0
                return (
                  <tr
                    key={d.producto_id}
                    style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                  >
                    <td style={S.td}>
                      <strong style={{ color: '#334c2b' }}>{d.producto_nombre}</strong>
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      {sinRend ? (
                        <span style={{ color: '#f46e15', fontSize: '0.8rem', fontWeight: 600 }}>
                          ⚠️ Sin dato
                        </span>
                      ) : (
                        <strong>{formatKG(d.rendimiento_kg)}</strong>
                      )}
                    </td>
                    <td style={{ ...S.td, fontWeight: 700, color: sinRend ? '#aaa' : '#c62828' }}>
                      {sinRend ? '—' : formatPYG(d.costo_por_kg)}
                    </td>
                    <td style={S.td}>{formatPYG(d.precio_venta)}</td>
                    <td
                      style={{
                        ...S.td,
                        fontWeight: 700,
                        color: colorMargen(d.margen_porcentaje),
                      }}
                    >
                      {sinRend ? '—' : formatPYG(d.margen_bruto_kg)}
                    </td>
                    <td
                      style={{
                        ...S.td,
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: colorMargen(d.margen_porcentaje),
                      }}
                    >
                      {d.margen_porcentaje}%
                    </td>
                    <td style={{ ...S.td, color: '#555', fontSize: '0.85rem' }}>
                      {sinRend ? '—' : formatPYG(d.precio_sugerido_20pct)}
                    </td>
                    <td
                      style={{
                        ...S.td,
                        color: '#f46e15',
                        fontWeight: 700,
                        backgroundColor: '#fff8f0',
                      }}
                    >
                      {sinRend ? '—' : formatPYG(d.precio_sugerido_40pct)}
                    </td>
                    <td style={{ ...S.td, color: '#b7996b', fontWeight: 700 }}>
                      {sinRend ? '—' : formatPYG(d.precio_sugerido_60pct)}
                    </td>
                    <td style={S.td}>
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
                    </td>
                    <td style={S.td}>
                      <button
                        type="button"
                        onClick={() => router.push('/admin/recetas')}
                        style={{ ...S.btnVerde, padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        title="Editar receta"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Vista en Tarjetas */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {filtrados.map((d) => {
            const badge = badgeMargen(d.margen_porcentaje)
            const sinRend = !d.rendimiento_kg || Number(d.rendimiento_kg) <= 0
            return (
              <div
                key={d.producto_id}
                style={{
                  ...S.card,
                  marginBottom: 0,
                  borderLeft: `4px solid ${colorMargen(d.margen_porcentaje)}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      color: '#334c2b',
                      fontSize: '0.95rem',
                      flex: 1,
                      paddingRight: '0.5rem',
                    }}
                  >
                    {d.producto_nombre}
                  </h3>
                  <span
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {badge.text}
                  </span>
                </div>
                {sinRend && (
                  <div
                    style={{
                      backgroundColor: '#fff8e1',
                      borderRadius: '4px',
                      padding: '0.4rem 0.6rem',
                      marginBottom: '0.6rem',
                      fontSize: '0.8rem',
                      color: '#5a4000',
                    }}
                  >
                    ⚠️ Falta cargar rendimiento en Recetas
                  </div>
                )}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ color: '#666' }}>Rinde: </div>
                  <div style={{ fontWeight: 700, color: '#334c2b' }}>
                    {sinRend ? '—' : formatKG(d.rendimiento_kg)}
                  </div>
                  <div style={{ color: '#666' }}>Costo/kg: </div>
                  <div style={{ fontWeight: 700, color: '#c62828' }}>
                    {sinRend ? '—' : formatPYG(d.costo_por_kg)}
                  </div>
                  <div style={{ color: '#666' }}>Precio actual: </div>
                  <div style={{ fontWeight: 700 }}>{formatPYG(d.precio_venta)}</div>
                  <div style={{ color: '#666' }}>Margen bruto: </div>
                  <div style={{ fontWeight: 700, color: colorMargen(d.margen_porcentaje) }}>
                    {d.margen_porcentaje}%
                  </div>
                </div>
                {!sinRend && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      borderTop: '1px solid #f0ebe3',
                      paddingTop: '0.75rem',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.3rem' }}>
                      Precios sugeridos:{' '}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          backgroundColor: '#f0ebe3',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        20% → <strong>{formatPYG(d.precio_sugerido_20pct)}</strong>
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          backgroundColor: '#fff3e0',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        🎯 40% →{' '}
                        <strong style={{ color: '#f46e15' }}>
                          {formatPYG(d.precio_sugerido_40pct)}
                        </strong>
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          backgroundColor: '#f9f0e0',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        60% →{' '}
                        <strong style={{ color: '#b7996b' }}>
                          {formatPYG(d.precio_sugerido_60pct)}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => router.push('/admin/recetas')}
                  style={{
                    ...S.btnVerde,
                    width: '100%',
                    marginTop: '0.75rem',
                    padding: '0.4rem',
                    fontSize: '0.82rem',
                  }}
                >
                  ✏️ Editar receta
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Nota Explicativa */}
      <div
        style={{
          ...S.card,
          backgroundColor: '#f9f5f0',
          fontSize: '0.88rem',
          color: '#555',
          marginTop: '0.5rem',
        }}
      >
        <strong style={{ color: '#334c2b' }}>📌 Margen bruto — solo materia prima: </strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>
            <strong>Costo/kg</strong> = Costo total de ingredientes ÷ Rendimiento en kg.
          </li>
          <li>
            El margen mostrado <strong>NO incluye</strong> mano de obra, gas, luz, alquiler ni costos fijos.
          </li>
          <li>
            Para ver el margen real con todos los costos usá la pestaña <strong>🎯 Margen Real</strong>.
          </li>
        </ul>
      </div>
    </>
  )
}
