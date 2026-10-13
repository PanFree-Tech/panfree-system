-- ============================================================
-- Migracion: 2026-10-13-f1-07-initplan
-- Tarea: F1-07 - Optimizar politicas RLS con InitPlan
-- Hallazgo: DB-001e
-- Autor: Pedro J. Pirovani
-- Fecha: 2026-10-13
-- ============================================================
--
-- CONTEXTO
-- --------
-- 79 politicas RLS llamaban funciones STABLE (auth.uid, auth.jwt,
-- auth.role, is_admin) directamente en USING / WITH CHECK.
-- Postgres las evalua una vez POR FILA.
--
-- FIX
-- ---
-- Envolver cada llamada en un subselect (SELECT ...). Esto activa
-- InitPlan en Postgres: la funcion se evalua UNA VEZ POR QUERY.
--
-- ROLLBACK
-- --------
-- Ver bloque ROLLBACK al final del archivo.
--
-- ============================================================

-- ============================================================
-- BLOQUE 1: is_admin() simple
-- ============================================================

DROP POLICY IF EXISTS "Admin gestiona canjes" ON public.canjes_dipticos;
CREATE POLICY "Admin gestiona canjes" ON public.canjes_dipticos
  FOR ALL TO public USING ((SELECT is_admin()));

DROP POLICY IF EXISTS "Admin puede actualizar canjes" ON public.canjes_premios;
CREATE POLICY "Admin puede actualizar canjes" ON public.canjes_premios
  FOR UPDATE TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "Admin puede eliminar canjes" ON public.canjes_premios;
CREATE POLICY "Admin puede eliminar canjes" ON public.canjes_premios
  FOR DELETE TO authenticated USING ((SELECT is_admin()));

DROP POLICY IF EXISTS "Admin gestiona cupones" ON public.cupones_descuento;
CREATE POLICY "Admin gestiona cupones" ON public.cupones_descuento
  FOR ALL TO public USING ((SELECT is_admin()));

DROP POLICY IF EXISTS "Admin full access detalle_pedido" ON public.detalle_pedido;
CREATE POLICY "Admin full access detalle_pedido" ON public.detalle_pedido
  FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "detalle_pedido_admin_all" ON public.detalle_pedido;
CREATE POLICY "detalle_pedido_admin_all" ON public.detalle_pedido
  FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "insumos_admin_all" ON public.insumos;
CREATE POLICY "insumos_admin_all" ON public.insumos
  FOR ALL TO public USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "notif_admin_all" ON public.notificaciones_admin;
CREATE POLICY "notif_admin_all" ON public.notificaciones_admin
  FOR ALL TO public USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "Admin full access pedidos" ON public.pedidos;
CREATE POLICY "Admin full access pedidos" ON public.pedidos
  FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "pedidos_admin_all" ON public.pedidos;
CREATE POLICY "pedidos_admin_all" ON public.pedidos
  FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "Admin gestiona premios" ON public.premios;
CREATE POLICY "Admin gestiona premios" ON public.premios
  FOR ALL TO public USING ((SELECT is_admin()));

DROP POLICY IF EXISTS "Admin full access productos" ON public.productos;
CREATE POLICY "Admin full access productos" ON public.productos
  FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "admin_all_productos" ON public.productos;
CREATE POLICY "admin_all_productos" ON public.productos
  FOR ALL TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "productos_admin_all" ON public.productos;
CREATE POLICY "productos_admin_all" ON public.productos
  FOR ALL TO public USING ((SELECT is_admin()));

-- ============================================================
-- BLOQUE 2: is_admin() OR auth.role() = service_role
-- ============================================================

-- NOTA: los 15 bloques siguen el mismo patron. Ver 13-f1-07-rls-initplan.md
-- para la lista completa. Aqui se incluye la migracion resumida.

DROP POLICY IF EXISTS "Admin y service_role acceso codigos_dipticos" ON public.codigos_dipticos;
CREATE POLICY "Admin y service_role acceso codigos_dipticos" ON public.codigos_dipticos
  FOR ALL TO public USING ((SELECT is_admin()) OR (SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT is_admin()) OR (SELECT auth.role()) = 'service_role');

-- ... (13 politicas mas con el mismo patron: Admin ERP *, Admin all *, etc.)

-- ============================================================
-- BLOQUE 3: auth.jwt() -> app_metadata ->> role
-- ============================================================

-- 14 politicas. Patron:
DROP POLICY IF EXISTS "compras_admin" ON public.compras;
CREATE POLICY "compras_admin" ON public.compras
  FOR ALL TO authenticated
  USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ... (13 politicas mas con el mismo patron)

-- ============================================================
-- BLOQUE 4: resto (auth.uid, EXISTS, IN, storage)
-- ============================================================

-- 37 politicas. Patrones:
--   auth.uid() simple -> (SELECT auth.uid())
--   cliente_id IN (SELECT ... user_id = auth.uid())
--   EXISTS (SELECT 1 FROM clientes WHERE user_id = auth.uid())
--   storage.objects con is_admin() OR auth.role()

-- NOTA: para el SQL completo, consultar el editor de Supabase,
-- donde se ejecuto paso a paso (bloques 1-4 + fix puntual).

-- ============================================================
-- ROLLBACK (NO ejecutar a menos que sea necesario)
-- ============================================================
--
-- El rollback consiste en reemplazar:
--   (SELECT is_admin())    -> is_admin()
--   (SELECT auth.uid())    -> auth.uid()
--   (SELECT auth.jwt())    -> auth.jwt()
--   (SELECT auth.role())   -> auth.role()
--
-- en cada politica listada arriba.
--
-- NO RECOMENDADO: la version optimizada es funcionalmente equivalente
-- y mas rapida en tablas con muchas filas.
