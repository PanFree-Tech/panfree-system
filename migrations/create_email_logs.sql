-- ==============================================================================
-- 📁 MIGRACIÓN: migrations/create_email_logs.sql
-- 📅 FECHA: 2026-08-22
-- 📌 OBJETIVO: TABLA DE HISTORIAL Y AUDITORÍA DE CORREOS ENVIADOS CON RESEND
-- ==============================================================================

-- 1. Crear tabla 'email_logs'
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  from_email TEXT DEFAULT 'PanFree <contacto@panfree.fit>',
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued', 'delivered', 'bounced')),
  resend_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para optimizar consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_id);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas previas para evitar duplicados
DROP POLICY IF EXISTS "Public read on email_logs" ON email_logs;
DROP POLICY IF EXISTS "Admin and Service Role full access on email_logs" ON email_logs;

-- 5. Políticas de seguridad
CREATE POLICY "Admin and Service Role full access on email_logs"
ON email_logs FOR ALL
USING (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
)
WITH CHECK (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);
