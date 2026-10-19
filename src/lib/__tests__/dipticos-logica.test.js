import { calcularNivel, NIVELES_GAMIFICACION, generarCodigo } from '@/lib/dipticos'

describe('calcularNivel (gamificación)', () => {
  it('0 puntos = Bronce', () => {
    const result = calcularNivel(0)
    expect(result.actual.id).toBe('bronce')
    expect(result.actual.nombre).toBe('Bronce')
    expect(result.siguiente.id).toBe('plata')
    expect(result.progreso).toBe(0)
  })

  it('199 puntos = Bronce (límite superior)', () => {
    const result = calcularNivel(199)
    expect(result.actual.id).toBe('bronce')
    expect(result.siguiente.id).toBe('plata')
  })

  it('200 puntos = Plata', () => {
    const result = calcularNivel(200)
    expect(result.actual.id).toBe('plata')
    expect(result.siguiente.id).toBe('oro')
  })

  it('499 puntos = Plata (límite superior)', () => {
    const result = calcularNivel(499)
    expect(result.actual.id).toBe('plata')
  })

  it('500 puntos = Oro', () => {
    const result = calcularNivel(500)
    expect(result.actual.id).toBe('oro')
    expect(result.siguiente.id).toBe('vip')
  })

  it('999 puntos = Oro (límite superior)', () => {
    const result = calcularNivel(999)
    expect(result.actual.id).toBe('oro')
  })

  it('1000 puntos = VIP', () => {
    const result = calcularNivel(1000)
    expect(result.actual.id).toBe('vip')
    expect(result.siguiente).toBeNull()
    expect(result.progreso).toBe(100)
  })

  it('5000 puntos = VIP (sin límite)', () => {
    const result = calcularNivel(5000)
    expect(result.actual.id).toBe('vip')
    expect(result.siguiente).toBeNull()
  })

  it('puntos negativos se normalizan a 0', () => {
    const result = calcularNivel(-100)
    expect(result.actual.id).toBe('bronce')
  })
})

describe('NIVELES_GAMIFICACION', () => {
  it('tiene 4 niveles', () => {
    expect(NIVELES_GAMIFICACION).toHaveLength(4)
  })

  it('los IDs son correctos', () => {
    const ids = NIVELES_GAMIFICACION.map(n => n.id)
    expect(ids).toEqual(['bronce', 'plata', 'oro', 'vip'])
  })

  it('los rangos de min son crecientes', () => {
    const mins = NIVELES_GAMIFICACION.map(n => n.min)
    expect(mins).toEqual([0, 200, 500, 1000])
  })
})

describe('generarCodigo', () => {
  it('genera un código de 6 caracteres', () => {
    const codigo = generarCodigo()
    expect(codigo).toHaveLength(6)
  })

  it('solo contiene caracteres alfanuméricos', () => {
    const codigo = generarCodigo()
    expect(codigo).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('genera códigos distintos (probabilístico, 100 iteraciones)', () => {
    const codigos = new Set()
    for (let i = 0; i < 100; i++) {
      codigos.add(generarCodigo())
    }
    expect(codigos.size).toBeGreaterThan(90)
  })
})
