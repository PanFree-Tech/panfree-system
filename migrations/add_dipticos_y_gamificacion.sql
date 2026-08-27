-- ==============================================================================
-- 📁 MIGRACIÓN: add_dipticos_y_gamificacion.sql
-- 📌 DESCRIPCIÓN: Tablas, funciones, triggers y RLS para el Sistema de Dípticos,
--    Códigos QR, Gamificación y Fidelización de PanFree.
-- ==============================================================================

-- 1. Tabla de códigos de dípticos (6 caracteres alfanuméricos)
CREATE TABLE IF NOT EXISTS public.codigos_dipticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    lote_id TEXT,
    canjeado BOOLEAN NOT NULL DEFAULT false,
    canjeado_por UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    canjeado_en TIMESTAMPTZ,
    fecha_expiracion TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '365 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_codigos_dipticos_codigo ON public.codigos_dipticos (codigo);
CREATE INDEX IF NOT EXISTS idx_codigos_dipticos_canjeado ON public.codigos_dipticos (canjeado);
CREATE INDEX IF NOT EXISTS idx_codigos_dipticos_lote ON public.codigos_dipticos (lote_id);

-- 2. Tabla de canjes de dípticos
CREATE TABLE IF NOT EXISTS public.canjes_dipticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_id UUID NOT NULL REFERENCES public.codigos_dipticos(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    puntos_ganados INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canjes_dipticos_cliente ON public.canjes_dipticos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_canjes_dipticos_codigo ON public.canjes_dipticos (codigo_id);

-- 3. Tabla de premios canjeables
CREATE TABLE IF NOT EXISTS public.premios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    costo_puntos INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('descuento', 'producto_gratis', 'delivery_gratis')),
    valor TEXT,
    stock INTEGER NOT NULL DEFAULT 999,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de canjes de premios
