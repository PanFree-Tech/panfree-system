/**
 * 📁 src/app/api/dipticos/canjear/route.js
 * API segura para validar y canjear códigos de dípticos físicos con QR
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabase as supabaseAdmin, sanitizeSupabaseUrl, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '@/lib/supabase'
import { canjearCodigo, validarCodigo } from '@/lib/dipticos'

export async function POST(req) {
    try {
        const body = await req.json()
        const { codigo, clienteId: providedClienteId, userId: providedUserId } = body

        if (!codigo || typeof codigo !== 'string' || codigo.trim().length !== 6) {
            return NextResponse.json(
                { success: false, error: 'Código inválido (debe tener 6 caracteres alfanuméricos)' },
                { status: 400 }
            )
        }

        const codigoLimpio = codigo.trim().toUpperCase()

        // 1. Intentar obtener el usuario de la sesión activa
        let userId = providedUserId || null
        let clienteId = providedClienteId || null

        try {
            const cookieStore = cookies()
            const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
            const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
            const supabaseUrl = sanitizeSupabaseUrl(rawUrl)
            const supabaseAnonKey = (rawKey && typeof rawKey === 'string' && rawKey.trim()) ? rawKey.trim() : DEFAULT_SUPABASE_ANON_KEY

            const supabaseSsr = createServerClient(
                supabaseUrl,
                supabaseAnonKey,
                {
                    cookies: {
                        get(name) {
                            return cookieStore.get(name)?.value
                        },
                    },
                }
            )

            const { data: { user } } = await supabaseSsr.auth.getUser()
            if (user) {
                userId = user.id
            }
        } catch (cookieErr) {
            console.warn('Advertencia leyendo cookies de sesión SSR:', cookieErr.message)
        }

        // Si se envió un token Bearer en headers
        if (!userId) {
            const authHeader = req.headers.get('authorization')
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.replace('Bearer ', '').trim()
                const { data: { user } } = await supabaseAdmin.auth.getUser(token)
                if (user) {
                    userId = user.id
                }
            }
        }

        // Si no hay clienteId pero sí userId, buscar el id de cliente
        if (!clienteId && userId) {
            const { data: clienteRecord } = await supabaseAdmin
                .from('clientes')
                .select('id, nombre_completo, puntos_fidelidad')
                .eq('user_id', userId)
                .maybeSingle()

            if (clienteRecord) {
                clienteId = clienteRecord.id
            } else {
                // Si el cliente no existe en la tabla clientes, crearlo automáticamente
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId).catch(() => ({ data: null }))
                const email = authUser?.user?.email || 'cliente@panfree.com'
                const nombre = authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name || email.split('@')[0]

                const { data: nuevoCliente, error: createErr } = await supabaseAdmin
                    .from('clientes')
                    .insert({
                        user_id: userId,
                        email,
                        nombre_completo: nombre,
                        puntos_fidelidad: 0,
                        nivel_cliente: 'bronce',
                        is_active: true,
                        role: 'cliente'
                    })
                    .select('id')
                    .single()

                if (!createErr && nuevoCliente) {
                    clienteId = nuevoCliente.id
                }
            }
        }

        // Si tras todos los intentos no hay cliente autenticado, requerir login
        if (!clienteId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Debes iniciar sesión con tu cuenta PanFree para canjear este código',
                    requiereLogin: true
                },
                { status: 401 }
            )
        }

        // 2. Ejecutar el canje del código
        const resultado = await canjearCodigo(codigoLimpio, clienteId)

        if (!resultado.success) {
            return NextResponse.json({
                success: false,
                mensaje: resultado.mensaje,
                error: resultado.mensaje
            }, { status: 200 })
        }

        return NextResponse.json({
            success: true,
            puntos: resultado.puntos,
            mensaje: resultado.mensaje || `¡Código canjeado con éxito! +${resultado.puntos} puntos añadidos.`,
            canje: resultado.canje
        })

    } catch (error) {
        console.error('Error no controlado en /api/dipticos/canjear:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor al procesar el canje' },
            { status: 500 }
        )
    }
}
