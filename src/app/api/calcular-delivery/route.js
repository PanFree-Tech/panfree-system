/**
 * 📁 UBICACIÓN: src/app/api/calcular-delivery/route.js
 * 📅 CREADO: 2026-03-12
 * 📌 DESCRIPCIÓN: Calcula el costo de delivery usando:
 *    - Nominatim (OpenStreetMap) para geocodificar la dirección → lat/lng
 *    - Fórmula de Haversine para distancia en línea recta (sin API key)
 *    - delivery_config de Supabase para tarifas y radio máximo
 *
 *    POST /api/calcular-delivery
 *    Body: { direccion: "Av. España 1234, Encarnación" }
 *    Response: { disponible, costo, distancia_km, mensaje }
 *
 * ⚠️ Nominatim requiere User-Agent único y max 1 req/seg (rate limit).
 *    Para producción con alto volumen, considerar caché en Supabase.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ⚠️ force-dynamic: evita que Next.js evalúe esta route en build time
// (las env vars de Fly.io solo están disponibles en runtime, no en build)
export const dynamic = 'force-dynamic'

// ── Fórmula de Haversine: distancia en km entre dos coordenadas ───────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Geocodifica una dirección con Nominatim (OpenStreetMap, gratis) ────────────
async function geocodificar(direccion) {
  // Siempre agregar "Encarnación, Paraguay" para acotar búsqueda
  const query   = `${direccion}, Encarnación, Itapúa, Paraguay`
  const encoded = encodeURIComponent(query)
  const url     = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=py`

  const res = await fetch(url, {
    headers: {
      // Nominatim exige User-Agent identificable — buena práctica obligatoria
      'User-Agent': 'PanFree/1.0 (panfree.fit; contacto@panfree.fit)',
    },
  })

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

  const data = await res.json()
  if (!data || data.length === 0) return null

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display: data[0].display_name,
  }
}

export async function POST(request) {
  // Cliente creado en runtime (no en build time) para que las env vars estén disponibles
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    const body = await request.json()
    const { direccion } = body

    if (!direccion || direccion.trim().length < 5) {
      return NextResponse.json(
        { error: 'Ingresá una dirección válida.' },
        { status: 400 }
      )
    }

    // ── 1. Leer configuración de delivery desde Supabase ────────────────────
    const { data: config, error: configError } = await supabase
      .from('delivery_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'Configuración de delivery no disponible.' },
        { status: 500 }
      )
    }

    const {
      local_lat,
      local_lng,
      max_radius_km,
      base_fee,
      per_km_fee,
      min_delivery_fee,
      free_shipping_threshold,
    } = config

    // ── 2. Geocodificar dirección del cliente ────────────────────────────────
    const geo = await geocodificar(direccion)

    if (!geo) {
      return NextResponse.json({
        disponible      : false,
        costo           : 0,
        distancia_km    : null,
        mensaje         : 'No pudimos encontrar esa dirección. Verificá que esté en Encarnación.',
        geocodificado   : false,
      })
    }

    // ── 3. Calcular distancia con Haversine ──────────────────────────────────
    const distanciaKm = haversineKm(
      parseFloat(local_lat),
      parseFloat(local_lng),
      geo.lat,
      geo.lng
    )

    // ── 4. Verificar radio máximo ────────────────────────────────────────────
    if (distanciaKm > parseFloat(max_radius_km)) {
      return NextResponse.json({
        disponible      : false,
        costo           : 0,
        distancia_km    : Math.round(distanciaKm * 10) / 10,
        mensaje         : `Lo sentimos, esa dirección está fuera de nuestra zona de delivery (máximo ${max_radius_km} km).`,
        geocodificado   : true,
        lat             : geo.lat,
        lng             : geo.lng,
      })
    }

    // ── 5. Calcular costo ────────────────────────────────────────────────────
    // El subtotal_pedido viene opcional en el body para verificar envío gratis
    const subtotalPedido = parseFloat(body.subtotal || 0)
    let costo = 0

    if (subtotalPedido >= parseFloat(free_shipping_threshold) && free_shipping_threshold > 0) {
      costo = 0  // Envío gratis
    } else {
      costo = parseFloat(base_fee) + (distanciaKm * parseFloat(per_km_fee))
      costo = Math.max(costo, parseFloat(min_delivery_fee))
      costo = Math.round(costo / 100) * 100  // Redondear a centenas de PYG
    }

    return NextResponse.json({
      disponible      : true,
      costo,
      distancia_km    : Math.round(distanciaKm * 10) / 10,
      envio_gratis    : costo === 0,
      free_shipping_threshold: parseFloat(free_shipping_threshold),
      mensaje         : costo === 0
        ? `🎁 ¡Envío gratis! (a ${Math.round(distanciaKm * 10) / 10} km)`
        : `Envío a ${Math.round(distanciaKm * 10) / 10} km de distancia`,
      geocodificado   : true,
      lat             : geo.lat,
      lng             : geo.lng,
    })

  } catch (err) {
    console.error('[calcular-delivery] Error:', err)
    return NextResponse.json(
      { error: 'Error al calcular delivery. Intentá de nuevo.' },
      { status: 500 }
    )
  }
}