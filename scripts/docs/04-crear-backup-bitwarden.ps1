# 04-crear-backup-bitwarden.ps1
# Genera el archivo de backup estructural para Bitwarden.
# Salida: C:\Users\Admin\backups-panfree\PanFree-Backup-Estructural-2026-10-13.md
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\04-crear-backup-bitwarden.ps1

$ErrorActionPreference = "Stop"

$outDir = "C:\Users\Admin\backups-panfree"
$outFile = Join-Path $outDir "PanFree-Backup-Estructural-2026-10-13.md"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

Write-Host "=== Generando backup estructural para Bitwarden ===" -ForegroundColor Cyan
Write-Host ""

$sb = New-Object System.Text.StringBuilder

function Add-Line { param([string]$t = "") [void]$sb.AppendLine($t) }

# ============== HEADER ==============
Add-Line '# PanFree - Backup Estructural'
Add-Line '**Fecha:** 2026-10-13'
Add-Line '**Proyecto:** PanFree System (gbdrcaumghykiipqgbty)'
Add-Line '**Motivo:** Backup previo al fix F1-02 (RLS Always True). Plan Free de Supabase sin backups automaticos.'
Add-Line '**Ubicacion local:** C:\Users\Admin\backups-panfree\'
Add-Line ''
Add-Line '---'
Add-Line ''

# ============== COMO RESTAURAR ==============
Add-Line '## Como restaurar'
Add-Line ''
Add-Line '### Si solo se rompio una politica RLS:'
Add-Line '1. Abrir Supabase -> SQL Editor'
Add-Line '2. Buscar la politica en la seccion "Politicas RLS" de este documento'
Add-Line '3. Copiar el `CREATE POLICY` y ejecutarlo (con DROP previo si existe)'
Add-Line ''
Add-Line '### Si se corrompio la estructura:'
Add-Line '1. Crear proyecto nuevo en Supabase'
Add-Line '2. Ejecutar todos los `CREATE TABLE` de la seccion "Schema"'
Add-Line '3. Ejecutar todos los `CREATE POLICY` de la seccion "Politicas"'
Add-Line '4. Recrear funciones y triggers (pendientes de documentar)'
Add-Line '5. Migrar los datos desde los CSV exportados'
Add-Line ''
Add-Line '---'
Add-Line ''

# ============== ESTADO ==============
Add-Line '## Estado del backup'
Add-Line ''
Add-Line '| Componente | Respaldado | Ubicacion |'
Add-Line '|---|---|---|'
Add-Line '| Schema (38 tablas) | SI | Este documento (seccion Schema) |'
Add-Line '| Politicas RLS (80+) | SI | Este documento (seccion Politicas) |'
Add-Line '| Funciones SQL | PENDIENTE | - |'
Add-Line '| Triggers | PENDIENTE | - |'
Add-Line '| Datos (filas) | PARCIAL | CSVs en C:\Users\Admin\backups-panfree\ |'
Add-Line ''
Add-Line '---'
Add-Line ''

# ============== SCHEMA ==============
Add-Line '## SCHEMA COMPLETO (38 tablas)'
Add-Line ''
Add-Line '### Comercial / E-commerce'
Add-Line ''

Add-Line '**public.clientes**'
Add-Line '```sql'
Add-Line 'CREATE TABLE public.clientes ('
Add-Line '  id uuid NOT NULL DEFAULT gen_random_uuid(),'
Add-Line '  nombre_completo text NOT NULL,'
Add-Line '  email text NOT NULL,'
Add-Line '  telefono text,'
Add-Line '  direccion_calle text,'
Add-Line '  direccion_numero text,'
Add-Line '  direccion_piso_dept text,'
Add-Line "  direccion_ciudad text DEFAULT 'Encarnacion'::text,"
Add-Line "  direccion_provincia text DEFAULT 'Itapua'::text,"
Add-Line '  direccion_cp text,'
Add-Line '  lat numeric(10,8),'
Add-Line '  lng numeric(11,8),'
Add-Line '  prefiere_retiro boolean DEFAULT false,'
Add-Line '  prefiere_delivery boolean DEFAULT true,'
Add-Line '  notas_cliente text,'
Add-Line '  user_id uuid,'
Add-Line '  is_active boolean DEFAULT true,'
Add-Line '  created_at timestamp with time zone DEFAULT now(),'
Add-Line '  updated_at timestamp with time zone DEFAULT now(),'
Add-Line '  puntos_fidelidad integer DEFAULT 0,'
Add-Line "  nivel_cliente text DEFAULT 'bronce'::text,"
Add-Line '  avatar_url text,'
Add-Line '  foto_url text,'
Add-Line "  role text DEFAULT 'cliente'::text"
Add-Line ');'
Add-Line ''

