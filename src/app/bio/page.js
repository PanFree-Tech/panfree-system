/**
 * 📁 UBICACIÓN: src/app/bio/page.js
 * 📅 ACTUALIZADO: 2026-08-17
 * 📌 DESCRIPCIÓN: Página de bio para Instagram de PanFree.
 *    - ✅ Imágenes de productos sin recorte (proporción natural)
 *    - ✅ Logo con borde circular (mantenido)
 *    - ✅ Reemplazado Wheat por Package
 *    - ✅ AGREGADA unidad de medida junto al precio
 */
import { createClient } from '@supabase/supabase-js'
import { MapPin, ShoppingCart, Package, Phone } from 'lucide-react'
import CldImageWrapper from '@/components/CldImageWrapper'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || 'https://gbdrcaumghykiipqgbty.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZHJjYXVtZ2h5a2lpcHFnYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjczNjIsImV4cCI6MjA4NzgwMzM2Mn0.OydRQxa51Ql42zvscWnQkEKJuU_3yeCS4qPQQoP6TuM'
const supabase        = createClient(supabaseUrl, supabaseAnonKey)

const WA_URL = 'https://wa.me/595984589845?text=Hola%20PanFree!%20%F0%9F%9E%90%20Quiero%20hacer%20un%20pedido'
const formatPYG = n => `₲ ${Number(n || 0).toLocaleString('es-PY')}`

export const metadata = {
  title: 'PanFree | Panificados Sin Gluten — Encarnación',
  description: 'Panadería artesanal sin gluten en Encarnación, Paraguay. Chipas, muffins, panes y más. Delivery a domicilio.',
  openGraph: {
    title: 'PanFree | Panificados Sin Gluten',
    description: 'Chipas, muffins, panes artesanales sin gluten. Delivery en Encarnación, Paraguay.',
    url: 'https://panfree.fit/bio',
    images: [{ url: 'https://panfree.fit/logopanfree.png', width: 512, height: 512 }],
  },
}

