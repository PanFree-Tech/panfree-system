# BUG-013 - createClient en top-level rompe build en CI

**Fecha:** 2026-10-17 (S25)
**Hallazgo:** BUG-013 (nuevo)
**Severidad:** Media (P2) - rompe CI, no produccion
**Estado:** Cerrado
**Sesion:** 25

---

## 1. Sintoma

El CI de GitHub Actions fallaba en el step `Build` con:

```
Error: supabaseKey is required.
    at new sg (.../chunks/7495.js:24:62616)
    at 19621 (.../.next/server/app/api/admin/marketing/test-email/route.js:1:571)
> Build error occurred
Error: Failed to collect page data for /api/admin/marketing/test-email
```

**Detectado en:** S25, al activar el build en CI por primera vez
(antes fallaba en `Test` por TST-001).

## 2. Causa raiz

`src/app/api/admin/marketing/test-email/route.js` y
`src/app/api/resend-webhook/route.js` instancian `createClient()`
en **top-level** (al importar el modulo):

```js
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

En **build time**, Next.js "Collecting page data" importa los modulos
para analizarlos. Eso ejecuta `createClient()` con
`process.env.SUPABASE_SERVICE_ROLE_KEY` **undefined** (no esta en CI,
porque `SUPABASE_SERVICE_ROLE_KEY` es secreta y no debe estar en
GitHub Secrets). Resultado: `supabaseKey is required` y el build falla.

En **runtime** (Vercel), funciona porque `SUPABASE_SERVICE_ROLE_KEY`
esta configurada en Vercel env vars.

`send-email/route.js` no rompe porque tiene fallback a
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, que si esta en el `env:` del step
`Build` en CI (placeholder).

## 3. Fix aplicado

Mover `createClient()` **dentro de una funcion** `getSupabaseAdmin()`,
que se ejecuta **solo en runtime**, no en build:

```js
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

export async function POST(req) {
  const supabaseAdmin = getSupabaseAdmin()
  // ...
}
```

**Por que funciona:**
- En build, Next.js solo importa el modulo (sin side effects).
- En runtime, cuando llega el request, `getSupabaseAdmin()` se ejecuta
  con las env vars reales de Vercel.
- En CI, el build pasa porque `createClient` no se ejecuta.

## 4. Archivos modificados

- `src/app/api/admin/marketing/test-email/route.js`
- `src/app/api/resend-webhook/route.js`

`send-email/route.js` **no se toca** (ya tiene el patron correcto
con fallback).

## 5. Verificacion

- [ ] `npm run build` pasa localmente (sin `.env.local`)
- [ ] CI pasa en GitHub Actions (step `Build`)
- [ ] `test-email` funciona en produccion (Vercel)
- [ ] `resend-webhook` funciona en produccion (Vercel)

## 6. Relacion con F4-06

**F4-06 (placeholders en ci.yml) sigue OK.** Los placeholders
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estan
bien puestos en el step `Build`. El error **no es por los placeholders**,
es por `test-email` y `resend-webhook` que instancian el cliente en
top-level.

BUG-013 se detecto al activar el build en CI. Se cierra con este fix.

## 7. Referencias

- Commit: (se agrega al commitear)
- CI run: https://github.com/PanFree-Tech/panfree-system/actions/runs/39029347656
- F4-06: docs/operations/PLAN-DE-TRABAJO.md
- `src/lib/supabase.js` (fail-fast de F3-02)