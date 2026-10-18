-- S29 - Fix vista_disponibilidad_productos (bug "Sin stock" en catálogo)
-- Fecha: 2026-10-19
-- Contexto: PanFree es Made-To-Order puro. No hay stock físico.
-- La vista vieja usaba stock_actual > 0, que devolvía "Sin stock" para productos con stock 0.
-- Fix: usar is_active (siempre true si el producto está activo).

CREATE OR REPLACE VIEW public.vista_disponibilidad_productos AS
SELECT
  p.id AS producto_id,
  p.nombre AS producto_nombre,
  p.slug,
  (p.lead_time > 0) AS requiere_anticipacion,
  'retiro_delivery'::text AS tipo_entrega,
  p.is_active AS disponible,
  p.production_capacity AS tandas_posibles,
  NULL::text AS ingredientes_faltantes
FROM productos p
WHERE p.is_active = true;