-- ==============================================================================
-- 📁 MIGRACIÓN: create_configuracion_y_usuarios.sql
-- 📅 FECHA: 2026-08-28
-- 📌 OBJETIVO:
--    1. Crear tabla `configuracion_sitio` (Logo, Octubre Rosa, Banners, Favicon)
--    2. Crear tabla `usuarios` (Administradores, operadores, roles y avatares)
--    3. Asegurar columnas `avatar_url` y `foto_url` en la tabla `clientes`
-- ==============================================================================

-- 1. Tabla de Configuración Global del Sitio
CREATE TABLE IF NOT EXISTS public.configuracion_sitio (
    id INTEGER PRIMARY KEY DEFAULT 1,
    nombre_tienda TEXT NOT NULL DEFAULT 'PanFree',
    logo_url TEXT,
    logo_rosa_url TEXT,
    usar_logo_rosa BOOLEAN NOT NULL DEFAULT false,
    logo_variantes JSONB DEFAULT '[]'::jsonb,
    logo_variante_activa TEXT DEFAULT NULL,
    banner_url TEXT,
    banner_titulo TEXT DEFAULT 'Panificados y Repostería 100% Sin Gluten',
    banner_subtitulo TEXT DEFAULT 'Elaborados artesanalmente en Encarnación con ingredientes certificados.',
    banner_link TEXT DEFAULT '#catalogo',
    favicon_url TEXT,
    telefono_whatsapp TEXT DEFAULT '+595984589845',
    instagram_handle TEXT DEFAULT '@panfree.py',
    direccion_fisica TEXT DEFAULT 'Encarnación, Itapúa, Paraguay',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar fila inicial por defecto si no existe
INSERT INTO public.configuracion_sitio (id, nombre_tienda, usar_logo_rosa)
VALUES (1, 'PanFree', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla de Usuarios del Sistema (Admin / Staff / Operadores)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    foto_url TEXT,
    rol TEXT NOT NULL DEFAULT 'operador' CHECK (rol IN ('admin', 'operador', 'repartidor', 'marketing')),
    telefono TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Columnas de Avatar y Foto en tabla Clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'cliente';

-- 4. Habilitar RLS en configuracion_sitio y usuarios
ALTER TABLE public.configuracion_sitio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Seguridad (RLS)
-- Lectura pública para la configuración del sitio (necesario para el header/banners)
CREATE POLICY "Lectura publica de configuracion_sitio" 
ON public.configuracion_sitio 
FOR SELECT 
USING (true);

-- Modificación de configuración solo para administradores
CREATE POLICY "Admin update configuracion_sitio" 
ON public.configuracion_sitio 
FOR ALL 
USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' OR
    coalesce(auth.jwt() -> 'raw_user_meta_data' ->> 'role', '') = 'admin' OR
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

-- Lectura de usuarios para autenticados o admin
CREATE POLICY "Lectura de usuarios auth_o_admin" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Gestión total de usuarios para administradores
CREATE POLICY "Admin total usuarios" 
ON public.usuarios 
FOR ALL 
USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' OR
    coalesce(auth.jwt() -> 'raw_user_meta_data' ->> 'role', '') = 'admin' OR
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);
