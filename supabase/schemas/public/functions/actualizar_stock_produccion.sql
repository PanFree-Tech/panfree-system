-- ============================================================
-- Funcion: public.actualizar_stock_produccion()
-- Ultima actualizacion: 2026-10-13 (F1-03)
-- Tipo: TRIGGER (no debe ser invocada via RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.actualizar_stock_produccion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stock_anterior INTEGER;
  v_stock_nuevo INTEGER;
BEGIN
  IF NEW.estado IN ('completado', 'finalizado') AND OLD.estado NOT IN ('completado', 'finalizado') THEN
    SELECT stock_actual INTO v_stock_anterior
    FROM public.productos
    WHERE id = NEW.producto_id
    FOR UPDATE;

    v_stock_nuevo := v_stock_anterior + NEW.cantidad_producida;

    UPDATE public.productos
    SET stock_actual = v_stock_nuevo
    WHERE id = NEW.producto_id;

    INSERT INTO public.stock_movimientos (
      producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
      motivo, referencia_id, referencia_tabla
    ) VALUES (
      NEW.producto_id, 'entrada_produccion', NEW.cantidad_producida,
      v_stock_anterior, v_stock_nuevo,
      'Produccion completada: Lote ' || NEW.numero_lote, NEW.id, 'produccion'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- F1-03: revocar ejecucion publica
REVOKE EXECUTE ON FUNCTION public.actualizar_stock_produccion() FROM anon, authenticated, public;