import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(request, { params }) {
  const codigo = params.codigo.toUpperCase()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: diptico } = await supabase
    .from('codigos_dipticos')
    .select('codigo, producto_id, productos(nombre, imagen_url, descripcion, precio_venta)')
    .eq('codigo', codigo)
    .maybeSingle()

  const producto = diptico?.productos
  const nombreProducto = producto?.nombre || 'Panadería Artesanal PanFree'
  const descripcionProducto = producto?.descripcion || 'Disfruta de nuestros productos 100% libres de gluten.'
  const imagenProducto = producto?.imagen_url || 'https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png'
  const precioProducto = producto?.precio_venta ? `₲ ${Number(producto.precio_venta).toLocaleString('es-PY')}` : null
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://panfree.fit/diptico/${codigo}`
  const logoUrl = 'https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#fcfaf7',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 1. Header (Verde, con borde dorado) */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          backgroundColor: '#334c2b', 
          padding: '40px 20px', 
          color: '#eee6d9',
          borderBottom: '6px solid #b7996b'
        }}>
          <div style={{
            display: 'flex',
            backgroundColor: '#ffffff',
            padding: '15px 30px',
            borderRadius: '25px',
            marginBottom: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            <img src={logoUrl} width="120" height="120" style={{ objectFit: 'contain' }} alt="PanFree Logo" />
          </div>

          <h1 style={{ fontSize: '38px', margin: 0, fontWeight: '900', textAlign: 'center' }}>¡Gracias por elegir PanFree!</h1>
          <p style={{ fontSize: '20px', margin: '10px 0 0 0', color: '#b7996b', fontWeight: '600' }}>El placer de volver a comer libremente</p>
        </div>

        {/* 2. Cuerpo (Fondo crema) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', flex: 1 }}>
          
          {/* Tarjeta de Cupón */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: '#ffffff', 
            padding: '30px', 
            borderRadius: '24px', 
            border: '1px solid #e8dfd3', 
            width: '85%',
            boxShadow: '0 8px 20px rgba(51, 76, 43, 0.08)',
            marginBottom: '25px',
            position: 'relative'
          }}>
            {/* Barra superior de colores */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', display: 'flex' }}>
              <div style={{ width: '33%', height: '100%', backgroundColor: '#b7996b', borderTopLeftRadius: '24px' }} />
              <div style={{ width: '33%', height: '100%', backgroundColor: '#f46e15' }} />
              <div style={{ width: '34%', height: '100%', backgroundColor: '#334c2b', borderTopRightRadius: '24px' }} />
            </div>

            <span style={{ fontSize: '13px', color: '#f46e15', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '15px', marginBottom: '5px' }}>CLUB DE FIDELIDAD</span>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#334c2b', margin: '0 0 20px 0' }}>Tu código exclusivo</h2>

            {/* Caja del código */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              backgroundColor: '#fcfaf7', 
              padding: '25px', 
              borderRadius: '16px', 
              border: '3px dashed #b7996b', 
              width: '100%'
            }}>
              <span style={{ fontSize: '12px', color: '#8a7a6b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Código del Díptico</span>
              <span style={{ fontSize: '50px', fontWeight: '900', letterSpacing: '8px', color: '#334c2b', fontFamily: 'monospace' }}>{codigo}</span>
              <p style={{ fontSize: '14px', color: '#8a7a6b', margin: '8px 0 0 0' }}>Canjeá este código en panfree.fit/diptico</p>
            </div>
          </div>

          {/* Tarjeta del Producto Asociado */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            backgroundColor: '#ffffff', 
            padding: '20px', 
            borderRadius: '24px', 
            border: '1px solid #e8dfd3', 
            width: '85%',
            boxShadow: '0 8px 20px rgba(51, 76, 43, 0.08)',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <img 
              src={imagenProducto} 
              width="110" 
              height="110" 
              style={{ borderRadius: '16px', objectFit: 'cover', border: '1px solid #eee' }} 
              alt="Producto"
            />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '20px', flex: 1 }}>
              <span style={{ fontSize: '12px', color: '#b7996b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Producto Asociado</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#334c2b', marginBottom: '4px' }}>{nombreProducto}</span>
              <span style={{ fontSize: '14px', color: '#8a7a6b', lineHeight: 1.4 }}>{descripcionProducto}</span>
              {precioProducto && (
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#f46e15', marginTop: '6px' }}>{precioProducto}</span>
              )}
            </div>
          </div>

          {/* QR GRANDE Y DESTACADO */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#ffffff', 
            padding: '20px', 
            borderRadius: '24px', 
            border: '4px solid #b7996b',
            boxShadow: '0 10px 25px rgba(51, 76, 43, 0.15)',
          }}>
            <img src={qrUrl} width="280" height="280" alt="QR para canjear" />
            <span style={{ fontSize: '16px', color: '#334c2b', fontWeight: 'bold', marginTop: '10px' }}>Escaneá para sumar 100 puntos</span>
          </div>

        </div>

        {/* 3. Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#253920', padding: '20px', alignItems: 'center', borderTop: '6px solid #b7996b' }}>
          <span style={{ fontSize: '18px', color: '#f5f1eb', fontWeight: 'bold' }}>Pedidos online en panfree.fit</span>
          <span style={{ fontSize: '14px', color: '#b7996b', marginTop: '6px' }}>© 2026 PanFree. Encarnación, Paraguay.</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        'Content-Disposition': `attachment; filename="Diptico-PanFree-${codigo}.png"`,
      },
    }
  )
}