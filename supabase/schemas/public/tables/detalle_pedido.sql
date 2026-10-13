-- ============================================================
-- Tabla: public.detalle_pedido
-- Ultima actualizacion: 2026-10-13
-- ============================================================

CREATE TABLE public.detalle_pedido (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric(10,2) NOT NULL,
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  subtotal numeric(12,0)
);

-- RLS
ALTER TABLE public.detalle_pedido ENABLE ROW LEVEL SECURITY;

-- Politicas
-- (Actualizadas en F1-02: DROP de "detalle_public_insert")

-- Admin: acceso total
CREATE POLICY "Admin full access detalle_pedido" ON public.detalle_pedido
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- INSERT: cliente autenticado (valida que el pedido sea suyo)
CREATE POLICY detalle_pedido_insertar ON public.detalle_pedido
  FOR INSERT TO authenticated
  WITH CHECK (
    pedido_id IN (
      SELECT pedidos.id FROM public.pedidos
      WHERE pedidos.cliente_id IN (
        SELECT clientes.id FROM public.clientes
        WHERE clientes.user_id = auth.uid()
      )
    )
    OR ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text
  );

-- INSERT: invitado anonimo (pedido de cliente sin user_id)
CREATE POLICY detalle_pedido_invitado_insert ON public.detalle_pedido
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = detalle_pedido.pedido_id
        AND pedidos.cliente_id IN (
          SELECT clientes.id FROM public.clientes
          WHERE clientes.user_id IS NULL
        )
    )
  );

-- SELECT: admin o dueño del pedido
CREATE POLICY detalle_pedido_lectura ON public.detalle_pedido
  FOR SELECT TO public
  USING (
    ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text
    OR pedido_id IN (
      SELECT pedidos.id FROM public.pedidos
      WHERE pedidos.cliente_id IN (
        SELECT clientes.id FROM public.clientes
        WHERE clientes.user_id = auth.uid()
      )
    )
  );

-- NOTA F1-02: se elimino "detalle_public_insert" (WITH CHECK true).
-- Cubierta por detalle_pedido_insertar + detalle_pedido_invitado_insert.