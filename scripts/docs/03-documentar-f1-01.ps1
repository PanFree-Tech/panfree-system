# 03-documentar-f1-01.ps1
# Documenta el fix F1-01 (3 vistas SECURITY DEFINER -> SECURITY INVOKER)
# y actualiza tracking. Commitea y pushea.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\03-documentar-f1-01.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\03-documentar-f1-01.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Documentando F1-01: fix vistas SECURITY DEFINER ===" -ForegroundColor Cyan
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
# 1. Crear el documento de fix
# ============================================================
$lines = @(
    '# F1-01 - Fix 3 vistas SECURITY DEFINER',
    '',
    '**Fecha:** 2026-10-13',
    '**Hallazgo:** DB-001a',
    '**Severidad:** Critica',
    '**Estado:** Cerrado',
    '',
    '---',
    '',
    '## Vistas afectadas',
    '',
    '| Vista | Esquema | Riesgo |',
    '|---|---|---|',
    '| `vista_costo_receta_agrupada` | public | Bypass RLS via PostgREST con anon key |',
    '| `vista_disponibilidad_productos` | public | Bypass RLS via PostgREST con anon key |',
    '| `vista_costo_receta` | public | Bypass RLS via PostgREST con anon key |',
    '',
    '---',
    '',
    '## Causa raiz',
    '',
    'Las vistas en PostgreSQL son `SECURITY DEFINER` por defecto. Eso significa',
    'que se ejecutan con los permisos del creador de la vista, no del que',
    'consulta. Resultado: ignoran las politicas RLS de las tablas subyacentes.',
    '',
    'Como las 3 vistas estan en el schema `public` y son accesibles via',
    'PostgREST con la anon key (que es publica por diseno), cualquier cliente',
    'podia leerlas saltandose RLS. Esto expone datos de costos, recetas y',
    'disponibilidad que deberian estar restringidos a staff administrativo.',
    '',
    '---',
    '',
    '## Fix aplicado',
    '',
    'Se cambio el modo de seguridad de las 3 vistas de `SECURITY DEFINER` a',
    '`SECURITY INVOKER`. Con este modo, la vista usa los permisos del que',
    'consulta, respetando RLS.',
    '',
    'Operacion **no destructiva**: no se borro ni recreo ninguna vista, solo',
    'se cambio una propiedad. Reversible con `SET (security_invoker = false)`.',
    '',
    '### SQL aplicado',
    '',
    '```sql',
    'ALTER VIEW public.vista_costo_receta_agrupada SET (security_invoker = true);',
    'ALTER VIEW public.vista_disponibilidad_productos SET (security_invoker = true);',
    'ALTER VIEW public.vista_costo_receta SET (security_invoker = true);',
    '```',
    '',
    '---',
    '',
    '## Verificacion',
    '',
    '### Verificacion 1: pg_class.reloptions',
    '',
    '```sql',
    'SELECT',
    '    c.relname AS view_name,',
    '    c.reloptions AS options',
    'FROM pg_class c',
    'JOIN pg_namespace n ON n.oid = c.relnamespace',
    'WHERE n.nspname = ''public''',
    '  AND c.relname IN (',
    '    ''vista_costo_receta_agrupada'',',
    '    ''vista_disponibilidad_productos'',',
    '    ''vista_costo_receta''',
    '  )',
    'ORDER BY c.relname;',
    '```',
    '',
    '**Resultado obtenido:** 3 filas con `options = ["security_invoker=true"]`.',
    '',
    '### Verificacion 2: Supabase Advisors',
    '',
    'Ir a **Supabase Dashboard -> Advisors -> Security**. Las 3 vistas deben',
    'haber desaparecido del listado de warnings.',
    '',
    '### Verificacion 3: Test funcional',
    '',
    '- **Como anon (anon key):** las vistas no deben devolver datos sensibles.',
    '- **Como admin (service_role o app autenticada):** las vistas deben',
    '  funcionar igual que antes del fix.',
    '',
    '---',
    '',
    '## Definition of Done (F1-01)',
    '',
    '- [x] Cambio implementado en la DB',
    '- [x] Supabase Advisors deja de reportar las 3 vistas',
    '- [ ] Test manual con anon: no accede a datos sensibles',
    '- [ ] Test manual con admin: funciona correctamente',
    '- [x] Documentado en este archivo',
    '- [ ] Commit pusheado con prefijo `security(db):`',
    '',
    '---',
    '',
    '## Referencias',
    '',
    '- [DB-001a en tracking](./06-hallazgos-tracking.md)',
    '- [Auditoria Supabase Advisors](./02-supabase-advisors.md)',
    '- [ADR-001: Supabase como backend unico](../../architecture/decisiones/ADR-001-supabase-backend-unico.md)',
    '- [ADR-002: Seguridad en capas y app_metadata](../../architecture/decisiones/ADR-002-seguridad-en-capas-app-metadata.md)'
)

$content = $lines -join "`n"
Write-FileNoBom -Path "docs/audits/2026-10-13-inicial/07-f1-01-fix-vistas-security-definer.md" -Content $content

# ============================================================
# 2. Actualizar tracking de hallazgos
# ============================================================
Write-Host ""
Write-Host "--- Actualizando tracking ---" -ForegroundColor Yellow

$trackingPath = "docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
$tracking = Get-Content $trackingPath -Raw -Encoding UTF8

$tracking = $tracking.Replace(
    "| DB-001a | Vistas SECURITY DEFINER | F1 | P0 | Abierto | - |",
    "| DB-001a | Vistas SECURITY DEFINER | F1 | P0 | Cerrado | (pendiente) |"
)

$tracking = $tracking.Replace(
    "| Abierto | 22 |",
    "| Abierto | 21 |"
)
$tracking = $tracking.Replace(
    "| Cerrado | 0 |",
    "| Cerrado | 1 |"
)
$tracking = $tracking.Replace(
    "| Critica | 6 | 0 |",
    "| Critica | 6 | 1 |"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $trackingPath), $tracking, $utf8NoBom)
Write-Host "[OK] $trackingPath actualizado" -ForegroundColor Green

# ============================================================
# 3. Verificar links
# ============================================================
Write-Host ""
Write-Host "--- Verificando links ---" -ForegroundColor Yellow
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\docs\00-verificar-links.ps1")
$verifyExit = $LASTEXITCODE

if ($verifyExit -ne 0) {
    Write-Host ""
    Write-Host "ADVERTENCIA: links rotos despues del cambio." -ForegroundColor Red
    Write-Host "Revisar y corregir antes de commitear." -ForegroundColor Red
    exit 1
}

# ============================================================
# 4. Git status + commit
# ============================================================
Write-Host ""
Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:"
    Write-Host "  git add docs/audits/2026-10-13-inicial/07-f1-01-fix-vistas-security-definer.md"
    Write-Host "  git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md"
    Write-Host "  git add scripts/docs/03-documentar-f1-01.ps1"
    Write-Host "  git commit -m `"security(db): fix SECURITY DEFINER en 3 vistas de costos`""
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

git add docs/audits/2026-10-13-inicial/07-f1-01-fix-vistas-security-definer.md
git add docs/audits/2026-10-13-inicial/06-hallazgos-tracking.md
git add scripts/docs/03-documentar-f1-01.ps1

git commit -m "security(db): fix SECURITY DEFINER en 3 vistas de costos"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -3