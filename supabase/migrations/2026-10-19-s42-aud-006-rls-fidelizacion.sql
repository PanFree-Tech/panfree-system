-- ============================================================================
-- AUD-006: Corregir RLS de fidelizacion + RPCs atomicos
-- Fecha: 2026-10-19
-- Aplicada manualmente en Supabase SQL Editor (2026-10-19)
-- ============================================================================

-- 1. Agregar columna puntos_ganados a codigos_dipticos (configurable)
ALTER TABLE public.codigos_dipticos
  ADD COLUMN IF NOT EXISTS puntos_ganados integer NOT NULL DEFAULT 100;

-- 2. Eliminar politica USING(true) de codigos_dipticos (permite enumeracion)
DROP POLICY IF EXISTS "Lectura publica de codigos dipticos" ON public.codigos_dipticos;

-- 3. Corregir bug de canjes_premios SELECT (compara auth.uid() con cliente_id)
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios canjes" ON public.canjes_premios;
CREATE POLICY "Usuarios pueden ver sus propios canjes"
ON public.canjes_premios
FOR SELECT
TO authenticated
USING (
  cliente_id IN (SELECT id FROM public.clientes WHERE user_id = (SELECT auth.uid()))
);

-- 4. Corregir bug de canjes_premios INSERT (mismo problema)
DROP POLICY IF EXISTS "Usuarios pueden crear sus propios canjes" ON public.canjes_premios;
CREATE POLICY "Usuarios pueden crear sus propios canjes"
ON public.canjes_premios
FOR INSERT
TO authenticated
WITH CHECK (
  cliente_id IN (SELECT id FROM public.clientes WHERE user_id = (SELECT auth.uid()))
);

