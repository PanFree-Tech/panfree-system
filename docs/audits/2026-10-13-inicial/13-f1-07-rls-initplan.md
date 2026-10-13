# F1-07 - Optimizar politicas RLS con InitPlan

**Fecha:** 2026-10-13
**Hallazgo:** DB-001e
**Severidad:** Media (rendimiento)
**Estado:** Cerrado
**Esfuerzo:** L (Large)

---

## Contexto

Supabase Security Advisor reportaba ~60 politicas RLS que llaman
funciones `STABLE` (`auth.uid()`, `auth.jwt()`, `auth.role()`,
`is_admin()`) **directamente** en las clausulas `USING` o `WITH CHECK`.

Postgres evalua esas funciones **una vez por fila** cuando aparecen
directamente en la condicion de la politica. Con tablas grandes esto
genera un costo de O(N) llamadas por query.

---

## Causa raiz

Las funciones `auth.*` de Supabase son `STABLE`, no `IMMUTABLE`.
Eso significa que Postgres **no puede cachearlas** y las reevalua
en cada iteracion del scan.

El fix oficial (documentado por Supabase) es envolver las llamadas
en un subselect:

    -- ANTES (una evaluacion por fila)
    USING (auth.uid() = user_id)

    -- DESPUES (una evaluacion por query, via InitPlan)
    USING ((SELECT auth.uid()) = user_id)

Postgres detecta el subselect escalar y lo promueve a **InitPlan**,
que se evalua **una sola vez por query** antes del scan principal.

---

## Alcance

Se identificaron **79 politicas** con llamadas directas en:

- `public.*` (76 politicas)
- `storage.objects` (3 politicas)

Patrones encontrados:

| Patron | Descripcion | Cantidad |
|---|---|---|
| A | `is_admin()` solo | 13 |
| B | `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'` | 14 |
| C | `is_admin() OR auth.role() = 'service_role'` | 15 |
| D | `auth.uid() = <columna>` | ~10 |
| E | `cliente_id IN (SELECT ... user_id = auth.uid())` | ~7 |
| F | Combinaciones con OR / AND y EXISTS | ~20 |

---

## Ejecucion

Se aplico en 4 bloques + 1 fix puntual, con verificacion despues
de cada bloque usando `pg_policies`.

1. **Bloque 1** - Grupo A: `is_admin()` simple. 13 politicas.
2. **Bloque 2** - Grupo C: `is_admin() OR auth.role()`. 15 politicas.
3. **Bloque 3** - Grupo B: `auth.jwt() -> app_metadata`. 14 politicas.
4. **Bloque 4** - Grupo D: resto (auth.uid, EXISTS, IN, storage). 37 politicas.
5. **Fix puntual** - `productos.productos_admin_all` (no incluida en Bloque 1 por
   confusion con `admin_all_productos`).

---

## Evidencia

### Conteo final de `pg_policies`

| Clasificacion | Count |
|---|---|
| **DIRECTA** | **0** |
| OPTIMIZADA | 81 |
| SIN_auth | 13 |
| **Total** | **94** |

**KPI logrado:** cero politicas con llamadas directas a `auth.*` /
`is_admin()`. Todas las que usan auth pasan por InitPlan.

### EXPLAIN ANALYZE (referencia)

Query: cliente viendo sus pedidos.

**Antes del fix:**
    Execution Time: 3.948 ms
    Buffers: shared hit=13 dirtied=1
    Index Scan clientes: loops=6

**Despues del fix:**
    Execution Time: 1.671 ms
    Buffers: shared hit=13
    Index Scan clientes: loops=6

**Nota:** el dataset es de prueba (6 pedidos), y la query se ejecuto
como `postgres` (superusuario), por lo que RLS no se aplica. La mejora
de tiempo observada (3.9 -> 1.7 ms) es varianza de cache, no InitPlan.
La evidencia real es **estructural** (conteo en `pg_policies`), no
medicion de tiempo.

Para medir el impacto real habria que:
1. Ejecutar como rol `authenticated`.
2. Tener volumen representativo (>10k filas).
3. Comparar `loops` en el plan.

---

## Rollback

Ver bloque de rollback al final de
`supabase/migrations/2026-10-13-f1-07-initplan.sql`.

En resumen: reemplazar `(SELECT auth.uid())` por `auth.uid()`, etc.
No es recomendado: la version optimizada es equivalente y mas rapida.

---

## Candidatas a eliminar en F1-08

Durante el analisis se detectaron politicas **duplicadas** (misma regla,
expresada de dos formas distintas). F1-08 debe consolidarlas.

### Duplicados claros

| Tabla | Politicas | Regla real |
|---|---|---|
| pedidos | `Admin full access pedidos`, `pedidos_admin_all` | is_admin ALL |
| detalle_pedido | `Admin full access detalle_pedido`, `detalle_pedido_admin_all` | is_admin ALL |
| productos | `Admin full access productos`, `admin_all_productos`, `productos_admin_all` | is_admin ALL |
| productos | `productos_escritura_admin` (variante auth.jwt) | is_admin ALL |
| insumos | `Admin ERP insumos`, `insumos_admin_all` | is_admin + service_role vs is_admin |

### Duplicados parciales (evaluar caso por caso)

| Tabla | Politicas |
|---|---|
| detalle_pedido | `detalle_owner_select`, `detalle_pedido_lectura` |
| pedidos | `pedidos_owner_select`, `pedidos_select_own`, `pedidos_lectura` |
| productos | `productos_lectura_publica`, `select_publico_productos` |
| canjes_premios | `Admin puede ver todos los canjes`, `Usuarios pueden ver sus propios canjes` (parcial) |

Estimado: ~15-20 politicas eliminables via consolidacion.

---

## Hallazgos colaterales

### P7: `auth.jwt() ->> 'role'` (variante raiz)

Se detectaron 3 politicas que usan `auth.jwt() ->> 'role'` (raiz del JWT)
en lugar de `auth.jwt() -> 'app_metadata' ->> 'role'`.

- `eventos_calendario.Admins pueden gestionar eventos`
- `promociones_historico.Admins pueden gestionar histÃ³rico`
- `reglas_promocion.Admins pueden gestionar reglas`

Esto **contradice ADR-002** (fuente unica de rol = `app_metadata.role`).
En F1-07 solo se optimizo (subselect), NO se cambio la semantica.
**Debe resolverse en F3-01.**

---

## Definition of Done (F1-07)

- [x] Query de diagnostico ejecutada (identificacion de 79 DIRECTAS)
- [x] 79 politicas optimizadas via `(SELECT ...)`
- [x] Verificacion: 0 DIRECTAS en `pg_policies`
- [x] SQL versionado en `supabase/migrations/2026-10-13-f1-07-initplan.sql`
- [x] EXPLAIN ANALYZE antes/despues documentado (con limitaciones)
- [x] Candidatas a F1-08 listadas
- [x] Hallazgo DB-001e marcado como Cerrado en tracking
- [ ] Commit pusheado con prefijo `security(db):`

---

## Referencias

- [DB-001e en tracking](./06-hallazgos-tracking.md)
- [Advisors de Supabase](./02-supabase-advisors.md)
- [Migracion SQL](../../../supabase/migrations/2026-10-13-f1-07-initplan.sql)
- [ADR-002: seguridad en capas](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
- [Supabase - RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
- [Postgres - InitPlan](https://www.postgresql.org/docs/current/runtime-config-query.html)