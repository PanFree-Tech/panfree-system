# F1-11 / SEC-012 - canjes_premios usa is_admin() en vez de clientes.role

**Fecha:** 2026-10-14
**Hallazgo:** SEC-012
**Tarea:** F1-11
**Severidad:** Media (consistencia + rendimiento, no vulnerabilidad)
**Estado:** Cerrado
**Esfuerzo:** S (Small)

---

## 1. Contexto

Durante F1-08 (Sesion 6) se detecto que la politica RLS
`Admin puede ver todos los canjes` sobre `public.canjes_premios` usa un
`EXISTS` manual contra `clientes.role` en vez de `is_admin()`, la fuente
unica de verdad de rol definida en [ADR-002](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md).

Es la unica de las 5 politicas de la tabla que no usa `is_admin()`:

| # | Nombre | cmd | roles | qual / with_check |
|---|---|---|---|---|
| 1 | `Admin puede eliminar canjes` | DELETE | `{authenticated}` | `is_admin()` |
| 2 | `Usuarios pueden crear sus propios canjes` | INSERT | `{public}` | `auth.uid() = cliente_id` |
| 3 | **`Admin puede ver todos los canjes`** | **SELECT** | **`{public}`** | **`EXISTS (SELECT 1 FROM clientes WHERE clientes.user_id = auth.uid() AND clientes.role = 'admin')`** |
| 4 | `Usuarios pueden ver sus propios canjes` | SELECT | `{public}` | `auth.uid() = cliente_id` |
| 5 | `Admin puede actualizar canjes` | UPDATE | `{authenticated}` | `is_admin()` |

---

## 2. Diagnostico

### 2.1 Inconsistencia con ADR-002

ADR-002 establece que `app_metadata.role` es la **fuente unica de verdad**
del rol y que `is_admin()` es el helper canonico para consultarlo desde RLS.
La politica #3 no lo usa: recalcula el rol a mano con un `EXISTS` contra
`clientes.role`.

### 2.2 Subquery correlacionada no optimizada

El patron `EXISTS (SELECT 1 FROM clientes WHERE ...)` se evalua por fila.
F1-07 migro el resto del esquema al patron InitPlan `(SELECT is_admin())`,
que se evalua una sola vez por query. Esta politica quedo afuera.

### 2.3 Rol `{public}` en vez de `{authenticated}`

Las otras 2 politicas admin de la tabla (`Admin puede eliminar canjes` y
`Admin puede actualizar canjes`) usan `{authenticated}`. La #3 usa
`{public}`. En la practica no hay leak (anon tiene `auth.uid() = NULL` y el
`EXISTS` filtra todo), pero es inconsistente con las vecinas.

### 2.4 No hay vulnerabilidad

- `anon` no matchea el `EXISTS` (auth.uid() = NULL) -> 0 filas.
- Clientes B2C siguen viendo solo sus propios canjes via politica #4.
- Admin via `is_admin()` sigue viendo todos.

Es un fix de **consistencia + rendimiento + higiene**, no de seguridad.

---

## 3. Fix aplicado

### 3.1 Base de datos (SQL)

Ver migracion: `supabase/migrations/2026-10-14-f1-11-sec-012-canjes-premios.sql`

```sql
DROP POLICY IF EXISTS "Admin puede ver todos los canjes" ON public.canjes_premios;

CREATE POLICY "Admin puede ver todos los canjes"
  ON public.canjes_premios
  FOR SELECT
  TO authenticated
  USING ( (SELECT is_admin()) );
```

### 3.2 Codigo

Sin cambios. El unico codigo que toca `canjes_premios` es el path B2C:

- `src/app/perfil/puntos/page.js:167` (listado del propio cliente)
- `src/lib/dipertivos.js:267` (registro del canje)
- `src/lib/dipertivos.js:280` (log de error)

Ninguno depende del rol admin. `is_admin` no aparece en `src/`.

---

## 4. Verificacion

### 4.1 Politicas despues del fix (5)

| # | Nombre | cmd | roles | qual / with_check |
|---|---|---|---|---|
| 1 | `Admin puede eliminar canjes` | DELETE | `{authenticated}` | `is_admin()` |
| 2 | `Usuarios pueden crear sus propios canjes` | INSERT | `{public}` | `auth.uid() = cliente_id` |
| 3 | `Admin puede ver todos los canjes` | SELECT | `{authenticated}` | `(SELECT is_admin())` |
| 4 | `Usuarios pueden ver sus propios canjes` | SELECT | `{public}` | `auth.uid() = cliente_id` |
| 5 | `Admin puede actualizar canjes` | UPDATE | `{authenticated}` | `is_admin()` |

### 4.2 Comportamiento esperado

| Sujeto | SELECT canjes_premios |
|---|---|
| Cliente B2C autenticado | Solo los suyos (politica #4) |
| Admin (`is_admin()`) | Todos (politica #3) |
| `service_role` | Todos (bypasea RLS) |
| `anon` | 0 filas |

### 4.3 Consistencia con ADR-002

Las 5 politicas de `canjes_premios` usan ahora `is_admin()` cuando
corresponde al rol admin. La tabla queda alineada con la fuente unica de
verdad de rol definida en ADR-002.

---

## 5. Impacto

### Consistencia

- SEC-012 cerrado: `canjes_premios` alineado con ADR-002.
- 5/5 politicas de la tabla usan `is_admin()` (o criterios B2C explicitos).

### Rendimiento

- Politica #3 pasa de subquery correlacionada a InitPlan.
- Impacto medible: bajo (tabla chica, consultas esporadicas). Documentado
  por completitud, sin EXPLAIN ANALYZE (no hay seÃ±al medible).

### Funcionalidad

- Sin regresiones esperadas.
- Path B2C intacto (politicas #2 y #4 sin cambios).
- Path admin intacto (politicas #1, #3, #5 con `is_admin()`).

---

## 6. DoD (F1-11 / SEC-012)

- [x] Diagnostico completo de las 5 politicas.
- [x] Verificacion PRE con output real de pg_policies (5 filas).
- [x] DROP de la politica inconsistente.
- [x] CREATE con `is_admin()` + rol `{authenticated}`.
- [x] Verificacion POST: 5 filas, politica #3 actualizada.
- [x] Auditoria de codigo (`src/`) para confirmar 0 impactos.
- [x] Migracion SQL versionada en `supabase/migrations/`.
- [x] Doc de auditoria generado (este archivo).
- [x] Tracking actualizado (SEC-012 -> Cerrado).
- [ ] Commit pusheado con `security(db):`.

---

## 7. Referencias

- [SEC-012 en tracking](./06-hallazgos-tracking.md)
- [ADR-002 - app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
- [F1-08 - Consolidacion RLS](./15-f1-08-consolidacion-rls.md)
- [F1-07 - InitPlan](./13-f1-07-rls-initplan.md)
- [Migracion SQL](../../../supabase/migrations/2026-10-14-f1-11-sec-012-canjes-premios.sql)
- [Supabase - RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security)
