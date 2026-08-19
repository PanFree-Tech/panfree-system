/**
 * 📁 UBICACIÓN: src/app/admin/costos/components/CostosFijos.js
 * 📅 ACTUALIZADO: 2026-08-19 (Fase 3 - Refactor de Costos)
 * 📌 DESCRIPCIÓN: Pestaña 2 del módulo de costos: Registro y gestión de costos fijos mensuales.
 *    - Visualización tabular de rubros (alquiler, servicios, salarios, depreciación, software, marketing, otros, total)
 *    - Acciones para dar de alta nuevo mes, editar registro existente o eliminar
 *    - Guía de rubros sugeridos para estandarizar la imputación contable
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { formatPYG, labelPeriodo, S } from '../lib/calculos'

export default function CostosFijos({ fijos = [], onAbrirNuevo, onAbrirEditar, onEliminar }) {
  return (
    <>
      {/* Cabecera de la sección */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#334c2b', fontSize: '1.1rem' }}>
            🏗️ Costos Fijos Mensuales
          </h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>
            Alquiler, salarios, servicios, depreciación de equipos, software y marketing.
          </p>
        </div>
        <button type="button" onClick={onAbrirNuevo} style={S.btnNaranja}>
          + Cargar mes
        </button>
      </div>

      {/* Tabla o Estado Vacío */}
      {fijos.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#999' }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>🏗️</p>
          <p style={{ marginBottom: '1rem', color: '#666', fontSize: '1rem' }}>
            Todavía no cargaste ningún mes de costos fijos.
          </p>
          <button type="button" onClick={onAbrirNuevo} style={S.btnNaranja}>
            + Cargar primer mes
          </button>
        </div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr>
                {[
                  'Mes',
                  'Alquiler',
                  'Servicios',
                  'Salarios',
                  'Depreciación',
                  'Software',
                  'Marketing',
                  'Otros',
                  'TOTAL',
                  '',
                ].map((h) => (
                  <th key={h} style={S.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fijos.map((f, idx) => (
                <tr
                  key={f.id}
                  style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                >
                  <td
                    style={{
                      ...S.td,
                      fontWeight: 700,
                      color: '#334c2b',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {labelPeriodo(f.periodo)}
                  </td>
                  <td style={S.td}>{f.alquiler > 0 ? formatPYG(f.alquiler) : '—'}</td>
                  <td style={S.td}>{f.servicios > 0 ? formatPYG(f.servicios) : '—'}</td>
                  <td style={S.td}>{f.salarios > 0 ? formatPYG(f.salarios) : '—'}</td>
                  <td style={S.td}>
                    {f.depreciacion_equipos > 0 ? formatPYG(f.depreciacion_equipos) : '—'}
                  </td>
                  <td style={S.td}>
                    {f.licencias_software > 0 ? formatPYG(f.licencias_software) : '—'}
                  </td>
                  <td style={S.td}>{f.marketing > 0 ? formatPYG(f.marketing) : '—'}</td>
                  <td style={S.td}>{f.otros > 0 ? formatPYG(f.otros) : '—'}</td>
                  <td
                    style={{
                      ...S.td,
                      fontWeight: 800,
                      color: '#c62828',
                      fontSize: '1rem',
                    }}
                  >
                    {formatPYG(f.total_fijos)}
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => onAbrirEditar(f)}
                        style={{ ...S.btnVerde, padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        title="Editar costos del mes"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar(f.id)}
                        style={{
                          ...S.btnGris,
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.78rem',
                          backgroundColor: '#c62828',
                        }}
                        title="Eliminar registro"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Guía informativa de rubros */}
      <div
        style={{
          ...S.card,
          backgroundColor: '#f9f5f0',
          fontSize: '0.88rem',
          color: '#555',
          marginTop: '0.5rem',
        }}
      >
        <strong style={{ color: '#334c2b' }}>📌 ¿Qué incluir en cada rubro? </strong>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.5rem',
            marginTop: '0.75rem',
          }}
        >
          {[
            { icon: '🏠', label: 'Alquiler', desc: 'Local de producción y salón de ventas' },
            { icon: '💡', label: 'Servicios', desc: 'Luz (ANDE), agua, gas, internet' },
            { icon: '👷', label: 'Salarios', desc: 'Sueldos del personal + aportes IPS' },
            { icon: '⚙️', label: 'Depreciación', desc: 'Hornos, amasadoras y equipamiento' },
            { icon: '💻', label: 'Software', desc: 'Supabase, hosting, apps y dominio' },
            { icon: '📣', label: 'Marketing', desc: 'Publicidad digital, redes e impresiones' },
            { icon: '📦', label: 'Otros', desc: 'Gastos de limpieza y varios no clasificados' },
          ].map((r) => (
            <div
              key={r.label}
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}
            >
              <span>{r.icon}</span>
              <span>
                <strong>{r.label}: </strong>
                {r.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
