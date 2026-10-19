-- ============================================================================
-- Hotfix: restaurar EXECUTE en is_admin() para authenticated
-- Fecha: 2026-10-19
-- ============================================================================
-- El PR #49 (AUD-005 + AUD-007) revoco EXECUTE de is_admin() a authenticated.
-- Pero is_admin() se usa en las politicas RLS, y las politicas se ejecutan
-- con el rol del usuario (authenticated). Sin EXECUTE, las politicas fallan
-- con "permission denied for function is_admin" (codigo 42501).
--
-- Fix: restaurar EXECUTE a authenticated. La funcion es SECURITY DEFINER,
-- asi que no hay riesgo: corre como postgres y solo lee clientes.role.
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Verificar
DO $$
BEGIN
  RAISE NOTICE 'EXECUTE restaurado en is_admin() para authenticated';
END $$;