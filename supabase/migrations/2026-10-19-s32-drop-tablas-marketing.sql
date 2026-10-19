-- =============================================================
-- S32 - Drop de tablas huerfanas del modulo Marketing retirado
-- Fecha: 2026-10-19
-- Contexto: DOC-008 (retiro de Marketing) cerrado en S31.
--           Las tablas reglas_promocion, promociones_historico e
--           instagram_posts quedaron sin uso tras el retiro.
-- Backup:   reglas_promocion tenia 4 filas. Respaldadas en
--           docs/audits/2026-10-13-inicial/48-s32-backup-reglas-promocion.json
-- Nota:     promociones_historico e instagram_posts tenian 0 filas.
-- =============================================================

BEGIN;

-- 1. reglas_promocion (4 filas, backup en JSON)
DROP TABLE IF EXISTS public.reglas_promocion CASCADE;

-- 2. promociones_historico (0 filas)
DROP TABLE IF EXISTS public.promociones_historico CASCADE;

-- 3. instagram_posts (0 filas)
DROP TABLE IF EXISTS public.instagram_posts CASCADE;

COMMIT;

-- Verificacion post-migracion (ejecutar por separado si se desea):
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('reglas_promocion', 'promociones_historico', 'instagram_posts');
-- Resultado esperado: 0 filas.