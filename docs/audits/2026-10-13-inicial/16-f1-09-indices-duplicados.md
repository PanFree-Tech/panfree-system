# F1-09 - Eliminar indices duplicados

**Fecha:** 2026-10-13
**Hallazgo:** DB-001i
**Severidad:** Baja (higiene + espacio)
**Estado:** Cerrado
**Esfuerzo:** S (Small)

---

## Contexto

Supabase Security Advisor reportaba indices duplicados en el esquema
`public`. Durante F1-09 se hizo el inventario real con `pg_index` +
`pg_get_indexdef`, se verifico que ningun indice a dropear respaldara
una constraint (PK/UNIQUE/FK), y se aplico la consolidacion.

---

## Inventario real (pg_index)

Se detectaron **9 grupos de duplicados exactos** (misma firma:
tabla + metodo + columnas/expresion + orden + where).

---

## Los 9 DROP aplicados

### Grupo A - Indices `idx_*` redundantes respecto a un UNIQUE hermano (7)

| Tabla | DROP | Conservar (UNIQUE) |
|---|---|---|
| clientes | `idx_clientes_email` | `clientes_email_key` |
| codigos_dipticos | `idx_codigos_dipticos_codigo` | `codigos_dipticos_codigo_key` |
| compras | `idx_compras_numero` | `compras_numero_compra_key` |
| cupones_descuento | `idx_cupones_codigo` | `cupones_descuento_codigo_key` |
| pedidos | `idx_pedidos_numero` | `pedidos_numero_pedido_key` |
| produccion | `idx_produccion_lote` | `produccion_numero_lote_key` |
| productos | `idx_productos_slug` | `productos_slug_key` |

**Razon:** el UNIQUE ya sirve como indice B-tree para busquedas por
igualdad. El `idx_*` no-UNIQUE con la misma firma es 100% redundante.

### Grupo B - Indices no-UNIQUE duplicados entre si (2)

| Tabla | DROP | Conservar |
|---|---|---|
| notificaciones_admin | `idx_notificaciones_created` | `idx_notificaciones_admin_created_at` |
| notificaciones_admin | `idx_notificaciones_leida` | `idx_notificaciones_admin_leido` |

**Razon:** mismo `btree (created_at DESC)` y `btree (leido)`. Se conserva
el que sigue la convencion `idx_<tabla_completa>_<columna>`; se dropea
el de nombre inconsistente (legacy).

---

## Verificaciones previas (output real)

### Verificacion 1 - Los 9 indices NO respaldan constraints

Query: `pg_constraint` + `pg_class` filtrando por los 9 nombres.

Resultado: **0 filas**. Ningun `DROP` afecta una PK/UNIQUE/FK.

### Verificacion 2 - UNIQUE hermano presente (Grupo A)

Query: `LEFT JOIN` entre los 7 indices a dropear y sus UNIQUE hermanos.

Resultado: **7 filas**, todas con `diagnostico = UNIQUE equivalente (OK)`.

### Verificacion 2b - Pares no-UNIQUE (Grupo B)

Query: `pg_index` filtrando `notificaciones_admin` por los 4 indices.

Resultado: **4 filas**, todas con `es_unico = false`. Confirma que los
pares `(created_at DESC)` y `(leido)` son duplicados exactos entre
no-UNIQUE, sin constraint detras.

---

## Casi-duplicados NO tocados (documentados para futuras sesiones)

### a) recetas: prefijo de UNIQUE compuesto

- `idx_recetas_version` -> `(producto_id, version)`
- `recetas_producto_id_insumo_id_version_key` -> `(producto_id, insumo_id, version)` UNIQUE

`idx_recetas_version` es prefijo del UNIQUE compuesto. Postgres puede
usar el UNIQUE para queries que filtran `(producto_id, version)`. Es
candidato a drop en una limpieza fina futura, pero requiere validar
planes de query reales antes. **Fuera de scope de F1-09.**

### b) push_subscriptions: dos UNIQUE con semantica distinta

- `push_subscriptions_endpoint_key` -> `(endpoint)` UNIQUE
- `push_subscriptions_user_endpoint_unique` -> `(user_id, endpoint)` UNIQUE

No son duplicados exactos. El segundo permite el mismo `endpoint` para
distintos `user_id`; el primero lo restringe globalmente. Es una
inconsistencia de diseno, no un duplicado. **Fuera de scope de F1-09.**

---

## Por que NO se uso DROP INDEX CONCURRENTLY

El SQL Editor de Supabase envuelve el `RUN` en una transaccion
implicita. `CONCURRENTLY` no puede correr dentro de una transaccion.
Las tablas afectadas son chicas (~16 kB por indice), el lock es de
milisegundos. Se prefirio `DROP INDEX IF EXISTS` (sin CONCURRENTLY)
para que el script corra sin fragmentar en 9 ejecuciones separadas.

---

## Rollback

Cada `CREATE INDEX` para revertir esta documentado en:

- `supabase/migrations/2026-10-13-f1-09-indices-duplicados.sql`
  (seccion ROLLBACK, comentada).

No se recomienda rollback: los indices dropeados eran redundantes.

---

## DoD (F1-09)

- [x] Inventario real de `pg_index` analizado (9 grupos).
- [x] Verificacion 1: 0 constraints respaldadas por los indices a dropear.
- [x] Verificacion 2: 7 UNIQUE hermanos confirmados.
- [x] Verificacion 2b: 2 pares no-UNIQUE confirmados.
- [x] 9 `DROP INDEX IF EXISTS` aplicados.
- [x] Casi-duplicados documentados (recetas, push_subscriptions).
- [x] SQL versionado en `supabase/migrations/`.
- [x] Tracking actualizado (DB-001i -> Cerrado).
- [x] Doc de auditoria generado (este archivo).
- [ ] Commit pusheado con `chore(db):`.

---

## Referencias

- [DB-001i en tracking](./06-hallazgos-tracking.md)
- [Advisors de Supabase](./02-supabase-advisors.md)
- [Migracion SQL](../../../supabase/migrations/2026-10-13-f1-09-indices-duplicados.sql)
- [Postgres - DROP INDEX](https://www.postgresql.org/docs/current/sql-dropindex.html)
- [Postgres - pg_index](https://www.postgresql.org/docs/current/catalog-pg-index.html)

