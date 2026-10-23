'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import TicketCupon from '@/components/TicketCupon'
import { Gift, Search, User } from 'lucide-react'

export default function AdminCuponesPage() {
  const [canjes, setCanjes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    async function cargarCanjes() {
      setLoading(true)
      // Trae los canjes con el nombre del cliente y del premio
      const { data, error } = await supabase
        .from('canjes_premios')
        .select(`
          id,
          cupon_generado,
          created_at,
          puntos_gastados,
          clientes ( nombre_completo, email ),
          premios ( nombre, tipo, valor )
        `)
        .not('cupon_generado', 'is', null) // Solo los que tienen cupón generado
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar canjes:', error)
      } else {
        setCanjes(data || [])
      }
      setLoading(false)
    }

    cargarCanjes()
  }, [])

  // Filtro de búsqueda por nombre de cliente o código de cupón
  const canjesFiltrados = canjes.filter(c => 
    c.clientes?.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cupon_generado?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.clientes?.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Segoe UI", sans-serif' }}>
      
      {/* Cabecera */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#334c2b', fontSize: '1.8rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gift color="#f46e15" size={28} />
          Cupones de Premios
        </h1>
        <p style={{ color: '#666', margin: 0 }}>Historial de premios canjeados y generación de tickets para WhatsApp.</p>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '0.5rem', 
        backgroundColor: '#fff', border: '1px solid #b7996b', 
        borderRadius: '8px', padding: '0.5rem 1rem', marginBottom: '1.5rem',
        maxWidth: '400px'
      }}>
        <Search size={18} color="#888" />
        <input
          type="text"
          placeholder="Buscar por cliente o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', backgroundColor: 'transparent' }}
        />
      </div>

      {/* Tabla de canjes */}
      {loading ? (
        <p style={{ color: '#666' }}>Cargando canjes...</p>
      ) : canjesFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fcfaf7', borderRadius: '12px', border: '1px dashed #b7996b' }}>
          <Gift size={48} color="#b7996b" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ color: '#666', margin: 0 }}>No se encontraron cupones generados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {canjesFiltrados.map((canje) => (
            <div key={canje.id} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: '#fff',
              border: '1px solid #eee6d9',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              
              {/* Datos del cliente */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334c2b', fontWeight: '600', marginBottom: '0.25rem' }}>
                  <User size={16} /> {canje.clientes?.nombre_completo || 'Cliente Desconocido'}
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                  {canje.clientes?.email || 'Sin email'} • {new Date(canje.created_at).toLocaleDateString('es-PY')}
                </div>
              </div>

              {/* Datos del premio */}
              <div>
                <div style={{ fontWeight: '600', color: '#f46e15' }}>{canje.premios?.nombre || 'Premio'}</div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>
                  {canje.puntos_gastados} puntos gastados
                </div>
              </div>

              {/* Código y Botón de descarga */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold', color: '#334c2b', backgroundColor: '#eee6d9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  {canje.cupon_generado}
                </span>
                {/* Integración del Componente de Ticket */}
                {canje.cupon_generado && (
                  <TicketCupon cupon={{ 
                    codigo: canje.cupon_generado, 
                    tipo_descuento: canje.premios?.tipo === 'descuento' ? 'porcentaje' : 'monto_fijo',
                    valor_descuento: canje.premios?.valor,
                    fecha_expiracion: null // Si tu tabla de canjes no guarda fecha de expiración, se omite
                  }} />
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
