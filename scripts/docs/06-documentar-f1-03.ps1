# 06-documentar-f1-03.ps1
# Documenta el fix F1-03 (4 funciones SECURITY DEFINER restringidas).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\06-documentar-f1-03.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\06-documentar-f1-03.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Documentando F1-03: fix funciones SECURITY DEFINER ===" -ForegroundColor Cyan
Write-Host ""

function Write-FileNoBom {
    param(
        [string]$Path,
        [string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) $Path), $Content, $utf8NoBom)
    Write-Host "[OK] $Path" -ForegroundColor Green
}

# ============================================================
# 1. Funciones declarativas en supabase/schemas/public/functions/
# ============================================================

$func1 = @(
    '-- ============================================================',
    '-- Funcion: public.actualizar_stock_pedido()',
    '-- Ultima actualizacion: 2026-10-13 (F1-03)',
    '-- Tipo: TRIGGER (no debe ser invocada via RPC)',
    '-- ============================================================',
    '',
    'CREATE OR REPLACE FUNCTION public.actualizar_stock_pedido()',
    ' RETURNS trigger',
    ' LANGUAGE plpgsql',
    ' SECURITY DEFINER',
    ' SET search_path TO ''public''',
    'AS $function$',
    'DECLARE',
    '  v_item RECORD;',
    '  v_stock_anterior INTEGER;',
    '  v_stock_nuevo INTEGER;',
    '  v_producto_id UUID;',
    '  v_cantidad INTEGER;',
    'BEGIN',
    '  IF NEW.estado IN (''confirmado'', ''entregado'') AND OLD.estado NOT IN (''confirmado'', ''entregado'') THEN',
    '    FOR v_item IN',
    '      SELECT dp.producto_id, dp.cantidad',
    '      FROM public.detalle_pedido dp',
    '      WHERE dp.pedido_id = NEW.id',
    '    LOOP',
    '      v_producto_id := v_item.producto_id;',
    '      v_cantidad := v_item.cantidad;',
    '',
    '      SELECT stock_actual INTO v_stock_anterior',
    '      FROM public.productos',
    '      WHERE id = v_producto_id',
    '      FOR UPDATE;',
    '',
    '      IF v_stock_anterior < v_cantidad THEN',
    '        RAISE EXCEPTION ''Stock insuficiente para el producto ID %: % unidades disponibles, se requieren %'',',
    '          v_producto_id, v_stock_anterior, v_cantidad;',
    '      END IF;',
    '',
    '      v_stock_nuevo := v_stock_anterior - v_cantidad;',
    '',
    '      UPDATE public.productos',
    '      SET stock_actual = v_stock_nuevo',
    '      WHERE id = v_producto_id;',
    '',
    '      INSERT INTO public.stock_movimientos (',
    '        producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,',
    '        motivo, referencia_id, referencia_tabla',
    '      ) VALUES (',
    '        v_producto_id, ''salida_pedido'', -v_cantidad, v_stock_anterior, v_stock_nuevo,',
    '        ''Pedido confirmado: '' || NEW.numero_pedido, NEW.id, ''pedidos''',
    '      );',
    '    END LOOP;',
    '  END IF;',
    '  RETURN NEW;',
    'END;',
    '$function$;',
    '',
    '-- F1-03: revocar ejecucion publica',
    'REVOKE EXECUTE ON FUNCTION public.actualizar_stock_pedido() FROM anon, authenticated, public;'
)
Write-FileNoBom -Path "supabase/schemas/public/functions/actualizar_stock_pedido.sql" -Content ($func1 -join "`n")

