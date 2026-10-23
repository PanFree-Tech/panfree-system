import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const codigo = params.codigo.toUpperCase()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

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

  const logoUrl = 'https://res.cloudinary.com/d7simx38/image/upload/v1788037279/logo-panfree.png'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=https://panfree.fit/diptico/${codigo}`
  const imagenProductoUrl = producto?.imagen_url || logoUrl
  const linkTexto = `panfree.fit/diptico/${codigo}`

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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#334c2b',
            padding: '36px 30px 32px 30px',
            borderBottom: '10px solid #b7996b',
          }}
        >
          <img
            src={logoUrl}
            width="250"
            height="250"
            style={{ borderRadius: '56px' }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: '60px',
              color: '#eee6d9',
              marginTop: '22px',
              fontWeight: 900,
              textAlign: 'center',
            }}
          >
            ¡Gracias por elegir PanFree!
          </div>
        </div>

        {/* BODY */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            padding: '28px 36px',
            gap: '24px',
          }}
        >
          {/* CÓDIGO */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              backgroundColor: '#fcfaf7',
              border: '6px dashed #b7996b',
              borderRadius: '32px',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '34px',
                color: '#f46e15',
                fontWeight: 900,
                letterSpacing: '6px',
              }}
            >
              TU CÓDIGO
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '150px',
                fontFamily: 'monospace',
                fontWeight: 900,
                letterSpacing: '14px',
                color: '#334c2b',
                lineHeight: 1.05,
              }}
            >
              {codigo}
            </div>
          </div>

          {/* PRODUCTO */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#ffffff',
              border: '2px solid #e8dfd3',
              borderRadius: '32px',
              padding: '20px',
              gap: '26px',
            }}
          >
            <img
              src={imagenProductoUrl}
              width="210"
              height="210"
              style={{ borderRadius: '24px', objectFit: 'cover' }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: '54px',
                  fontWeight: 900,
                  color: '#334c2b',
                  lineHeight: 1.1,
                }}
              >
                {nombreProducto}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: '30px',
                  color: '#6b5d4f',
                  marginTop: '8px',
                  lineHeight: 1.25,
                  maxHeight: '114px',
                  overflow: 'hidden',
                }}
              >
                {descripcionProducto}
              </div>
              {precioProducto ? (
                <div
                  style={{
                    display: 'flex',
                    fontSize: '56px',
                    fontWeight: 900,
                    color: '#f46e15',
                    marginTop: '10px',
                  }}
                >
                  {precioProducto}
                </div>
              ) : null}
            </div>
          </div>

          {/* QR */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              width: '100%',
              backgroundColor: '#ffffff',
              border: '8px solid #334c2b',
              borderRadius: '40px',
              padding: '24px',
            }}
          >
            <img src={qrUrl} width="560" height="560" />
            <div
              style={{
                display: 'flex',
                fontSize: '44px',
                fontWeight: 900,
                color: '#334c2b',
                marginTop: '18px',
                textAlign: 'center',
              }}
            >
              Escaneá para sumar puntos
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '46px',
                fontWeight: 900,
                color: '#f46e15',
                marginTop: '8px',
                textAlign: 'center',
              }}
            >
              {linkTexto}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#253920',
            padding: '22px',
          }}
        >
          <div style={{ display: 'flex', fontSize: '28px', color: '#b7996b' }}>
            © 2026 PanFree
          </div>
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