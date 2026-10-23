import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// FORZAMOS NODE.JS PARA EVITAR LÍMITES DE EDGE
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const codigo = params.codigo.toUpperCase()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // 1. Buscar datos del díptico
  const { data: diptico, error: dbError } = await supabase
    .from('codigos_dipticos')
    .select('codigo, producto_id, productos(nombre, imagen_url, descripcion, precio_venta)')
    .eq('codigo', codigo)
    .maybeSingle()

  if (dbError) console.error('DB Error:', dbError)
  if (!diptico) {
    return new Response('Código no encontrado', { status: 404 })
  }

  const producto = diptico.productos
  const nombreProducto = producto?.nombre || 'PanFree'
  const descripcionProducto = producto?.descripcion || 'Producto artesanal sin gluten.'
  const precioProducto = producto?.precio_venta ? `₲ ${Number(producto.precio_venta).toLocaleString('es-PY')}` : null
  
  // 2. URLs de imágenes
  const logoUrl = 'https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://panfree.fit/diptico/${codigo}`
  
  // Si el producto no tiene imagen, usamos el logo como fallback
  const imagenProductoUrl = producto?.imagen_url || logoUrl

  // 3. Generar imagen (Forzando el uso de las URLs directamente)
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
        {/* HEADER */}
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', 
          backgroundColor: '#334c2b', padding: '30px 20px', 
          borderBottom: '6px solid #b7996b' 
        }}>
          <img src={logoUrl} width="180" height="180" style={{ borderRadius: '20px' }} />
          <h1 style={{ fontSize: '40px', color: '#eee6d9', margin: '15px 0 0 0', fontWeight: '900', textAlign: 'center' }}>
            ¡Gracias por elegir PanFree!
          </h1>
        </div>

        {/* BODY */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', flex: 1 }}>
          
          {/* CÓDIGO */}
          <div style={{ 
            display: 'flex', flexDirection: 'column', backgroundColor: '#fff', padding: '20px', 
            borderRadius: '24px', border: '1px solid #e8dfd3', width: '90%', alignItems: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.05)', marginBottom: '20px'
          }}>
            <span style={{ fontSize: '16px', color: '#f46e15', fontWeight: 'bold' }}>TU CÓDIGO</span>
            <span style={{ fontSize: '60px', fontWeight: '900', letterSpacing: '5px', color: '#334c2b' }}>{codigo}</span>
          </div>

          {/* PRODUCTO */}
          <div style={{ 
            display: 'flex', flexDirection: 'row', backgroundColor: '#fff', padding: '15px', 
            borderRadius: '24px', border: '1px solid #e8dfd3', width: '90%', alignItems: 'center',
            marginBottom: '20px'
          }}>
            <img src={imagenProductoUrl} width="100" height="100" style={{ borderRadius: '12px', objectFit: 'cover' }} />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '15px' }}>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#334c2b' }}>{nombreProducto}</span>
              <span style={{ fontSize: '14px', color: '#8a7a6b' }}>{descripcionProducto}</span>
              {precioProducto && <span style={{ fontSize: '24px', fontWeight: '900', color: '#f46e15', marginTop: '5px' }}>{precioProducto}</span>}
            </div>
          </div>

          {/* QR */}
          <div style={{ 
            display: 'flex', flexDirection: 'column', backgroundColor: '#fff', padding: '20px', 
            borderRadius: '24px', border: '4px solid #334c2b', alignItems: 'center', width: '90%'
          }}>
            <img src={qrUrl} width="300" height="300" />
            <span style={{ fontSize: '18px', color: '#334c2b', fontWeight: 'bold', marginTop: '10px' }}>Escaneá para sumar puntos</span>
            <span style={{ fontSize: '16px', color: '#f46e15', marginTop: '5px' }}>panfree.fit/diptico/{codigo}</span>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#253920', padding: '15px' }}>
          <span style={{ fontSize: '16px', color: '#b7996b' }}>© 2026 PanFree</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        'Content-Disposition': `attachment; filename="Diptico-${codigo}.png"`,
      },
    }
  )
}