Add-Line '**public.productos**'
Add-Line '```sql'
Add-Line 'CREATE TABLE public.productos ('
Add-Line '  id uuid NOT NULL DEFAULT gen_random_uuid(),'
Add-Line '  slug text NOT NULL,'
Add-Line '  nombre text NOT NULL,'
Add-Line '  descripcion text,'
Add-Line '  categoria text NOT NULL,'
Add-Line '  precio_venta numeric(12,0) NOT NULL,'
Add-Line '  precio_mayorista numeric(12,0),'
Add-Line '  iva_porcentaje numeric(5,2) DEFAULT 21.00,'
Add-Line '  stock_actual integer DEFAULT 0,'
Add-Line '  stock_minimo integer DEFAULT 5,'
Add-Line "  unidad_medida text DEFAULT 'unidad'::text,"
Add-Line '  imagen_url text,'
Add-Line '  imagen_alt text,'
Add-Line '  is_active boolean DEFAULT true,'
Add-Line '  is_featured boolean DEFAULT false,'
Add-Line '  disponible_delivery boolean DEFAULT true,'
Add-Line '  created_at timestamp with time zone DEFAULT now(),'
Add-Line '  updated_at timestamp with time zone DEFAULT now(),'
Add-Line '  created_by uuid,'
Add-Line '  rendimiento_unidades integer DEFAULT 1,'
Add-Line '  tiempo_prep_min integer DEFAULT 0,'
Add-Line '  tiempo_coccion_min integer DEFAULT 0,'
Add-Line '  tiempo_reposo_min integer DEFAULT 0,'
Add-Line '  temperatura_horno_c integer,'
Add-Line '  notas_produccion text,'
Add-Line "  dificultad text DEFAULT 'media'::text,"
Add-Line '  rendimiento_kg numeric(10,3),'
Add-Line '  peso_promedio_unidad numeric(10,4),'
Add-Line '  requiere_anticipacion boolean NOT NULL DEFAULT false,'
Add-Line "  tags ARRAY NOT NULL DEFAULT '{}'::text[],"
Add-Line "  imagenes_urls ARRAY NOT NULL DEFAULT '{}'::text[],"
Add-Line '  imagen_public_id text,'
Add-Line '  production_capacity integer DEFAULT 10,'
Add-Line '  current_orders integer DEFAULT 0,'
Add-Line '  lead_time integer DEFAULT 24,'
Add-Line '  order_available boolean DEFAULT true,'
Add-Line "  availability_status text DEFAULT 'DISPONIBLE'::text,"
Add-Line '  en_promocion boolean DEFAULT false,'
Add-Line '  precio_promocion numeric(12,2),'
Add-Line '  fecha_inicio_promo timestamp with time zone,'
Add-Line '  fecha_fin_promo timestamp with time zone,'
Add-Line "  motivo_promocion text DEFAULT 'manual'::text,"
Add-Line '  ingredientes text,'
Add-Line '  calorias integer,'
Add-Line '  proteinas numeric(5,2),'
Add-Line '  carbohidratos numeric(5,2),'
Add-Line '  grasas numeric(5,2),'
Add-Line '  fibra numeric(5,2),'
Add-Line '  grasas_saturadas numeric(5,2),'
Add-Line '  sodio numeric(5,2),'
Add-Line '  peso_porcion integer DEFAULT 100'
Add-Line ');'
Add-Line ''

