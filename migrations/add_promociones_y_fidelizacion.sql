-- ==============================================================================
-- 📁 MIGRACIÓN: add_promociones_y_fidelizacion.sql
-- ==============================================================================

-- 1. Agregar soporte de oferta en productos
ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS en_promocion BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS precio_promocion NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS fecha_inicio_promo TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fecha_fin_promo TIMESTAMPTZ;

-- 2. Agregar campos de fidelización en clientes
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS puntos_fidelidad INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS nivel_cliente TEXT NOT NULL DEFAULT 'bronce' 
  CHECK (nivel_cliente IN ('bronce', 'plata', 'oro', 'vip'));

-- 3. Agregar soporte de descuentos en pedidos
ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS cupon_codigo TEXT,
ADD COLUMN IF NOT EXISTS descuento_monto NUMERIC(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS puntos_ganados INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS puntos_usados INTEGER NOT NULL DEFAULT 0;

-- 4. Crear tabla de Cupones
CREATE TABLE IF NOT EXISTS public.cupones_descuento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    tipo_descuento TEXT NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
    valor_descuento NUMERIC(12, 2) NOT NULL,
    monto_minimo_compra NUMERIC(12, 2) NOT NULL DEFAULT 0,
    limite_usos_total INTEGER,
    usos_actuales INTEGER NOT NULL DEFAULT 0,
    limite_por_cliente INTEGER NOT NULL DEFAULT 1,
    fecha_expiracion TIMESTAMPTZ,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Crear tabla de Uso de Cupones
CREATE TABLE IF NOT EXISTS public.cupones_canjeados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cupon_id UUID NOT NULL REFERENCES public.cupones_descuento(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
    descuento_obtenido NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RLS en nuevas tablas
ALTER TABLE public.cupones_descuento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupones_canjeados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de cupones activos" ON public.cupones_descuento
FOR SELECT USING (activo = true);

CREATE POLICY "Gestión total de cupones para admin" ON public.cupones_descuento
FOR ALL USING (auth.is_admin());

CREATE POLICY "Lectura de canjes propios o admin" ON public.cupones_canjeados
FOR SELECT USING (auth.is_admin() OR cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

CREATE POLICY "Insertar canje desde checkout" ON public.cupones_canjeados
FOR INSERT WITH CHECK (true);
