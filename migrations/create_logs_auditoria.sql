-- ==============================================================================
-- 📁 UBICACIÓN: migrations/create_logs_auditoria.sql
-- 📅 FECHA: 2026-08-19 (FASE 6: UX Y MONITOREO)
-- 📌 DESCRIPCIÓN: Crea la tabla de logs de auditoría y sus políticas RLS
-- ==============================================================================

-- 1. Crear tabla logs_auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accion TEXT NOT NULL,
  detalle TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Índices para consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_created_at ON logs_auditoria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_accion ON logs_auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario ON logs_auditoria(usuario_id);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- 4. Políticas: solo admin puede consultar logs
DROP POLICY IF EXISTS "admin_select_logs" ON logs_auditoria;
CREATE POLICY "admin_select_logs" ON logs_auditoria
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    auth.jwt()->'app_metadata'->>'role' = 'admin'
  );

-- 5. Políticas: usuarios autenticados o service_role pueden insertar logs
DROP POLICY IF EXISTS "admin_insert_logs" ON logs_auditoria;
CREATE POLICY "admin_insert_logs" ON logs_auditoria
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );
