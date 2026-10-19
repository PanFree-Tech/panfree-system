/**
 * Logger central de PanFree System.
 *
 * - En desarrollo: emite log, warn y error normalmente.
 * - En produccion: silencia log y warn, mantiene error para observabilidad.
 *
 * Uso: import { log, warn, error } from '@/lib/logger'
 */

const IS_PROD = process.env.NODE_ENV === 'production'

export function log(...args) {
  if (!IS_PROD) console.log(...args)
}

export function warn(...args) {
  if (!IS_PROD) console.warn(...args)
}

export function error(...args) {
  console.error(...args)
}

const logger = { log, warn, error }

export default logger
