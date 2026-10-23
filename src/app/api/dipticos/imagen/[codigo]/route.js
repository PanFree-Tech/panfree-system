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
          padding: '30px 20px', 
          color: '#eee6d9',
          borderBottom: '6px solid #b7996b'
        }}>
          {/* Logo con bordes redondeados (sin fondo blanco) */}
          <div style={{ display: 'flex', marginBottom: '15px' }}>
            <img 
              src={logoUrl} 
              width="180" 
              height="180" 
              style={{ objectFit: 'contain', borderRadius: '20px' }} 
              alt="PanFree Logo" 
            />
          </div>

          <h1 style={{ fontSize: '45px', margin: 0, fontWeight: '900', textAlign: 'center', letterSpacing: '-1px' }}>¡Gracias por elegir PanFree!</h1>
          <p style={{ fontSize: '24px', margin: '10px 0 0 0', color: '#b7996b', fontWeight: '600' }}>El placer de volver a comer libremente</p>
        </div>

        {/* 2. Cuerpo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px', flex: 1 }}>
          
          {/* Tarjeta de Cupón */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: '#ffffff', 
            padding: '30px', 
            borderRadius: '24px', 
            border: '1px solid #e8dfd3', 
            width: '90%',
            boxShadow: '0 8px 20px rgba(51, 76, 43, 0.08)',
            marginBottom: '20px',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', display: 'flex' }}>
              <div style={{ width: '33%', height: '100%', backgroundColor: '#b7996b', borderTopLeftRadius: '24px' }} />
              <div style={{ width: '33%', height: '100%', backgroundColor: '#f46e15' }} />
              <div style={{ width: '34%', height: '100%', backgroundColor: '#334c2b', borderTopRightRadius: '24px' }} />
            </div>

            <span style={{ fontSize: '16px', color: '#f46e15', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '15px', marginBottom: '5px' }}>CLUB DE FIDELIDAD</span>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#334c2b', margin: '0 0 20px 0' }}>Tu código exclusivo</h2>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              backgroundColor: '#fcfaf7', 
              padding: '30px', 
              borderRadius: '16px', 
              border: '4px dashed #b7996b', 
              width: '100%'
            }}>
              <span style={{ fontSize: '16px', color: '#8a7a6b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Código del Díptico</span>
              <span style={{ fontSize: '70px', fontWeight: '900', letterSpacing: '10px', color: '#334c2b', fontFamily: 'monospace' }}>{codigo}</span>
              <p style={{ fontSize: '18px', color: '#8a7a6b', margin: '10px 0 0 0' }}>Canjeá este código en panfree.fit/diptico</p>
            </div>
          </div>

          {/* Tarjeta del Producto (SIN ETIQUETAS, solo los datos) */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            backgroundColor: '#ffffff', 
            padding: '20px', 
            borderRadius: '24px', 
            border: '1px solid #e8dfd3', 
            width: '90%',
            boxShadow: '0 8px 20px rgba(51, 76, 43, 0.08)',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <img 
              src={imagenProducto} 
              width="140" 
              height="140" 
              style={{ borderRadius: '16px', objectFit: 'cover', border: '2px solid #eee' }} 
              alt="Producto"
            />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '20px', flex: 1, justifyContent: 'center' }}>
              {/* Título en grande */}
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#334c2b', marginBottom: '6px', lineHeight: 1.2 }}>{nombreProducto}</span>
              
              {/* Descripción más chica */}
              <span style={{ fontSize: '16px', color: '#8a7a6b', lineHeight: 1.4, marginBottom: '8px' }}>{descripcionProducto}</span>
              
              {/* Precio destacado */}
              {precioProducto && (
                <span style={{ fontSize: '32px', fontWeight: '900', color: '#f46e15', marginTop: '4px' }}>{precioProducto}</span>
              )}
            </div>
          </div>

          {/* QR GRANDE + LINK VISIBLE */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#ffffff', 
            padding: '20px', 
            borderRadius: '24px', 
            border: '6px solid #334c2b',
            boxShadow: '0 10px 30px rgba(51, 76, 43, 0.15)',
            width: '90%'
          }}>
            <img src={qrUrl} width="450" height="450" alt="QR para canjear" />

            {/* Link visible */}
            <div style={{ 
              marginTop: '15px', 
              padding: '15px 20px', 
              backgroundColor: '#fcfaf7', 
              borderRadius: '12px', 
              border: '2px solid #e8dfd3',
              width: '100%',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '20px', color: '#8a7a6b', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                ¿No podés escanear? Ingresá a:
              </span>
              <span style={{ fontSize: '28px', fontWeight: '900', color: '#f46e15', fontFamily: 'monospace' }}>
                panfree.fit/diptico/{codigo}
              </span>
            </div>

            <span style={{ fontSize: '20px', color: '#334c2b', fontWeight: 'bold', marginTop: '15px' }}>Escaneá para sumar 100 puntos</span>
          </div>

        </div>

        {/* 3. Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#253920', padding: '20px', alignItems: 'center', borderTop: '6px solid #b7996b' }}>
          <span style={{ fontSize: '22px', color: '#f5f1eb', fontWeight: 'bold' }}>Pedidos online en panfree.fit</span>
          <span style={{ fontSize: '16px', color: '#b7996b', marginTop: '6px' }}>© 2026 PanFree. Encarnación, Paraguay.</span>
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