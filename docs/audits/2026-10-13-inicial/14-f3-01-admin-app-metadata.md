# F3-01 - Migrar autorizacion admin a app_metadata

**Fecha:** 2026-10-13
**Hallazgos cerrados:** SEC-003, P7, SEC-004, SEC-005, SEC-006, SEC-007, BUG-002
**Severidad:** Critica (SEC-003, SEC-004, SEC-005) / Alta (SEC-006, SEC-007) / Media (BUG-002)
**Estado:** Cerrado
**Esfuerzo:** S (Small)

---

## Contexto

ADR-002 establece que `app_metadata.role` es la unica fuente de verdad
del rol de un usuario. Sin embargo, el middleware leia `user_metadata.role`
(editable por el usuario) y varias politicas RLS usaban la raiz del JWT
en lugar de `app_metadata`. Esto permitia elevacion de privilegios.

---

## Hallazgos cerrados

| ID | Descripcion | Como se cerro |
|---|---|---|
| SEC-003 | Middleware leia `user_metadata.role` (editable por el cliente) | `src/middleware.js` ahora lee solo `user.app_metadata?.role` |
| P7 | 3 politicas usaban `auth.jwt() ->> 'role'` (raiz, nunca da 'admin') | Migradas a `auth.jwt() -> 'app_metadata' ->> 'role'` |
| SEC-004 | `authenticated` podia UPDATE `clientes.role` (auto-promocion) | `REVOKE UPDATE (role)` via grant quirurgico por columna |
| SEC-005 | `anon` tenia UPDATE/INSERT/DELETE/TRUNCATE sobre `clientes` | `REVOKE ALL ON public.clientes FROM anon` |
| SEC-006 | `authenticated` podia modificar columnas sensibles (`puntos_fidelidad`, `nivel_cliente`, `is_active`, `user_id`, `id`) | Grant UPDATE restringido a 15 columnas cosmeticas |
| SEC-007 | `authenticated` podia INSERT con `role: 'admin'` | Grant INSERT restringido a columnas no sensibles |
| BUG-002 | `route.js` insertaba `avatar` pero la columna es `avatar_url` | Corregido en `src/app/auth/callback/route.js` |

---

## Cambios aplicados

### 1. Codigo - Middleware (`src/middleware.js`)

**Antes (vulnerable):**

```js
const userRole =
  user.app_metadata?.role ||
  user.user_metadata?.role ||      // editable por el usuario
  user.raw_user_meta_data?.role || // alias legacy
  user.role                        // rol Postgres, no de negocio
```

**Despues (ADR-002):**

```js
// ADR-002: SOLO app_metadata.role es fuente de verdad.
const userRole = user.app_metadata?.role
const isAdmin = userRole === 'admin'
```

Commit: e5bed103

### 2. DB - Funcion `is_admin()`

**Antes:** leia de `public.clientes.role` (editable por el usuario).

**Despues:** lee de `auth.jwt() -> 'app_metadata' ->> 'role'`.

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;
```

### 3. DB - 3 politicas P7

| Tabla | Policy | Antes | Despues |
|---|---|---|---|
| eventos_calendario | Admins pueden gestionar eventos | `auth.jwt() ->> 'role'` | `auth.jwt() -> 'app_metadata' ->> 'role'` |
| promociones_historico | Admins pueden gestionar historico | idem | idem |
| reglas_promocion | Admins pueden gestionar reglas | idem | idem |

### 4. DB - Permisos minimos sobre `clientes`

**Antes:** `anon` y `authenticated` tenian `GRANT ALL` (UPDATE/INSERT/DELETE/TRUNCATE/etc).

**Despues:**

- `anon`: **sin ningun privilegio**.
- `authenticated`:
  - `SELECT` completo (RLS filtra por fila).
  - `UPDATE` solo sobre 15 columnas cosmeticas.
  - `INSERT` solo sobre columnas del registro inicial.
  - **NO** puede tocar: `role`, `is_active`, `puntos_fidelidad`, `nivel_cliente`, `id`, `user_id`, `created_at`, `updated_at`, `email` (en UPDATE).

### 5. Codigo - Callback OAuth (`src/app/auth/callback/route.js`)

**Antes:**

```js
await supabase.from('clientes').insert({
  nombre_completo: nombre,
  email: user.email,
  user_id: user.id,
  is_active: true,      // DEFAULT true, no permitido por GRANT
  role: 'cliente',      // DEFAULT 'cliente', no permitido
  avatar: avatar,       // BUG: columna real es avatar_url
})
```

**Despues:**

```js
await supabase.from('clientes').insert({
  nombre_completo: nombre,
  email: user.email,
  user_id: user.id,
  avatar_url: avatarUrl, // BUG-002 fix
})
```

---

## Prerequisito verificado

Antes de reescribir `is_admin()`, se verifico en Dashboard de Supabase que
el unico admin real (`pirovanipedrojose@gmail.com`, user_id `5f8bb0ac-...`)
tiene `app_metadata.role = 'admin'`. Sin esto, el cambio hubiera dejado al
admin fuera del panel.

---

## Evidencia

### Middleware

- `npm run dev` compila `/src/middleware` sin errores.
- `GET /admin 200` con sesion de admin real.
- Commit `
e5bed103
` pusheado a `origin/main`.

### DB - `is_admin()`

Query `SELECT prosrc FROM pg_proc WHERE proname = 'is_admin';` devuelve:

```
SELECT COALESCE(
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
  false
);
```

### DB - 3 politicas P7

Query `pg_policies` devuelve `qual` con `app_metadata` en las 3.

### DB - Permisos sobre `clientes`

Query `table_privileges` para `anon`: 0 filas.
Query `table_privileges` para `authenticated`: solo `SELECT`.
Query `column_privileges` para `authenticated` UPDATE: 15 columnas cosmeticas.
Query `column_privileges` para `authenticated` INSERT: 17 columnas.

---

## Rollback

Ver seccion de rollback en:
`supabase/migrations/
2026-10-13
-f3-01-admin-app-metadata.sql`

---

## Definition of Done

- [x] Middleware lee solo `app_metadata.role`
- [x] `is_admin()` lee de `app_metadata`
- [x] 3 politicas P7 migradas a `app_metadata`
- [x] `REVOKE` de `UPDATE (role)` en `clientes`
- [x] `anon` sin privilegios sobre `clientes`
- [x] `authenticated` solo con permisos minimos
- [x] `route.js` alineado con GRANT INSERT
- [x] BUG-002 (`avatar_url`) corregido
- [x] Test end-to-end: login admin OK, `/admin` 200
- [x] Commit pusheado

---

## Referencias

- [Tracking de hallazgos](./06-hallazgos-tracking.md)
- [ADR-002: seguridad en capas](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
- [Migracion SQL](../../../supabase/migrations/
2026-10-13
-f3-01-admin-app-metadata.sql)
- [Middleware](../../../src/middleware.js)
- [Callback OAuth](../../../src/app/auth/callback/route.js)

