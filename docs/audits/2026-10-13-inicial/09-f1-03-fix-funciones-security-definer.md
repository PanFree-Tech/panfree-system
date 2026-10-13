# F1-03 - Restringir 4 funciones SECURITY DEFINER

**Fecha:** 2026-10-13
**Hallazgo:** DB-001c
**Severidad:** Critica
**Estado:** Cerrado

---

## Funciones corregidas

| Funcion | Tipo | Ejecutable por anon (antes) | Ejecutable por anon (despues) |
|---|---|---|---|
| `actualizar_stock_pedido` | TRIGGER | Si | No |
| `actualizar_stock_produccion` | TRIGGER | Si | No |
| `handle_new_user` | TRIGGER | Si | No |
| `is_admin` | UTILITY | Si | No |

---

## Causa raiz

Las 4 funciones son `SECURITY DEFINER`, o sea que se ejecutan con los
permisos del creador (postgres), no del que llama. Eso las hace bypasear
RLS. Ademas, PostgreSQL asigna EXECUTE a PUBLIC por defecto, y Supabase
extiende el grant a `anon` y `authenticated`.

Resultado: cualquiera con la anon key (publica por diseno) podia invocar
estas funciones via `POST /rest/v1/rpc/<nombre>`, permitiendo:

- Modificar stock de productos a voluntad
- Modificar stock de produccion
- Insertar filas en `clientes` sin restriccion
- Filtrar si un usuario es admin o no

---

## Fix aplicado

```sql
REVOKE EXECUTE ON FUNCTION public.actualizar_stock_pedido() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.actualizar_stock_produccion() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;
```

Las funciones siguen existiendo y funcionando como triggers. Solo se
bloquea la invocacion directa via RPC. `service_role` mantiene acceso.

---

## Por que no rompe nada

### Triggers

PostgreSQL ejecuta los triggers automaticamente sin verificar el permiso
EXECUTE del usuario que dispara el cambio. El REVOKE solo afecta a las
llamadas directas via PostgREST RPC.

### RLS policies

Cuando una policy llama a `is_admin()`, la ejecucion ocurre dentro del
motor de PostgreSQL, no pasa por el endpoint RPC. El REVOKE no afecta a
esas ejecuciones internas.

---

## Verificacion

### Test 1: permisos

```sql
SELECT 
    p.proname AS funcion,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_puede,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_puede,
    has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_puede
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('actualizar_stock_pedido', 'actualizar_stock_produccion', 'handle_new_user', 'is_admin');
```

**Resultado:** anon=false, auth=false, service=true para las 4.

### Test 2: trigger funcional

Se cambio el estado de un pedido a `confirmado`. El trigger se ejecuto:

- Se inserto una fila en `stock_movimientos` con `tipo_movimiento = salida_pedido`
- El stock del producto se desconto correctamente (10 -> 0)
- El motivo dice "Pedido confirmado: PF-2026-0003"

**Resultado:** el trigger funciona a pesar del REVOKE.

---

## Definition of Done (F1-03)

- [x] Cambio implementado en la DB (REVOKE)
- [x] Verificacion de permisos: anon y authenticated bloqueados
- [x] Test funcional: trigger dispara correctamente
- [x] Test funcional: stock se descuenta
- [x] Funciones guardadas en supabase/schemas/public/functions/
- [x] Documentado en este archivo
- [ ] Commit pusheado con prefijo `security(db):`

---

## Referencias

- [DB-001c en tracking](./06-hallazgos-tracking.md)
- [Auditoria Supabase Advisors](./02-supabase-advisors.md)
- [ADR-002: Seguridad en capas](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)