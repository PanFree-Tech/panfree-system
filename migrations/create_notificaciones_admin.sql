-- ==============================================================================
-- 📁 MIGRACIÓN: migrations/create_notificaciones_admin.sql
-- 📅 FECHA: 2026-08-28
-- 📌 OBJETIVO: TABLA DE NOTIFICACIONES Y ALERTAS INTERNAS PARA ADMINISTRADORES
-- ==============================================================================

-- 1. Crear tabla de notificaciones para administradores
CREATE TABLE IF NOT EXISTS notificaciones_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('nuevo_pedido', 'cancelacion', 'stock_bajo', 'sistema')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índices para búsquedas y ordenamientos rápidos
CREATE INDEX IF NOT EXISTS idx_notificaciones_admin_leido ON notificaciones_admin(leido);
CREATE INDEX IF NOT EXISTS idx_notificaciones_admin_created_at ON notificaciones_admin(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_admin_tipo ON notificaciones_admin(tipo);

-- 3. Políticas RLS
ALTER TABLE notificaciones_admin ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes si las hubiera
DROP POLICY IF EXISTS "Admins pueden ver notificaciones" ON notificaciones_admin;
DROP POLICY IF EXISTS "Admins pueden insertar notificaciones" ON notificaciones_admin;
DROP POLICY IF EXISTS "Admins pueden actualizar notificaciones" ON notificaciones_admin;
DROP POLICY IF EXISTS "Acceso completo service_role y authenticated" ON notificaciones_admin;

-- Política de lectura: Admins u operadores autenticados, y service_role
CREATE POLICY "Admins pueden ver notificaciones" ON notificaciones_admin
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    (
      auth.role() = 'authenticated' AND 
      (
        EXISTS (
          SELECT 1 FROM usuarios 
          WHERE usuarios.id = auth.uid() 
          AND usuarios.rol IN ('admin', 'operador')
        )
        OR
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'operador')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'operador')
      )
    )
  );

-- Política de inserción: Service role, backend API y admins
CREATE POLICY "Admins pueden insertar notificaciones" ON notificaciones_admin
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth.role() = 'anon' OR
    auth.role() = 'authenticated'
  );

-- Política de actualización: Solo admins y service_role
CREATE POLICY "Admins pueden actualizar notificaciones" ON notificaciones_admin
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    (
      auth.role() = 'authenticated' AND 
      (
        EXISTS (
          SELECT 1 FROM usuarios 
          WHERE usuarios.id = auth.uid() 
          AND usuarios.rol IN ('admin', 'operador')
        )
        OR
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'operador')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'operador')
      )
    )
  );
