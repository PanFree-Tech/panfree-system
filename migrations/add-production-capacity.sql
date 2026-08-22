-- ==============================================================================
-- 📁 MIGRACIÓN: migrations/add-production-capacity.sql
-- 📅 FECHA: 2026-08-22
-- 📌 OBJETIVO: FASE 2 - CAPACIDAD DE PRODUCCIÓN EN MODELO MADE-TO-ORDER
--    Agrega control de capacidad de producción diaria, cálculo de órdenes
--    actuales, tiempos de entrega (lead_time) y actualización automática
--    del estado de disponibilidad (DISPONIBLE, CAPACIDAD LIMITADA, CERRADO).
-- ==============================================================================

-- 1. Agregar columnas de capacidad de producción a la tabla 'productos' si no existen
ALTER TABLE productos 
  ADD COLUMN IF NOT EXISTS production_capacity INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS current_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_time INTEGER DEFAULT 24, -- tiempo de elaboración en horas
  ADD COLUMN IF NOT EXISTS order_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'DISPONIBLE';

-- 2. Asegurar valores por defecto para filas existentes que tengan NULL
UPDATE productos 
SET 
  production_capacity = COALESCE(production_capacity, 10),
  current_orders = COALESCE(current_orders, 0),
  lead_time = COALESCE(lead_time, 24),
  order_available = COALESCE(order_available, true),
  availability_status = CASE 
    WHEN COALESCE(current_orders, 0) >= COALESCE(production_capacity, 10) THEN 'CERRADO'
    WHEN COALESCE(current_orders, 0) >= (COALESCE(production_capacity, 10) * 0.8) THEN 'CAPACIDAD LIMITADA'
    ELSE 'DISPONIBLE'
  END
WHERE production_capacity IS NULL OR availability_status IS NULL;

-- 3. Crear o reemplazar la función que calcula automáticamente el estado
CREATE OR REPLACE FUNCTION update_availability_status()
RETURNS TRIGGER AS $$
DECLARE
  v_capacity INTEGER;
  v_orders INTEGER;
BEGIN
  -- Manejar valores nulos con valores seguros por defecto
  v_capacity := COALESCE(NEW.production_capacity, 10);
  v_orders := COALESCE(NEW.current_orders, 0);

  IF v_orders >= v_capacity THEN
    NEW.availability_status := 'CERRADO';
    NEW.order_available := false;
  ELSIF v_orders >= (v_capacity * 0.8) THEN
    NEW.availability_status := 'CAPACIDAD LIMITADA';
    NEW.order_available := true;
  ELSE
    NEW.availability_status := 'DISPONIBLE';
    NEW.order_available := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para actualizar estado antes de INSERT o UPDATE en productos
DROP TRIGGER IF EXISTS update_availability_trigger ON productos;

CREATE TRIGGER update_availability_trigger
BEFORE INSERT OR UPDATE OF current_orders, production_capacity ON productos
FOR EACH ROW
EXECUTE FUNCTION update_availability_status();
