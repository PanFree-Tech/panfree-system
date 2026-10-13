# F3-02 / SEC-002 - Eliminar claves hardcodeadas de src/lib/supabase.js

**Fecha:** 2026-10-14
**Hallazgo:** SEC-002
**Tarea:** F3-02
**Severidad:** Alta (clave productiva filtrada en repo)
**Estado:** Cerrado
**Esfuerzo:** S (Small)

---

## 1. Contexto

Durante la auditoria inicial (2026-10-13) se detecto que `src/lib/supabase.js`
contenia dos constantes con valores productivos hardcodeados:

- `DEFAULT_SUPABASE_URL = 'https://gbdrcaumghykiipqgbty.supabase.co'',
- `DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'`.

Se registro como **SEC-002** (Alta). La anon key es publica por diseno en
Supabase (va en el bundle del browser igual), pero hardcodearla en el repo
es un anti-patron por varias razones:

- **Configuracion fragil:** si cambia el proyecto Supabase (o la key se
  rota en Fase 2), el valor hardcodeado queda desactualizado y el fallback
  silencioso enmascara el error de configuracion.
- **Deploy silenciosamente roto:** si en Vercel (o donde se deploye) falta
  la env var, el cliente cae silenciosamente a la constante hardcodeada,
  y no hay sintoma visible de que el entorno esta mal configurado.
- **Superficie de rotacion:** cualquier rotacion futura de la key obliga a
  tocar el codigo, no solo las env vars.

Referencia: [ADR-002](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
establece que las claves productivas viven en env vars, nunca en el codigo.

---

## 2. Diagnostico

### 2.1 Constantes hardcodeadas

En `src/lib/supabase.js` lineas 9-10:

```js
export const DEFAULT_SUPABASE_URL = 'https://gbdrcaumghykiipqgbty.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 2.2 Fallbacks silenciosos (8 archivos)

Las constantes se usaban como fallback silencioso en 3 lugares dentro de
`supabase.js` (`sanitizeSupabaseUrl`, `sanitizeSupabaseKey` dos veces) y en
7 archivos consumidores adicionales:

| # | Archivo | Uso |
|---|---|---|
| 1 | `src/middleware.js` | import + fallback en `supabaseAnonKey` |
| 2 | `src/app/api/send-email/route.js` | import + fallback |
| 3 | `src/app/api/send-whatsapp-team/route.js` | import + fallback |
| 4 | `src/app/api/resumen-diario/route.js` | import + fallback |
| 5 | `src/app/api/dipticos/canjear/route.js` | import (URL + KEY) + ternario |
| 6 | `src/app/api/admin/marketing/programar-publicacion/route.js` | import + fallback |
| 7 | `src/app/api/admin/marketing/publish-instagram/route.js` | import + fallback |

### 2.3 Por que es Alta severidad

La anon key es publica por diseno, asi que no hay leak de secreto real.
Pero el patron de fallback silencioso convierte un error de configuracion
(env var faltante) en un deploy silenciosamente distinto, lo que viola el
principio de "config explicita" y complica la rotacion en Fase 2.

---

## 3. Fix aplicado

### 3.1 Cambios en `src/lib/supabase.js`

- Eliminadas las constantes `DEFAULT_SUPABASE_URL` y `DEFAULT_SUPABASE_ANON_KEY`.
- `sanitizeSupabaseUrl()` y `sanitizeSupabaseKey()` ahora **fail-fast** con
  `throw new Error(...)` en lugar de caer silenciosamente a un valor hardcodeado.
- Eliminado el `console.warn` del bloque `if (typeof window !== 'undefined')`
  que avisaba de valores por defecto (ya no aplica: fail-fast).

### 3.2 Cambios en los 7 consumidores

En cada uno se reemplazo el fallback `|| DEFAULT_SUPABASE_ANON_KEY` por:

```js
|| (() => { throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada') })()
```

Y se removieron los imports de las constantes eliminadas.

**Decision de diseno:** no se unifico la logica de sanitizacion en los
consumidores. Cada archivo mantiene su logica especifica (algunos leen
`process.env` directo, otros tienen variables intermedias). Solo se cambio
el punto de fallo: de caer a un valor hardcodeado, a tirar error explicito.
La sanitizacion fuerte queda centralizada en `src/lib/supabase.js`.

---

## 4. Verificacion

### 4.1 grep a 0

```
Get-ChildItem -Path src -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx |
    Select-String -Pattern 'DEFAULT_SUPABASE_ANON_KEY|DEFAULT_SUPABASE_URL'

Resultado: 0 referencias.
```

### 4.2 Diff limpio en archivos clave

- `src/lib/supabase.js`: sin constantes, con throws, sin console.warn.
- `src/middleware.js`: import limpio + IIFE throw.
- `src/app/api/dipticos/canjear/route.js`: AMBAS constantes removidas del
  import, ternario reemplazado.

### 4.3 Comportamiento esperado

| Escenario | Antes | Despues |
|---|---|---|
| Env vars OK | Funciona | Funciona |
| Falta NEXT_PUBLIC_SUPABASE_ANON_KEY | Usa la constante hardcodeada silenciosamente | `throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada')` |
| Falta NEXT_PUBLIC_SUPABASE_URL | Usa la constante hardcodeada silenciosamente | `throw new Error('NEXT_PUBLIC_SUPABASE_URL no esta configurada')` |

---

## 5. Impacto

### Seguridad

- SEC-002 cerrado: sin valores productivos hardcodeados en `src/`.
- Rotacion futura (Fase 2) no requiere tocar codigo.

### Operacional

- Fail-fast: si falta una env var, el error es explicito y apunta al nombre
  exacto de la variable. No hay deploy silenciosamente distinto.

### Funcionalidad

- Sin regresiones esperadas. Los clientes se construyen igual, solo cambia
  el comportamiento cuando falta configuracion.

---

## 6. Hallazgos colaterales (NO tocados en este fix)

Durante el diagnostico se detectaron otros valores hardcodeados en `src/`
que **no** se incluyeron en este fix para mantener "un commit por tarea":

- **SEC-014:** VAPID key hardcodeada en `src/app/admin/page.js:41-42`.
- **SEC-015:** URL Supabase hardcodeada en `src/app/api/pedidos/notificar-estado/route.js:18`
  y `src/lib/notificaciones.js:39`.
- **SEC-016:** Cloudinary cloud name hardcodeado en 4 lugares.
- **SEC-017:** GA4 Measurement ID hardcodeado en `src/app/api/ga4/measurement/route.js:17`.

Todos son P3 (higiene) y se agendan para sesiones de chores futuras.

---

## 7. DoD (F3-02 / SEC-002)

- [x] Diagnostico completo (2 constantes, 8 archivos consumidores).
- [x] Eliminadas las constantes hardcodeadas.
- [x] Reemplazados los fallbacks silenciosos por fail-fast.
- [x] Eliminado el `console.warn` residual.
- [x] Verificacion grep a 0 en `src/`.
- [x] Diff limpio en los archivos clave.
- [x] Doc de auditoria generado (este archivo).
- [x] Tracking actualizado (SEC-002 -> Cerrado).
- [ ] Commit pusheado con `security(src):`.

---

## 8. Referencias

- [SEC-002 en tracking](./06-hallazgos-tracking.md)
- [ADR-002 - app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
- [F1-08 - Consolidacion RLS](./15-f1-08-consolidacion-rls.md)
- [F1-10 - SEC-011 email_logs](./17-f1-10-sec-011-email-logs.md)
- [F1-11 - SEC-012 canjes_premios](./18-f1-11-sec-012-canjes-premios.md)
- [Supabase - API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase - Managing Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
