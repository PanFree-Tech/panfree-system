-- ============================================================
-- Funcion: public.update_updated_at_column()
-- Ultima actualizacion: 2026-10-13 (F1-04)
-- Tipo: TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;