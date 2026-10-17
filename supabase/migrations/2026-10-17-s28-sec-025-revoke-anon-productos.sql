-- SEC-025: Revocar privilegios excesivos de anon sobre productos
-- Fecha: 2026-10-17 (S28)
-- Hallazgo: SEC-025 (P2)
--
-- Contexto:
--   anon tenía INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER sobre productos.
--   RLS bloquea escrituras, pero:
--     - TRUNCATE no está cubierto por RLS.
--     - PostgREST no expone TRUNCATE, pero es defensa en profundidad violada.
--
-- Fix:
--   - Conservar SELECT (catálogo público).
--   - Revocar el resto.
--
-- Auditoría previa (S28):
--   - Policies TO anon sobre productos: 0 filas.
--   - No hay código en src/ que use anon para escribir en productos.
--
-- Rollback:
--   GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
--     ON public.productos TO anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER 
  ON public.productos FROM anon;

-- Verificación esperada:
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
-- WHERE table_name = 'productos' AND grantee = 'anon';
-- Resultado: solo SELECT.