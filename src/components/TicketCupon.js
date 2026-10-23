'use client'
import { useRef } from 'react'
import { toPng } from 'html-to-image'
import { Download, Ticket, Calendar, AlertCircle } from 'lucide-react'

export default function TicketCupon({ cupon }) {
  const ticketRef = useRef(null)

  const descargarImagen = async () => {
    if (ticketRef.current === null) return

    try {
      const dataUrl = await toPng(ticketRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#ffffff' 
      })
      
      const link = document.createElement('a')
      link.download = `Cupon-PanFree-${cupon.codigo}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error al descargar el cupón:', err)
      alert('Hubo un error al generar la imagen. Intentá de nuevo.')
    }
  }

  if (!cupon) return null

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      
      <div 
        ref={ticketRef} 
        style={{
          width: '400px',
          backgroundColor: '#fcfaf7',
          borderRadius: '16px',
          overflow: 'hidden',
          fontFamily: '"Segoe UI", sans-serif',
          boxShadow: '0 10px 25px rgba(51, 76, 43, 0.15)',
          border: '2px solid #b7996b'
        }}
      >
        <div style={{
          backgroundColor: '#334c2b',
          padding: '20px',
          textAlign: 'center',
          color: '#eee6d9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <Ticket size={32} color="#f46e15" />
          </div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>PanFree</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Cupón de Descuento Oficial</p>
        </div>

        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>Usá este código en el checkout:</p>
          
          <div style={{
            backgroundColor: '#eee6d9',
            border: '2px dashed #b7996b',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#334c2b',
            letterSpacing: '2px',
            marginBottom: '16px'
          }}>
            {cupon.codigo}
          </div>

          <h3 style={{ color: '#f46e15', fontSize: '20px', margin: '0 0 16px 0', fontWeight: 'bold' }}>
            {cupon.tipo_descuento === 'porcentaje' 
              ? `${cupon.valor_descuento}% de Descuento` 
              : `₲ ${Number(cupon.valor_descuento).toLocaleString('es-PY')} de Descuento`}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#666' }}>
            {cupon.fecha_expiracion && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Calendar size={14} color="#b7996b" />
                <span>Válido hasta: {new Date(cupon.fecha_expiracion).toLocaleDateString('es-PY')}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <AlertCircle size={14} color="#b7996b" />
              <span>Válido por única vez. Se desactiva al usarlo.</span>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#eee6d9',
          padding: '12px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#334c2b',
          fontWeight: '600'
        }}>
          Pedidos online en panfree.fit
        </div>
      </div>

      <button
        onClick={descargarImagen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#f46e15',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#d95f10'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#f46e15'}
      >
        <Download size={20} />
        Descargar Cupón para WhatsApp
      </button>
    </div>
  )
}