$func2 = @(
    '-- ============================================================',
    '-- Funcion: public.actualizar_stock_produccion()',
    '-- Ultima actualizacion: 2026-10-13 (F1-03)',
    '-- Tipo: TRIGGER (no debe ser invocada via RPC)',
    '-- ============================================================',
    '',
    'CREATE OR REPLACE FUNCTION public.actualizar_stock_produccion()',
    ' RETURNS trigger',
    ' LANGUAGE plpgsql',
    ' SECURITY DEFINER',
    ' SET search_path TO ''public''',
    'AS $function$',
    'DECLARE',
    '  v_stock_anterior INTEGER;',
    '  v_stock_nuevo INTEGER;',
    'BEGIN',
    '  IF NEW.estado IN (''completado'', ''finalizado'') AND OLD.estado NOT IN (''completado'', ''finalizado'') THEN',
    '    SELECT stock_actual INTO v_stock_anterior',
    '    FROM public.productos',
    '    WHERE id = NEW.producto_id',
    '    FOR UPDATE;',
    '',
    '    v_stock_nuevo := v_stock_anterior + NEW.cantidad_producida;',
    '',
    '    UPDATE public.productos',
    '    SET stock_actual = v_stock_nuevo',
    '    WHERE id = NEW.producto_id;',
    '',
    '    INSERT INTO public.stock_movimientos (',
    '      producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,',
    '      motivo, referencia_id, referencia_tabla',
    '    ) VALUES (',
    '      NEW.producto_id, ''entrada_produccion'', NEW.cantidad_producida,',
    '      v_stock_anterior, v_stock_nuevo,',
    '      ''Produccion completada: Lote '' || NEW.numero_lote, NEW.id, ''produccion''',
    '    );',
    '  END IF;',
    '  RETURN NEW;',
    'END;',
    '$function$;',
    '',
    '-- F1-03: revocar ejecucion publica',
    'REVOKE EXECUTE ON FUNCTION public.actualizar_stock_produccion() FROM anon, authenticated, public;'
)
Write-FileNoBom -Path "supabase/schemas/public/functions/actualizar_stock_produccion.sql" -Content ($func2 -join "`n")

$func3 = @(
    '-- ============================================================',
    '-- Funcion: public.handle_new_user()',
    '-- Ultima actualizacion: 2026-10-13 (F1-03)',
    '-- Tipo: TRIGGER (no debe ser invocada via RPC)',
    '-- ============================================================',
    '',
    'CREATE OR REPLACE FUNCTION public.handle_new_user()',
    ' RETURNS trigger',
    ' LANGUAGE plpgsql',
    ' SECURITY DEFINER',
    ' SET search_path TO ''public''',
    'AS $function$',
    'BEGIN',
    '  INSERT INTO public.clientes (',
    '    user_id, email, nombre_completo, is_active, role, puntos_fidelidad, nivel_cliente',
    '  ) VALUES (',
    '    NEW.id,',
    '    NEW.email,',
    '    COALESCE(',
    '      NEW.raw_user_meta_data->>''nombre_completo'',',
    '      NEW.raw_user_meta_data->>''full_name'',',
    '      ''Usuario''',
    '    ),',
    '    true,',
    '    ''cliente'',',
    '    0,',
    '    ''bronce''',
    '  );',
    '  RETURN NEW;',
    'END;',
    '$function$;',
    '',
    '-- F1-03: revocar ejecucion publica',
    'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;'
)
Write-FileNoBom -Path "supabase/schemas/public/functions/handle_new_user.sql" -Content ($func3 -join "`n")

$func4 = @(
    '-- ============================================================',
    '-- Funcion: public.is_admin()',
    '-- Ultima actualizacion: 2026-10-13 (F1-03)',
    '-- Tipo: UTILITY (usada en RLS policies, NO invocable via RPC)',
    '-- ============================================================',
    '',
    'CREATE OR REPLACE FUNCTION public.is_admin()',
    ' RETURNS boolean',
    ' LANGUAGE sql',
    ' STABLE SECURITY DEFINER',
    ' SET search_path TO ''public''',
    'AS $function$',
    '  SELECT EXISTS (',
    '    SELECT 1 FROM public.clientes',
    '    WHERE user_id = auth.uid()',
    '    AND role = ''admin''',
    '  );',
    '$function$;',
    '',
    '-- F1-03: revocar ejecucion publica',
    '-- Nota: las RLS policies que usan is_admin() siguen funcionando',
    '-- porque la ejecucion dentro de policies no verifica EXECUTE.',
    'REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;'
)
Write-FileNoBom -Path "supabase/schemas/public/functions/is_admin.sql" -Content ($func4 -join "`n")

