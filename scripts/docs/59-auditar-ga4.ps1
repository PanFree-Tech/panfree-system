# ============================================================================
# 59-auditar-ga4.ps1
# ----------------------------------------------------------------------------
# Auditoria de uso real de credenciales GA4 en el codigo.
#
# Resuelve SEC-023: GA4 tiene 2 juegos de credenciales coexistiendo en Vercel.
#   Grupo A (Service Account):     GA4_PROJECT_ID, GA4_PRIVATE_KEY, GA4_CLIENT_EMAIL
#   Grupo B (Measurement Protocol): GA4_API_SECRET, GA_PROPERTY_ID
#
# Solo lectura. No modifica codigo. No commitea.
# Escribe docs/audits/2026-10-13-inicial/36-audit-ga4.txt (temporal).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/59-auditar-ga4.ps1
#
# Referencia: mismos patrones que 52-auditar-n8n.ps1 y 56-auditar-apis-ia.ps1 (S18).
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot  = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcPath   = Join-Path $repoRoot 'src'
$outDir    = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial'
$outFile   = Join-Path $outDir  '36-audit-ga4.txt'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 59 - Auditoria GA4 (SEC-023)' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

# --- Validaciones previas ---------------------------------------------------

if (-not (Test-Path -LiteralPath $srcPath)) {
    Write-Host "[ERROR] No existe la carpeta src: $srcPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path -LiteralPath $outDir)) {
    Write-Host "[ERROR] No existe la carpeta de auditorias: $outDir" -ForegroundColor Red
    exit 1
}

# --- Variables GA4 a auditar ------------------------------------------------

# Grupo A - Service Account (Google Cloud)
$grupoA = @(
    'GA4_PROJECT_ID',
    'GA4_PRIVATE_KEY',
    'GA4_CLIENT_EMAIL'
)

# Grupo B - Measurement Protocol
$grupoB = @(
    'GA4_API_SECRET',
    'GA_PROPERTY_ID'
)

# Contexto adicional
$contexto = @(
    'NEXT_PUBLIC_GA_MEASUREMENT_ID'
)

$todas = $grupoA + $grupoB + $contexto

# --- Acumuladores -----------------------------------------------------------

$lineas = New-Object System.Collections.Generic.List[string]
$hitTotal = 0

function Add-Linea {
    param([string]$Texto)
    $lineas.Add($Texto) | Out-Null
    Write-Host $Texto
}

# --- Encabezado del reporte -------------------------------------------------

$fecha = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

Add-Linea "=== AUDITORIA GA4 - 2026-10-13-inicial ==="
Add-Linea "Fecha: $fecha"
Add-Linea "Script: scripts/docs/59-auditar-ga4.ps1"
Add-Linea "Objetivo: resolver SEC-023 (2 juegos de credenciales GA4 en Vercel)"
Add-Linea ""

Add-Linea "--- Variables auditadas ---"
Add-Linea ""
Add-Linea "[Grupo A] Service Account (Google Cloud):"
foreach ($v in $grupoA) { Add-Linea "  - $v" }
Add-Linea ""
Add-Linea "[Grupo B] Measurement Protocol:"
foreach ($v in $grupoB) { Add-Linea "  - $v" }
Add-Linea ""
Add-Linea "[Contexto] Measurement ID publico:"
foreach ($v in $contexto) { Add-Linea "  - $v" }
Add-Linea ""

# --- Auditoria por variable -------------------------------------------------

Add-Linea "============================================================"
Add-Linea " RESULTADOS POR VARIABLE"
Add-Linea "============================================================"
Add-Linea ""

$archivosSrc = Get-ChildItem -Path $srcPath -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx,*.mjs -ErrorAction SilentlyContinue

if (-not $archivosSrc) {
    Write-Host "[WARN] No se encontraron archivos fuente en src/" -ForegroundColor Yellow
}

