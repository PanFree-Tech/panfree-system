-- ============================================================
-- Funcion: public.actualizar_stock_pedido()
-- Ultima actualizacion: 2026-10-13 (F1-03)
-- Tipo: TRIGGER (no debe ser invocada via RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.actualizar_stock_pedido()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
  v_stock_anterior INTEGER;
  v_stock_nuevo INTEGER;
  v_producto_id UUID;
  v_cantidad INTEGER;
BEGIN
  IF NEW.estado IN ('confirmado', 'entregado') AND OLD.estado NOT IN ('confirmado', 'entregado') THEN
    FOR v_item IN
      SELECT dp.producto_id, dp.cantidad
      FROM public.detalle_pedido dp
      WHERE dp.pedido_id = NEW.id
    LOOP
      v_producto_id := v_item.producto_id;
      v_cantidad := v_item.cantidad;

      SELECT stock_actual INTO v_stock_anterior
      FROM public.productos
      WHERE id = v_producto_id
      FOR UPDATE;

      IF v_stock_anterior < v_cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto ID %: % unidades disponibles, se requieren %',
          v_producto_id, v_stock_anterior, v_cantidad;
      END IF;

      v_stock_nuevo := v_stock_anterior - v_cantidad;

      UPDATE public.productos
      SET stock_actual = v_stock_nuevo
      WHERE id = v_producto_id;

      INSERT INTO public.stock_movimientos (
        producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
        motivo, referencia_id, referencia_tabla
      ) VALUES (
        v_producto_id, 'salida_pedido', -v_cantidad, v_stock_anterior, v_stock_nuevo,
        'Pedido confirmado: ' || NEW.numero_pedido, NEW.id, 'pedidos'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

-- F1-03: revocar ejecucion publica
REVOKE EXECUTE ON FUNCTION public.actualizar_stock_pedido() FROM anon, authenticated, public;