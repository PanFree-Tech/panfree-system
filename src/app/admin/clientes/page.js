/**
 * 📁 UBICACIÓN: src/app/admin/clientes/page.js
 * 📅 ACTUALIZADO: 2026-08-19 (Fase 4 - Sistema Compartido)
 * 📌 DESCRIPCIÓN: Listado de clientes registrados con su historial de pedidos y contacto directo por WhatsApp.
 * ⚠️  EN CASO DE MODIFICACIÓN SIGNIFICATIVA, actualizar este comentario.
 */

'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Truck,
  Store,
  Banknote,
  Landmark,
  FileText,
  X,
  Send,
  Loader2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase-client'
import { S, COLORS } from '../_styles'
import { formatFecha, formatPYG } from '../lib/helpers'

export default function AdminClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [selected, setSelected] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [loadingPedidos, setLoadingPedidos] = useState(false)

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    setLoading(true)
    try {
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setClientes(data || [])
    } catch (err) {
      console.error('[PanFree] Error cargando clientes:', err)
    } finally {
      setLoading(false)
    }
  }

  async function verPedidos(cliente) {
    setSelected(cliente)
    setLoadingPedidos(true)
    try {
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const { data } = await supabase
        .from('pedidos')
        .select('numero_pedido, estado, total_final, created_at, metodo_entrega, metodo_pago')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false })
      setPedidos(data || [])
    } catch (err) {
      console.error('[PanFree] Error cargando pedidos:', err)
    } finally {
      setLoadingPedidos(false)
    }
  }

  const filtrados = clientes.filter(
    (c) =>
      c.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.telefono?.includes(busqueda)
  )

  const ESTADO_COLOR = {
    pendiente: COLORS.naranja,
    confirmado: COLORS.verde,
    en_produccion: COLORS.azul,
    listo: COLORS.verdeOscuro,
    entregado: COLORS.gris,
    cancelado: COLORS.rojo,
  }

  return (
    <div style={{ fontFamily: '"Segoe UI", sans-serif' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 0.25rem',
              color: COLORS.verdeOscuro,
              fontSize: '1.6rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Users size={26} /> Clientes
          </h1>
          <p style={{ margin: 0, color: '#8f9a44', fontSize: '0.9rem' }}>
            {loading ? '...' : `${clientes.length} clientes registrados`}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.5rem',
            border: `2px solid ${COLORS.marfil}`,
            borderRadius: '8px',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            color: COLORS.verdeOscuro,
            backgroundColor: COLORS.blanco,
            boxSizing: 'border-box',
          }}
        />
        <Search
          size={18}
          color="#888"
          style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>

      {/* Layout: lista + detalle */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selected ? '1fr 1fr' : '1fr',
          gap: '1.5rem',
        }}
      >
        {/* Lista de clientes */}
        <div>
          {loading ? (
            <p style={{ color: COLORS.gris, textAlign: 'center', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Loader2 className="animate-spin" size={18} /> Cargando clientes...
            </p>
          ) : filtrados.length === 0 ? (
            <p style={{ color: COLORS.gris, textAlign: 'center', padding: '2rem' }}>
              No se encontraron clientes
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtrados.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => verPedidos(cliente)}
                  style={{
                    backgroundColor: selected?.id === cliente.id ? '#f9f5f0' : COLORS.blanco,
                    border: `2px solid ${
                      selected?.id === cliente.id ? COLORS.marfil : COLORS.grisBorde
                    }`,
                    borderRadius: '8px',
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = COLORS.marfil)}
                  onMouseOut={(e) =>
                    (e.currentTarget.style.borderColor =
                      selected?.id === cliente.id ? COLORS.marfil : COLORS.grisBorde)
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: '0 0 0.25rem',
                          fontWeight: '700',
                          color: COLORS.verdeOscuro,
                          fontSize: '0.95rem',
                        }}
                      >
                        {cliente.nombre_completo || 'Sin nombre'}
                      </p>
                      <p style={{ margin: '0 0 0.2rem', color: COLORS.gris, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={13} color="#888" /> {cliente.email || '—'}
                      </p>
                      {cliente.telefono && (
                        <p style={{ margin: 0, color: COLORS.gris, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Phone size={13} color="#888" /> {cliente.telefono}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          backgroundColor: cliente.is_active ? '#e8f5e9' : '#ffebee',
                          color: cliente.is_active ? COLORS.verde : COLORS.rojo,
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        {cliente.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <p
                        style={{
                          margin: '0.3rem 0 0',
                          color: COLORS.grisClaro,
                          fontSize: '0.75rem',
                        }}
                      >
                        {formatFecha(cliente.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Preferencias */}
                  <div
                    style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {cliente.prefiere_delivery && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          backgroundColor: COLORS.beige,
                          color: COLORS.verdeOscuro,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Truck size={12} /> Delivery
                      </span>
                    )}
                    {cliente.prefiere_retiro && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          backgroundColor: COLORS.beige,
                          color: COLORS.verdeOscuro,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Store size={12} /> Retiro
                      </span>
                    )}
                    {cliente.direccion_ciudad && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          backgroundColor: COLORS.beige,
                          color: COLORS.verdeOscuro,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <MapPin size={12} /> {cliente.direccion_ciudad}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel detalle */}
        {selected && (
          <div
            style={{
              backgroundColor: COLORS.blanco,
              border: `2px solid ${COLORS.marfil}`,
              borderRadius: '8px',
              padding: '1.5rem',
              position: 'sticky',
              top: '1rem',
              alignSelf: 'start',
            }}
          >
            {/* Header detalle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: COLORS.verdeOscuro,
                  fontSize: '1.1rem',
                  fontWeight: '700',
                }}
              >
                {selected.nombre_completo || 'Sin nombre'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setPedidos([])
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.grisClaro,
                  padding: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Info contacto */}
            <div
              style={{
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              {selected.email && (
                <p style={{ margin: 0, color: '#555', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} color="#666" /> {selected.email}
                </p>
              )}
              {selected.telefono && (
                <p style={{ margin: 0, color: '#555', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} color="#666" /> {selected.telefono}
                </p>
              )}
              {selected.direccion_calle && (
                <p style={{ margin: 0, color: '#555', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} color="#666" /> {selected.direccion_calle} {selected.direccion_numero}{' '}
                  {selected.direccion_piso_dept || ''}, {selected.direccion_ciudad || ''}
                </p>
              )}
              {selected.notas_cliente && (
                <p
                  style={{
                    margin: '0.5rem 0 0',
                    color: COLORS.gris,
                    fontSize: '0.85rem',
                    backgroundColor: '#f9f6f1',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${COLORS.marfil}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.35rem',
                  }}
                >
                  <FileText size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> {selected.notas_cliente}
                </p>
              )}
            </div>

            {/* Pedidos del cliente */}
            <h3
              style={{
                margin: '0 0 0.75rem',
                color: COLORS.verdeOscuro,
                fontSize: '0.95rem',
                fontWeight: '700',
                borderTop: '1px solid #e8ddd0',
                paddingTop: '1rem',
              }}
            >
              Historial de pedidos
            </h3>

            {loadingPedidos ? (
              <p style={{ color: COLORS.grisClaro, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Loader2 className="animate-spin" size={14} /> Cargando...
              </p>
            ) : pedidos.length === 0 ? (
              <p style={{ color: COLORS.grisClaro, fontSize: '0.85rem' }}>
                Sin pedidos registrados
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pedidos.map((p) => (
                  <div
                    key={p.numero_pedido}
                    style={{
                      backgroundColor: '#f9f6f1',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: '0 0 0.2rem',
                          fontWeight: '700',
                          color: COLORS.verdeOscuro,
                          fontSize: '0.88rem',
                        }}
                      >
                        {p.numero_pedido}
                      </p>
                      <p style={{ margin: 0, color: COLORS.grisClaro, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {formatFecha(p.created_at || p.fecha_pedido)} ·{' '}
                        {p.metodo_entrega === 'delivery' ? <Truck size={12} /> : <Store size={12} />} ·{' '}
                        {p.metodo_pago === 'efectivo' ? <Banknote size={12} /> : <Landmark size={12} />}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          margin: '0 0 0.2rem',
                          color: COLORS.naranja,
                          fontWeight: '800',
                          fontSize: '0.9rem',
                        }}
                      >
                        {formatPYG(p.total_final)}
                      </p>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: ESTADO_COLOR[p.estado] || '#555',
                        }}
                      >
                        {p.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botón WhatsApp */}
            {selected.telefono && (
              <a
                href={
                  'https://wa.me/' +
                  selected.telefono.replace(/\D/g, '') +
                  '?text=' +
                  encodeURIComponent(
                    'Hola ' +
                      (selected.nombre_completo?.split(' ')[0] || '') +
                      '! Te contactamos desde PanFree.'
                  )
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  textAlign: 'center',
                  backgroundColor: COLORS.whatsapp,
                  color: COLORS.blanco,
                  padding: '0.7rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                }}
              >
                <Send size={18} style={{ flexShrink: 0 }} />
                Contactar por WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
