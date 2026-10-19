import { calcularDescuento } from '@/lib/cupones'

describe('calcularDescuento', () => {
  describe('cupones de porcentaje', () => {
    it('calcula 10% de 100000 = 10000', () => {
      const cupon = { tipo_descuento: 'porcentaje', valor_descuento: 10 }
      expect(calcularDescuento(cupon, 100000)).toBe(10000)
    })

    it('calcula 50% de 50000 = 25000', () => {
      const cupon = { tipo_descuento: 'porcentaje', valor_descuento: 50 }
      expect(calcularDescuento(cupon, 50000)).toBe(25000)
    })

    it('no descuenta más que el subtotal (100% de 1000 = 1000)', () => {
      const cupon = { tipo_descuento: 'porcentaje', valor_descuento: 100 }
      expect(calcularDescuento(cupon, 1000)).toBe(1000)
    })

    it('redondea hacia arriba con .5', () => {
      const cupon = { tipo_descuento: 'porcentaje', valor_descuento: 15 }
      expect(calcularDescuento(cupon, 1055)).toBe(158)
    })
  })

  describe('cupones de monto fijo', () => {
    it('descuenta monto fijo si es menor al subtotal', () => {
      const cupon = { tipo_descuento: 'fijo', valor_descuento: 15000 }
      expect(calcularDescuento(cupon, 50000)).toBe(15000)
    })

    it('no descuenta más que el subtotal (fijo 20000 en subtotal 10000 = 10000)', () => {
      const cupon = { tipo_descuento: 'fijo', valor_descuento: 20000 }
      expect(calcularDescuento(cupon, 10000)).toBe(10000)
    })

    it('descuenta 0 si el subtotal es 0', () => {
      const cupon = { tipo_descuento: 'fijo', valor_descuento: 5000 }
      expect(calcularDescuento(cupon, 0)).toBe(0)
    })
  })

  describe('casos borde', () => {
    it('devuelve 0 si no hay cupón', () => {
      expect(calcularDescuento(null, 10000)).toBe(0)
    })

    it('devuelve 0 si el subtotal es negativo', () => {
      const cupon = { tipo_descuento: 'porcentaje', valor_descuento: 10 }
      expect(calcularDescuento(cupon, -100)).toBe(0)
    })

    it('devuelve 0 si valor_descuento es undefined', () => {
      const cupon = { tipo_descuento: 'porcentaje' }
      expect(calcularDescuento(cupon, 1000)).toBe(0)
    })
  })
})
