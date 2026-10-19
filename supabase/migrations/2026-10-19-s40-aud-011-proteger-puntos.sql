-- ============================================================================
-- AUD-011: Proteger puntos_fidelidad y nivel_cliente de manipulación cliente
-- Fecha: 2026-10-19
-- ============================================================================
-- PROBLEMA:
--   clientes_update_policy permite UPDATE total de la fila.
--   Cualquier usuario logueado puede hacer:
--     PATCH /rest/v1/clientes?id=eq.<su_id>
--     Body: { "puntos_fidelidad": 999999, "nivel_cliente": "vip" }
--   Y auto-asignarse puntos y nivel VIP.
--
-- SOLUCIÓN:
--   Política de UPDATE con WITH CHECK que valida que puntos_fidelidad y
--   nivel_cliente NO cambian. Si el cliente intenta modificarlos, falla.
--   Esos campos solo los modifica:
--     - trigger sumar_puntos_diptico (SECURITY DEFINER, bypass RLS)
--     - RPC canjear_diptico / canjear_premio (SECURITY DEFINER, PR 2)
--     - service_role (backend/admin, bypass RLS)
-- ============================================================================

DROP POLICY IF EXISTS "clientes_update_policy" ON public.clientes;

CREATE POLICY "clientes_update_policy"
ON public.clientes
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND puntos_fidelidad = (SELECT puntos_fidelidad FROM public.clientes WHERE user_id = (SELECT auth.uid()))
  AND nivel_cliente = (SELECT nivel_cliente FROM public.clientes WHERE user_id = (SELECT auth.uid()))
);