# BUG-010 - Regresion del logger (S13)

**Fecha:** 2026-10-14
**Hallazgo:** BUG-010
**Severidad:** Critica (produccion caida)
**Estado:** Cerrado
**Commit fix:** 757938c2

---

## Sintoma

Application error: a client-side exception has occurred.
Console: `ReferenceError: logger is not defined`.

---

## Causa raiz

El commit `a031ba2e` (S13, F3-06) reemplazo 381 llamadas `console.*`
por `logger.*` en 88 archivos, pero importo el logger con:

    import { log, warn, error } from '@/lib/logger'

El modulo `src/lib/logger.js` exporta funciones sueltas (`log`, `warn`, `error`)
Y un default `{ log, warn, error }`, pero NO un objeto `logger`.

Los 88 archivos llamaban `logger.log(...)`, `logger.warn(...)`,
`logger.error(...)`, pero `logger` nunca se definio. Resultado:
`ReferenceError` en runtime (no en build â€” Next.js no falla por esto).

---

## Fix aplicado

Reemplazo literal en los 88 archivos:

    import { log, warn, error } from '@/lib/logger'
    ->
    import logger from '@/lib/logger'

Los calls `logger.log/warn/error` quedan intactos.

- Script: `scripts/docs/29-fix-logger-import.ps1`
- Commit: `757938c2`

---

## Verificacion

- Deploy Vercel `757938c2`: Ready
- App en incognito: OK
- Console: sin ReferenceError
- React montado, DOM con contenido (2329 chars)
- Script verificacion: 9 checks OK

---

## Hallazgo colateral

**BUG-011:** bug en `scripts/docs/29-fix-logger-import.ps1`, linea final:

    Write-Ok ($modified + ' archivos modificados')

PowerShell interpreta `$modified + ' string'` como suma aritmetica
cuando `$modified` es int. Fix pendiente: usar `"$modified archivos
modificados"`. No bloquea (el fix se aplico igual, solo fallo el log
final y el commit automatico).

---

## Lecciones

1. Los reemplazos masivos (381 calls en 88 archivos) requieren
   verificacion post-fix en produccion. El build paso OK pero la
   app crasheaba en runtime.
2. Nunca asumir que un import "esta bien" solo porque el archivo
   lo tiene. Verificar que el nombre importado matchee con el uso.
3. En Next.js, un error de referencia en runtime no rompe el build.

---

## Referencias

- Commit fix: 757938c2
- Script: scripts/docs/29-fix-logger-import.ps1
- Doc original S13: 22-f3-06-dbg-001-logger.md
- [Tracking de hallazgos](./06-hallazgos-tracking.md)
