# 07-documentar-f1-04.ps1
# Documenta el fix F1-04 (search_path en 3 funciones).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\07-documentar-f1-04.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\07-documentar-f1-04.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Documentando F1-04: search_path en 3 funciones ===" -ForegroundColor Cyan
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
# 1. Actualizar los archivos .sql de las funciones
# ============================================================

# actualizar_stock_pedido - agregar search_path
$func1 = Get-Content "supabase/schemas/public/functions/actualizar_stock_pedido.sql" -Raw -Encoding UTF8
$func1 = $func1.Replace(
    " LANGUAGE plpgsql`n SECURITY DEFINER`nAS `$function`$",
    " LANGUAGE plpgsql`n SECURITY DEFINER`n SET search_path TO 'public'`nAS `$function`$"
)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "supabase/schemas/public/functions/actualizar_stock_pedido.sql"), $func1, $utf8NoBom)
Write-Host "[OK] actualizar_stock_pedido.sql actualizado" -ForegroundColor Green

# actualizar_stock_produccion - agregar search_path
$func2 = Get-Content "supabase/schemas/public/functions/actualizar_stock_produccion.sql" -Raw -Encoding UTF8
$func2 = $func2.Replace(
    " LANGUAGE plpgsql`n SECURITY DEFINER`nAS `$function`$",
    " LANGUAGE plpgsql`n SECURITY DEFINER`n SET search_path TO 'public'`nAS `$function`$"
)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "supabase/schemas/public/functions/actualizar_stock_produccion.sql"), $func2, $utf8NoBom)
Write-Host "[OK] actualizar_stock_produccion.sql actualizado" -ForegroundColor Green

# update_updated_at_column - crear archivo nuevo
$func3 = @(
    '-- ============================================================',
    '-- Funcion: public.update_updated_at_column()',
    '-- Ultima actualizacion: 2026-10-13 (F1-04)',
    '-- Tipo: TRIGGER',
    '-- ============================================================',
    '',
    'CREATE OR REPLACE FUNCTION public.update_updated_at_column()',
    ' RETURNS trigger',
    ' LANGUAGE plpgsql',
    ' SET search_path TO ''public''',
    'AS $function$',
    'BEGIN',
    '  NEW.updated_at = now();',
    '  RETURN NEW;',
    'END;',
    '$function$;'
)
Write-FileNoBom -Path "supabase/schemas/public/functions/update_updated_at_column.sql" -Content ($func3 -join "`n")

# ============================================================
# 2. Documento de auditoria
# ============================================================
$lines = @(
    '# F1-04 - Fijar search_path de 3 funciones',
    '',
    '**Fecha:** 2026-10-13',
    '**Hallazgo:** DB-001g',
    '**Severidad:** Alta',
    '**Estado:** Cerrado',
    '',
    '---',
    '',
    '## Funciones corregidas',
    '',
    '| Funcion | Tipo | SECURITY DEFINER | search_path antes | search_path despues |',
    '|---|---|---|---|---|',
    '| `actualizar_stock_pedido` | TRIGGER | Si | (null) | public |',
    '| `actualizar_stock_produccion` | TRIGGER | Si | (null) | public |',
    '| `update_updated_at_column` | TRIGGER | No | (null) | public |',
    '',
    '---',
    '',
    '## Causa raiz',
    '',
    'Las funciones sin `SET search_path` son vulnerables a **search path',
    'hijacking**. Un atacante con permisos para crear objetos en un schema',
    'anterior en el path podria sobrescribir funciones como `now()` o',
    '`auth.uid()` y ejecutarlas con los permisos del owner de la funcion.',
    '',
    'El riesgo es mas alto en funciones `SECURITY DEFINER` porque se ejecutan',
    'con permisos elevados (postgres), pero conviene fijarlo en todas.',
    '',
    '---',
    '',
    '## Fix aplicado',
    '',
    '```sql',
    'ALTER FUNCTION public.actualizar_stock_pedido() SET search_path TO ''public'';',
    'ALTER FUNCTION public.actualizar_stock_produccion() SET search_path TO ''public'';',
    'ALTER FUNCTION public.update_updated_at_column() SET search_path TO ''public'';',
    '```',
    '',
    '`ALTER FUNCTION ... SET search_path` NO recrea la funcion. Solo modifica',
    'su configuracion. Los triggers siguen funcionando igual.',
    '',
    '---',
    '',
    '## Verificacion',
    '',
    '```sql',
    'SELECT p.proname, p.proconfig, p.prosecdef',
    'FROM pg_proc p',
    'JOIN pg_namespace n ON n.oid = p.pronamespace',
    'WHERE n.nspname = ''public''',
    '  AND p.proname IN (''actualizar_stock_pedido'', ''actualizar_stock_produccion'', ''update_updated_at_column'');',
    '```',
    '',
    '**Resultado:** las 3 funciones con `configuracion = ["search_path=public"]`.',
    '',
    '---',
    '',
    '## Definition of Done (F1-04)',
    '',
    '- [x] Cambio implementado en la DB',
    '- [x] Las 3 funciones con search_path=public',
    '- [x] Funciones guardadas en supabase/schemas/public/functions/',
    '- [x] Documentado en este archivo',
    '- [ ] Commit pusheado con prefijo `security(db):`',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- [DB-001g en tracking](./06-hallazgos-tracking.md)',
    '- [Auditoria Supabase Advisors](./02-supabase-advisors.md)',
    '- [ADR-002: Seguridad en capas](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)',
    '- [OWASP - Search Path Hijacking](https://owasp.org/www-project-top-ten/)'
)
Write-FileNoBom -Path "docs/audits/2026-10-13-inicial/10-f1-04-search-path.md" -Content ($lines -join "`n")

# ============================================================
# 3. Actualizar tracking
# ============================================================
Write-Host ""
Write-Host "--- Actualizando tracking ---" -ForegroundColor Yellow

$trackingPath = "docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
$tracking = Get-Content $trackingPath -Raw -Encoding UTF8

$tracking = $tracking.Replace(
    "| DB-001g | Funciones con search_path mutable | F1 | P1 | Abierto | - |",
    "| DB-001g | Funciones con search_path mutable | F1 | P1 | Cerrado | (pendiente) |"
)
$tracking = $tracking.Replace("| Abierto | 19 |", "| Abierto | 18 |")
$tracking = $tracking.Replace("| Cerrado | 3 |", "| Cerrado | 4 |")
$tracking = $tracking.Replace("| Alta | 8 | 0 |", "| Alta | 8 | 1 |")

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
    Write-Host "  git add docs/audits/2026-10-13-inicial/10-f1-04-search-path.md"
    Write-Host "  git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
    Write-Host "  git add scripts/docs/07-documentar-f1-04.ps1"
    Write-Host "  git commit -m `"security(db): fijar search_path en 3 funciones`""
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
git add docs/audits/2026-10-13-inicial/10-f1-04-search-path.md
git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add scripts/docs/07-documentar-f1-04.ps1

git commit -m "security(db): fijar search_path en 3 funciones"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -3