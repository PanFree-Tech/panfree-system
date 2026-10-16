# ============================================================================
# 71-orquestar-bloque-ga4.ps1
# ----------------------------------------------------------------------------
# Orquestador del bloque GA4 (59 + 60). Reemplaza al 64c que quedo con el
# bug de "powershell -File" anidado (loop infinito, deuda S20).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\71-orquestar-bloque-ga4.ps1
#
# Fix S22: usa invocacion directa (& "script.ps1") en vez de
# "powershell -ExecutionPolicy Bypass -File script.ps1" anidado.
#
# NO commitea. Solo orquesta.
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$scripts  = Join-Path $repoRoot 'scripts\docs'

$script59 = Join-Path $scripts '59-auditar-ga4.ps1'
$script60 = Join-Path $scripts '60-leer-endpoints-ga4.ps1'

Write-Host ''
Write-Host '############################################################' -ForegroundColor Magenta
Write-Host '#  ORQUESTADOR BLOQUE GA4 (59 + 60)                        #' -ForegroundColor Magenta
Write-Host '#  Fix S22: invocacion directa (no powershell -File)       #' -ForegroundColor Magenta
Write-Host '############################################################' -ForegroundColor Magenta
Write-Host ''

# --- Validaciones ----------------------------------------------------------

if (-not (Test-Path -LiteralPath $script59)) {
    Write-Host "[ERROR] No existe: $script59" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path -LiteralPath $script60)) {
    Write-Host "[ERROR] No existe: $script60" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] 59 encontrado: $script59" -ForegroundColor Green
Write-Host "[OK] 60 encontrado: $script60" -ForegroundColor Green
Write-Host ''

# --- Paso 1: 59 ------------------------------------------------------------

Write-Host '--- [1/2] Ejecutando 59-auditar-ga4.ps1 ---' -ForegroundColor Cyan
Write-Host ''

# Invocacion directa: el script se ejecuta en el contexto actual.
# NO se usa "powershell -File" (eso anida shells y causa loop en PS 5.1).
& $script59

if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 59 fallo con exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '--- [1/2] 59 completado ---' -ForegroundColor Green
Write-Host ''

# --- Paso 2: 60 ------------------------------------------------------------

Write-Host '--- [2/2] Ejecutando 60-leer-endpoints-ga4.ps1 ---' -ForegroundColor Cyan
Write-Host ''

& $script60

if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 60 fallo con exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '--- [2/2] 60 completado ---' -ForegroundColor Green
Write-Host ''

# --- Resumen ---------------------------------------------------------------

Write-Host '############################################################' -ForegroundColor Magenta
Write-Host '#  BLOQUE GA4 COMPLETADO                                   #' -ForegroundColor Magenta
Write-Host '############################################################' -ForegroundColor Magenta
Write-Host ''
Write-Host 'Reportes generados:' -ForegroundColor Green
Write-Host '  docs/audits/2026-10-13-inicial/36-audit-ga4.txt' -ForegroundColor Green
Write-Host '  docs/audits/2026-10-13-inicial/37-endpoints-ga4.txt' -ForegroundColor Green
Write-Host ''