foreach ($var in $todas) {

    $hits = @()

    foreach ($archivo in $archivosSrc) {
        $contenido = Get-Content -LiteralPath $archivo.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $contenido) { continue }

        if ($contenido.Contains($var)) {
            $rel = $archivo.FullName.Substring($repoRoot.Length + 1)
            $matches = ([regex]::Matches($contenido, [regex]::Escape($var))).Count
            $hits += [pscustomobject]@{
                Archivo = $rel
                Veces   = $matches
            }
        }
    }

    $totalVar = ($hits | Measure-Object -Property Veces -Sum).Sum
    if (-not $totalVar) { $totalVar = 0 }

    Add-Linea "------------------------------------------------------------"
    Add-Linea "Variable: $var"
    Add-Linea "Total coincidencias: $totalVar"
    if ($hits.Count -gt 0) {
        Add-Linea "Archivos:"
        foreach ($h in $hits) {
            Add-Linea ("  {0}  ({1} vez/veces)" -f $h.Archivo, $h.Veces)
        }
    } else {
        Add-Linea "  (sin coincidencias en src/)"
    }
    Add-Linea ""

    $hitTotal += $totalVar
}

# --- Resumen ----------------------------------------------------------------

Add-Linea "============================================================"
Add-Linea " RESUMEN"
Add-Linea "============================================================"
Add-Linea ""
Add-Linea "Total coincidencias en src/: $hitTotal"
Add-Linea ""

# Interpretacion preliminar por grupo
$hitsA = 0
$hitsB = 0
$hitsC = 0

foreach ($var in $grupoA) {
    $n = 0
    foreach ($archivo in $archivosSrc) {
        $c = Get-Content -LiteralPath $archivo.FullName -Raw -ErrorAction SilentlyContinue
        if ($c -and $c.Contains($var)) { $n++ }
    }
    $hitsA += $n
}
foreach ($var in $grupoB) {
    $n = 0
    foreach ($archivo in $archivosSrc) {
        $c = Get-Content -LiteralPath $archivo.FullName -Raw -ErrorAction SilentlyContinue
        if ($c -and $c.Contains($var)) { $n++ }
    }
    $hitsB += $n
}
foreach ($var in $contexto) {
    $n = 0
    foreach ($archivo in $archivosSrc) {
        $c = Get-Content -LiteralPath $archivo.FullName -Raw -ErrorAction SilentlyContinue
        if ($c -and $c.Contains($var)) { $n++ }
    }
    $hitsC += $n
}

Add-Linea "Presencia por grupo (cantidad de archivos con al menos 1 coincidencia):"
Add-Linea "  Grupo A (Service Account):        $hitsA archivo(s)"
Add-Linea "  Grupo B (Measurement Protocol):   $hitsB archivo(s)"
Add-Linea "  Contexto (Measurement ID):        $hitsC archivo(s)"
Add-Linea ""

Add-Linea "--- Proximos pasos sugeridos ---"
Add-Linea ""
if ($hitsA -eq 0 -and $hitsB -gt 0) {
    Add-Linea "Grupo A NO se usa, Grupo B SI. Accion: eliminar Grupo A de Vercel y .env.example."
} elseif ($hitsB -eq 0 -and $hitsA -gt 0) {
    Add-Linea "Grupo B NO se usa, Grupo A SI. Accion: eliminar Grupo B de Vercel y .env.example."
} elseif ($hitsA -gt 0 -and $hitsB -gt 0) {
    Add-Linea "AMBOS grupos se usan. Accion: rotar los dos (verificacion manual adicional)."
} else {
    Add-Linea "NINGUN grupo aparece en src/. Verificar manualmente antes de eliminar."
    Add-Linea "Revisar tambien: scripts/, docs/, endpoints dinamicos, o strings parciales."
}
Add-Linea ""
Add-Linea "Revisar archivos individuales con:"
Add-Linea "  Select-String -Path src\**\*.js,src\**\*.jsx -Pattern 'GA4_PROJECT_ID|GA4_PRIVATE_KEY|GA4_CLIENT_EMAIL'"
Add-Linea "  Select-String -Path src\**\*.js,src\**\*.jsx -Pattern 'GA4_API_SECRET|GA_PROPERTY_ID'"
Add-Linea ""

Add-Linea "--- Fin del reporte ---"

# --- Escribir archivo -------------------------------------------------------

$contenidoFinal = ($lineas -join "`r`n") + "`r`n"

[System.IO.File]::WriteAllText($outFile, $contenidoFinal, (New-Object System.Text.UTF8Encoding $false))

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host " Reporte escrito en:" -ForegroundColor Green
Write-Host "   $outFile" -ForegroundColor Green
Write-Host " Total coincidencias: $hitTotal" -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Siguiente paso: revisar el resumen del reporte y decidir' -ForegroundColor Yellow
Write-Host 'si eliminar un grupo de Vercel o rotar ambos (SEC-023).' -ForegroundColor Yellow
Write-Host ''