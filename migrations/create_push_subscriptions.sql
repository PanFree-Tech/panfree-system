-- ==============================================================================
-- 📁 MIGRACIÓN: create_push_subscriptions.sql
-- 📅 FECHA: 2026-08-28
-- 📌 OBJETIVO:
--    1. Crear tabla `push_subscriptions` para almacenar suscripciones Push Web (VAPID)
--    2. Almacenar suscripción completa (JSONB) y campos normalizados (endpoint, p256dh, auth)
--    3. Configurar índices y políticas RLS para control granular de acceso
-- ==============================================================================

-- 1. Crear tabla de suscripciones Push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT,
    auth TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
);

-- 2. Crear índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
    ON public.push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
    ON public.push_subscriptions(endpoint);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at 
    ON public.push_subscriptions(created_at DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (RLS)

-- Los usuarios autenticados solo pueden consultar sus propias suscripciones
CREATE POLICY "Los usuarios pueden ver sus propias suscripciones push"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Los usuarios pueden registrar nuevas suscripciones push asociadas a su usuario
CREATE POLICY "Los usuarios pueden registrar sus suscripciones push"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus suscripciones push
CREATE POLICY "Los usuarios pueden actualizar sus suscripciones push"
ON public.push_subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus suscripciones push
CREATE POLICY "Los usuarios pueden eliminar sus suscripciones push"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Acceso total para administradores y service_role (usado por backend para enviar notificaciones)
CREATE POLICY "Acceso total para service_role y administradores en push_subscriptions"
ON public.push_subscriptions
FOR ALL
USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' OR
    coalesce(auth.jwt() -> 'raw_user_meta_data' ->> 'role', '') = 'admin' OR
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

-- 5. Comentarios de documentación en la base de datos
COMMENT ON TABLE public.push_subscriptions IS 'Almacena suscripciones Push Web VAPID para notificaciones a administradores y clientes';
COMMENT ON COLUMN public.push_subscriptions.subscription IS 'Objeto JSON completo de PushSubscription generado por el navegador';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'URL única del endpoint de entrega de la notificación en el servicio push del navegador';
