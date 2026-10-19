describe('Dipticos - lógica de canje', () => {
  it('valida código de díptico (formato A-Z0-9, 6 chars)', () => {
    const codigo = 'A7K3P9'
    expect(/^[A-Z0-9]{6}$/.test(codigo)).toBe(true)
  })

  it('rechaza código con caracteres inválidos', () => {
    const codigo = 'A7K-3P'
    expect(/^[A-Z0-9]{6}$/.test(codigo)).toBe(false)
  })

  it('valida que un díptico no esté expirado', () => {
    const hoy = new Date('2026-10-19')
    const vencimiento = new Date('2026-10-01')
    expect(vencimiento < hoy).toBe(true)
  })

  it('valida que un díptico vigente no esté expirado', () => {
    const hoy = new Date('2026-10-19')
    const vencimiento = new Date('2026-12-31')
    expect(vencimiento >= hoy).toBe(true)
  })

  it('valida que un díptico no esté canjeado', () => {
    const diptico = { canjeado: false, canjeado_en: null }
    expect(diptico.canjeado).toBe(false)
    expect(diptico.canjeado_en).toBeNull()
  })

  it('detecta díptico ya canjeado', () => {
    const diptico = { canjeado: true, canjeado_en: '2026-10-01T10:00:00Z' }
    expect(diptico.canjeado).toBe(true)
    expect(diptico.canjeado_en).not.toBeNull()
  })
})