# ============================================================
# 2. Documento de auditoria
# ============================================================
$lines = @(
    '# F1-03 - Restringir 4 funciones SECURITY DEFINER',
    '',
    '**Fecha:** 2026-10-13',
    '**Hallazgo:** DB-001c',
    '**Severidad:** Critica',
    '**Estado:** Cerrado',
    '',
    '---',
    '',
    '## Funciones corregidas',
    '',
    '| Funcion | Tipo | Ejecutable por anon (antes) | Ejecutable por anon (despues) |',
    '|---|---|---|---|',
    '| `actualizar_stock_pedido` | TRIGGER | Si | No |',
    '| `actualizar_stock_produccion` | TRIGGER | Si | No |',
    '| `handle_new_user` | TRIGGER | Si | No |',
    '| `is_admin` | UTILITY | Si | No |',
    '',
    '---',
    '',
    '## Causa raiz',
    '',
    'Las 4 funciones son `SECURITY DEFINER`, o sea que se ejecutan con los',
    'permisos del creador (postgres), no del que llama. Eso las hace bypasear',
    'RLS. Ademas, PostgreSQL asigna EXECUTE a PUBLIC por defecto, y Supabase',
    'extiende el grant a `anon` y `authenticated`.',
    '',
    'Resultado: cualquiera con la anon key (publica por diseno) podia invocar',
    'estas funciones via `POST /rest/v1/rpc/<nombre>`, permitiendo:',
    '',
    '- Modificar stock de productos a voluntad',
    '- Modificar stock de produccion',
    '- Insertar filas en `clientes` sin restriccion',
    '- Filtrar si un usuario es admin o no',
    '',
    '---',
    '',
    '## Fix aplicado',
    '',
    '```sql',
    'REVOKE EXECUTE ON FUNCTION public.actualizar_stock_pedido() FROM anon, authenticated, public;',
    'REVOKE EXECUTE ON FUNCTION public.actualizar_stock_produccion() FROM anon, authenticated, public;',
    'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;',
    'REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;',
    '```',
    '',
    'Las funciones siguen existiendo y funcionando como triggers. Solo se',
    'bloquea la invocacion directa via RPC. `service_role` mantiene acceso.',
    '',
    '---',
    '',
    '## Por que no rompe nada',
    '',
    '### Triggers',
    '',
    'PostgreSQL ejecuta los triggers automaticamente sin verificar el permiso',
    'EXECUTE del usuario que dispara el cambio. El REVOKE solo afecta a las',
    'llamadas directas via PostgREST RPC.',
    '',
    '### RLS policies',
    '',
    'Cuando una policy llama a `is_admin()`, la ejecucion ocurre dentro del',
    'motor de PostgreSQL, no pasa por el endpoint RPC. El REVOKE no afecta a',
    'esas ejecuciones internas.',
    '',
    '---',
    '',
    '## Verificacion',
    '',
    '### Test 1: permisos',
    '',
    '```sql',
    'SELECT ',
    '    p.proname AS funcion,',
    '    has_function_privilege(''anon'', p.oid, ''EXECUTE'') AS anon_puede,',
    '    has_function_privilege(''authenticated'', p.oid, ''EXECUTE'') AS auth_puede,',
    '    has_function_privilege(''service_role'', p.oid, ''EXECUTE'') AS service_puede',
    'FROM pg_proc p',
    'JOIN pg_namespace n ON n.oid = p.pronamespace',
    'WHERE n.nspname = ''public''',
    '  AND p.proname IN (''actualizar_stock_pedido'', ''actualizar_stock_produccion'', ''handle_new_user'', ''is_admin'');',
    '```',
    '',
    '**Resultado:** anon=false, auth=false, service=true para las 4.',
    '',
    '### Test 2: trigger funcional',
    '',
    'Se cambio el estado de un pedido a `confirmado`. El trigger se ejecuto:',
    '',
    '- Se inserto una fila en `stock_movimientos` con `tipo_movimiento = salida_pedido`',
    '- El stock del producto se desconto correctamente (10 -> 0)',
    '- El motivo dice "Pedido confirmado: PF-2026-0003"',
    '',
    '**Resultado:** el trigger funciona a pesar del REVOKE.',
    '',
    '---',
    '',
    '## Definition of Done (F1-03)',
    '',
    '- [x] Cambio implementado en la DB (REVOKE)',
    '- [x] Verificacion de permisos: anon y authenticated bloqueados',
    '- [x] Test funcional: trigger dispara correctamente',
    '- [x] Test funcional: stock se descuenta',
    '- [x] Funciones guardadas en supabase/schemas/public/functions/',
    '- [x] Documentado en este archivo',
    '- [ ] Commit pusheado con prefijo `security(db):`',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- [DB-001c en tracking](./06-hallazgos-tracking.md)',
    '- [Auditoria Supabase Advisors](./02-supabase-advisors.md)',
    '- [ADR-002: Seguridad en capas](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)'
)
Write-FileNoBom -Path "docs/audits/2026-10-13-inicial/09-f1-03-fix-funciones-security-definer.md" -Content ($lines -join "`n")

