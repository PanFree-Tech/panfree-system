-- ==============================================================================
-- 📁 UBICACIÓN: migrations/create_marketing_smart_tables.sql
-- 📌 SISTEMA DE MARKETING INTELIGENTE - PANFREE
-- 📅 FECHA: 2026-08-20
-- 📖 DESCRIPCIÓN: DDL completo para reglas de promoción, calendario de eventos,
--    historial de promociones inteligentes y registro de publicaciones.
-- ==============================================================================

-- 1. TABLA: reglas_promocion
CREATE TABLE IF NOT EXISTS public.reglas_promocion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    condicion JSONB NOT NULL DEFAULT '{}'::jsonb,
    tipo_costo TEXT CHECK (tipo_costo IN ('competitivo', 'objetivo', 'premium')) DEFAULT 'competitivo',
    descuento_min INTEGER NOT NULL DEFAULT 5,
    descuento_max INTEGER NOT NULL DEFAULT 20,
    prioridad INTEGER NOT NULL DEFAULT 1,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: eventos_calendario
CREATE TABLE IF NOT EXISTS public.eventos_calendario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    categoria TEXT DEFAULT 'festividad',
    productos_relacionados TEXT[] DEFAULT '{}',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: promociones_historico
CREATE TABLE IF NOT EXISTS public.promociones_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    regla_id UUID REFERENCES public.reglas_promocion(id) ON DELETE SET NULL,
    descuento_aplicado INTEGER NOT NULL DEFAULT 0,
    precio_final NUMERIC(12, 2) NOT NULL DEFAULT 0,
    captions_generados JSONB DEFAULT '{}'::jsonb,
    imagen_url TEXT,
    post_id TEXT,
    publicada BOOLEAN NOT NULL DEFAULT false,
    fecha_programada TIMESTAMPTZ,
    fecha_publicacion TIMESTAMPTZ,
    engagement INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA ADICIONAL: instagram_posts (Historial de publicaciones directas)
CREATE TABLE IF NOT EXISTS public.instagram_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    caption TEXT NOT NULL,
    post_id TEXT,
    post_url TEXT,
    format TEXT DEFAULT 'feed_4_5',
    status TEXT DEFAULT 'publicado',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ÍNDICES PARA ALTO RENDIMIENTO ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reglas_activo_prioridad ON public.reglas_promocion (activo, prioridad DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_fechas ON public.eventos_calendario (fecha_inicio, fecha_fin, activo);
CREATE INDEX IF NOT EXISTS idx_promociones_producto ON public.promociones_historico (producto_id);
CREATE INDEX IF NOT EXISTS idx_promociones_fecha ON public.promociones_historico (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promociones_publicada ON public.promociones_historico (publicada, fecha_programada);

-- ─── TRIGGER: Auto-actualizar updated_at en reglas_promocion ──────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_reglas_promocion_updated_at ON public.reglas_promocion;
CREATE TRIGGER trg_reglas_promocion_updated_at
    BEFORE UPDATE ON public.reglas_promocion
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_column();

-- ─── POLÍTICAS DE SEGURIDAD RLS (Row Level Security) ─────────────────────────
ALTER TABLE public.reglas_promocion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promociones_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

-- Lectura para usuarios autenticados / anónimos según sea necesario en la app
CREATE POLICY "Permitir lectura de reglas" ON public.reglas_promocion FOR SELECT USING (true);
CREATE POLICY "Permitir gestión de reglas para admin" ON public.reglas_promocion FOR ALL USING (true);

CREATE POLICY "Permitir lectura de eventos" ON public.eventos_calendario FOR SELECT USING (true);
CREATE POLICY "Permitir gestión de eventos para admin" ON public.eventos_calendario FOR ALL USING (true);

CREATE POLICY "Permitir lectura de historico" ON public.promociones_historico FOR SELECT USING (true);
CREATE POLICY "Permitir gestión de historico para admin" ON public.promociones_historico FOR ALL USING (true);

CREATE POLICY "Permitir lectura de instagram_posts" ON public.instagram_posts FOR SELECT USING (true);
CREATE POLICY "Permitir gestión de instagram_posts" ON public.instagram_posts FOR ALL USING (true);

-- ─── SEMILLAS DE DATOS INICIALES (SEEDS) ─────────────────────────────────────

-- 1. Reglas de Promoción Inteligentes
INSERT INTO public.reglas_promocion (nombre, descripcion, condicion, tipo_costo, descuento_min, descuento_max, prioridad, activo)
VALUES
(
    'Impulso por Festividad o Evento',
    'Aplica cuando hay un evento en el calendario activo con productos relacionados',
    '{"tipo": "evento_calendario", "dias_antelacion": 7, "requiere_evento_activo": true}'::jsonb,
    'competitivo',
    10,
    15,
    10,
    true
),
(
    'Promoción de Exceso de Stock / Inventario',
    'Aplica descuento cuando el inventario supera el umbral de seguridad de 30 unidades',
    '{"tipo": "stock", "operador": ">=", "umbral": 30}'::jsonb,
    'competitivo',
    15,
    20,
    8,
    true
),
(
    'Fidelización Fin de Semana',
    'Descuento especial los viernes y sábados para pedidos anticipados de panificados familiares',
    '{"tipo": "dia_semana", "dias": ["Friday", "Saturday"], "categoria": "Panificados"}'::jsonb,
    'objetivo',
    10,
    15,
    5,
    true
),
(
    'Producto Estrella Premium (Sin Descuento / Valor Añadido)',
    'Promoción orientada a calidad artesanal sin sacrificar margen para productos destacados',
    '{"tipo": "producto_estrella", "destacado": true}'::jsonb,
    'premium',
    0,
    5,
    3,
    true
)
ON CONFLICT DO NOTHING;

-- 2. Eventos del Calendario Típicos de Panadería y Gastronomía Sin Gluten
INSERT INTO public.eventos_calendario (nombre, fecha_inicio, fecha_fin, categoria, productos_relacionados, activo)
VALUES
(
    'Semana Santa',
    '2026-03-29',
    '2026-04-05',
    'festividad',
    ARRAY['Chipa Tradicional Sin Gluten', 'Chipa Pirí', 'Rosca de Pascua Sin TACC'],
    true
),
(
    'Día Internacional del Celíaco',
    '2026-05-01',
    '2026-05-07',
    'salud',
    ARRAY['Pan de Campo Sin Gluten', 'Bizcochuelo Vainilla', 'Masa para Tarta Sin TACC'],
    true
),
(
    'Día de la Madre',
    '2026-05-10',
    '2026-05-16',
    'familiar',
    ARRAY['Torta Artesanal de Frutilla', 'Alfajores de Maicena', 'Brownie Sin Gluten'],
    true
),
(
    'Fiestas de San Juan',
    '2026-06-20',
    '2026-06-26',
    'tradicional',
    ARRAY['Chipa Asador Sin TACC', 'Mbeju Tradicional', 'Pastel Mandi''o'],
    true
),
(
    'Primavera & Desayunos Saludables',
    '2026-09-18',
    '2026-09-25',
    'estacion',
    ARRAY['Pan Lactal Multisemillas', 'Muffins de Arándanos', 'Pan Integral Sin TACC'],
    true
)
ON CONFLICT DO NOTHING;
