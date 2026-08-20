/**
 * 📁 UBICACIÓN: src/app/api/admin/diagnostico/route.js
 * 📌 DESCRIPCIÓN: Endpoint de diagnóstico de base de datos Supabase para PanFree.
 *    Verifica conectividad, conteo de tablas y estructura de esquema en vivo.
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const diagnostico = {
    timestamp: new Date().toISOString(),
    tablas: {},
    errores: [],
    resumen: 'ok',
  }

  const tablasAChequear = ['pedidos', 'detalle_pedido', 'clientes', 'productos', 'insumos']

  for (const tabla of tablasAChequear) {
    try {
      const inicio = Date.now()
      const { data, count, error } = await supabase
        .from(tabla)
        .select('*', { count: 'exact' })
        .limit(1)

      const duracionMs = Date.now() - inicio

      if (error) {
        diagnostico.tablas[tabla] = {
          estado: 'error',
          mensaje: error.message,
          codigo: error.code,
          duracionMs,
        }
        diagnostico.errores.push(`[${tabla}] ${error.message}`)
      } else {
        diagnostico.tablas[tabla] = {
          estado: 'ok',
          totalRegistros: count ?? 0,
          muestraEncontrada: (data && data.length > 0),
          duracionMs,
        }
      }
    } catch (err) {
      diagnostico.tablas[tabla] = {
        estado: 'excepcion',
        mensaje: err.message,
      }
      diagnostico.errores.push(`[${tabla}] ${err.message}`)
    }
  }

  if (diagnostico.errores.length > 0) {
    diagnostico.resumen = 'advertencias'
  }

  return NextResponse.json(diagnostico)
}
