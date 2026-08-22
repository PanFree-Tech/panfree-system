-- ==============================================================================
-- 📁 MIGRACIÓN: migrations/create-generaciones-imagen.sql
-- 📅 FECHA: 2026-08-22
-- 📌 OBJETIVO: FASE 3 - REGISTRO E HISTÓRICO DE GENERACIONES DE IMÁGENES CON CLOUDINARY
--    Almacena las transformaciones generativas de IA aplicadas a fotos de productos
--    reales de PanFree junto con los metadatos y URLs de Cloudinary.
-- ==============================================================================

-- 1. Crear tabla 'generaciones_imagen' si no existe
CREATE TABLE IF NOT EXISTS generaciones_imagen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  promocion_id UUID REFERENCES promociones_historico(id) ON DELETE SET NULL,
  imagen_original_url TEXT,
  imagen_generada_url TEXT NOT NULL,
  transformaciones JSONB DEFAULT '{}'::jsonb,
  prompt_creativo TEXT,
  evento TEXT,
  descuento_aplicado INTEGER DEFAULT 0,
  precio_original NUMERIC,
  precio_promocional NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para optimizar consultas de administración e historial
CREATE INDEX IF NOT EXISTS idx_generaciones_imagen_producto_id ON generaciones_imagen(producto_id);
CREATE INDEX IF NOT EXISTS idx_generaciones_imagen_promocion_id ON generaciones_imagen(promocion_id);
CREATE INDEX IF NOT EXISTS idx_generaciones_imagen_created_at ON generaciones_imagen(created_at DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE generaciones_imagen ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas previas para evitar duplicados
DROP POLICY IF EXISTS "Public read on generaciones_imagen" ON generaciones_imagen;
DROP POLICY IF EXISTS "Service role / Admin full access on generaciones_imagen" ON generaciones_imagen;

-- 5. Políticas de seguridad
-- Lectura permitida para usuarios autenticados y vistas públicas de marketing
CREATE POLICY "Public read on generaciones_imagen"
ON generaciones_imagen FOR SELECT
USING (true);

-- Inserción y actualización para Service Role y usuarios autenticados
CREATE POLICY "Service role / Admin full access on generaciones_imagen"
ON generaciones_imagen FOR ALL
USING (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
)
WITH CHECK (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);
