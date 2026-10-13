# F1-08 - Consolidar politicas RLS duplicadas

**Fecha:** 2026-10-13
**Hallazgo:** DB-001f
**Severidad:** Media (rendimiento + higiene)
**Estado:** Cerrado
**Esfuerzo:** L (Large)

---

## Contexto

Supabase Security Advisor reportaba ~150 "politicas permisivas duplicadas"
en el esquema `public`. Durante F1-08 se hizo el inventario real de
`pg_policies` y se aplico una consolidacion en 4 bloques.

---

## Aclaracion sobre el conteo del advisor

El advisor reporta **~150** pero el inventario real de `pg_policies`
mostro **78 politicas en public + 5 en storage**. La diferencia se explica
porque el advisor cuenta:

- Cada politica con `roles={public}` (que aplica implicitamente a `anon`
  y `authenticated`).
- Politicas heredadas de RLS en tablas relacionadas.
- No cada **duplicado real** (misma regla, mismo cmd, mismos roles).

Duplicados reales detectados y justificados: **20**.

---

## Inventario antes / despues

| Esquema | Antes | Despues | Diferencia |
|---|---|---|---|
| public | 78 | 58 | -20 |
| storage | 5 | 5 | 0 |
| **Total** | **83** | **63** | **-20** |

---

## Los 4 bloques aplicados

### Bloque 1 - Duplicados exactos admin ALL (5 politicas)

| Tabla | Politica eliminada | Politica conservada |
|---|---|---|
| pedidos | `Admin full access pedidos` | `pedidos_admin_all` |
| detalle_pedido | `Admin full access detalle_pedido` | `detalle_pedido_admin_all` |
| productos | `Admin full access productos` | `admin_all_productos` |
| productos | `productos_admin_all` | `admin_all_productos` |
| insumos | `insumos_admin_all` | `Admin ERP insumos` |

**Razon:** mismo `cmd=ALL`, mismos `roles` (o subset), misma expresion.

### Bloque 2 - Duplicados semanticos is_admin() vs jwt (9 politicas)

| Tabla | Eliminada (variante jwt) | Conservada (is_admin) |
|---|---|---|
| compras | `compras_admin` | `Admin ERP compras` |
| detalle_compra | `detalle_compra_admin` | `Admin ERP detalle_compra` |
| detalle_pedido | `detalle_pedido_admin_write` | `detalle_pedido_admin_all` |
| detalle_produccion | `detalle_produccion_admin` | `Admin ERP detalle_produccion` |
| eventos_calendario | `Admins pueden gestionar eventos` | `Admin gestion eventos_calendario` |
| produccion | `produccion_admin` | `Admin ERP produccion` |
| productos | `productos_escritura_admin` | `admin_all_productos` |
| promociones_historico | `Admins pueden gestionar historico` | `Admin gestion promociones_historico` |
| reglas_promocion | `Admins pueden gestionar reglas` | `Admin gestion reglas_promocion` |

**Razon:** post-F3-01, `is_admin()` lee de `app_metadata.role`.
Por lo tanto `is_admin()` es equivalente a
uth.jwt()->'app_metadata'->>'role'='admin'. Se conserva la variante
`is_admin()` por ser mas corta y centralizada (ver ADR-002).

### Bloque 3a - Subsets redundantes SELECT (3 politicas)

| Tabla | Eliminada | Conservada (superset) |
|---|---|---|
| pedidos | `pedidos_owner_select` | `pedidos_lectura` |
| pedidos | `pedidos_select_own` | `pedidos_lectura` |
| detalle_pedido | `detalle_owner_select` | `detalle_pedido_lectura` |

**Razon:** Postgres combina politicas permisivas con OR. La superset
cubre todos los casos de los subsets. Sin perdida funcional.

### Bloque 3b - select_publico_productos (1 politica, leak de informacion)

| Tabla | Eliminada | Razon |
|---|---|---|
| productos | `select_publico_productos` | `qual=true` + `roles={public}` exponia productos inactivos a cualquiera |