-- 5. RPC validar_codigo_diptico (reemplaza SELECT USING(true))
CREATE OR REPLACE FUNCTION public.validar_codigo_diptico(p_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_codigo record;
BEGIN
  SELECT id, codigo, canjeado, canjeado_en, fecha_expiracion, puntos_ganados
  INTO v_codigo
  FROM public.codigos_dipticos
  WHERE codigo = upper(trim(p_codigo));

  IF v_codigo IS NULL THEN
    RETURN jsonb_build_object('valido', false, 'mensaje', 'El codigo no existe');
  END IF;

  IF v_codigo.canjeado THEN
    RETURN jsonb_build_object('valido', false, 'mensaje', 'Este codigo ya fue canjeado');
  END IF;

  IF v_codigo.fecha_expiracion IS NOT NULL AND now() > v_codigo.fecha_expiracion THEN
    RETURN jsonb_build_object('valido', false, 'mensaje', 'Este codigo ha expirado');
  END IF;

  RETURN jsonb_build_object(
    'valido', true,
    'codigo_id', v_codigo.id,
    'puntos_ganados', v_codigo.puntos_ganados
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validar_codigo_diptico(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.validar_codigo_diptico(text) TO authenticated;

-- 6. RPC canjear_diptico (atomico, reemplaza el flujo manual)
CREATE OR REPLACE FUNCTION public.canjear_diptico(p_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_codigo_id uuid;
  v_cliente_id uuid;
  v_puntos integer;
  v_puntos_ganados integer;
  v_nuevo_nivel text;
  v_user_id uuid := (SELECT auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT id INTO v_cliente_id FROM public.clientes WHERE user_id = v_user_id;
  IF v_cliente_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cliente no encontrado');
  END IF;

  SELECT id, puntos_ganados INTO v_codigo_id, v_puntos_ganados
  FROM public.codigos_dipticos
  WHERE codigo = upper(trim(p_codigo)) AND canjeado = false
  FOR UPDATE;

  IF v_codigo_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Codigo invalido o ya canjeado');
  END IF;

  UPDATE public.codigos_dipticos
  SET canjeado = true, canjeado_por = v_cliente_id, canjeado_en = now()
  WHERE id = v_codigo_id;

  INSERT INTO public.canjes_dipticos (codigo_id, cliente_id, puntos_ganados)
  VALUES (v_codigo_id, v_cliente_id, v_puntos_ganados);

  SELECT puntos_fidelidad INTO v_puntos FROM public.clientes WHERE id = v_cliente_id;
  IF v_puntos >= 1000 THEN v_nuevo_nivel := 'vip';
  ELSIF v_puntos >= 500 THEN v_nuevo_nivel := 'oro';
  ELSIF v_puntos >= 200 THEN v_nuevo_nivel := 'plata';
  ELSE v_nuevo_nivel := 'bronce';
  END IF;

  UPDATE public.clientes
  SET nivel_cliente = v_nuevo_nivel, updated_at = now()
  WHERE id = v_cliente_id;

  RETURN jsonb_build_object(
    'success', true,
    'puntos_ganados', v_puntos_ganados,
    'nuevo_nivel', v_nuevo_nivel,
    'puntos_totales', v_puntos
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.canjear_diptico(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.canjear_diptico(text) TO authenticated;

-- 7. RPC canjear_premio (atomico)
CREATE OR REPLACE FUNCTION public.canjear_premio(p_premio_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cliente_id uuid;
  v_premio record;
  v_puntos_actuales integer;
  v_nuevo_nivel text;
  v_cupon text;
  v_user_id uuid := (SELECT auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT id INTO v_cliente_id FROM public.clientes WHERE user_id = v_user_id;
  IF v_cliente_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cliente no encontrado');
  END IF;

  SELECT * INTO v_premio
  FROM public.premios
  WHERE id = p_premio_id AND activo = true AND stock > 0
  FOR UPDATE;

  IF v_premio IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Premio no disponible');
  END IF;

  SELECT puntos_fidelidad INTO v_puntos_actuales
  FROM public.clientes
  WHERE id = v_cliente_id
  FOR UPDATE;

  IF v_puntos_actuales < v_premio.costo_puntos THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Puntos insuficientes. Necesitas %s y tienes %s', v_premio.costo_puntos, v_puntos_actuales)
    );
  END IF;

  v_cupon := 'CANJE-' || upper(substr(v_premio.tipo, 1, 3)) || '-' || substr(md5(random()::text), 1, 6);

  INSERT INTO public.canjes_premios (premio_id, cliente_id, puntos_gastados, cupon_generado, estado)
  VALUES (p_premio_id, v_cliente_id, v_premio.costo_puntos, v_cupon, 'completado');

  UPDATE public.clientes
  SET puntos_fidelidad = puntos_fidelidad - v_premio.costo_puntos,
      updated_at = now()
  WHERE id = v_cliente_id
  RETURNING puntos_fidelidad INTO v_puntos_actuales;

  IF v_puntos_actuales >= 1000 THEN v_nuevo_nivel := 'vip';
  ELSIF v_puntos_actuales >= 500 THEN v_nuevo_nivel := 'oro';
  ELSIF v_puntos_actuales >= 200 THEN v_nuevo_nivel := 'plata';
  ELSE v_nuevo_nivel := 'bronce';
  END IF;

  UPDATE public.clientes SET nivel_cliente = v_nuevo_nivel WHERE id = v_cliente_id;

  UPDATE public.premios SET stock = stock - 1 WHERE id = p_premio_id;

  IF v_premio.tipo IN ('descuento', 'delivery_gratis') THEN
    INSERT INTO public.cupones_descuento (codigo, descripcion, tipo_descuento, valor_descuento, monto_minimo_compra, limite_usos_total, usos_actuales, limite_por_cliente, activo)
    VALUES (
      v_cupon,
      'Premio canjeado: ' || v_premio.nombre,
      CASE WHEN v_premio.tipo = 'descuento' AND (v_premio.valor)::int <= 100 THEN 'porcentaje' ELSE 'monto_fijo' END,
      COALESCE((v_premio.valor)::int, 10),
      0, 1, 0, 1, true
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'cupon', v_cupon,
    'puntos_gastados', v_premio.costo_puntos,
    'puntos_restantes', v_puntos_actuales,
    'nuevo_nivel', v_nuevo_nivel,
    'premio_nombre', v_premio.nombre
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.canjear_premio(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.canjear_premio(uuid) TO authenticated;

-- 8. Eliminar trigger para que no duplique puntos (el RPC ya suma)
DROP TRIGGER IF EXISTS trigger_sumar_puntos_diptico ON public.canjes_dipticos;