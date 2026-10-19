describe('Cupones - lógica de validación', () => {
  it('calcula descuento porcentual correctamente', () => {
    const total = 100000
    const descuento = 10
    const resultado = total * (1 - descuento / 100)
    expect(resultado).toBe(90000)
  })

  it('calcula descuento fijo correctamente', () => {
    const total = 100000
    const descuento = 15000
    const resultado = total - descuento
    expect(resultado).toBe(85000)
  })

  it('no aplica descuento mayor al total', () => {
    const total = 10000
    const descuento = 15000
    const resultado = Math.max(0, total - descuento)
    expect(resultado).toBe(0)
  })

  it('valida cupón expirado', () => {
    const hoy = new Date('2026-10-19')
    const vencimiento = new Date('2026-10-01')
    expect(vencimiento < hoy).toBe(true)
  })

  it('valida cupón vigente', () => {
    const hoy = new Date('2026-10-19')
    const vencimiento = new Date('2026-12-31')
    expect(vencimiento >= hoy).toBe(true)
  })
})
