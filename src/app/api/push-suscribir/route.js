/**
 * 📁 UBICACIÓN: src/app/api/push-suscribir/route.js
 * 📅 ACTUALIZADO: 2026-03-06
 * 📌 FIX: Supabase client inicializado dentro de la función (no a nivel módulo)
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { subscription, userId, userAgent } = await request.json()
    if (!subscription?.endpoint || !userId) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id   : userId,
        endpoint  : subscription.endpoint,
        p256dh    : subscription.keys.p256dh,
        auth      : subscription.keys.auth,
        user_agent: userAgent || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' })

    if (error) throw error
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Error guardando suscripción push:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { endpoint } = await request.json()
    if (!endpoint) return NextResponse.json({ error: 'Sin endpoint' }, { status: 400 })
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}