Add-Line '**public.pedidos**'
Add-Line '```sql'
Add-Line 'CREATE TABLE public.pedidos ('
Add-Line '  id uuid NOT NULL DEFAULT gen_random_uuid(),'
Add-Line '  numero_pedido text NOT NULL,'
Add-Line '  cliente_id uuid NOT NULL,'
Add-Line "  estado text NOT NULL DEFAULT 'pendiente'::text,"
Add-Line '  metodo_entrega text NOT NULL,'
Add-Line '  entrega_direccion text,'
Add-Line '  entrega_lat numeric(10,8),'
Add-Line '  entrega_lng numeric(11,8),'
Add-Line '  entrega_distancia_km numeric(6,2),'
Add-Line '  entrega_costo numeric(10,2) DEFAULT 0,'
Add-Line '  entrega_instrucciones text,'
Add-Line '  fecha_pedido timestamp with time zone DEFAULT now(),'
Add-Line '  fecha_entrega_estimada timestamp with time zone,'
Add-Line '  fecha_entrega_real timestamp with time zone,'
Add-Line '  subtotal numeric(12,0) NOT NULL DEFAULT 0,'
Add-Line '  descuento numeric(12,0) DEFAULT 0,'
Add-Line '  total_final numeric(12,0) NOT NULL DEFAULT 0,'
Add-Line "  estado_pago text DEFAULT 'pendiente'::text,"
Add-Line '  mp_payment_id text,'
Add-Line '  mp_transaction_id text,'
Add-Line '  created_at timestamp with time zone DEFAULT now(),'
Add-Line '  updated_at timestamp with time zone DEFAULT now(),'
Add-Line '  creado_por uuid,'
Add-Line "  metodo_pago text DEFAULT 'efectivo'::text,"
Add-Line '  fecha_entrega_solicitada date,'
Add-Line '  es_pedido_anticipado boolean NOT NULL DEFAULT false,'
Add-Line '  cupon_codigo text,'
Add-Line '  descuento_monto numeric(12,2) DEFAULT 0,'
Add-Line '  puntos_ganados integer DEFAULT 0,'
Add-Line '  puntos_usados integer DEFAULT 0,'
Add-Line '  utm_source text,'
Add-Line '  utm_medium text,'
Add-Line '  utm_campaign text'
Add-Line ');'
Add-Line ''

Add-Line '**public.detalle_pedido**'
Add-Line '```sql'
Add-Line 'CREATE TABLE public.detalle_pedido ('
Add-Line '  id uuid NOT NULL DEFAULT gen_random_uuid(),'
Add-Line '  pedido_id uuid NOT NULL,'
Add-Line '  producto_id uuid NOT NULL,'
Add-Line '  cantidad integer NOT NULL,'
Add-Line '  precio_unitario numeric(10,2) NOT NULL,'
Add-Line '  notas text,'
Add-Line '  created_at timestamp with time zone DEFAULT now(),'
Add-Line '  subtotal numeric(12,0)'
Add-Line ');'
Add-Line ''

Add-Line '> NOTA: el schema completo tiene 38 tablas. Este archivo contiene las 4 criticas.'
Add-Line '> Para el listado completo, ver backup-schema-manual.json en la carpeta de backups.'
Add-Line ''
Add-Line '---'
Add-Line ''

# ============== POLITICAS ==============
Add-Line '## POLITICAS RLS - CRITICAS PARA F1-02'
Add-Line ''
Add-Line '### canjes_premios (LAS 2 QUE VAMOS A MODIFICAR)'
Add-Line ''
Add-Line 'Backup de las politicas actuales (por si hay que revertir F1-02):'
Add-Line ''
Add-Line '```sql'
Add-Line 'CREATE POLICY "Admin puede actualizar canjes" ON public.canjes_premios'
Add-Line '  FOR UPDATE TO authenticated'
Add-Line '  USING (true) WITH CHECK (true);'
Add-Line ''
Add-Line 'CREATE POLICY "Admin puede eliminar canjes" ON public.canjes_premios'
Add-Line '  FOR DELETE TO public'
Add-Line '  USING (true);'
Add-Line '```'
Add-Line ''

Add-Line '### pedidos (la que vamos a DROP)'
Add-Line ''
Add-Line '```sql'
Add-Line 'CREATE POLICY "pedidos_public_insert" ON public.pedidos'
Add-Line '  FOR INSERT TO public'
Add-Line '  WITH CHECK (true);'
Add-Line '```'
Add-Line ''

