// src/app/api/admin/ga-metrics/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  // ── DEBUG: Verificar variables de entorno ──
  console.log('🔍 GA_PROPERTY_ID:', process.env.GA_PROPERTY_ID ? '✅ DEFINIDO' : '❌ NO DEFINIDO')
  console.log('🔍 GA4_CLIENT_EMAIL:', process.env.GA4_CLIENT_EMAIL ? '✅ DEFINIDO' : '❌ NO DEFINIDO')
  console.log('🔍 GA4_PRIVATE_KEY:', process.env.GA4_PRIVATE_KEY ? '✅ DEFINIDO' : '❌ NO DEFINIDO')
  console.log('🔍 GA4_PROJECT_ID:', process.env.GA4_PROJECT_ID ? '✅ DEFINIDO' : '❌ NO DEFINIDO')
  // ──────────────────────────────────────────────
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '7d'

    // Calcular fecha de inicio
    const hoy = new Date()
    let fechaInicio = new Date()
    
    if (periodo === 'today') {
      fechaInicio = new Date(hoy.setHours(0, 0, 0, 0))
    } else if (periodo === '7d') {
      fechaInicio = new Date(hoy.setDate(hoy.getDate() - 7))
    } else if (periodo === '30d') {
      fechaInicio = new Date(hoy.setDate(hoy.getDate() - 30))
    } else if (periodo === '90d') {
      fechaInicio = new Date(hoy.setDate(hoy.getDate() - 90))
    }

    const fechaInicioStr = fechaInicio.toISOString()
    const hoyStr = new Date().toISOString()

    // ── 1. PEDIDOS DEL PERÍODO ──
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('total_final, estado, created_at, cliente_id')
      .gte('created_at', fechaInicioStr)
      .lte('created_at', hoyStr)
      .neq('estado', 'cancelado')

    if (pedidosError) {
      return NextResponse.json({ success: false, error: pedidosError.message }, { status: 500 })
    }

    // ── 2. PEDIDOS HISTÓRICOS (para ingresos totales) ──
    const { data: pedidosHistoricos, error: historicError } = await supabase
      .from('pedidos')
      .select('total_final, cliente_id, created_at')
      .neq('estado', 'cancelado')
      .order('created_at', { ascending: true })

    if (historicError) {
      console.warn('Error cargando pedidos históricos:', historicError.message)
    }

    // ── 3. CLICKS EN ANUNCIOS (UTM) ──
    // Buscar en la tabla de analytics o en pedidos si tienen campos UTM
    // Si no hay tabla de UTMs, usar datos de ejemplo o de GA4
    const { data: utmData, error: utmError } = await supabase
      .from('pedidos')
      .select('utm_source, utm_medium, utm_campaign, created_at')
      .not('utm_source', 'is', null)
      .gte('created_at', fechaInicioStr)
      .lte('created_at', hoyStr)

    if (utmError) {
      console.warn('Error cargando datos UTM:', utmError.message)
    }

    // ── 4. CALCULAR MÉTRICAS ──

    // 4.1 Métricas del período
    const ingresosPeriodo = pedidos?.reduce((sum, p) => sum + (p.total_final || 0), 0) || 0
    const pedidosTotales = pedidos?.length || 0
    const pedidosCompletados = pedidos?.filter(p => p.estado === 'entregado' || p.estado === 'confirmado').length || 0
    const clientesUnicos = new Set(pedidos?.map(p => p.cliente_id).filter(Boolean))
    const usuariosUnicos = clientesUnicos.size
    const ticketPromedio = pedidosTotales > 0 ? Math.round(ingresosPeriodo / pedidosTotales) : 0
    const conversionRate = pedidosTotales > 0 ? Math.round((pedidosCompletados / pedidosTotales) * 100) : 0

    // 4.2 Métricas históricas (INGRESOS TOTALES)
    const ingresosHistoricos = pedidosHistoricos?.reduce((sum, p) => sum + (p.total_final || 0), 0) || 0
    const clientesHistoricos = new Set(pedidosHistoricos?.map(p => p.cliente_id).filter(Boolean))
    const totalClientes = clientesHistoricos.size || 1
    const ltv = Math.round(ingresosHistoricos / totalClientes)

    // 4.3 CLICKS EN ANUNCIOS (UTM)
    const clicksPorFuente = {}
    const clicksPorCampania = {}
    
    // Agrupar clicks por fuente (utm_source)
    utmData?.forEach(item => {
      const source = item.utm_source || 'directo'
      if (!clicksPorFuente[source]) {
        clicksPorFuente[source] = 0
      }
      clicksPorFuente[source]++
      
      // Agrupar por campaña (utm_campaign)
      const campania = item.utm_campaign || 'sin_campania'
      if (!clicksPorCampania[campania]) {
        clicksPorCampania[campania] = 0
      }
      clicksPorCampania[campania]++
    })

    // Ordenar fuentes por cantidad de clicks
    const fuentesOrdenadas = Object.entries(clicksPorFuente)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    const campaniasOrdenadas = Object.entries(clicksPorCampania)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    const totalClicks = utmData?.length || 0

    return NextResponse.json({
      success: true,
      resumen: {
        // Período
        revenue: ingresosPeriodo,
        pedidos: pedidosTotales,
        usuarios: usuariosUnicos,
        ticketPromedio: ticketPromedio,
        conversion_rate: conversionRate,
        // Histórico
        ingresos_totales: ingresosHistoricos,
        ltv: ltv,
        clientes_unicos: totalClientes,
        // UTMs / Clicks en anuncios
        clicks_anuncios: totalClicks,
        clicks_por_fuente: fuentesOrdenadas,
        clicks_por_campania: campaniasOrdenadas,
      },
      detalles: {
        periodo,
        desde: fechaInicioStr,
        hasta: hoyStr,
        pedidos_completados: pedidosCompletados,
        pedidos_cancelados: pedidos?.filter(p => p.estado === 'cancelado').length || 0,
        primer_pedido: pedidosHistoricos?.[0]?.created_at || null,
        ultimo_pedido: pedidosHistoricos?.[pedidosHistoricos.length - 1]?.created_at || null,
      }
    })

  } catch (error) {
    console.error('Error en ga-metrics:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 })
  }
}