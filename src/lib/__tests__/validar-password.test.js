import { validarPassword, passwordEsValida } from '@/lib/validar-password'

describe('validarPassword', () => {
  it('rechaza contraseña vacía', () => {
    const result = validarPassword('')
    expect(result.ok).toBe(false)
    expect(result.errores.length).toBeGreaterThan(0)
  })

  it('rechaza contraseña menor a 10 caracteres', () => {
    const result = validarPassword('Abc1!')
    expect(result.ok).toBe(false)
  })

  it('rechaza contraseña sin mayúscula', () => {
    const result = validarPassword('abcdefgh1!')
    expect(result.ok).toBe(false)
  })

  it('rechaza contraseña sin minúscula', () => {
    const result = validarPassword('ABCDEFGH1!')
    expect(result.ok).toBe(false)
  })

  it('rechaza contraseña sin número', () => {
    const result = validarPassword('Abcdefgh!')
    expect(result.ok).toBe(false)
  })

  it('rechaza contraseña sin símbolo', () => {
    const result = validarPassword('Abcdefgh1')
    expect(result.ok).toBe(false)
  })

  it('acepta contraseña válida (10+ chars, mayúscula, minúscula, número, símbolo)', () => {
    const result = validarPassword('Abcdefgh1!')
    expect(result.ok).toBe(true)
    expect(result.errores.length).toBe(0)
  })

  it('acepta contraseña con símbolos especiales', () => {
    const result = validarPassword('MiClave123#')
    expect(result.ok).toBe(true)
  })

  it('passwordEsValida devuelve true para contraseña válida', () => {
    expect(passwordEsValida('Abcdefgh1!')).toBe(true)
  })

  it('passwordEsValida devuelve false para contraseña inválida', () => {
    expect(passwordEsValida('corta')).toBe(false)
  })
})
