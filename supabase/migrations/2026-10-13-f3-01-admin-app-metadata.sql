-- ============================================================================
-- F3-01 - Migrar autorizacion admin a app_metadata
-- ============================================================================
-- Fecha:    2026-10-13
-- Autor:    Pedro J. Pirovani
-- ADR:      ADR-002 (seguridad en capas, app_metadata como fuente unica)
--
-- Cierra:
--   SEC-003  - Middleware leia user_metadata.role (editable por el cliente)
--   P7       - 3 politicas usaban auth.jwt() ->> 'role' (raiz, nunca admin)
--   SEC-004  - authenticated podia UPDATE clientes.role (auto-promocion)
--   SEC-005  - anon tenia UPDATE/INSERT/DELETE/TRUNCATE sobre clientes
--   SEC-006  - authenticated podia modificar columnas sensibles
--              (puntos_fidelidad, nivel_cliente, is_active, id, user_id)
--   SEC-007  - authenticated podia INSERT con role='admin'
--   BUG-002  - route.js insertaba 'avatar' (columna real: avatar_url)
--
-- Prerequisito verificado (2026-10-13):
--   El unico admin real (pirovanipedrojose@gmail.com, user_id
--   5f8bb0ac-66fe-41e1-a43e-3d35ec370958) tiene app_metadata.role = 'admin'.
--   Sin esto, reescribir is_admin() hubiera dejado al admin fuera del panel.
--
-- IMPORTANTE: este archivo documenta los cambios aplicados. NO ejecutar
-- todo de una sola vez en el SQL Editor de Supabase. Aplicar por secciones
-- (A, B, C) verificando despues de cada una. Las secciones A, B y C ya
-- fueron aplicadas el 2026-10-13.
-- ============================================================================


-- ============================================================================
-- SECCION A: Reescribir is_admin() para leer de app_metadata
-- ============================================================================
-- Antes: is_admin() leia de public.clientes.role (editable por el usuario).
-- Ahora: lee de auth.jwt() -> 'app_metadata' ->> 'role' (fuente unica ADR-002).
--
-- Prerequisito verificado: admin real tiene app_metadata.role = 'admin'.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Verificacion A (ejecutar despues de aplicar):
--   SELECT prosrc FROM pg_proc WHERE proname = 'is_admin';
--     -> debe contener 'app_metadata' y NO mencionar 'public.clientes'
--   SELECT is_admin();
--     -> debe devolver false sin error (desde el SQL Editor, como postgres)

-- Rollback A (solo si falla):
--   CREATE OR REPLACE FUNCTION public.is_admin()
--   RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
--   SET search_path = public
--   AS $$ SELECT EXISTS (SELECT 1 FROM public.clientes
--                        WHERE user_id = auth.uid() AND role = 'admin'); $$;


-- ============================================================================
-- SECCION B: Corregir 3 politicas P7 (auth.jwt() ->> 'role' -> app_metadata)
-- ============================================================================
-- Estas 3 politicas usaban la RAIZ del JWT (siempre 'authenticated'), por lo
-- que NUNCA autorizaban a nadie. Se corrigen para leer app_metadata.role.

-- B.1 - eventos_calendario
DROP POLICY IF EXISTS "Admins pueden gestionar eventos" ON public.eventos_calendario;
CREATE POLICY "Admins pueden gestionar eventos"
  ON public.eventos_calendario
  FOR ALL
  TO authenticated
  USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- B.2 - promociones_historico
DROP POLICY IF EXISTS "Admins pueden gestionar histórico" ON public.promociones_historico;
CREATE POLICY "Admins pueden gestionar histórico"
  ON public.promociones_historico
  FOR ALL
  TO authenticated
  USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- B.3 - reglas_promocion
DROP POLICY IF EXISTS "Admins pueden gestionar reglas" ON public.reglas_promocion;
CREATE POLICY "Admins pueden gestionar reglas"
  ON public.reglas_promocion
  FOR ALL
  TO authenticated
  USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Verificacion B (ejecutar despues de aplicar):
--   SELECT tablename, policyname, qual FROM pg_policies
--   WHERE policyname IN (
--     'Admins pueden gestionar eventos',
--     'Admins pueden gestionar histórico',
--     'Admins pueden gestionar reglas'
--   );
--     -> las 3 deben mostrar 'app_metadata' en qual

-- Rollback B (solo si falla): volver a la version original
--   DROP POLICY IF EXISTS "Admins pueden gestionar eventos" ON public.eventos_calendario;
--   CREATE POLICY "Admins pueden gestionar eventos" ON public.eventos_calendario
--     FOR ALL TO authenticated
--     USING (((SELECT auth.jwt()) ->> 'role') = 'admin')
--     WITH CHECK (((SELECT auth.jwt()) ->> 'role') = 'admin');
--   (repetir para las otras 2)


