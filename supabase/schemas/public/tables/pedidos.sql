-- ============================================================
-- Tabla: public.pedidos
-- Ultima actualizacion: 2026-10-13
-- ============================================================

CREATE TABLE public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero_pedido text NOT NULL,
  cliente_id uuid NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente'::text,
  metodo_entrega text NOT NULL,
  entrega_direccion text,
  entrega_lat numeric(10,8),
  entrega_lng numeric(11,8),
  entrega_distancia_km numeric(6,2),
  entrega_costo numeric(10,2) DEFAULT 0,
  entrega_instrucciones text,
  fecha_pedido timestamp with time zone DEFAULT now(),
  fecha_entrega_estimada timestamp with time zone,
  fecha_entrega_real timestamp with time zone,
  subtotal numeric(12,0) NOT NULL DEFAULT 0,
  descuento numeric(12,0) DEFAULT 0,
  total_final numeric(12,0) NOT NULL DEFAULT 0,
  estado_pago text DEFAULT 'pendiente'::text,
  mp_payment_id text,
  mp_transaction_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  creado_por uuid,
  metodo_pago text DEFAULT 'efectivo'::text,
  fecha_entrega_solicitada date,
  es_pedido_anticipado boolean NOT NULL DEFAULT false,
  cupon_codigo text,
  descuento_monto numeric(12,2) DEFAULT 0,
  puntos_ganados integer DEFAULT 0,
  puntos_usados integer DEFAULT 0,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

-- RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Politicas
-- (Actualizadas en F1-02: DROP de "pedidos_public_insert")

-- Admin: acceso total
CREATE POLICY "Admin full access pedidos" ON public.pedidos
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- INSERT: cliente autenticado (valida cliente_id)
CREATE POLICY pedidos_insertar_cliente ON public.pedidos
  FOR INSERT TO authenticated
  WITH CHECK (
    cliente_id IN (
      SELECT clientes.id FROM public.clientes
      WHERE clientes.user_id = auth.uid()
    )
    OR ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text
  );

-- INSERT: invitado anonimo (cliente sin user_id)
CREATE POLICY pedidos_invitado_insert ON public.pedidos
  FOR INSERT TO anon
  WITH CHECK (
    cliente_id IN (
      SELECT clientes.id FROM public.clientes
      WHERE clientes.user_id IS NULL
    )
  );

-- SELECT: admin o dueño
CREATE POLICY pedidos_lectura ON public.pedidos
  FOR SELECT TO public
  USING (
    ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text
    OR (
      auth.uid() IS NOT NULL
      AND cliente_id IN (
        SELECT clientes.id FROM public.clientes
        WHERE clientes.user_id = auth.uid()
      )
    )
  );

-- UPDATE: admin o dueño
CREATE POLICY pedidos_update_admin ON public.pedidos
  FOR UPDATE TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text
    OR cliente_id IN (
      SELECT clientes.id FROM public.clientes
      WHERE clientes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text
    OR cliente_id IN (
      SELECT clientes.id FROM public.clientes
      WHERE clientes.user_id = auth.uid()
    )
  );

-- DELETE: solo admin
CREATE POLICY pedidos_delete_admin ON public.pedidos
  FOR DELETE TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- NOTA F1-02: se elimino "pedidos_public_insert" (WITH CHECK true).
-- Cubierta por pedidos_insertar_cliente + pedidos_invitado_insert.