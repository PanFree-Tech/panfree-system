-- ==============================================================================
-- 📁 MIGRACIÓN: migrations/create-public-images-bucket.sql
-- 📅 FECHA: 2026-08-22
-- 📌 OBJETIVO: Crear bucket 'public-images' en Supabase Storage con políticas
--    de seguridad RLS para imágenes de marketing y productos de PanFree.
-- ==============================================================================

-- 1. Crear el bucket 'public-images' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-images',
  'public-images',
  true,
  10485760, -- Límite de 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Habilitar RLS en storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas previas para evitar duplicación
DROP POLICY IF EXISTS "Public Read Access on public-images" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Insert on public-images" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Update on public-images" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Delete on public-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Authenticated Insert on public-images" ON storage.objects;

-- 4. POLÍTICA: Lectura pública (Cualquiera puede ver las imágenes públicas)
CREATE POLICY "Public Read Access on public-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-images');

-- 5. POLÍTICA: Service Role puede INSERTAR objetos
CREATE POLICY "Service Role Insert on public-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public-images' 
  AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
);

-- 6. POLÍTICA: Service Role puede ACTUALIZAR objetos
CREATE POLICY "Service Role Update on public-images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'public-images' 
  AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
)
WITH CHECK (
  bucket_id = 'public-images' 
  AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
);

-- 7. POLÍTICA: Service Role puede ELIMINAR objetos
CREATE POLICY "Service Role Delete on public-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public-images' 
  AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
);
