/**
 * 📁 UBICACIÓN: src/app/api/admin/marketing/decidir-promocion/route.js
 * 📌 ENDPOINT: GET /api/admin/marketing/decidir-promocion
 * 📖 DESCRIPCIÓN: Motor de toma de decisiones de marketing inteligente.
 *    Evalúa el calendario de eventos, el catálogo de productos y las reglas de negocio
 *    para sugerir la promoción óptima con mayor potencial de conversión.
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

    // 1. Obtener productos activos
    let productos = []
    try {
      const { data: prods, error: pErr } = await supabase
        .from('productos')
        .select('id,nombre,categoria,precio_venta,imagen_url,slug,descripcion,is_featured,is_active')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })

      if (!pErr && prods && prods.length > 0) {
        productos = prods
      }
    } catch (e) {
      console.warn('Advertencia al consultar productos en decidir-promocion:', e.message)
    }

    // Fallback de productos si la tabla está vacía
    if (productos.length === 0) {
      productos = [
        { id: 'prod-chipa-01', nombre: 'Chipa Tradicional Sin Gluten', categoria: 'Panificados', precio_venta: 20000, is_featured: true },
        { id: 'prod-pan-02', nombre: 'Pan de Campo Sin TACC', categoria: 'Panificados', precio_venta: 28000, is_featured: true },
        { id: 'prod-torta-03', nombre: 'Torta Artesanal Sin Gluten', categoria: 'Repostería', precio_venta: 85000, is_featured: false },
        { id: 'prod-alfajor-04', nombre: 'Alfajores de Maicena Sin TACC', categoria: 'Repostería', precio_venta: 18000, is_featured: false },
      ]
    }

    // 2. Obtener eventos del calendario
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

    // Fallback de eventos si la tabla no está creada
    if (eventos.length === 0) {
      eventos = [
        {
          id: 'evt-semana-santa',
          nombre: 'Semana Santa',
          fecha_inicio: '2026-03-25',
          fecha_fin: '2026-04-10',
          categoria: 'festividad',
          productos_relacionados: ['Chipa', 'Rosca', 'Pan de Campo'],
          activo: true
        },
        {
          id: 'evt-dia-celiaco',
          nombre: 'Día del Celíaco',
          fecha_inicio: '2026-05-01',
          fecha_fin: '2026-05-07',
          categoria: 'salud',
          productos_relacionados: ['Pan de Campo', 'Masa para Tarta'],
          activo: true
        }
      ]
    }

    // 3. Obtener reglas de promoción
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

    // Fallback de reglas
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
          activo: true
        },
        {
          id: 'reg-stock',
          nombre: 'Promoción de Exceso de Stock / Rotación',
          descripcion: 'Aplica rotación de inventario con descuento dinámico',
          condicion: { tipo: 'stock', umbral: 20 },
          tipo_costo: 'competitivo',
          descuento_min: 15,
          descuento_max: 20,
          prioridad: 8,
          activo: true
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
          activo: true
        }
      ]
    }

    // 4. LÓGICA DE DECISIÓN INTELIGENTE
    // A. Evaluar evento activo en la fecha consultada
    const eventoActivo = eventos.find((ev) => {
      return fechaParam >= ev.fecha_inicio && fechaParam <= ev.fecha_fin
    }) || null

    let productoElegido = null
    let reglaElegida = null
    let descuentoSugerido = 10
    let motivo = ''

    // Caso 1: Se solicitó evaluar un producto específico
    if (productoIdParam) {
      productoElegido = productos.find((p) => p.id === productoIdParam) || productos[0]
      if (eventoActivo && eventoActivo.productos_relacionados?.some((rel) =>
        productoElegido.nombre.toLowerCase().includes(rel.toLowerCase())
      )) {
        reglaElegida = reglas.find((r) => r.condicion?.tipo === 'evento_calendario') || reglas[0]
        descuentoSugerido = reglaElegida.descuento_max || 15
        motivo = `El producto coincide con el evento activo "${eventoActivo.nombre}". Se aplica regla de festividad.`
      } else {
        reglaElegida = reglas.find((r) => r.condicion?.tipo === 'producto_estrella') || reglas[0]
        descuentoSugerido = reglaElegida.descuento_min || 10
        motivo = `Evaluación personalizada para ${productoElegido.nombre} según regla de posicionamiento.`
      }
    }
    // Caso 2: El motor decide automáticamente el mejor producto
    else {
      // Prioridad 1: Producto asociado a evento activo en el calendario
      if (eventoActivo && Array.isArray(eventoActivo.productos_relacionados) && eventoActivo.productos_relacionados.length > 0) {
        productoElegido = productos.find((p) =>
          eventoActivo.productos_relacionados.some((rel) =>
            p.nombre.toLowerCase().includes(rel.toLowerCase()) ||
            p.categoria?.toLowerCase().includes(rel.toLowerCase())
          )
        )
        if (productoElegido) {
          reglaElegida = reglas.find((r) => r.condicion?.tipo === 'evento_calendario') || reglas[0]
          descuentoSugerido = reglaElegida.descuento_max || 15
          motivo = `🎉 Evento detectado: "${eventoActivo.nombre}". Se priorizó "${productoElegido.nombre}" para maximizar ventas estacionales.`
        }
      }

      // Prioridad 2: Si no hubo coincidencia con evento, elegir producto estrella destacado
      if (!productoElegido) {
        productoElegido = productos.find((p) => p.is_featured) || productos[0]
        reglaElegida = reglas.find((r) => r.prioridad >= 5) || reglas[0]
        descuentoSugerido = reglaElegida?.descuento_min || 10
        motivo = `⭐ Se seleccionó el producto destacado "${productoElegido.nombre}" con regla de fidelización.`
      }
    }

    const precioOriginal = Number(productoElegido?.precio_venta) || 25000
    const precioFinal = Math.round(precioOriginal * (1 - descuentoSugerido / 100))

    // Generar 2 sugerencias alternativas
    const alternativas = productos
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
          motivo: `Alternativa por categoría ${altProd.categoria || 'Panadería'}`
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
        motivo: motivo,
        fecha_evaluacion: fechaParam,
        timestamp: new Date().toISOString()
      },
      alternativas: alternativas,
      contexto: {
        total_productos_analizados: productos.length,
        total_eventos_activos: eventos.length,
        total_reglas_activas: reglas.length
      }
    })
  } catch (error) {
    console.error('Error en decidir-promocion API:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al calcular decisión de promoción' },
      { status: 500 }
    )
  }
}
