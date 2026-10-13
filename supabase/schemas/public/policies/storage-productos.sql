-- ============================================================
-- Politica: Imagenes productos - lectura directa (sin listado)
-- Ultima actualizacion: 2026-10-13 (F1-05)
-- Tabla: storage.objects
-- ============================================================
--
-- Contexto: el bucket productos es public=true (correcto, las
-- imagenes de producto son publicas). Pero la politica original
-- permitia listar todos los archivos, exponiendo nombres y
-- estructura de carpetas. Esta politica restringe a lectura
-- directa unicamente.

DROP POLICY IF EXISTS "ImÃ¡genes productos: lectura pÃºblica" ON storage.objects;
DROP POLICY IF EXISTS "ImÃ¡genes productos: lectura directa" ON storage.objects;

CREATE POLICY "ImÃ¡genes productos: lectura directa"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'productos'
  AND storage.allow_any_operation(
    ARRAY[
      'object.get_authenticated',
      'storage.object.get_authenticated'
    ]
  )
);