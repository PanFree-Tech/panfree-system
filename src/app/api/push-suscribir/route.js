/**
 * 📁 UBICACIÓN: src/app/api/push-suscribir/route.js
 * 📅 ACTUALIZADO: 2026-08-28
 * 📌 DESCRIPCIÓN: Endpoint para gestionar suscripciones Push Web (VAPID) en Supabase:
 *    - POST: Guarda o actualiza (upsert) la suscripción del usuario en la tabla push_subscriptions
 *    - GET: Obtiene las suscripciones activas de un usuario
 *    - DELETE: Elimina una suscripción específica por endpoint o usuario
 */

import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { sanitizeSupabaseUrl, sanitizeSupabaseKey } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Obtiene el cliente Supabase con service_role si está disponible o cliente estándar
 */
function getDbClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
  const anonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)

  if (serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey)
  }
  return createSupabaseClient(supabaseUrl, anonKey)
}

/**
 * POST: Guarda o actualiza una suscripción push
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { subscription, userId, user_id } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'El objeto de suscripción y su endpoint son requeridos' },
        { status: 400 }
      )
    }

    // 1. Identificar usuario desde la sesión o parámetro
    let targetUserId = userId || user_id

    if (!targetUserId) {
      try {
        const cookieStore = cookies()
        const authClient = createRouteHandlerClient({ cookies: () => cookieStore })
        const { data: { session } } = await authClient.auth.getSession()
        if (session?.user?.id) {
          targetUserId = session.user.id
        }
      } catch (authErr) {
        console.warn('⚠️ No se pudo obtener sesión por cookies:', authErr.message)
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere ID de usuario autenticado.' },
        { status: 401 }
      )
    }

    const endpoint = subscription.endpoint.trim()
    const p256dh = subscription.keys?.p256dh || null
    const auth = subscription.keys?.auth || null
    const userAgent = request.headers.get('user-agent') || ''

    const db = getDbClient()

    // 2. Insertar o actualizar suscripción (UPSERT)
    const payload = {
      user_id: targetUserId,
      subscription: subscription,
      endpoint: endpoint,
      p256dh: p256dh,
      auth: auth,
      user_agent: userAgent,
      updated_at: new Date().toISOString(),
    }

    const { data, error: upsertError } = await db
      .from('push_subscriptions')
      .upsert(payload, {
        onConflict: 'user_id,endpoint',
      })
      .select()

    if (upsertError) {
      console.error('❌ [Push] Error guardando suscripción en Supabase:', upsertError)
      // Fallback si la constraint onConflict tiene otro nombre o es solo por endpoint
      const { error: fallbackError } = await db
        .from('push_subscriptions')
        .upsert(payload, { onConflict: 'endpoint' })

      if (fallbackError) {
        throw fallbackError
      }
    }

    console.log(`✅ [Push] Suscripción registrada exitosamente para usuario ${targetUserId}`)

    return NextResponse.json({
      success: true,
      message: 'Suscripción push registrada correctamente',
      data,
    })
  } catch (error) {
    console.error('💥 [Push] Error en POST /api/push-suscribir:', error)
    return NextResponse.json(
      { error: error.message || 'Error al registrar suscripción push' },
      { status: 500 }
    )
  }
}

/**
 * GET: Obtiene las suscripciones activas de un usuario
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    let targetUserId = searchParams.get('userId') || searchParams.get('user_id')

    if (!targetUserId) {
      try {
        const cookieStore = cookies()
        const authClient = createRouteHandlerClient({ cookies: () => cookieStore })
        const { data: { session } } = await authClient.auth.getSession()
        if (session?.user?.id) {
          targetUserId = session.user.id
        }
      } catch (e) {
        // ignore
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Parámetro userId o sesión requerida' },
        { status: 400 }
      )
    }

    const db = getDbClient()
    const { data, error } = await db
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      subscriptions: data || [],
      count: data?.length || 0,
      isSubscribed: (data?.length || 0) > 0,
    })
  } catch (error) {
    console.error('💥 [Push] Error en GET /api/push-suscribir:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener suscripciones' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Elimina una suscripción push
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    const userId = searchParams.get('userId') || searchParams.get('user_id')

    const db = getDbClient()
    let query = db.from('push_subscriptions').delete()

    if (endpoint) {
      query = query.eq('endpoint', endpoint)
    } else if (userId) {
      query = query.eq('user_id', userId)
    } else {
      return NextResponse.json(
        { error: 'Se requiere endpoint o userId para eliminar' },
        { status: 400 }
      )
    }

    const { error } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Suscripción eliminada correctamente',
    })
  } catch (error) {
    console.error('💥 [Push] Error en DELETE /api/push-suscribir:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar suscripción' },
      { status: 500 }
    )
  }
}
