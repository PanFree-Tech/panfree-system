# ============================================================================
# 66b-update-tracking-status.ps1
# ----------------------------------------------------------------------------
# Actualiza el tracking de hallazgos y STATUS.md con el cierre de S20.
# Idempotente. Dry run por defecto.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/66b-update-tracking-status.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/docs/66b-update-tracking-status.ps1 -Aplicar
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$trackingFile = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md'
$statusFile   = Join-Path $repoRoot 'docs\STATUS.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 66b - Actualizar tracking + STATUS (S20)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

$modo = if ($Aplicar) { 'APLICAR' } else { 'DRY RUN' }
Write-Host "Modo: $modo" -ForegroundColor Yellow
Write-Host ''

if (-not (Test-Path -LiteralPath $trackingFile)) {
    Write-Host "[ERROR] No existe: $trackingFile" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path -LiteralPath $statusFile)) {
    Write-Host "[ERROR] No existe: $statusFile" -ForegroundColor Red
    exit 1
}

# --- 1. Verificar idempotencia ----------------------------------------------

$trackingContent = [System.IO.File]::ReadAllText($trackingFile)
$statusContent   = [System.IO.File]::ReadAllText($statusFile)

$yaAplicado = $trackingContent.Contains('DOC-015') -and $statusContent.Contains('Sesion 20')

Write-Host '--- Estado actual ---' -ForegroundColor Cyan
Write-Host "  Tracking ya tiene DOC-015?     $($trackingContent.Contains('DOC-015'))"
Write-Host "  STATUS ya tiene Sesion 20?     $($statusContent.Contains('Sesion 20'))"
Write-Host ''

if ($yaAplicado) {
    Write-Host '[INFO] Los cambios ya fueron aplicados. Saliendo.' -ForegroundColor Yellow
    exit 0
}

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Acciones que se realizarian:' -ForegroundColor Yellow
    Write-Host '  - Tracking: cerrar SEC-014, BUG-001, BUG-012' -ForegroundColor Yellow
    Write-Host '  - Tracking: SEC-024 -> No aplica' -ForegroundColor Yellow
    Write-Host '  - Tracking: agregar DOC-015' -ForegroundColor Yellow
    Write-Host '  - Tracking: actualizar header (fecha + total)' -ForegroundColor Yellow
    Write-Host '  - STATUS: apendice de Sesion 20' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# --- 2. Actualizar tracking --------------------------------------------------

Write-Host '--- Actualizando tracking ---' -ForegroundColor Cyan

# Cerrar SEC-014
$trackingContent = $trackingContent -replace '(?m)^(\| SEC-014 \| VAPID key hardcodeada en src/app/admin/page\.js \| F3 \| P3 \| )Abierto( \| - \|)$', '$1Cerrado (S20)$2'

# Cerrar BUG-001
$trackingContent = $trackingContent -replace '(?m)^(\| BUG-001 \| NEXT_PUBLIC_VAPID_KEY inconsistente \| F3 \| P2 \| )Abierto( \| - \|)$', '$1Cerrado (S20)$2'

# Cerrar BUG-012 (fila nueva, agregarla al final de la seccion de hallazgos bajos)
# Nota: si BUG-012 no existe como fila, se agrega despues.

# Cerrar SEC-024
$trackingContent = $trackingContent -replace '(?m)^(\| SEC-024 \| NEXT_PUBLIC_VAPID_EMAIL con valor sospechoso \(\?JWT\?\) \| F2 \| P2 \| )Abierto( \| - \|)$', '$1No aplica (S20: artefacto visual del CLI)$2'

# Actualizar header
$trackingContent = $trackingContent -replace '(?m)^\*\*Ultima actualizacion:\*\*.*$', '**Ultima actualizacion:** 2026-10-16 (fin Sesion 20)'

# Append DOC-015 al final de la seccion de hallazgos bajos (antes de la linea divisoria con la siguiente seccion)
$appendTracking = @(
    '',
    '| DOC-015 | Alias Vercel www.panfree.fit apuntaba a deployment viejo (hyx06fts0, 63d) | F4 | P2 | Abierto (revision S21) | (S20) |',
    '| BUG-012 | PWAInstallPrompt.js leia NEXT_PUBLIC_VAPID_KEY (variable inexistente) | F3 | P2 | Cerrado (S20) | 5923f3a6 |'
) -join "`r`n"

# Insertar antes de la linea "---" que precede a "## 4. Como cerrar un hallazgo"
$anchor = "`r`n---`r`n`r`n## 4. Como cerrar un hallazgo"
if ($trackingContent.Contains($anchor)) {
    $trackingContent = $trackingContent.Replace($anchor, $appendTracking + $anchor)
    Write-Host '  [OK] DOC-015 + BUG-012 agregados al tracking' -ForegroundColor Green
} else {
    Write-Host '  [WARN] No se encontro el ancla para insertar DOC-015/BUG-012' -ForegroundColor Yellow
}

[System.IO.File]::WriteAllText($trackingFile, $trackingContent, (New-Object System.Text.UTF8Encoding $false))
Write-Host '  [OK] Tracking actualizado' -ForegroundColor Green

# --- 3. Actualizar STATUS ---------------------------------------------------

Write-Host '--- Actualizando STATUS ---' -ForegroundColor Cyan

$appendStatus = @(
    '',
    '---',
    '',
    '**2026-10-16 - Sesion 20 (ENV) - COMPLETA**',
    '- F2-12: rotacion completa del par VAPID + fix de codigo.',
    '- F3-07 / SEC-014 / BUG-001 / BUG-012: VAPID_PUBLIC_KEY unificada desde env.',
    '- SEC-024: no aplica (era artefacto visual del CLI de Vercel).',
    '- DOC-015 (nuevo): alias Vercel www.panfree.fit apuntaba a deployment viejo.',
    '- Commit: 5923f3a6.',
    '- Pusheado + deploy Ready + alias actualizado con vercel --prod --force.'
) -join "`r`n"

$statusContent = $statusContent.TrimEnd() + "`r`n" + $appendStatus + "`r`n"

[System.IO.File]::WriteAllText($statusFile, $statusContent, (New-Object System.Text.UTF8Encoding $false))
Write-Host '  [OK] STATUS actualizado' -ForegroundColor Green

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 66b completado' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''