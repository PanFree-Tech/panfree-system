# F1-10 / SEC-011 + SEC-013 - Restringir acceso a email_logs

**Fecha:** 2026-10-14
**Hallazgos:** SEC-011 (Alta), SEC-013 (Media), BUG-004 (Media, colateral)
**Severidad:** Alta
**Estado:** Cerrado
**Esfuerzo:** S (Small)

---

## 1. Contexto

Durante F1-08 (Sesion 6) se detecto la politica RLS `Authenticated users can
read email_logs` con `qual=true`, que permitia a cualquier usuario autenticado
leer TODA la tabla `email_logs`. Se registro como SEC-011 (Alta).

Al preparar el fix en Sesion 8 se detectaron dos problemas adicionales:

- **SEC-013:** politica `Authenticated users can insert email_logs` con
  `roles={public}` permitia a cualquier autenticado insertar filas.
- **BUG-004:** los endpoints `test-email/route.js` y `resend-webhook/route.js`
  usaban el cliente generico `@/lib/supabase` (sin privilegios) para escribir
  en `email_logs`. Se apoyaban en la politica permisiva para funcionar.

---

## 2. Diagnostico

### Politicas antes del fix (4)

| # | Nombre | cmd | Roles | Qual / With check |
|---|---|---|---|---|
| 1 | `Admin email_logs` | ALL | `{public}` | `is_admin() OR service_role` |
| 2 | `Service role full access on email_logs` | ALL | `{service_role}` | `true` |
| 3 | `Authenticated users can insert email_logs` | INSERT | `{public}` | `auth.uid() IS NOT NULL` |
| 4 | `Authenticated users can read email_logs` | SELECT | `{authenticated}` | `true` |

### El problema

Postgres combina politicas PERMISSIVE con OR: la mas amplia gana. La politica 4
(`qual=true`) anulaba cualquier restriccion vecina. Cualquier cliente B2C con
sesion valida podia hacer `SELECT * FROM email_logs` via PostgREST y obtener:

- `to_email` (PII de destinatarios)
- `from_email`
- `subject`
- `body_html` / `body_text` (cuerpo completo de correos, incluidos tokens de
  recuperacion, links de verificacion, etc.)
- `metadata` (datos de negocio)
- `status`, `resend_id`, `error_message`, `created_at`

---

## 3. Fix aplicado

### 3.1 Base de datos (SQL)

Ver migracion: `supabase/migrations/2026-10-14-f1-10-sec-011-email-logs.sql`

```sql
DROP POLICY IF EXISTS "Authenticated users can read email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Authenticated users can insert email_logs" ON public.email_logs;
```

### 3.2 Codigo (BUG-004)

En `src/app/api/admin/marketing/test-email/route.js` y
`src/app/api/resend-webhook/route.js`:

- Se reemplazo `import { supabase } from '@/lib/supabase'` por
  `createClient` de `@supabase/supabase-js` con `SERVICE_ROLE_KEY`.
- Todas las escrituras a `email_logs` pasaron de `supabase` a `supabaseAdmin`.

Resultado: los endpoints bypasean RLS correctamente y no dependen de politicas
permisivas.

---

## 4. Verificacion

### 4.1 Politicas despues del fix (2)

| # | Nombre | cmd | Roles | Qual / With check |
|---|---|---|---|---|
| 1 | `Admin email_logs` | ALL | `{public}` | `is_admin() OR service_role` |
| 2 | `Service role full access on email_logs` | ALL | `{service_role}` | `true` |

### 4.2 Comportamiento esperado

| Sujeto | SELECT email_logs | INSERT email_logs | UPDATE email_logs |
|---|---|---|---|
| Cliente B2C autenticado | 0 filas (RLS) | Error RLS | Error RLS |
| Admin (`is_admin()`) | Todo | Todo | Todo |
| `service_role` | Todo | Todo | Todo |
| `anon` | 0 filas (RLS) | Error RLS | Error RLS |

### 4.3 Endpoints verificados

| Endpoint | Cliente | Antes | Despues |
|---|---|---|---|
| `send-email/route.js` | service_role | OK | OK |
| `test-email/route.js` | service_role | OK (por politica permisiva) | OK (por service_role) |
| `resend-webhook/route.js` | service_role | OK (por politica permisiva) | OK (por service_role) |
| `correos/page.js` | authenticated + is_admin | OK | OK |

---

## 5. Impacto

### Seguridad

- **SEC-011 cerrado:** clientes B2C ya no pueden leer PII de correos.
- **SEC-013 cerrado:** clientes B2C ya no pueden insertar filas en email_logs.
- **BUG-004 cerrado:** endpoints ahora usan service_role explicitamente.

### Funcionalidad

- Sin regresiones esperadas.
- `correos/page.js` sigue funcionando (admin con is_admin()).
- Los 3 endpoints siguen funcionando (ahora via service_role).

---

## 6. DoD (F1-10)

- [x] Diagnostico completo de las 4 politicas.
- [x] Verificacion PRE con output real de pg_policies.
- [x] DROP de las 2 politicas permisivas.
- [x] Verificacion POST: solo 2 politicas restantes.
- [x] Auditoria de los 4 archivos de codigo que tocan email_logs.
- [x] Fix de BUG-004 en los 2 endpoints afectados.
- [x] Migracion SQL versionada en supabase/migrations/.
- [x] Doc de auditoria generado (este archivo).
- [x] Tracking actualizado (SEC-011, SEC-013 -> Cerrado; BUG-004 -> Cerrado).
- [ ] Commit pusheado con security(db):.

---

## 7. Referencias

- [SEC-011 en tracking](./06-hallazgos-tracking.md)
- [F1-08 - Consolidacion RLS](./15-f1-08-consolidacion-rls.md)
- [ADR-002 - app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
- [Migracion SQL](../../../supabase/migrations/2026-10-14-f1-10-sec-011-email-logs.sql)
- [Supabase - RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase - API Keys](https://supabase.com/docs/guides/api/api-keys)
