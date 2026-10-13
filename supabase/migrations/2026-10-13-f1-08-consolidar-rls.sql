-- =====================================================================
-- F1-08 - Consolidar politicas RLS duplicadas
-- Fecha: 2026-10-13
-- Hallazgo: DB-001f (+ SEC-010 leak de productos inactivos)
-- Resumen: 20 politicas eliminadas en 4 bloques.
-- Total antes: 83 (public 78 + storage 5)
-- Total despues: 63 (public 58 + storage 5)
-- =====================================================================

-- ---------------------------------------------------------------------
-- BLOQUE 1 - Duplicados exactos admin ALL (5 politicas)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin full access pedidos"        ON public.pedidos;
DROP POLICY IF EXISTS "Admin full access detalle_pedido" ON public.detalle_pedido;
DROP POLICY IF EXISTS "Admin full access productos"      ON public.productos;
DROP POLICY IF EXISTS "productos_admin_all"              ON public.productos;
DROP POLICY IF EXISTS "insumos_admin_all"                ON public.insumos;

-- ---------------------------------------------------------------------
-- BLOQUE 2 - Duplicados semanticos is_admin() vs jwt (9 politicas)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "compras_admin"                     ON public.compras;
DROP POLICY IF EXISTS "detalle_compra_admin"              ON public.detalle_compra;
DROP POLICY IF EXISTS "detalle_pedido_admin_write"        ON public.detalle_pedido;
DROP POLICY IF EXISTS "detalle_produccion_admin"          ON public.detalle_produccion;
DROP POLICY IF EXISTS "Admins pueden gestionar eventos"   ON public.eventos_calendario;
DROP POLICY IF EXISTS "produccion_admin"                  ON public.produccion;
DROP POLICY IF EXISTS "productos_escritura_admin"         ON public.productos;
DROP POLICY IF EXISTS "Admins pueden gestionar histÃ³rico" ON public.promociones_historico;
DROP POLICY IF EXISTS "Admins pueden gestionar reglas"    ON public.reglas_promocion;

-- ---------------------------------------------------------------------
-- BLOQUE 3a - Subsets redundantes SELECT (3 politicas)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "pedidos_owner_select"              ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_select_own"                ON public.pedidos;
DROP POLICY IF EXISTS "detalle_owner_select"              ON public.detalle_pedido;

-- ---------------------------------------------------------------------
-- BLOQUE 3b - Leak de productos inactivos (1 politica)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "select_publico_productos"          ON public.productos;

-- ---------------------------------------------------------------------
-- BLOQUE 4 - Redundantes en notificaciones_admin (2 politicas)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Solo admin puede leer notificaciones"  ON public.notificaciones_admin;
DROP POLICY IF EXISTS "Admin puede actualizar notificaciones" ON public.notificaciones_admin;

-- =====================================================================
-- ROLLBACK (solo si hay que revertir)
-- =====================================================================

-- Bloque 1
-- CREATE POLICY "Admin full access pedidos"        ON public.pedidos FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
-- CREATE POLICY "Admin full access detalle_pedido" ON public.detalle_pedido FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
-- CREATE POLICY "Admin full access productos"      ON public.productos FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
-- CREATE POLICY "productos_admin_all"              ON public.productos FOR ALL TO public USING ((SELECT is_admin()));
-- CREATE POLICY "insumos_admin_all"                ON public.insumos FOR ALL TO public USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

-- Bloque 2 (restaurar variante jwt)
-- CREATE POLICY "compras_admin"                     ON public.compras FOR ALL TO authenticated USING (((((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')) WITH CHECK (((((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'));
-- ... (ver historial Git para el resto)

-- Bloque 3a
-- CREATE POLICY "pedidos_owner_select" ON public.pedidos FOR SELECT TO public USING (cliente_id IN (SELECT clientes.id FROM clientes WHERE clientes.user_id = (SELECT auth.uid())));
-- CREATE POLICY "pedidos_select_own"   ON public.pedidos FOR SELECT TO public USING ((SELECT is_admin()) OR cliente_id IN (SELECT clientes.id FROM clientes WHERE clientes.user_id = (SELECT auth.uid())));
-- CREATE POLICY "detalle_owner_select" ON public.detalle_pedido FOR SELECT TO public USING (pedido_id IN (SELECT p.id FROM pedidos p JOIN clientes c ON c.id = p.cliente_id WHERE c.user_id = (SELECT auth.uid())));

-- Bloque 3b (NO restaurar: reintroduce el leak)
-- CREATE POLICY "select_publico_productos" ON public.productos FOR SELECT TO public USING (true);

-- Bloque 4
-- CREATE POLICY "Solo admin puede leer notificaciones"  ON public.notificaciones_admin FOR SELECT TO public USING ((SELECT auth.role()) = 'authenticated' AND (((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
-- CREATE POLICY "Admin puede actualizar notificaciones" ON public.notificaciones_admin FOR UPDATE TO public USING ((SELECT auth.role()) = 'authenticated' AND (((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

