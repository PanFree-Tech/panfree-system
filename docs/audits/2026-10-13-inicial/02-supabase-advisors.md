# DB-001 - 250+ Advisors de Supabase

**Severidad:** Critica
**Estado:** Cerrado (S25, 0 sev 1-2; S28 sin cambios pendientes)
**Fecha:** 2026-10-13

## Resumen

Supabase Advisors detecto 250+ problemas:

- 3 vistas con SECURITY DEFINER (bypass RLS)
- ~60 politicas RLS sin optimizar
- ~150 politicas permisivas duplicadas
- 4 politicas RLS Always True
- 4 funciones SECURITY DEFINER ejecutables publicamente
- 3 funciones con search_path mutable
- 1 bucket de Storage listable publicamente
- Leaked Password Protection deshabilitado

## Evidencia

Ver evidencias/supabase-advisors-2026-10-13.txt

## Remediacion

Ver 99-plan-remediacion.md