# ============================================================
# 3. Actualizar tracking
# ============================================================
Write-Host ""
Write-Host "--- Actualizando tracking ---" -ForegroundColor Yellow

$trackingPath = "docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
$tracking = Get-Content $trackingPath -Raw -Encoding UTF8

$tracking = $tracking.Replace(
    "| DB-001c | Funciones SECURITY DEFINER publicas | F1 | P0 | Abierto | - |",
    "| DB-001c | Funciones SECURITY DEFINER publicas | F1 | P0 | Cerrado | (pendiente) |"
)
$tracking = $tracking.Replace("| Abierto | 20 |", "| Abierto | 19 |")
$tracking = $tracking.Replace("| Cerrado | 2 |", "| Cerrado | 3 |")
$tracking = $tracking.Replace("| Critica | 6 | 2 |", "| Critica | 6 | 3 |")

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $trackingPath), $tracking, $utf8NoBom)
Write-Host "[OK] $trackingPath actualizado" -ForegroundColor Green

# ============================================================
# 4. Verificar links
# ============================================================
Write-Host ""
Write-Host "--- Verificando links ---" -ForegroundColor Yellow
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\docs\00-verificar-links.ps1")
$verifyExit = $LASTEXITCODE

if ($verifyExit -ne 0) {
    Write-Host ""
    Write-Host "ADVERTENCIA: links rotos." -ForegroundColor Red
    exit 1
}

# ============================================================
# 5. Git status + commit
# ============================================================
Write-Host ""
Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:"
    Write-Host "  git add supabase/schemas/public/functions/"
    Write-Host "  git add docs/audits/2026-10-13-inicial/09-f1-03-fix-funciones-security-definer.md"
    Write-Host "  git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
    Write-Host "  git add scripts/docs/06-documentar-f1-03.ps1"
    Write-Host "  git commit -m `"security(db): restringir 4 funciones SECURITY DEFINER`""
    Write-Host "  git push origin main"
    exit 0
}

Write-Host ""
$resp = Read-Host "Hacer commit y push? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add supabase/schemas/public/functions/
git add docs/audits/2026-10-13-inicial/09-f1-03-fix-funciones-security-definer.md
git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add scripts/docs/06-documentar-f1-03.ps1

git commit -m "security(db): restringir 4 funciones SECURITY DEFINER"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -3