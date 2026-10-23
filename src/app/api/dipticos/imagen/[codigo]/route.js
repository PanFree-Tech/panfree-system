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
    .select('codigo, producto_id, productos(nombre, imagen_url)')
    .eq('codigo', codigo)
    .maybeSingle()

  const producto = diptico?.productos
  const nombreProducto = producto?.nombre || 'PanFree'
  const imagenProducto = producto?.imagen_url || 'https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://panfree.fit/diptico/${codigo}`

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
          border: '6px solid #b7996b',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#334c2b', padding: '30px', color: '#eee6d9' }}>
          <h1 style={{ fontSize: '48px', margin: 0, fontWeight: 'bold' }}>PanFree</h1>
          <p style={{ fontSize: '20px', margin: '5px 0 0 0', opacity: 0.9 }}>100% Sin Gluten · Encarnación</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', flex: 1 }}>
          <h2 style={{ color: '#f46e15', fontSize: '32px', margin: '0 0 20px 0', textAlign: 'center' }}>¡GANÁ 100 PUNTOS DE REGALO!</h2>

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '15px', borderRadius: '15px', border: '2px solid #e0d5c5', marginBottom: '20px', width: '80%' }}>
            <img src={imagenProducto} width="100" height="100" style={{ borderRadius: '10px', objectFit: 'cover' }} />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '20px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#334c2b' }}>{nombreProducto}</span>
              <span style={{ fontSize: '18px', color: '#666' }}>Escaneá y sumá puntos</span>
            </div>
          </div>

          <img src={qrUrl} width="220" height="220" style={{ border: '4px solid #b7996b', borderRadius: '10px', padding: '5px', backgroundColor: '#fff' }} />

          <div style={{ marginTop: '20px', backgroundColor: '#eee6d9', padding: '10px 30px', borderRadius: '10px', border: '2px dashed #b7996b' }}>
            <span style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '5px', color: '#334c2b' }}>{codigo}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#eee6d9', padding: '15px', fontSize: '16px', color: '#334c2b', fontWeight: 'bold' }}>
          Pedidos online en panfree.fit
        </div>
      </div>
    ),
    {
      width: 600,
      height: 900,
      headers: {
        'Content-Disposition': `attachment; filename="Diptico-PanFree-${codigo}.png"`,
      },
    }
  )
}