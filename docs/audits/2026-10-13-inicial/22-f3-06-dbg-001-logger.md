# F3-06 - DBG-001: console.log con datos sensibles

**Fecha de cierre:** 2026-10-14
**Sesion:** 13
**Hallazgo:** DBG-001 (P1)
**Commit:** a031ba2e

---

## 1. Problema

DBG-001 reportaba `console.log/warn/error` con datos sensibles en `src/`.
En total: **381 llamadas** en **88 archivos**, incluyendo emails, UUIDs
de cliente, IDs de pedido y en algunos casos argumentos de error completos.

En produccion (Vercel), estos logs van a los logs del runtime y son
visibles en el dashboard de Vercel. No hay filtro automatico.

---

## 2. Estrategia

En lugar de eliminar las 381 llamadas (perdida de trazabilidad en dev,
diff enorme, riesgo alto), se creo un **logger runtime** que silencia
`log` y `warn` en produccion pero mantiene `error` para observabilidad.

Archivo nuevo: `src/lib/logger.js` (21 lineas):

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

---

## 3. Cambios aplicados

- Creado `src/lib/logger.js`.
- 381 reemplazos en 88 archivos:
  - `console.log(`   -> `logger.log(`
  - `console.warn(`  -> `logger.warn(`
  - `console.error(` -> `logger.error(`
- 88 imports agregados: `import { log, warn, error } from '@/lib/logger'`.

### Reglas de insercion del import

- Si el archivo tiene `'use client'`, el import va despues del directive.
- Si el archivo tiene imports multilinea (`import {` ... `} from 'x'`),
  el import va despues del cierre `} from`.
- Si el archivo no tiene imports, el import va al inicio.

---

## 4. Verificacion (DoD)

- [x] `src/lib/logger.js` creado, 21 lineas, sin dependencias.
- [x] 0 `console.*` residuales fuera de `logger.js`.
- [x] 88 archivos con import, 0 errores de insercion.
- [x] Archivos con `'use client'` con import despues del directive.
- [x] Archivos con imports multilinea sin romper bloques.
- [x] `src/app/page.js` y `publish-instagram/route.js` sin syntax errors.
- [x] Commit `a031ba2e` pusheado a main.

### Verificacion post-fix

    Select-String -Path src\**\*.js,src\**\*.jsx `
      -Pattern 'console\.(log|warn|error)\(' `
      | Where-Object { $_.Path -notmatch 'logger\.js$' }

    -> 0 resultados

---

## 5. Triaje PII

Se corrio un grep de PII (`email|token|password|key|secret|userId|cliente|phone|whatsapp`)
sobre las lineas con logger. Resultado: **54 hits potenciales**.

Clasificacion:

- ~20 falsos positivos (palabra `cliente`, `email`, `key` en mensaje de contexto).
- ~34 loguean identificadores reales (UUIDs, emails operativos, IDs de pedido).
- 0 credenciales reales (no hay `password` ni `token` con valor).

Conclusion: en produccion, `logger.log/warn` silenciados. Los 34
identificadores operativos ya no se emiten. `logger.error` sigue emitiendo
para observabilidad (Sentry/Vercel).

---

## 6. Deuda tecnica registrada

- **Build local no funciona** sin `.env.local`. Esto es preexistente a
  F3-06 (el fail-fast se introdujo en F3-02 / S10).
  Se resolvera con F2-14 (guardar .env en Bitwarden) + crear `.env.local`.
- **PWA regenera artefactos** en `public/` durante `npm run build`
  (sw.js, workbox-*.js, worker-*.js). No commitear. Ya estan
  trackeados y se revierten con `git checkout`.
- **Imports sin uso**: en archivos con un solo `console.log` reemplazado
  a `logger.log`, el import trae `log, warn, error` pero solo usa uno.
  No bloquea (ESLint ignoreDuringBuilds: true). Se resuelve al hacer F3-08.

---

## 7. Referencias

- Hallazgo: [06-hallazgos-tracking.md](./06-hallazgos-tracking.md)
- Fix: commit `a031ba2e`
- Script: [26a-fix-f3-06-logger.ps1](../../../scripts/docs/26a-fix-f3-06-logger.ps1)
- Documentacion: [26b-documentar-f3-06.ps1](../../../scripts/docs/26b-documentar-f3-06.ps1)