**Razon:** politica SELECT con `qual=true` anulaba `productos_lectura_publica`
(que filtra `is_active=true`) por la combinacion OR de Postgres.
Cualquier cliente (incluso `anon`) que hiciera `SELECT * FROM productos`
via PostgREST veia productos inactivos, salteando los filtros del
frontend. **Es un leak de informacion, no solo un duplicado.**

**Cierre:** se elimino la politica. Ahora:
- Publicos ven solo activos (via `productos_lectura_publica`).
- Admin ve todo (via `productos_lectura_admin` + `admin_all_productos`).

### Bloque 4 - Redundantes en notificaciones_admin (2 politicas)

| Tabla | Eliminada | Razon |
|---|---|---|
| notificaciones_admin | `Solo admin puede leer notificaciones` | cubierta por `notif_admin_all` (ALL) |
| notificaciones_admin | `Admin puede actualizar notificaciones` | cubierta por `notif_admin_all` (ALL) |

**Razon:** `notif_admin_all` es ALL con `qual=is_admin()` y
`with_check=is_admin()`. Cubre SELECT, INSERT, UPDATE y DELETE para admin.
Las 2 eliminadas agregaban `auth.role()='authenticated'` que es
implicito en `is_admin()`. No se toco `Permitir inserts desde triggers`
(funcionalmente distinta).

---

## Hallazgos colaterales detectados durante F1-08

| ID | Descripcion | Severidad | Estado |
|---|---|---|---|
| SEC-010 | `select_publico_productos` exponia productos inactivos (leak) | Media | **Cerrado en F1-08** |
| SEC-011 | `email_logs.Authenticated users can read email_logs` con `qual=true` | Alta | Abierto (Sesion 7) |
| SEC-012 | `canjes_premios.Admin puede ver todos los canjes` usa `clientes.role` en vez de `is_admin()` | Media | Abierto (F3) |
| BUG-003 | `diptico/[codigo]/page.js:98` usa `.eq('activo', true)` (typo, columna real `is_active`) | Baja | Abierto (F3) |

---

## Aprendizajes

1. **Postgres combina politicas permisivas con OR.** La mas amplia gana.
   Esto significa que una politica mal escrita con `qual=true` puede
   anular politicas mas restrictivas escritas al lado.
2. **El advisor de Supabase sobreestima duplicados.** Cuenta cada politica
   permisiva sobre `roles={public}`, no cada duplicado real.
3. **`is_admin()` vs `auth.jwt()->'app_metadata'->>'role'`** son
   equivalentes post-F3-01. Mantener solo `is_admin()` por consistencia
   con ADR-002.
4. **Auditar el codigo antes de eliminar politicas permisivas.**
   Confirmar que los paths que necesitan ver datos "especiales"
   (ej: inactivos) esten cubiertos por otra politica con el rol correcto.

---

## Rollback

Cada bloque tiene su rollback documentado en:

- `supabase/migrations/2026-10-13-f1-08-consolidar-rls.sql` (comentado).

No se recomienda rollback: la version consolidada es equivalente
y ademas corrige el leak de `select_publico_productos`.

---

## DoD (F1-08)

- [x] Inventario completo de `pg_policies` analizado.
- [x] 20 duplicados reales identificados y justificados.
- [x] 4 bloques aplicados con verificacion PRE y POST.
- [x] 0 perdidas funcionales (analisis de impacto en codigo).
- [x] Leak de `select_publico_productos` cerrado.
- [x] SQL versionado en `supabase/migrations/`.
- [x] Hallazgos colaterales registrados.
- [x] Tracking actualizado (DB-001f -> Cerrado).
- [x] Doc de auditoria generado (este archivo).
- [ ] Commit pusheado con `security(db):`.

---

## Referencias

- [DB-001f en tracking](./06-hallazgos-tracking.md)
- [Advisors de Supabase](./02-supabase-advisors.md)
- [F1-07 - InitPlan](./13-f1-07-rls-initplan.md)
- [Migracion SQL](../../../supabase/migrations/2026-10-13-f1-08-consolidar-rls.sql)
- [ADR-002: app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
- [Supabase - RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security)

