# ============================================================================
# 67a-recon-y-fix-status-s20.ps1  (v2)
# ----------------------------------------------------------------------------
# Bloque 0 + 1 de S21:
#   - Recon: estado del repo + auditoria de next.config.js
#   - Fix STATUS.md: actualizar header + progreso + F2 + entrada S20
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# Verificacion post-write obligatoria.
#
# NOTA: Vercel CLI en PowerShell 5.1 escribe a stderr aunque tenga exito.
#       Se maneja con $ErrorActionPreference = 'Continue' en esa seccion.
#       Los comandos de Vercel se hacen manuales fuera del script.
# ============================================================================

param(
    [switch]$Aplicar
)

$repoRoot     = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$statusFile   = Join-Path $repoRoot 'docs\STATUS.md'
$outDir       = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial'
$reconFile    = Join-Path $outDir '40-recon-s21.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 67a - Recon S21 + fix STATUS.md (v2)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

# ============================================================================
# SECCION A - RECON (solo lectura)
# ============================================================================

Write-Host '--- A.1 Git estado ---' -ForegroundColor Cyan

$gitHead = git rev-parse HEAD 2>&1
$gitBranch = git branch --show-current 2>&1
$gitStatus = git status --short 2>&1
$gitLog = git log --oneline -5 2>&1

Write-Host "  HEAD:   $gitHead"
Write-Host "  Branch: $gitBranch"
Write-Host "  Status: $(if ($gitStatus) { 'hay cambios (normal: script 67a sin trackear)' } else { 'limpio' })"
Write-Host ''
Write-Host '  Ultimos 5 commits:'
$gitLog | ForEach-Object { Write-Host "    $_" }
Write-Host ''

Write-Host '--- A.2 next.config.js (PWA config, para DOC-017) ---' -ForegroundColor Cyan

$nextConfigFile = Join-Path $repoRoot 'next.config.js'
$pwaSkipWaiting = 'NO DETECTADO'
$pwaClientsClaim = 'NO DETECTADO'
$pwaDocumentCaching = 'NO DETECTADO'
$nextConfigRaw = '(no existe next.config.js)'

if (Test-Path -LiteralPath $nextConfigFile) {
    $nextConfigRaw = [System.IO.File]::ReadAllText($nextConfigFile)
    if ($nextConfigRaw -match 'skipWaiting\s*:\s*true') { $pwaSkipWaiting = 'SI' }
    if ($nextConfigRaw -match 'clientsClaim\s*:\s*true') { $pwaClientsClaim = 'SI' }
    if ($nextConfigRaw -match 'destination\s*:\s*[''"]document[''"]') { $pwaDocumentCaching = 'SI (probable causa DOC-017)' }
}

Write-Host "  skipWaiting: $pwaSkipWaiting"
Write-Host "  clientsClaim: $pwaClientsClaim"
Write-Host "  Cachea HTML (document): $pwaDocumentCaching"
Write-Host ''

# ============================================================================
# SECCION B - Escribir recon a archivo
# ============================================================================

if (-not (Test-Path -LiteralPath $outDir)) {
    Write-Host "[ERROR] No existe: $outDir" -ForegroundColor Red
    exit 1
}

if (Test-Path -LiteralPath $reconFile) {
    Write-Host '[INFO] Recon ya existe. No se sobrescribe.' -ForegroundColor Yellow
} else {
    $fecha = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $reconLineas = @(
        '# Recon S21 - Estado del proyecto al inicio de S21',
        '',
        "**Fecha:** $fecha",
        '**Sesion:** 21',
        '',
        '---',
        '',
        '## Git',
        '',
        '```',
        "HEAD:   $gitHead",
        "Branch: $gitBranch",
        "Status: $(if ($gitStatus) { 'hay cambios' } else { 'limpio' })",
        '```',
        '',
        'Ultimos 5 commits:',
        '',
        '```',
        ($gitLog -join "`r`n"),
        '```',
        '',
        '---',
        '',
        '## Auditoria next.config.js (PWA / SW - DOC-017)',
        '',
        "skipWaiting: $pwaSkipWaiting",
        "clientsClaim: $pwaClientsClaim",
        "Cachea HTML (document): $pwaDocumentCaching",
        '',
        'Interpretacion:',
        '- Si skipWaiting = NO DETECTADO -> causa probable del SW que no se actualiza.',
        '- Si Cachea HTML = SI -> causa directa del HTML viejo servido por SW.',
        '',
        '---',
        '',
        '## Auditoria Supabase ANON KEY (DOC-016)',
        '',
        'Pendiente: verificar manualmente en Vercel Dashboard.',
        'Reportar prefijo: eyJ... (legacy) o sb_publishable_ (OK).',
        '',
        '---',
        '',
        '## Auditoria Vercel',
        '',
        'Pendiente: correr manualmente',
        '',
        '```',
        'vercel ls --yes          # ultimos deployments',
        'vercel alias ls          # www.panfree.fit -> deployment',
        '```',
        '',
        '---',
        '',
        '## Fin del recon'
    )

    $contenido = ($reconLineas -join "`r`n") + "`r`n"
    [System.IO.File]::WriteAllText($reconFile, $contenido, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "[OK] Recon escrito: $reconFile" -ForegroundColor Green
}
Write-Host ''

# ============================================================================
# SECCION C - Fix STATUS.md
# ============================================================================

Write-Host '--- C. Fix STATUS.md ---' -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $statusFile)) {
    Write-Host "[ERROR] No existe: $statusFile" -ForegroundColor Red
    exit 1
}

