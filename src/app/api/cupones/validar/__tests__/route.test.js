/**
 * @jest-environment node
 */
import { testApiHandler } from 'next-test-api-route-handler'
import * as appHandler from '@/app/api/cupones/validar/route'

describe('/api/cupones/validar', () => {
  it('devuelve 400 si no se envía código', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subtotal: 10000 }),
        })
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.valido).toBe(false)
        expect(json.mensaje).toContain('requerido')
      },
    })
  })

  it('devuelve 400 si el código está vacío', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: '   ', subtotal: 10000 }),
        })
        expect(res.status).toBe(400)
      },
    })
  })
})
