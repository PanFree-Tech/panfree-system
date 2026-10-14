/**
 * src/lib/validar-password.js
 * ACTUALIZADO: 2026-10-14
 * Validacion centralizada de fortaleza de password.
 * Reglas AUTH-001 (F3-04): minimo 10 chars + mayuscula + minuscula + numero + simbolo.
 */

export const PASSWORD_MIN_LENGTH = 10

export const PASSWORD_REGLAS = [
  {
    id: 'length',
    test: (pwd) => pwd.length >= PASSWORD_MIN_LENGTH,
    mensaje: 'Al menos 10 caracteres',
  },
  {
    id: 'mayuscula',
    test: (pwd) => /[A-Z]/.test(pwd),
    mensaje: 'Al menos una letra mayuscula (A-Z)',
  },
  {
    id: 'minuscula',
    test: (pwd) => /[a-z]/.test(pwd),
    mensaje: 'Al menos una letra minuscula (a-z)',
  },
  {
    id: 'numero',
    test: (pwd) => /[0-9]/.test(pwd),
    mensaje: 'Al menos un numero (0-9)',
  },
  {
    id: 'simbolo',
    test: (pwd) => /[^A-Za-z0-9]/.test(pwd),
    mensaje: 'Al menos un simbolo (!@#$%^&*...)',
  },
]

/**
 * Valida una password contra las reglas.
 * @param {string} pwd
 * @returns {{ ok: boolean, errores: string[], reglas: Array<{id: string, ok: boolean, mensaje: string}> }}
 */
export function validarPassword(pwd) {
  const texto = typeof pwd === 'string' ? pwd : ''
  const reglas = PASSWORD_REGLAS.map((r) => ({
    id: r.id,
    ok: r.test(texto),
    mensaje: r.mensaje,
  }))
  const errores = reglas.filter((r) => !r.ok).map((r) => r.mensaje)
  return { ok: errores.length === 0, errores, reglas }
}

/**
 * Atajo: true si la password es valida.
 */
export function passwordEsValida(pwd) {
  return validarPassword(pwd).ok
}