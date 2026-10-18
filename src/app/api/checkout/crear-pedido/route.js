/**
 * src/app/api/checkout/crear-pedido/route.js
 *
 * Endpoint server-side para crear pedidos (invitados + logueados).
 * Usa SUPABASE_SERVICE_ROLE_KEY para bypasear RLS y GRANTs.
 * El navegador NO toca Supabase directamente.
 *
 * Flujo:
 *  1. Busca/crea cliente (service_role)
 *  2. Crea pedido (service_role, trigger genera numero_pedido)
 *  3. Crea detalle_pedido (service_role)
 *  4. Actualiza cupón y puntos (service_role)
 *  5. Notifica (fire-and-forget)
 */

import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.panfree.fit'

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      cliente: { nombre, email, telefono, userId } = {},
      items,
      metodoEntrega,
      metodoPago,
      direccion,
      deliveryInfo,
      cupon,
      descuento,
    } = body

    // Validaciones
    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 })
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 })
    }
    if (!telefono || !telefono.trim()) {
      return NextResponse.json({ success: false, error: 'Teléfono requerido' }, { status: 400 })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Carrito vacío' }, { status: 400 })
    }
    if (!['retiro', 'delivery'].includes(metodoEntrega)) {
      return NextResponse.json({ success: false, error: 'Método de entrega inválido' }, { status: 400 })
    }
    if (metodoEntrega === 'delivery' && !deliveryInfo?.disponible) {
      return NextResponse.json({ success: false, error: 'Dirección fuera de zona de delivery' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // 1. Calcular totales
    const subtotal = items.reduce(
      (sum, i) => sum + (Number(i.precio_venta) * Number(i.cantidad)),
      0
    )
    const costoDelivery = metodoEntrega === 'delivery' ? (Number(deliveryInfo?.costo) || 0) : 0
    const descuentoMonto = Number(descuento) || 0
    const totalFinal = Math.max(0, subtotal - descuentoMonto) + costoDelivery
    const puntosGanados = Math.floor(totalFinal / 1000)

    // 2. Buscar/crear cliente
    const emailNormalizado = email.trim().toLowerCase()
    let clienteId = null

    const { data: existente, error: errBuscar } = await admin
      .from('clientes')
      .select('id, user_id')
      .eq('email', emailNormalizado)
      .maybeSingle()

    if (errBuscar) {
      logger.error('Error buscando cliente:', errBuscar)
      throw errBuscar
    }

    if (existente) {
      clienteId = existente.id
      await admin
        .from('clientes')
        .update({
          nombre_completo: nombre.trim(),
          telefono: telefono.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clienteId)
    } else {
      const { data: nuevo, error: errCliente } = await admin
        .from('clientes')
        .insert({
          nombre_completo: nombre.trim(),
          email: emailNormalizado,
          telefono: telefono.trim() || null,
          user_id: userId || null,
          direccion_ciudad: 'Encarnación',
          direccion_provincia: 'Itapúa',
        })
        .select('id')
        .single()

      if (errCliente) {
        logger.error('Error creando cliente:', errCliente)
        throw errCliente
      }
      clienteId = nuevo.id
    }

    // 3. Crear pedido (trigger genera numero_pedido)
    const direccionCompleta = metodoEntrega === 'delivery'
      ? [direccion?.direccion, direccion?.referencia].filter(Boolean).join(' - ')
      : null

    const { data: pedido, error: errPedido } = await admin
      .from('pedidos')
      .insert({
        cliente_id: clienteId,
        estado: 'pendiente',
        metodo_entrega: metodoEntrega,
        entrega_direccion: direccionCompleta,
        entrega_costo: costoDelivery,
        entrega_distancia_km: deliveryInfo?.distancia_km || null,
        entrega_lat: deliveryInfo?.lat || null,
        entrega_lng: deliveryInfo?.lng || null,
        subtotal,
        descuento: descuentoMonto,
        total_final: totalFinal,
        estado_pago: 'pendiente',
        metodo_pago: metodoPago,
        creado_por: userId || null,
        cupon_codigo: cupon?.codigo || null,
        descuento_monto: descuentoMonto,
        puntos_ganados: puntosGanados,
        puntos_usados: 0,
        es_pedido_anticipado: false,
      })
      .select('id, numero_pedido')
      .single()

    if (errPedido) {
      logger.error('Error creando pedido:', errPedido)
      throw errPedido
    }

    // 4. Crear detalle
    const detalles = items.map(i => ({
      pedido_id: pedido.id,
      producto_id: i.id,
      cantidad: Number(i.cantidad),
      precio_unitario: Number(i.precio_venta),
    }))

    const { error: errDetalle } = await admin.from('detalle_pedido').insert(detalles)
    if (errDetalle) {
      logger.error('Error creando detalle:', errDetalle)
      throw errDetalle
    }

    // 5. Registrar cupón
    if (cupon?.id && descuentoMonto > 0) {
      try {
        await admin.from('cupones_canjeados').insert({
          cupon_id: cupon.id,
          cliente_id: clienteId,
          pedido_id: pedido.id,
          descuento_obtenido: descuentoMonto,
        })
        const { data: cData } = await admin
          .from('cupones_descuento')
          .select('usos_actuales')
          .eq('id', cupon.id)
          .single()
        await admin
          .from('cupones_descuento')
          .update({ usos_actuales: (cData?.usos_actuales || 0) + 1 })
          .eq('id', cupon.id)
      } catch (cErr) {
        logger.warn('No se pudo registrar cupón:', cErr)
      }
    }

    // 6. Actualizar puntos de fidelidad
    try {
      const { data: cInfo } = await admin
        .from('clientes')
        .select('puntos_fidelidad')
        .eq('id', clienteId)
        .single()
      const nuevosPuntos = (cInfo?.puntos_fidelidad || 0) + puntosGanados
      let nivel = 'bronce'
      if (nuevosPuntos >= 5000) nivel = 'vip'
      else if (nuevosPuntos >= 1500) nivel = 'oro'
      else if (nuevosPuntos >= 500) nivel = 'plata'

      await admin
        .from('clientes')
        .update({ puntos_fidelidad: nuevosPuntos, nivel_cliente: nivel })
        .eq('id', clienteId)
    } catch (fErr) {
      logger.warn('No se pudo actualizar puntos:', fErr)
    }

    // 7. Notificar (fire-and-forget)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (process.env.NEXT_PUBLIC_API_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
      }
      await fetch(`${BASE_URL}/api/notificar-pedido`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pedido: {
            numero: pedido.numero_pedido,
            total: totalFinal,
            metodoPago,
            metodoEntrega,
            items: items.map(i => ({
              nombre: i.nombre,
              cantidad: Number(i.cantidad),
              precio: Number(i.precio_venta),
            })),
          },
          cliente: {
            nombre: nombre.trim(),
            email: email.trim(),
            telefono: telefono.trim(),
            direccion: direccionCompleta,
          },
        }),
      })
    } catch (nErr) {
      logger.warn('No se pudo notificar pedido:', nErr)
    }

    return NextResponse.json({
      success: true,
      numeroPedido: pedido.numero_pedido,
      pedidoId: pedido.id,
      total: totalFinal,
      subtotal,
      costoDelivery,
      puntosGanados,
    })
  } catch (error) {
    logger.error('Error en /api/checkout/crear-pedido:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al crear pedido' },
      { status: 500 }
    )
  }
}