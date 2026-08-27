/**
 * 📁 UBICACIÓN: src/app/producto/[slug]/page.js
 * 📅 ACTUALIZADO: 2026-03-05
 * 📌 CAMBIOS:
 *  - Consulta vista_disponibilidad_productos y pasa prop `disponible` al cliente
 */
import { notFound } from 'next/navigation'
import { supabase as supabaseServer } from '@/lib/supabase'
import PaginaProductoCliente from './ProductoCliente'

const DOMINIO = 'https://panfree.fit'

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params
    const { data: producto } = await supabaseServer
      .from('productos')
      .select('nombre, descripcion, imagen_url, precio_venta, categoria')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!producto) {
      return {
        title: 'Producto no encontrado — PanFree',
        description: 'Este producto no existe o ya no está disponible.',
      }
    }

    const formatPYG = n => `₲ ${Number(n || 0).toLocaleString('es-PY')}`
    const titulo    = `${producto.nombre} — PanFree`
    const desc      = producto.descripcion
      ? `${producto.descripcion} · ${formatPYG(producto.precio_venta)} · Delivery en Encarnación, Paraguay.`
      : `${producto.nombre} sin gluten · ${formatPYG(producto.precio_venta)} · Elaborado artesanalmente en Encarnación, Paraguay.`

    return {
      title       : titulo,
      description : desc,
      openGraph: {
        title      : titulo,
        description: desc,
        url        : `${DOMINIO}/producto/${slug}`,
        siteName   : 'PanFree — Panificados Sin Gluten',
        locale     : 'es_PY',
        type       : 'website',
        images     : producto.imagen_url
          ? [{ url: producto.imagen_url, width: 800, height: 800, alt: producto.nombre }]
          : [{ url: `${DOMINIO}/logopanfree.png`, width: 512, height: 512, alt: 'PanFree' }],
      },
      twitter: {
        card       : 'summary_large_image',
        title      : titulo,
        description: desc,
        images     : producto.imagen_url ? [producto.imagen_url] : [`${DOMINIO}/logopanfree.png`],
      },
    }
  } catch (err) {
    return {
      title: 'Producto — PanFree',
      description: 'Panificados sin gluten en Encarnación, Paraguay.',
    }
  }
}

export default async function PaginaProducto({ params }) {
  const { slug } = await params

  try {
    // Carga producto y disponibilidad en paralelo
    const [{ data: producto }, { data: dispData }] = await Promise.all([
      supabaseServer
        .from('productos')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single(),
      supabaseServer
        .from('vista_disponibilidad_productos')
        .select('disponible, requiere_anticipacion')
        .eq('slug', slug)
        .single(),
    ])

    if (!producto) notFound()

    const disponible          = dispData?.disponible           ?? true
    const requiereAnticipacion = dispData?.requiere_anticipacion ?? false

    // Productos relacionados
    const { data: relacionados } = await supabaseServer
      .from('productos')
      .select('id, slug, nombre, precio_venta, precio_promocion, en_promocion, fecha_inicio_promo, fecha_fin_promo, imagen_url, imagen_alt, categoria, stock_actual')
      .eq('categoria', producto.categoria)
      .eq('is_active', true)
      .neq('id', producto.id)
      .limit(4)

    return (
      <PaginaProductoCliente
        producto={producto}
        relacionados={relacionados || []}
        disponible={disponible}
        requiereAnticipacion={requiereAnticipacion}
      />
    )
  } catch (err) {
    notFound()
  }
}

export async function generateStaticParams() {
  try {
    const { data } = await supabaseServer
      .from('productos')
      .select('slug')
      .eq('is_active', true)
    return (data || []).map(p => ({ slug: p.slug }))
  } catch (err) {
    return []
  }
}