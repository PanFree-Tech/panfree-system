# Schema declarativo - PanFree System

Este directorio contiene el **estado deseado** del schema de Supabase
en formato SQL. Es la fuente de verdad para:

1. Auditoria de cambios estructurales (cada PR que toca la DB tiene su diff aqui).
2. Recuperacion ante desastres (reconstruir la DB desde cero).
3. Documentacion viva (que hay en cada tabla y por que).

## Estructura

    supabase/
    ├── schemas/
    │   └── public/
    │       ├── tables/       -- CREATE TABLE + RLS + politicas
    │       ├── policies/     -- (futuro) politicas extraidas por tabla
    │       └── functions/    -- (futuro) funciones SQL
    └── migrations/           -- (futuro) migraciones incrementales

## Reglas

1. **Un archivo por tabla.** El nombre del archivo = nombre de la tabla.
2. **Cada archivo incluye:** CREATE TABLE + ENABLE ROW LEVEL SECURITY + politicas.
3. **Cada cambio va con un commit** que explica que cambio y por que.
4. **Los datos NO van aca.** Solo estructura.
5. **Los secretos NO van aca.** Solo SQL.

## Como aplicar cambios

### En Supabase (produccion)

1. Modificar el archivo `.sql` correspondiente en este repo.
2. Aplicar el cambio manualmente en **Supabase SQL Editor**.
3. Verificar que el cambio funciona (tests).
4. Commit + push.

### En local (futuro)

    supabase db reset

Reconstruye la DB local desde los archivos de `schemas/`.

## Pendiente

- [ ] Migrar todas las 38 tablas a este formato (F1-02 cubre 3).
- [ ] Agregar `functions/is_admin.sql`.
- [ ] Agregar `functions/handle_new_user.sql`.
- [ ] Configurar `supabase db diff` para generar migraciones automaticas.

## Referencias

- [Supabase - Managing Schemas](https://supabase.com/docs/guides/local-development/managing-your-schemas)
- [Supabase - Declarative Schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas)
- [Plan de Trabajo Fase 1](../docs/operations/PLAN-DE-TRABAJO.md)