CREATE TABLE IF NOT EXISTS public.canjes_premios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    premio_id UUID NOT NULL REFERENCES public.premios(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    puntos_gastados INTEGER NOT NULL,
    cupon_generado TEXT,
    estado TEXT NOT NULL DEFAULT 'completado' CHECK (estado IN ('pendiente', 'completado', 'cancelado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canjes_premios_cliente ON public.canjes_premios (cliente_id);

-- 5. Insertar premios por defecto si no existen
INSERT INTO public.premios (nombre, descripcion, costo_puntos, tipo, valor, stock, activo)
SELECT '10% OFF', '10% de descuento en tu próxima compra online', 200, 'descuento', '10', 999, true
WHERE NOT EXISTS (SELECT 1 FROM public.premios WHERE nombre = '10% OFF');

INSERT INTO public.premios (nombre, descripcion, costo_puntos, tipo, valor, stock, activo)
SELECT 'Pan de Molde Gratis', 'Pan de molde clásico artesanal sin gluten totalmente gratis', 500, 'producto_gratis', 'Pan de Molde', 999, true
WHERE NOT EXISTS (SELECT 1 FROM public.premios WHERE nombre = 'Pan de Molde Gratis');

INSERT INTO public.premios (nombre, descripcion, costo_puntos, tipo, valor, stock, activo)
SELECT 'Delivery Gratis', 'Envío gratis en tu próxima compra en Gran Encarnación', 100, 'delivery_gratis', '0', 999, true
WHERE NOT EXISTS (SELECT 1 FROM public.premios WHERE nombre = 'Delivery Gratis');

INSERT INTO public.premios (nombre, descripcion, costo_puntos, tipo, valor, stock, activo)
SELECT '20% OFF VIP', '20% de descuento exclusivo en compras mayores a ₲ 100.000', 800, 'descuento', '20', 999, true
WHERE NOT EXISTS (SELECT 1 FROM public.premios WHERE nombre = '20% OFF VIP');

-- 6. Función para generar código de 6 caracteres alfanuméricos
CREATE OR REPLACE FUNCTION generar_codigo_diptico()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluye I, O, 0, 1 para evitar confusiones de lectura
    codigo TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        codigo := codigo || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para generar código único comprobando colisiones
CREATE OR REPLACE FUNCTION generar_codigo_diptico_unico()
RETURNS TEXT AS $$
DECLARE
    nuevo_codigo TEXT;
    existe BOOLEAN;
BEGIN
    LOOP
        nuevo_codigo := generar_codigo_diptico();
        SELECT EXISTS(SELECT 1 FROM public.codigos_dipticos WHERE codigo = nuevo_codigo) INTO existe;
        EXIT WHEN NOT existe;
    END LOOP;
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger y Función: sumar puntos al canjear y actualizar nivel
CREATE OR REPLACE FUNCTION sumar_puntos_diptico()
RETURNS TRIGGER AS $$
DECLARE
    pts_actuales INTEGER;
    nuevo_nivel TEXT;
BEGIN
    UPDATE public.clientes 
    SET puntos_fidelidad = COALESCE(puntos_fidelidad, 0) + NEW.puntos_ganados,
        updated_at = NOW()
    WHERE id = NEW.cliente_id
    RETURNING puntos_fidelidad INTO pts_actuales;

    -- Recalcular nivel de cliente
    IF pts_actuales >= 1000 THEN
        nuevo_nivel := 'vip';
    ELSIF pts_actuales >= 500 THEN
        nuevo_nivel := 'oro';
    ELSIF pts_actuales >= 200 THEN
        nuevo_nivel := 'plata';
    ELSE
        nuevo_nivel := 'bronce';
    END IF;

    UPDATE public.clientes
    SET nivel_cliente = nuevo_nivel
    WHERE id = NEW.cliente_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sumar_puntos_diptico ON public.canjes_dipticos;
CREATE TRIGGER trigger_sumar_puntos_diptico
AFTER INSERT ON public.canjes_dipticos
FOR EACH ROW
EXECUTE FUNCTION sumar_puntos_diptico();

-- 9. Políticas de Seguridad RLS
ALTER TABLE public.codigos_dipticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canjes_dipticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canjes_premios ENABLE ROW LEVEL SECURITY;

-- Políticas codigos_dipticos
DROP POLICY IF EXISTS "Lectura de códigos para canje" ON public.codigos_dipticos;
CREATE POLICY "Lectura de códigos para canje" ON public.codigos_dipticos
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Actualización de código al canjear" ON public.codigos_dipticos;
CREATE POLICY "Actualización de código al canjear" ON public.codigos_dipticos
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin gestiona códigos" ON public.codigos_dipticos;
CREATE POLICY "Admin gestiona códigos" ON public.codigos_dipticos
FOR ALL USING (auth.role() = 'authenticated');

-- Políticas canjes_dipticos
DROP POLICY IF EXISTS "Clientes ven sus canjes" ON public.canjes_dipticos;
CREATE POLICY "Clientes ven sus canjes" ON public.canjes_dipticos
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar canjes" ON public.canjes_dipticos;
CREATE POLICY "Insertar canjes" ON public.canjes_dipticos
FOR INSERT WITH CHECK (true);

-- Políticas premios
DROP POLICY IF EXISTS "Premios visibles para todos" ON public.premios;
CREATE POLICY "Premios visibles para todos" ON public.premios
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin gestiona premios" ON public.premios;
CREATE POLICY "Admin gestiona premios" ON public.premios
FOR ALL USING (auth.role() = 'authenticated');

-- Políticas canjes_premios
DROP POLICY IF EXISTS "Clientes ven sus canjes de premios" ON public.canjes_premios;
CREATE POLICY "Clientes ven sus canjes de premios" ON public.canjes_premios
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar canje de premio" ON public.canjes_premios;
CREATE POLICY "Insertar canje de premio" ON public.canjes_premios
FOR INSERT WITH CHECK (true);