export default async function BioInstagram() {
  // Productos destacados con disponibilidad real
  const { data: destacados } = await supabase
    .from('productos')
    .select('id, nombre, slug, precio_venta, unidad_medida, imagen_url, imagen_alt, is_featured')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('nombre', { ascending: true })
    .limit(6)

  // Disponibilidad desde vista
  const { data: dispData } = await supabase
    .from('vista_disponibilidad_productos')
    .select('producto_id, disponible')

  const dispMap = {}
  ;(dispData || []).forEach(d => { dispMap[d.producto_id] = d.disponible })

  // Si no hay destacados, traer los primeros 6 activos
  const { data: todos } = !destacados?.length
    ? await supabase
        .from('productos')
        .select('id, nombre, slug, precio_venta, unidad_medida, imagen_url, imagen_alt')
        .eq('is_active', true)
        .order('nombre', { ascending: true })
        .limit(6)
    : { data: null }

  const productos = (destacados?.length ? destacados : todos) || []
  // Solo mostrar disponibles
  const productosVisibles = productos.filter(p => dispMap[p.id] !== false)

  // Función para transformar URLs de Cloudinary:
  // Solo optimiza formato y calidad, sin recortar ni escalar
  const transformCloudinaryUrl = (url) => {
    if (!url) return url
    if (url.includes('res.cloudinary.com')) {
      const parts = url.split('/upload/')
      if (parts.length === 2) {
        // Solo optimización, sin recorte ni escalado forzado
        return `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`
      }
    }
    return url
  }

  return (
    <main style={{
      backgroundColor: '#eee6d9',
      minHeight: '100vh',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      padding: '24px 16px',
      maxWidth: '480px',
      margin: '0 auto',
    }}>

      {/* Header con logo optimizado (mantiene borde circular) */}
      <header style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid #b7996b',
          margin: '0 auto',
          backgroundColor: '#fff',
          position: 'relative',
        }}>
          <CldImageWrapper
            src="/images/logo-panfree.png"
            alt="PanFree"
            width={100}
            height={100}
            priority
            style={{ objectFit: 'cover' }}
          />
        </div>
        <h1 style={{ color: '#334c2b', margin: '12px 0 4px', fontSize: '1.4rem', fontWeight: '800' }}>
          Panificados artesanales sin gluten
        </h1>
        <p style={{ color: '#666', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
          Panificados artesanales sin gluten<br/>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} color="#666" /> Encarnación, Paraguay
          </span>
        </p>
      </header>

      {/* Botón principal WhatsApp */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          backgroundColor: '#25D366', color: '#fff',
          padding: '14px 24px', borderRadius: '12px',
          textAlign: 'center', textDecoration: 'none',
          fontWeight: '700', fontSize: '1rem',
          marginBottom: '12px',
          boxShadow: '0 4px 12px rgba(37,211,102,0.35)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.956-1.406A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.177 5.83c-.198-.442-.407-.451-.596-.459l-.507-.007c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.2 0 1.299.946 2.553 1.078 2.729.132.176 1.826 2.903 4.493 3.953 2.222.877 2.667.703 3.148.659.48-.044 1.55-.634 1.77-1.247.218-.613.218-1.138.153-1.248-.066-.11-.242-.176-.507-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.858-.836 1.033-.154.176-.308.198-.572.066-.264-.132-1.114-.411-2.122-1.308-.784-.698-1.314-1.56-1.468-1.824-.154-.264-.016-.407.116-.538.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.574-1.43-.79-1.957z"/>
        </svg>
        Pedir por WhatsApp
      </a>

      {/* Botón ver tienda completa */}
      <a
        href="https://panfree.fit?utm_source=instagram&utm_medium=bio&utm_campaign=bio_link"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          backgroundColor: '#334c2b', color: '#eee6d9',
          padding: '12px 24px', borderRadius: '12px',
          textAlign: 'center', textDecoration: 'none',
          fontWeight: '700', fontSize: '0.95rem',
          marginBottom: '24px',
          border: '2px solid #b7996b',
        }}
      >
        <ShoppingCart size={18} />
        <span>Ver todos los productos</span>
      </a>

      {/* Separador */}
      <p style={{ color: '#b7996b', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>
        Productos disponibles
      </p>

      {/* Lista de productos con imágenes sin recorte y optimizadas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {productosVisibles.map(producto => (
          <a
            key={producto.slug}
            href={`https://panfree.fit/producto/${producto.slug}?utm_source=instagram&utm_medium=bio&utm_campaign=producto_${producto.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              backgroundColor: '#fff', padding: '12px',
              borderRadius: '10px', textDecoration: 'none',
              color: '#334c2b', border: '2px solid #e0d5c5',
            }}
          >
            {/* Imagen sin recorte - mantiene proporción natural */}
            <div style={{
              width: '60px',
              height: '60px',
              flexShrink: 0,
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#f5f0e8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {producto.imagen_url
                ? (
                  <CldImageWrapper
                    src={transformCloudinaryUrl(producto.imagen_url)}
                    alt={producto.imagen_alt || producto.nombre}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="60px"
                  />
                ) : (
                  <Package size={28} color="#b7996b" />
                )
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '0.92rem', lineHeight: 1.3, marginBottom: '3px' }}>
                {producto.nombre}
              </div>
              {/* 👇 PRECIO CON UNIDAD DE MEDIDA */}
              <div style={{ color: '#f46e15', fontWeight: '800', fontSize: '0.95rem' }}>
                {formatPYG(producto.precio_venta)}
                {producto.unidad_medida && producto.unidad_medida !== 'unidad' && (
                  <span style={{
                    fontSize: '0.7rem',
                    color: '#888',
                    fontWeight: 400,
                    marginLeft: '4px',
                  }}>
                    / {producto.unidad_medida}
                  </span>
                )}
              </div>
            </div>

            <span style={{ color: '#b7996b', fontSize: '1.2rem', flexShrink: 0 }}>→</span>
          </a>
        ))}
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', marginTop: '28px',
        paddingTop: '20px', borderTop: '1px solid #d4c5b0',
        color: '#888', fontSize: '0.8rem', lineHeight: 2,
      }}>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '4px 0' }}>
          <MapPin size={14} color="#888" /> Encarnación, Paraguay
        </p>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '4px 0' }}>
          <Phone size={14} color="#888" /> +595 984 589845
        </p>
        <p style={{ margin: '4px 0' }}>
          <a href="https://panfree.fit" style={{ color: '#334c2b', fontWeight: '600' }}>
            panfree.fit
          </a>
        </p>
      </footer>

    </main>
  )
}