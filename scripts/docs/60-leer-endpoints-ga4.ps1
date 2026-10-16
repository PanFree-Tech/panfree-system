# ============================================================================
# 60-leer-endpoints-ga4.ps1
# ----------------------------------------------------------------------------
# Vuelca el contenido de los 3 archivos que consumen credenciales GA4.
# Necesario para disenar la rotacion de F2-11 (SEC-023).
#
# Solo lectura. No modifica codigo. No commitea.
# Escribe docs/audits/2026-10-13-inicial/37-endpoints-ga4.txt (temporal).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/60-leer-endpoints-ga4.ps1
#
# Referencia: mismo patron que 59-auditar-ga4.ps1 (S19).
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot  = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outDir    = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial'
$outFile   = Join-Path $outDir  '37-endpoints-ga4.txt'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 60 - Leer endpoints GA4 (para F2-11)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $outDir)) {
    Write-Host "[ERROR] No existe la carpeta: $outDir" -ForegroundColor Red
    exit 1
}

# --- Archivos a leer --------------------------------------------------------

$archivosRel = @(
    'src\app\api\admin\ga-metrics\route.js',
    'src\app\api\ga4\measurement\route.js',
    'src\components\GAScript.jsx'
)

$lineas = New-Object System.Collections.Generic.List[string]

function Add-Linea {
    param([string]$Texto)
    $lineas.Add($Texto) | Out-Null
    Write-Host $Texto
}

# --- Encabezado -------------------------------------------------------------

$fecha = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

Add-Linea "=== ENDPOINTS GA4 - Lectura para F2-11 (SEC-023) ==="
Add-Linea "Fecha: $fecha"
Add-Linea "Script: scripts/docs/60-leer-endpoints-ga4.ps1"
Add-Linea ""
Add-Linea "Objetivo: ver como se consumen las variables GA4 para disenar la rotacion."
Add-Linea ""
Add-Linea "Variables rotables confirmadas por auditoria 59:"
Add-Linea "  - GA4_PRIVATE_KEY (Service Account, Google Cloud Console)"
Add-Linea "  - GA4_API_SECRET  (Measurement Protocol, GA4 Admin)"
Add-Linea ""

# --- Leer cada archivo ------------------------------------------------------

$ok = 0
$fail = 0

foreach ($rel in $archivosRel) {
    $full = Join-Path $repoRoot $rel

    Add-Linea "============================================================"
    Add-Linea " ARCHIVO: $rel"
    Add-Linea "============================================================"
    Add-Linea ""

    if (-not (Test-Path -LiteralPath $full)) {
        Add-Linea "  [NO EXISTE] $full"
        Add-Linea ""
        $fail++
        continue
    }

    $contenido = [System.IO.File]::ReadAllText($full)

    # Normalizar saltos de linea
    $contenido = $contenido -replace "`r`n", "`n"
    $contenido = $contenido -replace "`r", "`n"
    $arrLineas = $contenido -split "`n"

    $num = 1
    foreach ($l in $arrLineas) {
        $numStr = "{0,4}" -f $num
        Add-Linea "$numStr | $l"
        $num++
    }

    Add-Linea ""
    Add-Linea "  [OK] $($arrLineas.Count) lineas leidas"
    Add-Linea ""
    $ok++
}

# --- Resumen ----------------------------------------------------------------

Add-Linea "============================================================"
Add-Linea " RESUMEN"
Add-Linea "============================================================"
Add-Linea ""
Add-Linea "Archivos leidos OK: $ok"
Add-Linea "Archivos faltantes: $fail"
Add-Linea ""
Add-Linea "--- Checklist para el analisis ---"
Add-Linea ""
Add-Linea "1. Confirmar como se lee GA4_PRIVATE_KEY (JSON inline? process.env directo?)."
Add-Linea "2. Confirmar como se usa GA4_CLIENT_EMAIL y GA_PROPERTY_ID."
Add-Linea "3. Confirmar como se usa GA4_API_SECRET (query string? body?)."
Add-Linea "4. Verificar si NEXT_PUBLIC_GA_MEASUREMENT_ID esta hardcodeado (SEC-017)."
Add-Linea "5. Verificar si hay fallbacks silenciosos que ocultarian una key vencida."
Add-Linea "6. Identificar donde se necesita redeploy vs hot reload."
Add-Linea ""
Add-Linea "--- Fin del reporte ---"

# --- Escribir ---------------------------------------------------------------

$contenidoFinal = ($lineas -join "`r`n") + "`r`n"
[System.IO.File]::WriteAllText($outFile, $contenidoFinal, (New-Object System.Text.UTF8Encoding $false))

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host " Reporte escrito en:" -ForegroundColor Green
Write-Host "   $outFile" -ForegroundColor Green
Write-Host " Archivos OK: $ok  |  Faltantes: $fail" -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Siguiente paso: pegar el contenido del .txt en el chat.' -ForegroundColor Yellow
Write-Host ''