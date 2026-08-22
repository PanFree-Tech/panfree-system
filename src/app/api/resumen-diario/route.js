/**
 * 📁 UBICACIÓN: src/app/api/resumen-diario/route.js
 * 📅 ACTUALIZADO: 2026-08-19 (PROTEGIDO - SOLO ADMIN)
 * 📌 DESCRIPCIÓN: Resumen de ventas del día para panel de administración PanFree.
 *    Calcula pedidos del día, ingresos totales, estados y productos más vendidos.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabase as publicSupabase, sanitizeSupabaseUrl, DEFAULT_SUPABASE_ANON_KEY } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // 1. Crear cliente Supabase con contexto de cookies (SSR)
    const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
    const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) || DEFAULT_SUPABASE_ANON_KEY

    const cookieStore = cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch {
              // Ignore in route handlers
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch {
              // Ignore in route handlers
            }
          },
        },
      }
    )

    // 2. Verificar usuario autenticado (1º Cookies SSR, 2º Header Authorization Bearer)
    let user = null
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

    if (!userError && authUser) {
      user = authUser
    } else {
      // Fallback: verificar header Authorization si se pasa Bearer token
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim()
        if (token) {
          const { data: tokenUser, error: tokenErr } = await publicSupabase.auth.getUser(token)
          if (!tokenErr && tokenUser?.user) {
            user = tokenUser.user
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 3. Verificar rol admin
    const isAdmin =
      user.raw_user_meta_data?.role === 'admin' ||
      user.user_metadata?.role === 'admin' ||
      user.app_metadata?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      )
    }

    // 4. Fechas para el día actual
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyISO = hoy.toISOString()

    // 5. Consultar pedidos de hoy
    const clientToUse = supabase || publicSupabase
    const { data: pedidosHoy, error: pedidosError } = await clientToUse
      .from('pedidos')
      .select('id, numero_pedido, estado, subtotal, total_final, metodo_entrega, metodo_pago, created_at')
      .gte('created_at', hoyISO)
      .order('created_at', { ascending: false })

    if (pedidosError) {
      console.error('[API resumen-diario] Error consultando pedidos:', pedidosError)
      throw pedidosError
    }

    const pedidosList = pedidosHoy || []
    const pedidosTotales = pedidosList.length
    const ingresosTotales = pedidosList.reduce(
      (sum, p) => sum + Number(p.total_final || p.subtotal || 0),
      0
    )

    const estadosPedidos = {
      pendiente: pedidosList.filter(p => p.estado === 'pendiente').length,
      confirmado: pedidosList.filter(p => p.estado === 'confirmado').length,
      en_produccion: pedidosList.filter(p => p.estado === 'en_produccion').length,
      listo: pedidosList.filter(p => p.estado === 'listo').length,
      entregado: pedidosList.filter(p => p.estado === 'entregado').length,
      cancelado: pedidosList.filter(p => p.estado === 'cancelado').length,
    }

    // 6. Consultar productos más vendidos (detalle_pedido)
    let productosMasVendidos = []
    try {
      const { data: detalles } = await clientToUse
        .from('detalle_pedido')
        .select('producto_id, cantidad, productos(nombre)')
        .gte('created_at', hoyISO)

      if (detalles && detalles.length > 0) {
        const prodCount = {}
        for (const item of detalles) {
          const nombre = item.productos?.nombre || `Producto ${item.producto_id}`
          prodCount[nombre] = (prodCount[nombre] || 0) + (Number(item.cantidad) || 0)
        }
        productosMasVendidos = Object.entries(prodCount)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5)
      }
    } catch (detErr) {
      console.warn('[API resumen-diario] Error no bloqueante al consultar detalles:', detErr)
    }

    return NextResponse.json({
      fecha: hoy.toISOString().split('T')[0],
      resumen: {
        pedidos_totales: pedidosTotales,
        ingresos_totales: ingresosTotales,
        ingresos_formateados: `₲ ${ingresosTotales.toLocaleString('es-PY')}`,
        estados: estadosPedidos,
        productos_mas_vendidos: productosMasVendidos,
        ultimos_pedidos: pedidosList.slice(0, 5),
      },
    })
  } catch (error) {
    console.error('Error en /api/resumen-diario:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar resumen diario' },
      { status: 500 }
    )
  }
}