$statusContent = [System.IO.File]::ReadAllText($statusFile)

$reemplazos = @(
    @{
        Viejo = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 19)'
        Nuevo = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 20)'
    },
    @{
        Viejo = '**Progreso global:** 72% (34 de 47 tareas)'
        Nuevo = '**Progreso global:** 76% (36 de 47 tareas)'
    },
    @{
        Viejo = '| F2 - Rotacion claves | 14 | 11 | 0 | 3 | 79% |'
        Nuevo = '| F2 - Rotacion claves | 14 | 13 | 0 | 1 | 93% |'
    },
    @{
        Viejo = '| **Total** | **47** | **34** | **0** | **13** | **72%** |'
        Nuevo = '| **Total** | **47** | **36** | **0** | **11** | **76%** |'
    },
    @{
        Viejo = '1. **F2-12** - Regenerar par VAPID (verificar SEC-024 + BUG-001 antes)'
        Nuevo = '1. **F2-03** - Cloudinary Root User (reconsultar ticket #392411 desde 2026-10-18)'
    }
)

foreach ($r in $reemplazos) {
    $tieneViejo = $statusContent.Contains($r.Viejo)
    $tieneNuevo = $statusContent.Contains($r.Nuevo)
    $estado = if ($tieneNuevo) { 'YA aplicado' } elseif ($tieneViejo) { 'Pendiente' } else { 'NO ENCONTRADO' }
    Write-Host "  [$estado] $($r.Viejo.Substring(0, [Math]::Min(60, $r.Viejo.Length)))..." -ForegroundColor $(if ($estado -eq 'Pendiente') { 'Yellow' } elseif ($estado -eq 'YA aplicado') { 'Green' } else { 'Red' })
}

Write-Host ''

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada en STATUS.md.' -ForegroundColor Yellow
    Write-Host '         Para aplicar: -Aplicar' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

$statusNuevo = $statusContent
foreach ($r in $reemplazos) {
    if ($statusNuevo.Contains($r.Viejo) -and -not $statusNuevo.Contains($r.Nuevo)) {
        $statusNuevo = $statusNuevo.Replace($r.Viejo, $r.Nuevo)
    }
}

$appendStatus = @(
    '',
    '---',
    '',
    '**2026-10-16 - Sesion 20 (ENV) - COMPLETA**',
    '- F2-12: rotacion completa del par VAPID + fix de codigo.',
    '- F3-07 / SEC-014 / BUG-001 / BUG-012: VAPID_PUBLIC_KEY unificada desde env.',
    '- SEC-024: no aplica (era artefacto visual del CLI de Vercel).',
    '- DOC-015 (nuevo): alias Vercel www.panfree.fit apuntaba a deployment viejo.',
    '- SEC-020 cerrado: todos los items Bitwarden rotables completos.',
    '- Commit: 5923f3a6 + 13f3cc96.'
) -join "`r`n"

$statusNuevo = $statusNuevo.TrimEnd() + "`r`n" + $appendStatus + "`r`n"

[System.IO.File]::WriteAllText($statusFile, $statusNuevo, (New-Object System.Text.UTF8Encoding $false))
Write-Host '[OK] STATUS.md actualizado' -ForegroundColor Green

# ============================================================================
# SECCION D - Verificacion post-write
# ============================================================================

Write-Host ''
Write-Host '--- D. Verificacion post-write ---' -ForegroundColor Cyan

$statusPost = [System.IO.File]::ReadAllText($statusFile)

$checks = @(
    @{ Nombre = 'Header dice "fin Sesion 20"';   Match = $statusPost.Contains('**Ultima actualizacion:** 2026-10-16 (fin Sesion 20)') },
    @{ Nombre = 'Progreso dice 76%';             Match = $statusPost.Contains('**Progreso global:** 76%') },
    @{ Nombre = 'F2 dice 13/14';                 Match = $statusPost.Contains('| F2 - Rotacion claves | 14 | 13 |') },
    @{ Nombre = 'Total dice 36/47';              Match = $statusPost.Contains('| **Total** | **47** | **36** |') },
    @{ Nombre = 'Proximos pasos dice F2-03';     Match = $statusPost.Contains('1. **F2-03** - Cloudinary Root User') },
    @{ Nombre = 'Append S20 presente';           Match = $statusPost.Contains('**2026-10-16 - Sesion 20 (ENV) - COMPLETA**') }
)

$todoOk = $true
foreach ($c in $checks) {
    $symbol = if ($c.Match) { 'OK  ' } else { 'FAIL' }
    $color = if ($c.Match) { 'Green' } else { 'Red' }
    Write-Host "  [$symbol] $($c.Nombre)" -ForegroundColor $color
    if (-not $c.Match) { $todoOk = $false }
}

Write-Host ''
if (-not $todoOk) {
    Write-Host '[ERROR] Verificacion post-write FALLO.' -ForegroundColor Red
    exit 1
}

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 67a COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO:' -ForegroundColor Yellow
Write-Host '  1. git diff --stat docs/' -ForegroundColor Yellow
Write-Host '  2. Si OK, commit + push' -ForegroundColor Yellow
Write-Host ''
Write-Host 'PENDIENTE MANUAL (para el informe):' -ForegroundColor Yellow
Write-Host '  - Verificar NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel Dashboard.' -ForegroundColor Yellow
Write-Host '  - Correr vercel ls --yes y vercel alias ls (fuera del script).' -ForegroundColor Yellow
Write-Host ''