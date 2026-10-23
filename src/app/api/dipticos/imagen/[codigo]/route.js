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
  const descripcionProducto = producto?.descripcion || 'Disfruta de nuestros productos 100% libres de gluten elaborados artesanalmente.'
  const imagenProducto = producto?.imagen_url || 'https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png'
  const precioProducto = producto?.precio_venta ? `₲ ${Number(producto.precio_venta).toLocaleString('es-PY')}` : null
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://panfree.fit/diptico/${codigo}`
  const logoUrl = 'https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#fcfaf7', // Fondo crema de la landing
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 1. Header estilo Landing (Verde oscuro con onda) */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          backgroundColor: '#334c2b', 
          padding: '40px 20px 60px 20px', 
          color: '#eee6d9',
          position: 'relative',
          // Simulamos la onda con un borde curvo (en Satori no hay SVG path fácil, pero usamos un div con border-radius)
        }}>
          {/* Logo dentro de recuadro blanco (como en la landing) */}
          <div style={{
            display: 'flex',
            backgroundColor: '#ffffff',
            padding: '10px 20px',
            borderRadius: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            <img src={logoUrl} width="80" height="80" style={{ objectFit: 'contain' }} />
          </div>

          <h1 style={{ fontSize: '36px', margin: 0, fontWeight: '800', textAlign: 'center', letterSpacing: '-0.5px' }}>¡Gracias por elegir PanFree!</h1>
          <p style={{ fontSize: '18px', margin: '10px 0 0 0', color: '#b7996b', fontWeight: '600' }}>El placer de volver a comer libremente</p>
          <p style={{ fontSize: '14px', margin: '15px 0 0 0', color: '#d0c5b4', maxWidth: '80%', textAlign: 'center' }}>
            Cada producto artesanal está horneado con dedicación para que disfrutes sin preocupaciones.
          </p>
          
          {/* Onda decorativa (usando un div con clip-path o border-radius) */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            backgroundColor: '#fcfaf7',
            borderTopLeftRadius: '50% 100%',
            borderTopRightRadius: '50% 100%',
          }} />
        </div>

        {/* 2. Cuerpo de la Landing */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', flex: 1, marginTop: '-20px', zIndex: 10 }}>
          
          {/* Tarjeta de Cupón (Estilo Voucher blanco) */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: '#ffffff', 
            padding: '30px', 
            borderRadius: '24px', 
            border: '1px solid #e8dfd3', 
            width: '90%',
            boxShadow: '0 10px 25px rgba(51, 76, 43, 0.08)',
            marginBottom: '20px',
            position: 'relative'
          }}>
            {/* Barra superior de colores */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', backgroundColor: '#f46e15', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex' }}>
              <div style={{ width: '33%', height: '100%', backgroundColor: '#b7996b' }} />
              <div style={{ width: '33%', height: '100%', backgroundColor: '#f46e15' }} />
              <div style={{ width: '34%', height: '100%', backgroundColor: '#334c2b' }} />
            </div>

            <span style={{ fontSize: '12px', color: '#f46e15', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>CLUB DE FIDELIDAD</span>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#334c2b', margin: '0 0 10px 0' }}>Tu código exclusivo</h2>
            <p style={{ fontSize: '14px', color: '#8a7a6b', margin: '0 0 20px 0' }}>Canjea este código para acumular puntos y canjearlos por productos y descuentos</p>

            {/* Caja del código */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              backgroundColor: '#fcfaf7', 
              padding: '20px', 
              borderRadius: '16px', 
              border: '2px dashed #b7996b', 
              width: '100%',
              marginBottom: '15px'
            }}>
              <span style={{ fontSize: '12px', color: '#8a7a6b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Código del Producto</span>
              <span style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '8px', color: '#334c2b', fontFamily: 'monospace' }}>{codigo}</span>
              <p style={{ fontSize: '12px', color: '#8a7a6b', margin: '5px 0 0 0' }}>Presente en el díptico o empaque de tu compra</p>
            </div>
          </div>

          {/* Tarjeta del Producto Asociado (Estilo Detalle de Producto) */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            backgroundColor: '#ffffff', 
            padding: '20px', 
            borderRadius: '24px', 
            border: '1px solid #e8dfd3', 
            width: '90%',
            boxShadow: '0 10px 25px rgba(51, 76, 43, 0.08)',
            alignItems: 'center'
          }}>
            <img 
              src={imagenProducto} 
              width="120" 
              height="120" 
              style={{ borderRadius: '16px', objectFit: 'cover', border: '1px solid #eee' }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '20px', flex: 1 }}>
              <span style={{ fontSize: '12px', color: '#b7996b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Detalle del Producto</span>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#334c2b', marginBottom: '4px' }}>{nombreProducto}</span>
              <span style={{ fontSize: '13px', color: '#8a7a6b', marginBottom: '8px', lineHeight: 1.2 }}>{descripcionProducto}</span>
              {precioProducto && (
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#f46e15' }}>{precioProducto}</span>
              )}
            </div>
          </div>

          {/* QR */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginTop: '20px',
            backgroundColor: '#ffffff', 
            padding: '10px', 
            borderRadius: '16px', 
            border: '2px solid #e8dfd3',
            width: '120px',
            height: '120px'
          }}>
            <img src={qrUrl} width="100" height="100" alt="QR" />
          </div>

        </div>

        {/* 3. Footer (Estilo Landing) */}
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#253920', padding: '20px', alignItems: 'center', borderTop: '1px solid #334c2b' }}>
          <img src={logoUrl} width="50" height="50" style={{ opacity: 0.9, marginBottom: '10px' }} />
          <span style={{ fontSize: '14px', color: '#f5f1eb', fontWeight: 'bold' }}>Panadería artesanal libre de gluten.</span>
          <span style={{ fontSize: '12px', color: '#b7996b', marginTop: '5px' }}>© 2026 PanFree. Todos los derechos reservados.</span>
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