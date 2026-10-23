'use client'
import { useRef } from 'react'
import { toPng } from 'html-to-image'
import { Download, Gift, QrCode } from 'lucide-react'

export default function TicketDiptico({ codigo, producto, onDescargar }) {
  const ticketRef = useRef(null)

  const descargarImagen = async () => {
    if (ticketRef.current === null) return
    try {
      const dataUrl = await toPng(ticketRef.current, { 
        cacheBust: true, 
        pixelRatio: 3,
        backgroundColor: '#ffffff' 
      })
      const link = document.createElement('a')
      link.download = `Diptico-PanFree-${codigo}.png`
      link.href = dataUrl
      link.click()
      if (onDescargar) onDescargar()
    } catch (err) {
      console.error('Error al descargar el díptico:', err)
      alert('Hubo un error al generar la imagen. Intentá de nuevo.')
    }
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://panfree.fit/diptico/${codigo}`)}`

  return (
    <div className="flex flex-col items-center gap-4">
      {/* DISEÑO DEL DÍPTICO (Lo que se descarga) */}
      <div 
        ref={ticketRef} 
        style={{
          width: '400px',
          backgroundColor: '#fcfaf7',
          borderRadius: '16px',
          overflow: 'hidden',
          fontFamily: '"Segoe UI", sans-serif',
          boxShadow: '0 10px 25px rgba(51, 76, 43, 0.15)',
          border: '3px solid #b7996b',
          position: 'relative'
        }}
      >
        {/* Cabecera Verde */}
        <div style={{
          backgroundColor: '#334c2b',
          padding: '20px',
          textAlign: 'center',
          color: '#eee6d9',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <Gift size={36} color="#f46e15" />
          </div>
          <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold', letterSpacing: '1px' }}>PanFree</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9, fontWeight: '600' }}>100% Sin Gluten · Encarnación</p>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '24px', textAlign: 'center', position: 'relative' }}>
          <h3 style={{ color: '#f46e15', fontSize: '20px', margin: '0 0 16px 0', fontWeight: '800', letterSpacing: '0.5px' }}>
            ¡GANÁ 100 PUNTOS DE REGALO!
          </h3>

          {/* Producto Asociado */}
          {producto && (
            <div style={{ 
              marginBottom: '16px', 
              backgroundColor: '#ffffff', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #e0d5c5' 
            }}>
              <img 
                src={producto.imagen_url || 'https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png'} 
                alt={producto.nombre || 'Producto'} 
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} 
              />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#334c2b' }}>
                {producto.nombre || 'PanFree'}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>
                Escaneá y sumá puntos con tu compra
              </p>
            </div>
          )}

          {/* QR Grande */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '16px',
            backgroundColor: '#ffffff',
            padding: '12px',
            borderRadius: '12px',
            border: '2px solid #b7996b',
            display: 'inline-block'
          }}>
            <img 
              src={qrUrl} 
              alt={`QR ${codigo}`} 
              style={{ width: '180px', height: '180px' }} 
            />
          </div>

          {/* Código */}
          <div style={{
            backgroundColor: '#eee6d9',
            border: '2px dashed #b7996b',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '26px',
            fontWeight: '900',
            color: '#334c2b',
            letterSpacing: '4px',
            fontFamily: 'monospace',
            marginBottom: '16px'
          }}>
            {codigo}
          </div>

          {/* Instrucciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#666', fontWeight: '600' }}>
            <p style={{ margin: 0 }}>1. Escaneá el QR con tu celular</p>
            <p style={{ margin: 0 }}>2. O ingresá a panfree.fit/diptico/{codigo}</p>
            <p style={{ margin: 0 }}>3. ¡Canjeá tus puntos y pedí tu regalo!</p>
          </div>
        </div>

        {/* Pie */}
        <div style={{
          backgroundColor: '#eee6d9',
          padding: '10px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#334c2b',
          fontWeight: '700'
        }}>
          Pedidos online en panfree.fit
        </div>
      </div>

      {/* Botón de descarga */}
      <button
        onClick={descargarImagen}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#f46e15', color: 'white', border: 'none',
          padding: '12px 24px', borderRadius: '8px', fontSize: '16px',
          fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s'
        }}
      >
        <Download size={20} />
        Descargar Díptico para WhatsApp
      </button>
    </div>
  )
}