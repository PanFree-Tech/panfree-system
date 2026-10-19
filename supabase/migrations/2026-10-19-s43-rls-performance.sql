-- ============================================================================
-- Fase 3 - Sprint 1: Performance RLS
-- Fecha: 2026-10-19
-- ============================================================================
-- Optimiza 2 politicas RLS de cupones_canjeados que no usan el patron
-- (SELECT auth.uid()) recomendado por Supabase.
-- Agrega 3 indices faltantes para los JOINs de las politicas.
-- ============================================================================

-- 1. Optimizar cupones_canjeados INSERT
-- Antes: WITH CHECK (auth.uid() IS NOT NULL)
-- Despues: WITH CHECK ((SELECT auth.uid()) IS NOT NULL)
DROP POLICY IF EXISTS "Insertar canje desde checkout" ON public.cupones_canjeados;
CREATE POLICY "Insertar canje desde checkout"
ON public.cupones_canjeados
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 2. Optimizar cupones_canjeados SELECT
-- Antes: USING (auth.uid() IN (SELECT clientes.user_id ...))
-- Despues: USING ((SELECT auth.uid()) IN (SELECT clientes.user_id ...))
DROP POLICY IF EXISTS "Lectura de canjes propios" ON public.cupones_canjeados;
CREATE POLICY "Lectura de canjes propios"
ON public.cupones_canjeados
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) IN (
    SELECT clientes.user_id FROM public.clientes WHERE clientes.id = cupones_canjeados.cliente_id
  )
);

-- 3. Indice faltante en cupones_canjeados.cliente_id (usado en RLS SELECT)
CREATE INDEX IF NOT EXISTS idx_cupones_canjeados_cliente
  ON public.cupones_canjeados USING btree (cliente_id);

-- 4. Indice faltante en cupones_canjeados.cupon_id (usado en FK)
CREATE INDEX IF NOT EXISTS idx_cupones_canjeados_cupon
  ON public.cupones_canjeados USING btree (cupon_id);

-- 5. Indice faltante en detalle_pedido.pedido_id (usado en RLS JOINs)
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido
  ON public.detalle_pedido USING btree (pedido_id);