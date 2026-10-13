-- ============================================================
-- Tabla: public.canjes_premios
-- Ultima actualizacion: 2026-10-13
-- ============================================================

CREATE TABLE public.canjes_premios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  premio_id uuid,
  puntos_gastados integer NOT NULL DEFAULT 0,
  cupon_generado text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.canjes_premios ENABLE ROW LEVEL SECURITY;

-- Politicas
-- (Actualizadas en F1-02: reemplazado USING (true) por is_admin())

DROP POLICY IF EXISTS "Admin puede actualizar canjes" ON public.canjes_premios;
CREATE POLICY "Admin puede actualizar canjes" ON public.canjes_premios
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin puede eliminar canjes" ON public.canjes_premios;
CREATE POLICY "Admin puede eliminar canjes" ON public.canjes_premios
  FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin puede ver todos los canjes" ON public.canjes_premios
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.user_id = auth.uid()
        AND clientes.role = 'admin'::text
    )
  );

CREATE POLICY "Usuarios pueden crear sus propios canjes" ON public.canjes_premios
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Usuarios pueden ver sus propios canjes" ON public.canjes_premios
  FOR SELECT
  TO public
  USING (auth.uid() = cliente_id);