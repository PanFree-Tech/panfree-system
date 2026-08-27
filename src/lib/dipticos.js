/**
 * 📁 src/lib/dipticos.js
 * Servicio integral para gestión de códigos de dípticos físicos, QR,
 * validación, canjes y gamificación de fidelidad en PanFree.
 */

import { supabase } from './supabase'

const CARACTERES_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin caracteres ambiguos como O/0, I/1

/**
 * Genera un código aleatorio de 6 caracteres alfanuméricos
 */
export function generarCodigo() {
    let codigo = ''
    for (let i = 0; i < 6; i++) {
        codigo += CARACTERES_CODIGO.charAt(Math.floor(Math.random() * CARACTERES_CODIGO.length))
    }
    return codigo
}

/**
 * Genera un código único comprobando en la base de datos (con fallback seguro)
 */
export async function generarCodigoUnico() {
    try {
        const { data, error } = await supabase.rpc('generar_codigo_diptico_unico')
        if (!error && data) return data
    } catch {
        // Fallback a generación en JavaScript si el RPC aún no fue ejecutado en SQL
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

/**
 * Genera un lote de códigos listos para inserción
 * @param {number} cantidad
 * @param {string} [loteId]
 * @param {number} [diasValidez=365]
 */
export async function generarLoteCantidad(cantidad = 50, loteId = null, diasValidez = 365) {
    const cant = Math.max(1, Math.min(1000, Number(cantidad) || 50))
    const lote = loteId || `LOTE-${new Date().toISOString().slice(0, 10)}-${generarCodigo().slice(0, 4)}`
    const fechaExp = new Date()
    fechaExp.setDate(fechaExp.getDate() + diasValidez)
    const fechaExpIso = fechaExp.toISOString()

    const setCodigos = new Set()

    // Intentar primero obtener códigos únicos
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
 * Valida un código de díptico
 * @param {string} codigo
 * @returns {Promise<{valido: boolean, mensaje?: string, codigo?: object}>}
 */
export async function validarCodigo(codigo) {
    if (!codigo || typeof codigo !== 'string') {
        return { valido: false, mensaje: 'Debes ingresar un código válido' }
    }

    const codigoLimpio = codigo.trim().toUpperCase()
    if (codigoLimpio.length !== 6) {
        return { valido: false, mensaje: 'El código debe tener exactamente 6 caracteres' }
    }

    try {
        const { data, error } = await supabase
            .from('codigos_dipticos')
            .select('*')
            .eq('codigo', codigoLimpio)
            .maybeSingle()

        if (error || !data) {
            return { valido: false, mensaje: 'El código ingresado no existe o es incorrecto' }
        }

        if (data.canjeado) {
            return {
                valido: false,
                mensaje: `Este código ya fue canjeado el ${new Date(data.canjeado_en || data.created_at).toLocaleDateString('es-PY')}`
            }
        }

        if (data.fecha_expiracion && new Date() > new Date(data.fecha_expiracion)) {
            return { valido: false, mensaje: 'Este código ha expirado' }
        }

        return { valido: true, codigo: data }
    } catch (err) {
        console.error('Error al validar código díptico:', err)
        return { valido: false, mensaje: 'Error al verificar el código en el sistema' }
    }
}

/**
 * Canjea un código de díptico y asigna los 100 puntos al cliente
 * @param {string} codigo
 * @param {string} clienteId
 * @returns {Promise<{success: boolean, puntos?: number, mensaje?: string, canje?: object}>}
 */
export async function canjearCodigo(codigo, clienteId) {
    if (!clienteId) {
        return { success: false, mensaje: 'Identificador de cliente no válido' }
    }

    const validacion = await validarCodigo(codigo)
    if (!validacion.valido) {
        return { success: false, mensaje: validacion.mensaje }
    }

    const codigoObj = validacion.codigo
    const ahoraIso = new Date().toISOString()
    const puntosAGanar = 100

    try {
        // 1. Registrar canje en tabla canjes_dipticos
        const { data: canje, error: canjeError } = await supabase
            .from('canjes_dipticos')
            .insert({
                codigo_id: codigoObj.id,
                cliente_id: clienteId,
                puntos_ganados: puntosAGanar,
                created_at: ahoraIso
            })
            .select()
            .single()

        if (canjeError) {
            console.error('Error insertando canje:', canjeError)
            // Si ya existe registro de canje
            if (canjeError.code === '23505') {
                return { success: false, mensaje: 'Este código ya fue registrado para canje' }
            }
            throw canjeError
        }

        // 2. Marcar código como canjeado en tabla codigos_dipticos
        const { error: updateCodigoError } = await supabase
            .from('codigos_dipticos')
            .update({
                canjeado: true,
                canjeado_por: clienteId,
                canjeado_en: ahoraIso
            })
            .eq('id', codigoObj.id)

        if (updateCodigoError) {
            console.warn('Advertencia actualizando código díptico:', updateCodigoError)
        }

        // 3. Asegurar actualización de puntos y nivel del cliente
        try {
            const { data: clienteActual } = await supabase
                .from('clientes')
                .select('puntos_fidelidad')
                .eq('id', clienteId)
                .single()

            const nuevosPuntos = (clienteActual?.puntos_fidelidad || 0) + puntosAGanar
            let nuevoNivel = 'bronce'
            if (nuevosPuntos >= 1000) nuevoNivel = 'vip'
            else if (nuevosPuntos >= 500) nuevoNivel = 'oro'
            else if (nuevosPuntos >= 200) nuevoNivel = 'plata'

            await supabase
                .from('clientes')
                .update({
                    puntos_fidelidad: nuevosPuntos,
                    nivel_cliente: nuevoNivel,
                    updated_at: ahoraIso
                })
                .eq('id', clienteId)
        } catch (clienteErr) {
            console.warn('Trigger o actualización cliente manejada:', clienteErr)
        }

        return {
            success: true,
            puntos: puntosAGanar,
            mensaje: `¡Excelente! Has sumado ${puntosAGanar} puntos a tu cuenta de fidelidad PanFree.`,
            canje
        }
    } catch (err) {
        console.error('Error en canjearCodigo:', err)
        return { success: false, mensaje: 'Ocurrió un problema al procesar el canje del código' }
    }
}

/**
 * Canjea un premio del catálogo de fidelidad descontando los puntos
 * @param {string} premioId
 * @param {string} clienteId
 */
export async function canjearPremio(premioId, clienteId) {
    try {
        const { data: premio, error: premioErr } = await supabase
            .from('premios')
            .select('*')
            .eq('id', premioId)
            .eq('activo', true)
            .single()

        if (premioErr || !premio) {
            return { success: false, mensaje: 'El premio seleccionado no está disponible' }
        }

        const { data: cliente, error: clienteErr } = await supabase
            .from('clientes')
            .select('puntos_fidelidad, nombre_completo, email')
            .eq('id', clienteId)
            .single()

        if (clienteErr || !cliente) {
            return { success: false, mensaje: 'Cliente no encontrado' }
        }

        const puntosActuales = cliente.puntos_fidelidad || 0
        if (puntosActuales < premio.costo_puntos) {
            return {
                success: false,
                mensaje: `Puntos insuficientes. Necesitas ${premio.costo_puntos} pts y tienes ${puntosActuales} pts.`
            }
        }

        // Generar un código de cupón único para el usuario si es descuento o beneficio
        const cuponGenerado = `CANJE-${premio.tipo.slice(0, 3).toUpperCase()}-${generarCodigo()}`

        // 1. Registrar canje de premio
        const { data: registroCanje, error: regErr } = await supabase
            .from('canjes_premios')
            .insert({
                premio_id: premio.id,
                cliente_id: clienteId,
                puntos_gastados: premio.costo_puntos,
                cupon_generado: cuponGenerado,
                estado: 'completado',
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (regErr) {
            console.warn('Error registrando canje en tabla canjes_premios:', regErr)
        }

        // 2. Si el premio es de descuento o delivery, crear cupón en cupones_descuento para usar en checkout
        if (premio.tipo === 'descuento' || premio.tipo === 'delivery_gratis') {
            const esPorcentaje = premio.tipo === 'descuento' && Number(premio.valor) <= 100
            await supabase.from('cupones_descuento').insert({
                codigo: cuponGenerado,
                descripcion: `Premio canjeado: ${premio.nombre}`,
                tipo_descuento: esPorcentaje ? 'porcentaje' : 'monto_fijo',
                valor_descuento: Number(premio.valor) || 10,
                monto_minimo_compra: 0,
                limite_usos_total: 1,
                usos_actuales: 0,
                limite_por_cliente: 1,
                activo: true
            })
        }

        // 3. Descontar puntos al cliente
        const puntosRestantes = puntosActuales - premio.costo_puntos
        let nuevoNivel = 'bronce'
        if (puntosRestantes >= 1000) nuevoNivel = 'vip'
        else if (puntosRestantes >= 500) nuevoNivel = 'oro'
        else if (puntosRestantes >= 200) nuevoNivel = 'plata'

        await supabase
            .from('clientes')
            .update({
                puntos_fidelidad: puntosRestantes,
                nivel_cliente: nuevoNivel,
                updated_at: new Date().toISOString()
            })
            .eq('id', clienteId)

        return {
            success: true,
            mensaje: `¡Felicidades! Canjeaste "${premio.nombre}". Tu cupón es: ${cuponGenerado}`,
            cupon: cuponGenerado,
            puntosRestantes,
            premio
        }
    } catch (err) {
        console.error('Error al canjear premio:', err)
        return { success: false, mensaje: 'Error interno al procesar el canje de premio' }
    }
}

/**
 * Obtiene métricas y estadísticas de códigos de dípticos
 */
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
        console.error('Error obteniendo estadísticas de dípticos:', err)
        return { total: 0, activos: 0, canjeados: 0, lotes: 0, tasaCanje: '0%' }
    }
}

/**
 * Definición de niveles de gamificación
 */
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