-- ============================================================================
-- SECCION C: Permisos minimos sobre clientes
-- ============================================================================
-- Cierra: SEC-004 (UPDATE role), SEC-005 (anon con DDL),
--         SEC-006 (columnas sensibles), SEC-007 (INSERT role).
--
-- Estrategia: revocar TODO y re-otorgar a nivel columna lo estrictamente
--             necesario. Los DEFAULT cubren role/is_active/puntos/nivel.
--             Los triggers cubren updated_at y nivel_cliente.
--
-- Chequeo previo confirmado (2026-10-13):
--   anon:          GRANT ALL (UPDATE/INSERT/DELETE/TRUNCATE/...)
--   authenticated: GRANT ALL sobre las 24 columnas
--   postgres:      superusuario (no se toca)
--   service_role:  backend (no se toca)

-- --- PASO C.1: REVOCAR TODO a anon y authenticated ---
REVOKE ALL ON public.clientes FROM anon;
REVOKE ALL ON public.clientes FROM authenticated;

-- --- PASO C.2: anon NO recibe nada ---
-- (los REVOKE del paso C.1 ya dejan a anon sin privilegios)

-- --- PASO C.3: authenticated - SELECT completo (RLS filtra por fila) ---
GRANT SELECT ON public.clientes TO authenticated;

-- --- PASO C.4: authenticated - UPDATE solo columnas cosmeticas/direccion ---
-- NO se otorga UPDATE sobre:
--   role, is_active, puntos_fidelidad, nivel_cliente  (SEC-004/006)
--   id, user_id, created_at, updated_at               (integridad/auditoria)
--   email                                              (fuente: auth.users)
GRANT UPDATE (
  nombre_completo,
  telefono,
  direccion_calle,
  direccion_numero,
  direccion_piso_dept,
  direccion_ciudad,
  direccion_provincia,
  direccion_cp,
  lat,
  lng,
  prefiere_retiro,
  prefiere_delivery,
  notas_cliente,
  avatar_url,
  foto_url
) ON public.clientes TO authenticated;

-- --- PASO C.5: authenticated - INSERT solo columnas del registro ---
-- NO se otorga INSERT sobre:
--   role, is_active, puntos_fidelidad, nivel_cliente  (SEC-007)
--   id, created_at, updated_at                        (DEFAULT)
GRANT INSERT (
  user_id,
  email,
  nombre_completo,
  avatar_url,
  telefono,
  direccion_calle,
  direccion_numero,
  direccion_piso_dept,
  direccion_ciudad,
  direccion_provincia,
  direccion_cp,
  lat,
  lng,
  prefiere_retiro,
  prefiere_delivery,
  notas_cliente,
  foto_url
) ON public.clientes TO authenticated;

-- Verificacion C (ejecutar despues de aplicar):
--   1) SELECT grantee, privilege_type
--      FROM information_schema.table_privileges
--      WHERE table_name = 'clientes' AND grantee IN ('anon','authenticated');
--        -> anon: 0 filas
--        -> authenticated: solo SELECT
--
--   2) SELECT grantee, column_name
--      FROM information_schema.column_privileges
--      WHERE table_name = 'clientes' AND grantee = 'authenticated'
--        AND privilege_type = 'UPDATE';
--        -> 15 columnas cosmeticas. NO debe aparecer role/is_active/
--           puntos_fidelidad/nivel_cliente/id/user_id/created_at/
--           updated_at/email
--
--   3) SELECT grantee, column_name
--      FROM information_schema.column_privileges
--      WHERE table_name = 'clientes' AND grantee = 'authenticated'
--        AND privilege_type = 'INSERT';
--        -> 17 columnas. NO debe aparecer role/is_active/
--           puntos_fidelidad/nivel_cliente/id/created_at/updated_at

-- Rollback C (solo si falla): restaurar los GRANT originales
--   GRANT ALL ON public.clientes TO anon;
--   GRANT ALL ON public.clientes TO authenticated;
--   (vuelve al estado previo al fix, con los riesgos de SEC-004/005/006/007)


-- ============================================================================
-- FIN F3-01
-- ============================================================================
-- Estado final verificado (2026-10-13):
--   - is_admin() lee de app_metadata                    OK
--   - 3 politicas P7 usan app_metadata                  OK
--   - anon sin privilegios sobre clientes               OK
--   - authenticated solo con permisos minimos           OK
--   - Columnas sensibles bloqueadas (UPDATE e INSERT)   OK
--
-- Hallazgos cerrados: SEC-003, SEC-004, SEC-005, SEC-006, SEC-007,
--                     P7, BUG-002.
-- ============================================================================