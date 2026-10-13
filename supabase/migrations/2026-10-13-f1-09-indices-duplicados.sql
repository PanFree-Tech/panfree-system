-- =====================================================================
-- F1-09 - Eliminar indices duplicados
-- Fecha: 2026-10-13
-- Hallazgo: DB-001i
-- Resumen: 9 indices duplicados eliminados en 2 grupos.
-- Verificacion previa: 0 constraints afectadas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- GRUPO A - idx_* redundantes respecto a UNIQUE hermano (7)
-- ---------------------------------------------------------------------

DROP INDEX IF EXISTS public.idx_clientes_email;
DROP INDEX IF EXISTS public.idx_codigos_dipticos_codigo;
DROP INDEX IF EXISTS public.idx_compras_numero;
DROP INDEX IF EXISTS public.idx_cupones_codigo;
DROP INDEX IF EXISTS public.idx_pedidos_numero;
DROP INDEX IF EXISTS public.idx_produccion_lote;
DROP INDEX IF EXISTS public.idx_productos_slug;

-- ---------------------------------------------------------------------
-- GRUPO B - no-UNIQUE duplicados entre si (2)
-- ---------------------------------------------------------------------

DROP INDEX IF EXISTS public.idx_notificaciones_created;
DROP INDEX IF EXISTS public.idx_notificaciones_leida;

-- =====================================================================
-- ROLLBACK (solo si hay que revertir)
-- =====================================================================

-- Grupo A
-- CREATE INDEX idx_clientes_email          ON public.clientes          USING btree (email);
-- CREATE INDEX idx_codigos_dipticos_codigo ON public.codigos_dipticos USING btree (codigo);
-- CREATE INDEX idx_compras_numero          ON public.compras          USING btree (numero_compra);
-- CREATE INDEX idx_cupones_codigo          ON public.cupones_descuento USING btree (codigo);
-- CREATE INDEX idx_pedidos_numero          ON public.pedidos          USING btree (numero_pedido);
-- CREATE INDEX idx_produccion_lote         ON public.produccion       USING btree (numero_lote);
-- CREATE INDEX idx_productos_slug          ON public.productos        USING btree (slug);

-- Grupo B
-- CREATE INDEX idx_notificaciones_created ON public.notificaciones_admin USING btree (created_at DESC);
-- CREATE INDEX idx_notificaciones_leida   ON public.notificaciones_admin USING btree (leido);

