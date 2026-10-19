-- ============================================================================
-- AUD-005 + AUD-007: Sincronizar RLS admin y eliminar USING(true)
-- Fecha: 2026-10-19
-- ============================================================================
-- AUD-005: configuracion_sitio y usuarios con is_admin() (estado correcto en DB,
--          ahora reproducible desde SQL versionado).
-- AUD-007: email_logs con USING(true) anulaba la politica de admin.
--          Cualquier rol podia leer todos los correos. Se elimina.
-- ============================================================================

-- AUD-005: configuracion_sitio
DROP POLICY IF EXISTS "Admin update configuracion_sitio" ON public.configuracion_sitio;
DROP POLICY IF EXISTS "Admin all configuracion_sitio" ON public.configuracion_sitio;

CREATE POLICY "Admin all configuracion_sitio"
ON public.configuracion_sitio
FOR ALL
TO authenticated
USING (public.is_admin() OR (SELECT auth.role()) = 'service_role')
WITH CHECK (public.is_admin() OR (SELECT auth.role()) = 'service_role');

-- AUD-005: usuarios
DROP POLICY IF EXISTS "Admin total usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admin usuarios" ON public.usuarios;

CREATE POLICY "Admin usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (public.is_admin() OR (SELECT auth.role()) = 'service_role')
WITH CHECK (public.is_admin() OR (SELECT auth.role()) = 'service_role');

-- AUD-007: email_logs
DROP POLICY IF EXISTS "Admin and Service Role full access on email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service role full access on email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admin email_logs" ON public.email_logs;

CREATE POLICY "Admin email_logs"
ON public.email_logs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
-- NOTA: service_role bypassa RLS por defecto, no necesita politica explicita.