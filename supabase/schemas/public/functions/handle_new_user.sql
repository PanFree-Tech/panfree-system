-- ============================================================
-- Funcion: public.handle_new_user()
-- Ultima actualizacion: 2026-10-13 (F1-03)
-- Tipo: TRIGGER (no debe ser invocada via RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.clientes (
    user_id, email, nombre_completo, is_active, role, puntos_fidelidad, nivel_cliente
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nombre_completo',
      NEW.raw_user_meta_data->>'full_name',
      'Usuario'
    ),
    true,
    'cliente',
    0,
    'bronce'
  );
  RETURN NEW;
END;
$function$;

-- F1-03: revocar ejecucion publica
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;