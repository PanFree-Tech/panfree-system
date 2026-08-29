-- ==============================================================================
-- 📁 MIGRACIÓN: fix_security_vulnerabilities.sql
-- 📌 OBJETIVO: Corregir vulnerabilidades RLS sin afectar la tienda online.
-- ==============================================================================

-- 1. instagram_posts: Habilitar RLS, lectura pública y escritura solo admin
ALTER TABLE IF EXISTS public.instagram_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura de instagram_posts" ON public.instagram_posts;
DROP POLICY IF EXISTS "Permitir gestión de instagram_posts" ON public.instagram_posts;
DROP POLICY IF EXISTS "Lectura pública de instagram_posts" ON public.instagram_posts;
DROP POLICY IF EXISTS "Admin gestión instagram_posts" ON public.instagram_posts;

CREATE POLICY "Lectura pública de instagram_posts"
ON public.instagram_posts FOR SELECT USING (true);

CREATE POLICY "Admin gestión instagram_posts"
ON public.instagram_posts FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 2. codigos_dipticos: Acceso restringido SOLO a admin o service_role
ALTER TABLE IF EXISTS public.codigos_dipticos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura de códigos para canje" ON public.codigos_dipticos;
DROP POLICY IF EXISTS "Actualización de código al canjear" ON public.codigos_dipticos;
DROP POLICY IF EXISTS "Admin gestiona códigos" ON public.codigos_dipticos;
DROP POLICY IF EXISTS "Admin y service_role acceso codigos_dipticos" ON public.codigos_dipticos;

CREATE POLICY "Admin y service_role acceso codigos_dipticos"
ON public.codigos_dipticos FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 3. Marketing Inteligente (reglas_promocion, eventos_calendario, promociones_historico)
ALTER TABLE IF EXISTS public.reglas_promocion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.promociones_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de reglas" ON public.reglas_promocion;
DROP POLICY IF EXISTS "Permitir gestión de reglas para admin" ON public.reglas_promocion;
DROP POLICY IF EXISTS "Lectura pública de reglas activas" ON public.reglas_promocion;
DROP POLICY IF EXISTS "Admin gestión reglas_promocion" ON public.reglas_promocion;

CREATE POLICY "Lectura pública de reglas activas"
ON public.reglas_promocion FOR SELECT
USING (activo = true OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admin gestión reglas_promocion"
ON public.reglas_promocion FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Permitir lectura de eventos" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Permitir gestión de eventos para admin" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Lectura pública de eventos activos" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Admin gestión eventos_calendario" ON public.eventos_calendario;

CREATE POLICY "Lectura pública de eventos activos"
ON public.eventos_calendario FOR SELECT
USING (activo = true OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Admin gestión eventos_calendario"
ON public.eventos_calendario FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Permitir lectura de historico" ON public.promociones_historico;
DROP POLICY IF EXISTS "Permitir gestión de historico para admin" ON public.promociones_historico;
DROP POLICY IF EXISTS "Admin gestión promociones_historico" ON public.promociones_historico;

CREATE POLICY "Admin gestión promociones_historico"
ON public.promociones_historico FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4. Tablas ERP (insumos, proveedores, compras, recetas, maquinarias, costos_fijos_mensuales)
ALTER TABLE IF EXISTS public.insumos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP insumos" ON public.insumos;
CREATE POLICY "Admin ERP insumos" ON public.insumos FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP proveedores" ON public.proveedores;
CREATE POLICY "Admin ERP proveedores" ON public.proveedores FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.compras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP compras" ON public.compras;
CREATE POLICY "Admin ERP compras" ON public.compras FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.detalle_compra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP detalle_compra" ON public.detalle_compra;
CREATE POLICY "Admin ERP detalle_compra" ON public.detalle_compra FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.recetas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP recetas" ON public.recetas;
CREATE POLICY "Admin ERP recetas" ON public.recetas FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.recetas_lineas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP recetas_lineas" ON public.recetas_lineas;
CREATE POLICY "Admin ERP recetas_lineas" ON public.recetas_lineas FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.produccion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP produccion" ON public.produccion;
CREATE POLICY "Admin ERP produccion" ON public.produccion FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.detalle_produccion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP detalle_produccion" ON public.detalle_produccion;
CREATE POLICY "Admin ERP detalle_produccion" ON public.detalle_produccion FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.maquinarias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP maquinarias" ON public.maquinarias;
CREATE POLICY "Admin ERP maquinarias" ON public.maquinarias FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.costos_fijos_mensuales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin ERP costos_fijos_mensuales" ON public.costos_fijos_mensuales;
CREATE POLICY "Admin ERP costos_fijos_mensuales" ON public.costos_fijos_mensuales FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 5. Logs y Usuarios Administrativos (email_logs, logs_auditoria, usuarios)
ALTER TABLE IF EXISTS public.email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin and Service Role full access on email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admin email_logs" ON public.email_logs;
CREATE POLICY "Admin email_logs" ON public.email_logs FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.logs_auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_logs" ON public.logs_auditoria;
DROP POLICY IF EXISTS "admin_insert_logs" ON public.logs_auditoria;
DROP POLICY IF EXISTS "Admin logs_auditoria" ON public.logs_auditoria;
CREATE POLICY "Admin logs_auditoria" ON public.logs_auditoria FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura de usuarios auth_o_admin" ON public.usuarios;
DROP POLICY IF EXISTS "Admin total usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admin usuarios" ON public.usuarios;
CREATE POLICY "Admin usuarios" ON public.usuarios FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');
