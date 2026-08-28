-- ==============================================================================
-- 📁 MIGRACIÓN: add_logo_variantes_configuracion.sql
-- 📅 FECHA: 2026-08-28
-- 📌 OBJETIVO:
--    Agregar columnas `logo_variantes` (JSONB) y `logo_variante_activa` (TEXT)
--    a la tabla `configuracion_sitio` para permitir galería de variantes temáticas
--    (Navidad, San Valentín, Octubre Rosa, Pascua, etc.) y selector de variante activa.
-- ==============================================================================

ALTER TABLE public.configuracion_sitio 
ADD COLUMN IF NOT EXISTS logo_variantes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS logo_variante_activa TEXT DEFAULT NULL;

-- Comentario explicativo en las columnas
COMMENT ON COLUMN public.configuracion_sitio.logo_variantes IS 'Array JSON con variantes temáticas del logo: [{id, nombre, url, creada_en}]';
COMMENT ON COLUMN public.configuracion_sitio.logo_variante_activa IS 'ID o URL de la variante temática activa para mostrar en el Header/Footer. NULL o vacío si se usa el logo principal base.';
