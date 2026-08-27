/**
 * 📁 src/app/api/premios/canjear/route.js
 * API para canjear premios del catálogo de fidelización usando puntos acumulados
 */

import { NextResponse } from 'next/server'
import { canjearPremio } from '@/lib/dipticos'
import { supabase } from '@/lib/supabase'

export async function POST(req) {
    try {
        const body = await req.json()
        const { premioId, clienteId, userId } = body

        if (!premioId) {
            return NextResponse.json(
                { success: false, error: 'Identificador de premio requerido' },
                { status: 400 }
            )
        }

        let targetClienteId = clienteId || null

        if (!targetClienteId && userId) {
            const { data: cliente } = await supabase
                .from('clientes')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle()

            if (cliente) {
                targetClienteId = cliente.id
            }
        }

        if (!targetClienteId) {
            return NextResponse.json(
                { success: false, error: 'Debes iniciar sesión para canjear un premio', requiereLogin: true },
                { status: 401 }
            )
        }

        const resultado = await canjearPremio(premioId, targetClienteId)

        return NextResponse.json(resultado, { status: resultado.success ? 200 : 400 })

    } catch (error) {
        console.error('Error en /api/premios/canjear:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno al canjear el premio' },
            { status: 500 }
        )
    }
}
