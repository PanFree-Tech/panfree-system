# ============================================================================
# 66b-fix-reemplazos.ps1
# ----------------------------------------------------------------------------
# Aplica los reemplazos de cierre que el 66b no logro (regex no matcheo).
# Usa .Replace() literal sobre strings exactos.
#
# Idempotente. Dry run por defecto.
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot     = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$trackingFile = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 66b-fix - Reemplazos literales de cierre (S20)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $trackingFile)) {
    Write-Host "[ERROR] No existe: $trackingFile" -ForegroundColor Red
    exit 1
}

$reemplazos = @(
    @{
        Viejo = '| BUG-001 | NEXT_PUBLIC_VAPID_KEY inconsistente | F3 | P2 | Abierto | - |'
        Nuevo = '| BUG-001 | NEXT_PUBLIC_VAPID_KEY inconsistente | F3 | P2 | Cerrado (S20) | 5923f3a6 |'
    },
    @{
        Viejo = '| SEC-024 | NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso (?JWT?) | F2 | P2 | Abierto | - |'
        Nuevo = '| SEC-024 | NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso (?JWT?) | F2 | P2 | No aplica (S20: artefacto del CLI de Vercel) | (S20) |'
    },
    @{
        Viejo = '| SEC-014 | VAPID key hardcodeada en src/app/admin/page.js | F3 | P3 | Abierto | - |'
        Nuevo = '| SEC-014 | VAPID key hardcodeada en src/app/admin/page.js | F3 | P3 | Cerrado (S20) | 5923f3a6 |'
    }
)

$contenido = [System.IO.File]::ReadAllText($trackingFile)

# --- 1. Auditoria previa ---

$planes = @()

foreach ($r in $reemplazos) {
    $tieneViejo = $contenido.Contains($r.Viejo)
    $tieneNuevo = $contenido.Contains($r.Nuevo)

    $estado = if ($tieneNuevo) { 'YA aplicado' } elseif ($tieneViejo) { 'Pendiente' } else { 'NO ENCONTRADO' }
    Write-Host "  [$estado] $($r.Nuevo.Substring(0, 60))..." -ForegroundColor $(if ($estado -eq 'Pendiente') { 'Yellow' } elseif ($estado -eq 'YA aplicado') { 'Green' } else { 'Red' })

    $planes += [pscustomobject]@{
        Viejo = $r.Viejo
        Nuevo = $r.Nuevo
        TieneViejo = $tieneViejo
        TieneNuevo = $tieneNuevo
    }
}

Write-Host ''

# --- 2. Idempotencia ---

$todoAplicado = ($planes | Where-Object { -not $_.TieneNuevo }).Count -eq 0

if ($todoAplicado) {
    Write-Host '[INFO] Todos los cambios ya aplicados. Saliendo.' -ForegroundColor Yellow
    exit 0
}

# --- 3. Dry run ---

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# --- 4. Aplicar ---

$contenidoNuevo = $contenido

foreach ($p in $planes) {
    if ($p.TieneNuevo) {
        Write-Host "  [SKIP] ya aplicado" -ForegroundColor Yellow
        continue
    }
    if (-not $p.TieneViejo) {
        Write-Host "  [WARN] no se encontro el string viejo, no se toca" -ForegroundColor Yellow
        Write-Host "         buscaba: $($p.Viejo)" -ForegroundColor Yellow
        continue
    }
    $contenidoNuevo = $contenidoNuevo.Replace($p.Viejo, $p.Nuevo)
    Write-Host "  [OK] reemplazado" -ForegroundColor Green
}

if ($contenidoNuevo -ne $contenido) {
    [System.IO.File]::WriteAllText($trackingFile, $contenidoNuevo, (New-Object System.Text.UTF8Encoding $false))
    Write-Host ''
    Write-Host '[OK] Tracking actualizado' -ForegroundColor Green
} else {
    Write-Host ''
    Write-Host '[INFO] No hubo cambios netos' -ForegroundColor Yellow
}

Write-Host ''