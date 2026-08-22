-- ==============================================================================
-- 📁 MIGRACIÓN: migrations/add_ga4_consent.sql
-- 📅 FECHA: 2026-08-22
-- 📌 DESCRIPCIÓN: Tablas para auditoría de consentimiento GA4 (panfree_ga_consent)
--    y atribución de conversiones de marketing (UTM Parameters & Ad Click IDs).
-- ==============================================================================

-- 1. Tabla de registro de consentimiento de analítica
CREATE TABLE IF NOT EXISTS public.ga4_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    consent_status TEXT NOT NULL CHECK (consent_status IN ('granted', 'denied')),
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de atribución de campañas de marketing y pedidos
CREATE TABLE IF NOT EXISTS public.marketing_campaign_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
    numero_pedido TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    gclid TEXT,
    fbclid TEXT,
    total_final NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Índices para consultas de alto rendimiento en panel de analítica
CREATE INDEX IF NOT EXISTS idx_ga4_consent_created_at ON public.ga4_consent_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_conv_created_at ON public.marketing_campaign_conversions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_conv_utm_source ON public.marketing_campaign_conversions (utm_source);
CREATE INDEX IF NOT EXISTS idx_marketing_conv_utm_campaign ON public.marketing_campaign_conversions (utm_campaign);
CREATE INDEX IF NOT EXISTS idx_marketing_conv_numero_pedido ON public.marketing_campaign_conversions (numero_pedido);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.ga4_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaign_conversions ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad
-- Lectura y gestión para administradores autenticados
DROP POLICY IF EXISTS "Admin full access ga4_consent_logs" ON public.ga4_consent_logs;
CREATE POLICY "Admin full access ga4_consent_logs" ON public.ga4_consent_logs
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access marketing_campaign_conversions" ON public.marketing_campaign_conversions;
CREATE POLICY "Admin full access marketing_campaign_conversions" ON public.marketing_campaign_conversions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Inserción anónima para logging de consentimientos y conversiones públicas
DROP POLICY IF EXISTS "Anon insert ga4_consent_logs" ON public.ga4_consent_logs;
CREATE POLICY "Anon insert ga4_consent_logs" ON public.ga4_consent_logs
    FOR INSERT TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon insert marketing_campaign_conversions" ON public.marketing_campaign_conversions;
CREATE POLICY "Anon insert marketing_campaign_conversions" ON public.marketing_campaign_conversions
    FOR INSERT TO anon
    WITH CHECK (true);
