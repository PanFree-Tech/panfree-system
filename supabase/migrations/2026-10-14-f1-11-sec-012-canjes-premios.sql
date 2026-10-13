-- =============================================================================
-- F1-11 / SEC-012: canjes_premios usa is_admin() en vez de clientes.role
-- Fecha: 2026-10-14
-- Sesion: 9
-- Hallazgo: SEC-012 (Media, consistencia con ADR-002)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONTEXTO
-- -----------------------------------------------------------------------------
-- La politica "Admin puede ver todos los canjes" sobre public.canjes_premios
-- usaba un EXISTS manual contra clientes.role, en vez de is_admin() (fuente
-- unica de verdad de rol segun ADR-002).
--
-- Estado ANTES: 5 politicas sobre canjes_premios.
--
--   # Nombre                                    cmd    roles           qual / with_check
--   1 Admin puede eliminar canjes               DELETE {authenticated}  is_admin()
--   2 Usuarios pueden crear sus propios canjes  INSERT {public}         auth.uid() = cliente_id
--   3 Admin puede ver todos los canjes          SELECT {public}         EXISTS (SELECT 1 FROM
--                                                                        clientes WHERE
--                                                                        clientes.user_id = auth.uid()
--                                                                        AND clientes.role='admin')
--   4 Usuarios pueden ver sus propios canjes    SELECT {public}         auth.uid() = cliente_id
--   5 Admin puede actualizar canjes             UPDATE {authenticated}  is_admin()
--
-- Problemas:
--   - Inconsistencia con ADR-002 (fuente unica de rol = app_metadata via is_admin()).
--   - Subquery correlacionada no optimizada (InitPlan). F1-07 ya migro el resto.
--   - roles={public} cuando deberia ser {authenticated} (consistente con #1 y #5).
--
-- No hay vulnerabilidad: anon no matchea el EXISTS (auth.uid() = NULL), y
-- "Usuarios pueden ver sus propios canjes" cubre el path B2C. Este fix es
-- consistencia + rendimiento + higiene.

-- -----------------------------------------------------------------------------
-- VERIFICACION PRE (output real, 2026-10-14)
-- -----------------------------------------------------------------------------
-- Query:
--   SELECT policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE schemaname='public' AND tablename='canjes_premios'
--   ORDER BY cmd, policyname;
--
-- Resultado: 5 filas (las listadas en CONTEXTO).

-- -----------------------------------------------------------------------------
-- FIX
-- -----------------------------------------------------------------------------

-- 1. Eliminar la politica inconsistente
DROP POLICY IF EXISTS "Admin puede ver todos los canjes" ON public.canjes_premios;

-- 2. Recrearla con is_admin() (InitPlan) y rol authenticated
CREATE POLICY "Admin puede ver todos los canjes"
  ON public.canjes_premios
  FOR SELECT
  TO authenticated
  USING ( (SELECT is_admin()) );

-- -----------------------------------------------------------------------------
-- VERIFICACION POST (output real, 2026-10-14)
-- -----------------------------------------------------------------------------
-- Query:
--   SELECT policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE schemaname='public' AND tablename='canjes_premios'
--   ORDER BY cmd, policyname;
--
-- Resultado: 5 filas. Politica #3 actualizada:
--   policyname = Admin puede ver todos los canjes
--   cmd        = SELECT
--   roles      = {authenticated}
--   qual       = ( SELECT is_admin() AS is_admin)
--
-- Las otras 4 politicas sin cambios.

-- -----------------------------------------------------------------------------
-- ROLLBACK (descomentar y ejecutar si hay que revertir)
-- -----------------------------------------------------------------------------
-- DROP POLICY IF EXISTS "Admin puede ver todos los canjes" ON public.canjes_premios;
-- CREATE POLICY "Admin puede ver todos los canjes"
--   ON public.canjes_premios
--   FOR SELECT
--   TO public
--   USING (
--     EXISTS (
--       SELECT 1 FROM clientes
--       WHERE clientes.user_id = (SELECT auth.uid())
--         AND clientes.role = 'admin'
--     )
--   );

-- =============================================================================
-- FIN MIGRACION
-- =============================================================================
