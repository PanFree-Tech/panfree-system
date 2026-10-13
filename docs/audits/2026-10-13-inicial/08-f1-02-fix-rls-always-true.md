# F1-02 - Fix 4 politicas RLS Always True

**Fecha:** 2026-10-13
**Hallazgo:** DB-001b
**Severidad:** Critica
**Estado:** Cerrado

---

## Politicas corregidas

| # | Tabla | Politica | Comando | Antes | Despues |
|---|---|---|---|---|---|
| 1 | canjes_premios | Admin puede eliminar canjes | DELETE | USING (true) | USING (is_admin()) |
| 2 | canjes_premios | Admin puede actualizar canjes | UPDATE | USING (true) | USING (is_admin()) |
| 3 | pedidos | pedidos_public_insert | INSERT | WITH CHECK (true) | ELIMINADA |
| 4 | detalle_pedido | detalle_public_insert | INSERT | WITH CHECK (true) | ELIMINADA |

---

## Causa raiz

Cuatro politicas RLS usaban `USING (true)` o `WITH CHECK (true)`, lo cual
permitia a cualquier rol (incluido `anon`) operar sin restriccion:

- **canjes_premios (DELETE):** cualquier usuario podia borrar canjes.
- **canjes_premios (UPDATE):** cualquier usuario podia modificar canjes.
- **pedidos (INSERT):** cualquiera podia insertar pedidos falsificando cliente_id.
- **detalle_pedido (INSERT):** cualquiera podia insertar lineas de pedido.

Las politicas 1 y 2 decian "Admin puede..." en el nombre pero no verificaban
el rol. Las politicas 3 y 4 eran redundantes: ya existian politicas mas
especificas que cubren los casos legitimos (cliente autenticado o invitado).

---

## Fix aplicado

### Politicas 1 y 2 (canjes_premios)

Reemplazadas por politicas que exigen `is_admin()`. La funcion `is_admin()`
verifica que el usuario este autenticado y tenga `role = admin` en la tabla
`clientes`.

```sql
DROP POLICY IF EXISTS "Admin puede eliminar canjes" ON public.canjes_premios;
CREATE POLICY "Admin puede eliminar canjes" ON public.canjes_premios
    FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admin puede actualizar canjes" ON public.canjes_premios;
CREATE POLICY "Admin puede actualizar canjes" ON public.canjes_premios
    FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
```

### Politicas 3 y 4 (pedidos y detalle_pedido)

Eliminadas. Cubiertas por las politicas existentes:

- `pedidos_insertar_cliente` (authenticated, valida cliente_id)
- `pedidos_invitado_insert` (anon, valida user_id IS NULL)
- `detalle_pedido_insertar` (authenticated, valida pedido del cliente)
- `detalle_pedido_invitado_insert` (anon, valida pedido de invitado)

```sql
DROP POLICY IF EXISTS "pedidos_public_insert" ON public.pedidos;
DROP POLICY IF EXISTS "detalle_public_insert" ON public.detalle_pedido;
```

---

## Verificacion

### Verificacion 1: query de chequeo

```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('canjes_premios', 'pedidos', 'detalle_pedido')
  AND (qual = 'true' OR with_check = 'true')
ORDER BY tablename, cmd, policyname;
```

**Resultado obtenido:** `Success. No rows returned` (0 politicas con true).

### Verificacion 2: funcional

- [ ] Admin entra a /admin/canjes y puede borrar/actualizar
- [ ] Checkout funciona (logueado)
- [ ] Checkout funciona (invitado)

---

## Definition of Done (F1-02)

- [x] Cambio implementado en la DB
- [x] Query de verificacion: 0 politicas con true
- [ ] Test funcional admin
- [ ] Test funcional checkout (logueado)
- [ ] Test funcional checkout (invitado)
- [x] Documentado en este archivo
- [x] Schema declarativo actualizado en supabase/schemas/
- [ ] Commit pusheado con prefijo `security(db):`

---

## Referencias

- [DB-001b en tracking](./06-hallazgos-tracking.md)
- [Auditoria Supabase Advisors](./02-supabase-advisors.md)
- [Schema declarativo canjes_premios](../../../supabase/schemas/public/tables/canjes_premios.sql)
- [Schema declarativo pedidos](../../../supabase/schemas/public/tables/pedidos.sql)
- [Schema declarativo detalle_pedido](../../../supabase/schemas/public/tables/detalle_pedido.sql)
- [ADR-002: Seguridad en capas y app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)