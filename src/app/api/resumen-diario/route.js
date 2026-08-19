/**
 * 📁 UBICACIÓN: src/app/api/resumen-diario/route.js
 * 📅 ACTUALIZADO: 2026-08-15 (PROTEGIDO - SOLO ADMIN)
 * 📌 DESCRIPCIÓN: Resumen de ventas del día para admin.
 *    CAMBIO CRÍTICO: Ahora requiere JWT válido con rol admin.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // ============================================
    // VERIFICAR AUTENTICACIÓN Y PERMISOS (ADMIN ONLY)
    // ============================================
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes estar autenticado.' },
        { status: 401 }
      )
    }

    // Verificar que es admin
    const isAdmin =
      session.user.raw_user_meta_data?.role === 'admin' ||
      session.user.user_metadata?.role === 'admin' ||
      session.user.app_metadata?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Solo admins pueden ver este reporte.' },
        { status: 403 }
      )
    }

    // ============================================
    // OBTENER FECHA DE HOY
    // ============================================
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyString = hoy.toISOString().split('T')[0]

    // ============================================
    // CONSULTAR PEDIDOS DE HOY
    // ============================================
    // Asumiendo que existe tabla 'pedidos' con columna 'created_at'
    const { data: pedidosHoy, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .gte('created_at', `${hoyString}T00:00:00`)
      .lt('created_at', `${hoyString}T23:59:59`)

    if (pedidosError) {
      throw pedidosError
    }

    // ============================================
    // CALCULAR TOTALES
    // ============================================
    const pedidosTotales = (pedidosHoy || []).length
    const ingresosTotales = (pedidosHoy || []).reduce(
      (sum, p) => sum + (p.total || 0),
      0
    )
    const estadosPedidos = {
      pendiente: (pedidosHoy || []).filter(p => p.estado === 'pendiente')
        .length,
      confirmado: (pedidosHoy || []).filter(p => p.estado === 'confirmado')
        .length,
      en_produccion: (pedidosHoy || []).filter(p => p.estado === 'en_produccion')
        .length,
      enviado: (pedidosHoy || []).filter(p => p.estado === 'enviado').length,
      entregado: (pedidosHoy || []).filter(p => p.estado === 'entregado')
        .length,
    }

    // ============================================
    // CONSULTAR PRODUCTOS MÁS VENDIDOS
    // ============================================
    // Asumiendo que existe tabla 'pedido_items' con producto_id y cantidad
    const { data: productosVendidos, error: productosError } = await supabase
      .from('pedido_items')
      .select('producto_id, cantidad')
      .gte('created_at', `${hoyString}T00:00:00`)
      .lt('created_at', `${hoyString}T23:59:59`)
      .order('cantidad', { ascending: false })
      .limit(5)

    if (productosError) {
      console.error('Error consultando productos:', productosError)
    }

    // ============================================
    // DEVOLVER RESUMEN
    // ============================================
    return NextResponse.json({
      fecha: hoyString,
      resumen: {
        pedidos_totales: pedidosTotales,
        ingresos_totales: ingresosTotales,
        ingresos_formateados: `₲ ${ingresosTotales.toLocaleString('es-PY')}`,
        estados: estadosPedidos,
        productos_mas_vendidos: productosVendidos || [],
      },
    })
  } catch (error) {
    console.error('Error en /api/resumen-diario:', error)
    return NextResponse.json(
      { error: 'Error al generar resumen' },
      { status: 500 }
    )
  }
}