-- ============================================================
-- Funcion: public.is_admin()
-- Ultima actualizacion: 2026-10-13 (F1-03)
-- Tipo: UTILITY (usada en RLS policies, NO invocable via RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.clientes
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$function$;

-- F1-03: revocar ejecucion publica
-- Nota: las RLS policies que usan is_admin() siguen funcionando
-- porque la ejecucion dentro de policies no verifica EXECUTE.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;