Add-Line '### detalle_pedido (la que vamos a DROP)'
Add-Line ''
Add-Line '```sql'
Add-Line 'CREATE POLICY "detalle_public_insert" ON public.detalle_pedido'
Add-Line '  FOR INSERT TO public'
Add-Line '  WITH CHECK (true);'
Add-Line '```'
Add-Line ''

Add-Line '> NOTA: el backup completo de las 80+ politicas esta en backup-policies-manual.json'
Add-Line '> en la carpeta de backups.'
Add-Line ''
Add-Line '---'
Add-Line ''

# ============== FIX F1-02 ==============
Add-Line '## FIX F1-02 (lo que vamos a aplicar)'
Add-Line ''
Add-Line '```sql'
Add-Line '-- canjes_premios DELETE'
Add-Line 'DROP POLICY IF EXISTS "Admin puede eliminar canjes" ON public.canjes_premios;'
Add-Line 'CREATE POLICY "Admin puede eliminar canjes" ON public.canjes_premios'
Add-Line '  FOR DELETE TO authenticated USING (is_admin());'
Add-Line ''
Add-Line '-- canjes_premios UPDATE'
Add-Line 'DROP POLICY IF EXISTS "Admin puede actualizar canjes" ON public.canjes_premios;'
Add-Line 'CREATE POLICY "Admin puede actualizar canjes" ON public.canjes_premios'
Add-Line '  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());'
Add-Line ''
Add-Line '-- pedidos INSERT (DROP)'
Add-Line 'DROP POLICY IF EXISTS "pedidos_public_insert" ON public.pedidos;'
Add-Line ''
Add-Line '-- detalle_pedido INSERT (DROP)'
Add-Line 'DROP POLICY IF EXISTS "detalle_public_insert" ON public.detalle_pedido;'
Add-Line '```'
Add-Line ''
Add-Line '---'
Add-Line ''

# ============== ROLLBACK ==============
Add-Line '## ROLLBACK de F1-02 (si algo sale mal)'
Add-Line ''
Add-Line '```sql'
Add-Line 'DROP POLICY IF EXISTS "Admin puede eliminar canjes" ON public.canjes_premios;'
Add-Line 'CREATE POLICY "Admin puede eliminar canjes" ON public.canjes_premios'
Add-Line '  FOR DELETE TO public USING (true);'
Add-Line ''
Add-Line 'DROP POLICY IF EXISTS "Admin puede actualizar canjes" ON public.canjes_premios;'
Add-Line 'CREATE POLICY "Admin puede actualizar canjes" ON public.canjes_premios'
Add-Line '  FOR UPDATE TO public USING (true) WITH CHECK (true);'
Add-Line ''
Add-Line 'CREATE POLICY "pedidos_public_insert" ON public.pedidos'
Add-Line '  FOR INSERT TO public WITH CHECK (true);'
Add-Line ''
Add-Line 'CREATE POLICY "detalle_public_insert" ON public.detalle_pedido'
Add-Line '  FOR INSERT TO public WITH CHECK (true);'
Add-Line '```'
Add-Line ''
Add-Line '---'
Add-Line ''

# ============== NOTAS ==============
Add-Line '## Notas'
Add-Line ''
Add-Line '- Los archivos JSON con el schema y las politicas completas estan en C:\Users\Admin\backups-panfree\'
Add-Line '- Los backups NUNCA se commitean al repositorio'
Add-Line '- Proxima sesion: agregar backup de funciones y triggers'
Add-Line '- Recordatorio: correr este backup cada vez que se haga un cambio estructural importante'
Add-Line ''

# Escribir archivo
$content = $sb.ToString()
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($outFile, $content, $utf8NoBom)

Write-Host "[OK] Archivo generado:" -ForegroundColor Green
Write-Host "     $outFile" -ForegroundColor Green
Write-Host ""
Write-Host "Tamano: $((Get-Item $outFile).Length) bytes" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Proximos pasos ===" -ForegroundColor Cyan
Write-Host "1. Abrir el archivo con:"
Write-Host "   notepad `"$outFile`""
Write-Host ""
Write-Host "2. Copiar todo el contenido y pegarlo en Bitwarden:"
Write-Host "   - Tipo: Nota segura"
Write-Host "   - Nombre: PanFree - Backup Estructural 2026-10-13"
Write-Host "   - Organizacion: PanFree"
Write-Host "   - Coleccion: Produccion"
Write-Host ""