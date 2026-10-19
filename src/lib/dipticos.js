/**
 * src/lib/dipticos.js
 * Servicio integral para gestion de codigos de dipticos fisicos, QR,
 * validacion, canjes y gamificacion de fidelidad en PanFree.
 *
 * AUD-006: canjes usan RPCs atomicos (canjear_diptico, canjear_premio)
 * en vez de INSERT+UPDATE+UPDATE manual. Elimina race conditions y
 * delegacion de puntos al cliente.
 */

import logger from '@/lib/logger'
import { supabase } from './supabase'

const CARACTERES_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generarCodigo() {
    let codigo = ''
    for (let i = 0; i < 6; i++) {
        codigo += CARACTERES_CODIGO.charAt(Math.floor(Math.random() * CARACTERES_CODIGO.length))
    }
    return codigo
}

export async function generarCodigoUnico() {
    try {
        const { data, error } = await supabase.rpc('generar_codigo_diptico_unico')
        if (!error && data) return data
    } catch {
        // Fallback a generacion en JavaScript si el RPC no esta disponible
    }

    let codigo = ''
    let esUnico = false
    let intentos = 0

    while (!esUnico && intentos < 10) {
        intentos++
        codigo = generarCodigo()
        const { data, error } = await supabase
            .from('codigos_dipticos')
            .select('id')
            .eq('codigo', codigo)
            .maybeSingle()

        if (error || !data) {
            esUnico = true
        }
    }

    return codigo
}

export async function generarLoteCantidad(cantidad = 50, loteId = null, diasValidez = 365) {
    const cant = Math.max(1, Math.min(1000, Number(cantidad) || 50))
    const lote = loteId || `LOTE-${new Date().toISOString().slice(0, 10)}-${generarCodigo().slice(0, 4)}`
    const fechaExp = new Date()
    fechaExp.setDate(fechaExp.getDate() + diasValidez)
    const fechaExpIso = fechaExp.toISOString()

    const setCodigos = new Set()
    while (setCodigos.size < cant) {
        setCodigos.add(generarCodigo())
    }

    const codigosArray = Array.from(setCodigos).map(codigo => ({
        codigo,
        lote_id: lote,
        canjeado: false,
        fecha_expiracion: fechaExpIso,
        created_at: new Date().toISOString()
    }))

    return {
        lote_id: lote,
        codigos: codigosArray
    }
}

/**
 * AUD-006: validarCodigo usa RPC (SELECT USING(true) fue eliminado).
 */
export async function validarCodigo(codigo) {
    if (!codigo || typeof codigo !== 'string') {
        return { valido: false, mensaje: 'Debes ingresar un codigo valido' }
    }

    const codigoLimpio = codigo.trim().toUpperCase()
    if (codigoLimpio.length !== 6) {
        return { valido: false, mensaje: 'El codigo debe tener exactamente 6 caracteres' }
    }

    try {
        const { data, error } = await supabase.rpc('validar_codigo_diptico', { p_codigo: codigoLimpio })

        if (error) {
            logger.error('Error al validar codigo diptico:', error)
            return { valido: false, mensaje: 'Error al verificar el codigo en el sistema' }
        }

        return data
    } catch (err) {
        logger.error('Error al validar codigo diptico:', err)
        return { valido: false, mensaje: 'Error al verificar el codigo en el sistema' }
    }
}

/**
 * AUD-006: canjearCodigo usa RPC atomico canjear_diptico.
 * El RPC verifica auth, bloquea fila con FOR UPDATE, marca canjeado,
 * inserta canje, suma puntos y recalcula nivel en una transaccion.
 */
export async function canjearCodigo(codigo) {
    if (!codigo || typeof codigo !== 'string') {
        return { success: false, mensaje: 'Codigo invalido' }
    }

    try {
        const { data, error } = await supabase.rpc('canjear_diptico', {
            p_codigo: codigo.trim().toUpperCase()
        })

        if (error) {
            logger.error('Error en RPC canjear_diptico:', error)
            return { success: false, mensaje: error.message || 'Error al procesar el canje' }
        }

        if (!data?.success) {
            return { success: false, mensaje: data?.error || 'No se pudo procesar el canje' }
        }

        return {
            success: true,
            puntos: data.puntos_ganados,
            nuevoNivel: data.nuevo_nivel,
            puntosTotales: data.puntos_totales,
            mensaje: `Excelente! Has sumado ${data.puntos_ganados} puntos a tu cuenta.`
        }
    } catch (err) {
        logger.error('Error en canjearCodigo:', err)
        return { success: false, mensaje: 'Ocurrio un problema al procesar el canje' }
    }
}

