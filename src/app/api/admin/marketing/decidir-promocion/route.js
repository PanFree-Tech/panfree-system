/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/decidir-promocion/route.js
 * 📌 ENDPOINT: GET /api/admin/marketing/decidir-promocion
 * 📖 DESCRIPCIÓN: Motor de toma de decisiones de marketing inteligente con control de capacidad de producción.
 *    - Filtra estrictamente productos con `order_available = true` y `availability_status = 'DISPONIBLE'`.
 *    - Prioriza productos con mayor margen de capacidad disponible (`production_capacity - current_orders`).
 *    - Cruza con el calendario de eventos y reglas de negocio para optimizar ventas sin sobrecargar la cocina.
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const productoIdParam = searchParams.get('producto_id')
    const fechaParam = searchParams.get('fecha') || new Date().toISOString().split('T')[0]

    // 1. Obtener todos los productos activos con sus campos de capacidad
    let todosLosProductos = []
    try {
      const { data: prods, error: pErr } = await supabase
        .from('productos')
        .select('id, nombre, categoria, precio_venta, imagen_url, slug, descripcion, is_featured, is_active, production_capacity, current_orders, lead_time, order_available, availability_status')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })

      if (!pErr && prods && prods.length > 0) {
        todosLosProductos = prods
      }
    } catch (e) {
      console.warn('Advertencia al consultar productos en decidir-promocion:', e.message)
    }

    // Fallback de productos con datos de capacidad si la tabla está vacía
    if (todosLosProductos.length === 0) {
      todosLosProductos = [
        {
          id: 'prod-chipa-01',
          nombre: 'Chipa Tradicional Sin Gluten',
          categoria: 'Panificados',
          precio_venta: 20000,
          is_featured: true,
          production_capacity: 30,
          current_orders: 5,
          lead_time: 24,
          order_available: true,
          availability_status: 'DISPONIBLE',
        },
        {
          id: 'prod-pan-02',
          nombre: 'Pan de Campo Sin TACC',
          categoria: 'Panificados',
          precio_venta: 28000,
          is_featured: true,
          production_capacity: 15,
          current_orders: 4,
          lead_time: 24,
          order_available: true,
          availability_status: 'DISPONIBLE',
        },
        {
          id: 'prod-torta-03',
          nombre: 'Torta Artesanal Sin Gluten',
          categoria: 'Repostería',
          precio_venta: 85000,
          is_featured: false,
          production_capacity: 5,
          current_orders: 5,
          lead_time: 48,
          order_available: false,
          availability_status: 'CERRADO',
        },
        {
          id: 'prod-alfajor-04',
          nombre: 'Alfajores de Maicena Sin TACC',
          categoria: 'Repostería',
          precio_venta: 18000,
          is_featured: false,
          production_capacity: 25,
          current_orders: 22,
          lead_time: 24,
          order_available: true,
          availability_status: 'CAPACIDAD LIMITADA',
        },
      ]
    }

    // Normalizar datos de capacidad de los productos
    const productosConMetricas = todosLosProductos.map((p) => {
      const cap = Math.max(1, Number(p.production_capacity) || 10)
      const ord = Math.max(0, Number(p.current_orders) || 0)
      const rem = Math.max(0, cap - ord)
      const pct = Math.min(100, Math.round((ord / cap) * 100))

      let status = p.availability_status
      let available = p.order_available !== undefined ? Boolean(p.order_available) : true

      if (!status) {
        if (ord >= cap) {
          status = 'CERRADO'
          available = false
        } else if (ord >= cap * 0.8) {
          status = 'CAPACIDAD LIMITADA'
          available = true
        } else {
          status = 'DISPONIBLE'
          available = true
        }
      }

      return {
        ...p,
        production_capacity: cap,
        current_orders: ord,
        remaining_capacity: rem,
        porcentaje_ocupacion: pct,
        order_available: available,
        availability_status: status,
      }
    })

    // 2. FILTRAR ESTRICTAMENTE PRODUCTOS DISPONIBLES PARA MARKETING
    // Regla de Negocio: SOLO promocionar productos con order_available = true Y availability_status = 'DISPONIBLE'
    const productosDisponibles = productosConMetricas
      .filter((p) => p.order_available === true && p.availability_status === 'DISPONIBLE')
      // Priorizar productos con mayor capacidad disponible (margen para recibir pedidos)
      .sort((a, b) => b.remaining_capacity - a.remaining_capacity)

    // Si NO hay productos disponibles en estado DISPONIBLE
    if (productosDisponibles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Capacidad de producción agotada',
        mensaje: 'No hay productos en estado DISPONIBLE para promocionar en este momento. Todos los productos han alcanzado su límite diario o están en capacidad limitada/cerrada.',
        resumen_capacidad: {
          total_productos: productosConMetricas.length,
          disponibles: 0,
          capacidad_limitada: productosConMetricas.filter((p) => p.availability_status === 'CAPACIDAD LIMITADA').length,
          cerrados: productosConMetricas.filter((p) => p.availability_status === 'CERRADO').length,
        },
      })
    }

    // 3. Obtener eventos del calendario
    let eventos = []
    try {
      const { data: evts, error: eErr } = await supabase
        .from('eventos_calendario')
        .select('*')
        .eq('activo', true)

      if (!eErr && evts) {
        eventos = evts
      }
    } catch (e) {
      console.warn('Advertencia al consultar eventos_calendario:', e.message)
    }

    if (eventos.length === 0) {
      eventos = [
        {
          id: 'evt-semana-santa',
          nombre: 'Semana Santa',
          fecha_inicio: '2026-03-25',
          fecha_fin: '2026-04-10',
          categoria: 'festividad',
          productos_relacionados: ['Chipa', 'Rosca', 'Pan de Campo'],
          activo: true,
        },
        {
          id: 'evt-dia-celiaco',
          nombre: 'Día del Celíaco',
          fecha_inicio: '2026-05-01',
          fecha_fin: '2026-05-07',
          categoria: 'salud',
          productos_relacionados: ['Pan de Campo', 'Masa para Tarta'],
          activo: true,
        },
      ]
    }

    // 4. Obtener reglas de promoción
    let reglas = []
    try {
      const { data: rgls, error: rErr } = await supabase
        .from('reglas_promocion')
        .select('*')
        .eq('activo', true)
        .order('prioridad', { ascending: false })

      if (!rErr && rgls) {
        reglas = rgls
      }
    } catch (e) {
      console.warn('Advertencia al consultar reglas_promocion:', e.message)
    }

    if (reglas.length === 0) {
      reglas = [
        {
          id: 'reg-evento',
          nombre: 'Impulso por Festividad o Evento',
          descripcion: 'Aplica cuando hay un evento activo en el calendario',
          condicion: { tipo: 'evento_calendario' },
          tipo_costo: 'competitivo',
          descuento_min: 10,
          descuento_max: 15,
          prioridad: 10,
          activo: true,
        },
        {
          id: 'reg-capacidad-alta',
          nombre: 'Impulso de Alta Capacidad Disponible',
          descripcion: 'Acelera pedidos en productos con amplia capacidad disponible en cocina',
          condicion: { tipo: 'capacidad_disponible', umbral: 10 },
          tipo_costo: 'competitivo',
          descuento_min: 10,
          descuento_max: 15,
          prioridad: 9,
          activo: true,
        },
        {
          id: 'reg-estrella',
          nombre: 'Producto Estrella Premium',
          descripcion: 'Fidelización y posicionamiento de calidad artesanal',
          condicion: { tipo: 'producto_estrella' },
          tipo_costo: 'premium',
          descuento_min: 5,
          descuento_max: 10,
          prioridad: 5,
          activo: true,
        },
      ]
    }

    // 5. LÓGICA DE DECISIÓN INTELIGENTE
    const eventoActivo = eventos.find((ev) => {
      return fechaParam >= ev.fecha_inicio && fechaParam <= ev.fecha_fin
    }) || null

    let productoElegido = null
    let reglaElegida = null
    let descuentoSugerido = 10
    let motivo = ''

    // Caso 1: Se solicitó evaluar un producto específico
    if (productoIdParam) {
      const buscado = productosConMetricas.find((p) => p.id === productoIdParam)

      if (buscado) {
        if (buscado.availability_status === 'CERRADO') {
          return NextResponse.json({
            success: false,
            error: 'Producto Cerrado por Capacidad Máxima',
            mensaje: `El producto "${buscado.nombre}" ha completado el 100% de su capacidad de pedidos (${buscado.current_orders}/${buscado.production_capacity}). No se puede promocionar.`,
            producto: buscado,
          }, { status: 400 })
        }

        if (buscado.availability_status === 'CAPACIDAD LIMITADA') {
          return NextResponse.json({
            success: false,
            error: 'Producto con Capacidad Limitada',
            mensaje: `El producto "${buscado.nombre}" se encuentra al ${buscado.porcentaje_ocupacion}% de su capacidad (${buscado.current_orders}/${buscado.production_capacity} pedidos). Se recomienda no impulsar promociones agresivas.`,
            producto: buscado,
          }, { status: 400 })
        }

        productoElegido = buscado
      } else {
        productoElegido = productosDisponibles[0]
      }

      if (
        eventoActivo &&
        eventoActivo.productos_relacionados?.some((rel) =>
          productoElegido.nombre.toLowerCase().includes(rel.toLowerCase())
        )
      ) {
        reglaElegida = reglas.find((r) => r.condicion?.tipo === 'evento_calendario') || reglas[0]
        descuentoSugerido = reglaElegida.descuento_max || 15
        motivo = `El producto coincide con el evento activo "${eventoActivo.nombre}" y tiene capacidad disponible (${productoElegido.remaining_capacity} cupos).`
      } else {
        reglaElegida = reglas.find((r) => r.condicion?.tipo === 'producto_estrella') || reglas[0]
        descuentoSugerido = reglaElegida.descuento_min || 10
        motivo = `Evaluación para ${productoElegido.nombre} con ${productoElegido.remaining_capacity} pedidos disponibles de producción.`
      }
    }
    // Caso 2: El motor decide automáticamente priorizando alta capacidad disponible
    else {
      // Prioridad 1: Coincidencia con evento activo PERO que esté disponible
      if (
        eventoActivo &&
        Array.isArray(eventoActivo.productos_relacionados) &&
        eventoActivo.productos_relacionados.length > 0
      ) {
        productoElegido = productosDisponibles.find((p) =>
          eventoActivo.productos_relacionados.some((rel) =>
            p.nombre.toLowerCase().includes(rel.toLowerCase()) ||
            p.categoria?.toLowerCase().includes(rel.toLowerCase())
          )
        )
        if (productoElegido) {
          reglaElegida = reglas.find((r) => r.condicion?.tipo === 'evento_calendario') || reglas[0]
          descuentoSugerido = reglaElegida.descuento_max || 15
          motivo = `🎉 Evento "${eventoActivo.nombre}" detectado. Se seleccionó "${productoElegido.nombre}" con ${productoElegido.remaining_capacity} cupos disponibles de producción.`
        }
      }

      // Prioridad 2: Producto disponible con mayor capacidad remanente (para balancear carga de cocina)
      if (!productoElegido) {
        // Tomar el producto disponible con más cupos libres
        productoElegido = productosDisponibles[0]
        reglaElegida = reglas.find((r) => r.condicion?.tipo === 'capacidad_disponible') || reglas[0]
        descuentoSugerido = reglaElegida?.descuento_min || 10
        motivo = `⚡ Alta disponibilidad de producción: "${productoElegido.nombre}" tiene ${productoElegido.remaining_capacity} cupos libres (${productoElegido.porcentaje_ocupacion}% ocupado).`
      }
    }

    const precioOriginal = Number(productoElegido?.precio_venta) || 25000
    const precioFinal = Math.round(precioOriginal * (1 - descuentoSugerido / 100))

    // Generar alternativas SOLO de la lista de disponibles
    const alternativas = productosDisponibles
      .filter((p) => p.id !== productoElegido?.id)
      .slice(0, 3)
      .map((altProd) => {
        const altDesc = 10
        const altOrig = Number(altProd.precio_venta) || 20000
        return {
          producto: altProd,
          descuento_sugerido: altDesc,
          precio_original: altOrig,
          precio_final: Math.round(altOrig * (1 - altDesc / 100)),
          capacidad_disponible: altProd.remaining_capacity,
          motivo: `Disponible en cocina: ${altProd.remaining_capacity} pedidos libres (${altProd.categoria || 'Panadería'})`,
        }
      })

    return NextResponse.json({
      success: true,
      decision: {
        producto: productoElegido,
        regla: reglaElegida,
        evento: eventoActivo,
        descuento_sugerido: descuentoSugerido,
        precio_original: precioOriginal,
        precio_final: precioFinal,
        capacidad_produccion: {
          capacidad_diaria: productoElegido.production_capacity,
          pedidos_actuales: productoElegido.current_orders,
          cupos_disponibles: productoElegido.remaining_capacity,
          porcentaje_ocupacion: `${productoElegido.porcentaje_ocupacion}%`,
          lead_time_horas: productoElegido.lead_time,
          estado_disponibilidad: productoElegido.availability_status,
        },
        motivo: motivo,
        fecha_evaluacion: fechaParam,
        timestamp: new Date().toISOString(),
      },
      alternativas: alternativas,
      contexto_produccion: {
        total_productos_catalogo: productosConMetricas.length,
        total_productos_disponibles: productosDisponibles.length,
        total_eventos_activos: eventos.length,
        total_reglas_activas: reglas.length,
      },
    })
  } catch (error) {
    console.error('Error en decidir-promocion API:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al calcular decisión de promoción' },
      { status: 500 }
    )
  }
}
