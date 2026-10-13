# F1-04 - Fijar search_path de 3 funciones

**Fecha:** 2026-10-13
**Hallazgo:** DB-001g
**Severidad:** Alta
**Estado:** Cerrado

---

## Funciones corregidas

| Funcion | Tipo | SECURITY DEFINER | search_path antes | search_path despues |
|---|---|---|---|---|
| `actualizar_stock_pedido` | TRIGGER | Si | (null) | public |
| `actualizar_stock_produccion` | TRIGGER | Si | (null) | public |
| `update_updated_at_column` | TRIGGER | No | (null) | public |

---

## Causa raiz

Las funciones sin `SET search_path` son vulnerables a **search path
hijacking**. Un atacante con permisos para crear objetos en un schema
anterior en el path podria sobrescribir funciones como `now()` o
`auth.uid()` y ejecutarlas con los permisos del owner de la funcion.

El riesgo es mas alto en funciones `SECURITY DEFINER` porque se ejecutan
con permisos elevados (postgres), pero conviene fijarlo en todas.

---

## Fix aplicado

```sql
ALTER FUNCTION public.actualizar_stock_pedido() SET search_path TO 'public';
ALTER FUNCTION public.actualizar_stock_produccion() SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';
```

`ALTER FUNCTION ... SET search_path` NO recrea la funcion. Solo modifica
su configuracion. Los triggers siguen funcionando igual.

---

## Verificacion

```sql
SELECT p.proname, p.proconfig, p.prosecdef
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('actualizar_stock_pedido', 'actualizar_stock_produccion', 'update_updated_at_column');
```

**Resultado:** las 3 funciones con `configuracion = ["search_path=public"]`.

---

## Definition of Done (F1-04)

- [x] Cambio implementado en la DB
- [x] Las 3 funciones con search_path=public
- [x] Funciones guardadas en supabase/schemas/public/functions/
- [x] Documentado en este archivo
- [ ] Commit pusheado con prefijo `security(db):`

---

## Referencias

- [DB-001g en tracking](./06-hallazgos-tracking.md)
- [Auditoria Supabase Advisors](./02-supabase-advisors.md)
- [ADR-002: Seguridad en capas](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)
- [OWASP - Search Path Hijacking](https://owasp.org/www-project-top-ten/)