/**
 * AUD-006: canjearPremio usa RPC atomico canjear_premio.
 */
export async function canjearPremio(premioId) {
    if (!premioId) {
        return { success: false, mensaje: 'ID de premio invalido' }
    }

    try {
        const { data, error } = await supabase.rpc('canjear_premio', {
            p_premio_id: premioId
        })

        if (error) {
            logger.error('Error en RPC canjear_premio:', error)
            return { success: false, mensaje: error.message || 'Error al procesar el canje' }
        }

        if (!data?.success) {
            return { success: false, mensaje: data?.error || 'No se pudo procesar el canje' }
        }

        return {
            success: true,
            cupon: data.cupon,
            puntosGastados: data.puntos_gastados,
            puntosRestantes: data.puntos_restantes,
            nuevoNivel: data.nuevo_nivel,
            premio: data.premio_nombre,
            mensaje: `Felicidades! Canjeaste "${data.premio_nombre}". Tu cupon es: ${data.cupon}`
        }
    } catch (err) {
        logger.error('Error en canjearPremio:', err)
        return { success: false, mensaje: 'Error interno al procesar el canje' }
    }
}

export async function getEstadisticas() {
    try {
        const { data, error } = await supabase
            .from('codigos_dipticos')
            .select('id, canjeado, lote_id, created_at')

        if (error || !data) {
            return { total: 0, activos: 0, canjeados: 0, lotes: 0, tasaCanje: '0%' }
        }

        const total = data.length
        const canjeados = data.filter(c => c.canjeado).length
        const activos = total - canjeados
        const lotesSet = new Set(data.map(c => c.lote_id).filter(Boolean))
        const tasa = total > 0 ? `${((canjeados / total) * 100).toFixed(1)}%` : '0%'

        return {
            total,
            activos,
            canjeados,
            lotes: lotesSet.size,
            tasaCanje: tasa
        }
    } catch (err) {
        logger.error('Error obteniendo estadisticas de dipticos:', err)
        return { total: 0, activos: 0, canjeados: 0, lotes: 0, tasaCanje: '0%' }
    }
}

export const NIVELES_GAMIFICACION = [
    { id: 'bronce', nombre: 'Bronce', min: 0, max: 199, emoji: '🥉', color: '#b7996b', bg: '#fdf8f0', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
    { id: 'plata', nombre: 'Plata', min: 200, max: 499, emoji: '🥈', color: '#78909c', bg: '#f0f4f8', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' },
    { id: 'oro', nombre: 'Oro', min: 500, max: 999, emoji: '🥇', color: '#f59e0b', bg: '#fef3c7', badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
    { id: 'vip', nombre: 'VIP', min: 1000, max: Infinity, emoji: '👑', color: '#7c3aed', bg: '#f5f3ff', badgeClass: 'bg-purple-100 text-purple-900 border-purple-300' }
]

export function calcularNivel(puntos = 0) {
    const pts = Math.max(0, Number(puntos) || 0)
    const actual = NIVELES_GAMIFICACION.reduce((acc, n) => (pts >= n.min ? n : acc), NIVELES_GAMIFICACION[0])
    const siguiente = NIVELES_GAMIFICACION.find(n => n.min > pts) || null

    let progreso = 100
    if (siguiente) {
        const rango = siguiente.min - actual.min
        const acumuladoEnNivel = pts - actual.min
        progreso = Math.min(100, Math.max(0, Math.round((acumuladoEnNivel / rango) * 100)))
    }

    return {
        actual,
        siguiente,
        puntosParaSiguiente: siguiente ? siguiente.min - pts : 0,
        progreso
    }
}