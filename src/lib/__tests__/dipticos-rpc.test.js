/**
 * Tests de los RPCs de fidelización (mockean supabase.rpc)
 *
 * Cubre:
 *   - validarCodigo: código válido, inválido, expirado, ya canjeado
 *   - canjearCodigo: éxito, código inválido, error de red
 *   - canjearPremio: éxito, puntos insuficientes, premio inactivo
 */

import { supabase } from '@/lib/supabase'
import { validarCodigo, canjearCodigo, canjearPremio } from '@/lib/dipticos'

describe('validarCodigo (RPC validar_codigo_diptico)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retorna válido cuando el RPC devuelve valido: true', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { valido: true, codigo_id: 'abc-123', puntos_ganados: 100 },
      error: null,
    })

    const r = await validarCodigo('ABC123')

    expect(r.valido).toBe(true)
    expect(r.puntos_ganados).toBe(100)
    expect(supabase.rpc).toHaveBeenCalledWith('validar_codigo_diptico', { p_codigo: 'ABC123' })
  })

  it('retorna inválido cuando el código no existe', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { valido: false, mensaje: 'El código no existe' },
      error: null,
    })

    const r = await validarCodigo('XXXXXX')

    expect(r.valido).toBe(false)
    expect(r.mensaje).toMatch(/no existe/)
  })

  it('retorna inválido cuando el código ya fue canjeado', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { valido: false, mensaje: 'Este código ya fue canjeado' },
      error: null,
    })

    const r = await validarCodigo('ABC123')

    expect(r.valido).toBe(false)
    expect(r.mensaje).toMatch(/ya fue canjeado/)
  })

  it('retorna inválido cuando el código expiró', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { valido: false, mensaje: 'Este código ha expirado' },
      error: null,
    })

    const r = await validarCodigo('ABC123')

    expect(r.valido).toBe(false)
    expect(r.mensaje).toMatch(/expirado/)
  })

  it('rechaza código con formato inválido (sin llamar al RPC)', async () => {
    const r = await validarCodigo('ABC')

    expect(r.valido).toBe(false)
    expect(r.mensaje).toMatch(/6 caracteres/)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })
})

describe('canjearCodigo (RPC canjear_diptico)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retorna success: true cuando el RPC devuelve success: true', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { success: true, puntos_ganados: 100, nuevo_nivel: 'plata', puntos_totales: 300 },
      error: null,
    })

    const r = await canjearCodigo('ABC123')

    expect(r.success).toBe(true)
    expect(r.puntos).toBe(100)
    expect(r.nuevoNivel).toBe('plata')
    expect(supabase.rpc).toHaveBeenCalledWith('canjear_diptico', { p_codigo: 'ABC123' })
  })

  it('retorna success: false cuando el código es inválido', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { success: false, error: 'Código inválido o ya canjeado' },
      error: null,
    })

    const r = await canjearCodigo('ABC123')

    expect(r.success).toBe(false)
    expect(r.mensaje).toMatch(/inválido|canjeado/)
  })

  it('retorna success: false cuando el RPC falla por red', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'network error' },
    })

    const r = await canjearCodigo('ABC123')

    expect(r.success).toBe(false)
    expect(r.mensaje).toBe('network error')
  })

  it('rechaza código vacío (sin llamar al RPC)', async () => {
    const r = await canjearCodigo('')

    expect(r.success).toBe(false)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })
})

describe('canjearPremio (RPC canjear_premio)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retorna success: true cuando el RPC devuelve success: true', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: {
        success: true,
        cupon: 'CANJE-DES-ABC123',
        puntos_gastados: 200,
        puntos_restantes: 100,
        nuevo_nivel: 'bronce',
        premio_nombre: '10% OFF',
      },
      error: null,
    })

    const r = await canjearPremio('premio-uuid-123')

    expect(r.success).toBe(true)
    expect(r.cupon).toBe('CANJE-DES-ABC123')
    expect(r.puntosRestantes).toBe(100)
    expect(supabase.rpc).toHaveBeenCalledWith('canjear_premio', { p_premio_id: 'premio-uuid-123' })
  })

  it('retorna success: false cuando no hay puntos suficientes', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { success: false, error: 'Puntos insuficientes. Necesitas 200 y tienes 50' },
      error: null,
    })

    const r = await canjearPremio('premio-uuid-123')

    expect(r.success).toBe(false)
    expect(r.mensaje).toMatch(/insuficientes/)
  })

  it('retorna success: false cuando el premio no está disponible', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { success: false, error: 'Premio no disponible' },
      error: null,
    })

    const r = await canjearPremio('premio-uuid-123')

    expect(r.success).toBe(false)
    expect(r.mensaje).toMatch(/no disponible/)
  })

  it('rechaza premioId vacío (sin llamar al RPC)', async () => {
    const r = await canjearPremio('')

    expect(r.success).toBe(false)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })
})