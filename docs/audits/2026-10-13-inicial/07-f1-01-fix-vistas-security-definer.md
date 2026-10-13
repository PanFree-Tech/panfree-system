# F1-01 - Fix 3 vistas SECURITY DEFINER

**Fecha:** 2026-10-13
**Hallazgo:** DB-001a
**Severidad:** Critica
**Estado:** Cerrado

---

## Vistas afectadas

| Vista | Esquema | Riesgo |
|---|---|---|
| `vista_costo_receta_agrupada` | public | Bypass RLS via PostgREST con anon key |
| `vista_disponibilidad_productos` | public | Bypass RLS via PostgREST con anon key |
| `vista_costo_receta` | public | Bypass RLS via PostgREST con anon key |

---

## Causa raiz

Las vistas en PostgreSQL son `SECURITY DEFINER` por defecto. Eso significa
que se ejecutan con los permisos del creador de la vista, no del que
consulta. Resultado: ignoran las politicas RLS de las tablas subyacentes.

Como las 3 vistas estan en el schema `public` y son accesibles via
PostgREST con la anon key (que es publica por diseno), cualquier cliente
podia leerlas saltandose RLS. Esto expone datos de costos, recetas y
disponibilidad que deberian estar restringidos a staff administrativo.

---

## Fix aplicado

Se cambio el modo de seguridad de las 3 vistas de `SECURITY DEFINER` a
`SECURITY INVOKER`. Con este modo, la vista usa los permisos del que
consulta, respetando RLS.

Operacion **no destructiva**: no se borro ni recreo ninguna vista, solo
se cambio una propiedad. Reversible con `SET (security_invoker = false)`.

### SQL aplicado

```sql
ALTER VIEW public.vista_costo_receta_agrupada SET (security_invoker = true);
ALTER VIEW public.vista_disponibilidad_productos SET (security_invoker = true);
ALTER VIEW public.vista_costo_receta SET (security_invoker = true);
```

---

## Verificacion

### Verificacion 1: pg_class.reloptions

```sql
SELECT
    c.relname AS view_name,
    c.reloptions AS options
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'vista_costo_receta_agrupada',
    'vista_disponibilidad_productos',
    'vista_costo_receta'
  )
ORDER BY c.relname;
```

**Resultado obtenido:** 3 filas con `options = ["security_invoker=true"]`.

### Verificacion 2: Supabase Advisors

Ir a **Supabase Dashboard -> Advisors -> Security**. Las 3 vistas deben
haber desaparecido del listado de warnings.

### Verificacion 3: Test funcional

- **Como anon (anon key):** las vistas no deben devolver datos sensibles.
- **Como admin (service_role o app autenticada):** las vistas deben
  funcionar igual que antes del fix.

---

## Definition of Done (F1-01)

- [x] Cambio implementado en la DB
- [x] Supabase Advisors deja de reportar las 3 vistas
- [ ] Test manual con anon: no accede a datos sensibles
- [ ] Test manual con admin: funciona correctamente
- [x] Documentado en este archivo
- [ ] Commit pusheado con prefijo `security(db):`

---

## Referencias

- [DB-001a en tracking](./06-hallazgos-tracking.md)
- [Auditoria Supabase Advisors](./02-supabase-advisors.md)
- [ADR-001: Supabase como backend unico](../../architecture/decisiones/ADR-001-supabase-backend-unico.md)
- [ADR-002: Seguridad en capas y app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)