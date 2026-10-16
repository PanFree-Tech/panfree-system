# ============================================================================
# 69c-sync-plan.ps1
# ----------------------------------------------------------------------------
# Sincroniza docs/operations/PLAN-DE-TRABAJO.md con el estado real post-S21:
#   - F2-12: Pendiente -> OK
#   - F3-07: Pendiente -> OK
#
# Idempotente. Dry run por defecto. -Aplicar escribe.
# Verificacion post-write obligatoria.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$planFile = Join-Path $repoRoot 'docs\operations\PLAN-DE-TRABAJO.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 69c - Sincronizar PLAN-DE-TRABAJO.md (S22)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

if (-not (Test-Path -LiteralPath $planFile)) {
    Write-Host "[ERROR] No existe: $planFile" -ForegroundColor Red
    exit 1
}

$contenido = [System.IO.File]::ReadAllText($planFile)

# ============================================================================
# Reemplazos literales
# ============================================================================

$reemplazos = @(
    @{
        Id    = '01-F2-12'
        Viejo = '| F2-12 | Regenerar par VAPID | P3 | M | Pendiente | Push funciona |'
        Nuevo = '| F2-12 | Regenerar par VAPID | P3 | M | OK | Par rotado + fix codigo. Cierra F2-12, F3-07, SEC-014, BUG-001, BUG-012 |'
    },
    @{
        Id    = '02-F3-07'
        Viejo = '| F3-07 | BUG-001: fix NEXT_PUBLIC_VAPID_KEY | P2 | S | Pendiente | Variable consistente |'
        Nuevo = '| F3-07 | BUG-001: fix NEXT_PUBLIC_VAPID_KEY | P2 | S | OK | Variable consistente desde env (commit 5923f3a6) |'
    }
)

# ============================================================================
# Auditoria previa
# ============================================================================

Write-Host '--- Auditoria previa ---' -ForegroundColor Cyan
Write-Host ''

$planes = @()
foreach ($r in $reemplazos) {
    $tieneViejo = $contenido.Contains($r.Viejo)
    $tieneNuevo = $contenido.Contains($r.Nuevo)
    $estado = if ($tieneNuevo) { 'YA aplicado' } elseif ($tieneViejo) { 'Pendiente' } else { 'NO ENCONTRADO' }
    $color = if ($estado -eq 'Pendiente') { 'Yellow' } elseif ($estado -eq 'YA aplicado') { 'Green' } else { 'Red' }
    Write-Host "  [$($r.Id)] $estado" -ForegroundColor $color

    $planes += [pscustomobject]@{
        Id         = $r.Id
        Viejo      = $r.Viejo
        Nuevo      = $r.Nuevo
        TieneViejo = $tieneViejo
        TieneNuevo = $tieneNuevo
    }
}

Write-Host ''

# ============================================================================
# Dry run
# ============================================================================

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Acciones que se realizarian:' -ForegroundColor Yellow
    foreach ($p in $planes) {
        if ($p.TieneNuevo) {
            Write-Host "  [SKIP] $($p.Id) - ya aplicado" -ForegroundColor Yellow
        } elseif (-not $p.TieneViejo) {
            Write-Host "  [WARN] $($p.Id) - no matchea el bloque viejo" -ForegroundColor Yellow
        } else {
            Write-Host "  [OK]   $($p.Id) - reemplazar" -ForegroundColor Yellow
        }
    }
    Write-Host ''
    exit 0
}

# ============================================================================
# Aplicar
# ============================================================================

$nuevo = $contenido

foreach ($p in $planes) {
    if ($p.TieneNuevo) {
        Write-Host "  [SKIP] $($p.Id) - ya aplicado" -ForegroundColor Yellow
        continue
    }
    if (-not $p.TieneViejo) {
        Write-Host "  [WARN] $($p.Id) - no matchea, no se toca" -ForegroundColor Yellow
        continue
    }
    $nuevo = $nuevo.Replace($p.Viejo, $p.Nuevo)
    Write-Host "  [OK] $($p.Id) reemplazado" -ForegroundColor Green
}

if ($nuevo -eq $contenido) {
    Write-Host ''
    Write-Host '[INFO] No hubo cambios netos.' -ForegroundColor Yellow
    exit 0
}

[System.IO.File]::WriteAllText($planFile, $nuevo, (New-Object System.Text.UTF8Encoding $false))
Write-Host ''
Write-Host '[OK] PLAN-DE-TRABAJO.md escrito' -ForegroundColor Green
Write-Host ''

# ============================================================================
# Verificacion post-write obligatoria
# ============================================================================

Write-Host '--- Verificacion post-write ---' -ForegroundColor Cyan

$post = [System.IO.File]::ReadAllText($planFile)

$checks = @(
    @{ Nombre = 'F2-12 dice OK';       Match = $post.Contains('| F2-12 | Regenerar par VAPID | P3 | M | OK |') },
    @{ Nombre = 'F3-07 dice OK';       Match = $post.Contains('| F3-07 | BUG-001: fix NEXT_PUBLIC_VAPID_KEY | P2 | S | OK |') },
    @{ Nombre = 'F2-12 NO dice Pendiente'; Match = -not $post.Contains('| F2-12 | Regenerar par VAPID | P3 | M | Pendiente |') },
    @{ Nombre = 'F3-07 NO dice Pendiente'; Match = -not $post.Contains('| F3-07 | BUG-001: fix NEXT_PUBLIC_VAPID_KEY | P2 | S | Pendiente |') }
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
Write-Host ' 69c COMPLETADO' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'PROXIMO PASO:' -ForegroundColor Yellow
Write-Host '  1. git diff docs/operations/PLAN-DE-TRABAJO.md' -ForegroundColor Yellow
Write-Host '  2. Si OK, commit + push' -ForegroundColor Yellow
Write-Host ''