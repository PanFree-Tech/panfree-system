-- S30 - Quitar trigger on_pedido_confirmado (PanFree es Made-To-Order)
-- Fecha: 2026-10-19
-- Contexto: el trigger descuenta stock al confirmar/entregar pedidos.
-- En Made-To-Order no hay stock fisico. El trigger bloquea pedidos si no hay stock
-- (RAISE EXCEPTION) y causa doble descuento al cambiar a 'entregado'.
--
-- Rollback (si se necesita):
-- CREATE TRIGGER on_pedido_confirmado AFTER UPDATE ON public.pedidos
--   FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_pedido();

DROP TRIGGER IF EXISTS on_pedido_confirmado ON public.pedidos;
DROP FUNCTION IF EXISTS public.actualizar_stock_pedido();