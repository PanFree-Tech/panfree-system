# ============================================================================
# 64a-reescribir-59-auditar-ga4.ps1
# ----------------------------------------------------------------------------
# Reescribe scripts/docs/59-auditar-ga4.ps1 con SCOPE DE TODO EL REPO.
#
# Motivo (deuda S19): el 59 original solo miraba src/. GA4 puede aparecer
# en scripts, docs, endpoints dinamicos, o strings parciales.
#
# Patron: mismo que scripts 54 (auditar-secrets, S18) + 52 + 56.
#
# Idempotente: si el 59 ya tiene la marca SCOPE-TOTAL-S20, no hace nada.
#
# Dry run por defecto. Requiere -Aplicar para escribir.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/64a-reescribir-59-auditar-ga4.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/docs/64a-reescribir-59-auditar-ga4.ps1 -Aplicar
# ============================================================================

param(
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

$repoRoot   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$targetFile = Join-Path $repoRoot 'scripts\docs\59-auditar-ga4.ps1'
$backupDir  = Join-Path $repoRoot '.backup-s20'
$backupFile = Join-Path $backupDir '59-auditar-ga4.ps1.bak'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 64a - Reescribir 59-auditar-ga4 con scope total' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

# --- Validaciones -----------------------------------------------------------

if (-not (Test-Path -LiteralPath $targetFile)) {
    Write-Host "[ERROR] No existe: $targetFile" -ForegroundColor Red
    exit 1
}

$contenidoActual = [System.IO.File]::ReadAllText($targetFile)

# Idempotencia: si ya tiene la marca, no reescribir
if ($contenidoActual.Contains('SCOPE-TOTAL-S20')) {
    Write-Host '[INFO] El 59 ya fue reescrito con scope total (SCOPE-TOTAL-S20).' -ForegroundColor Yellow
    Write-Host '[INFO] Nada que hacer. Saliendo.' -ForegroundColor Yellow
    exit 0
}

Write-Host "[OK] Archivo target: $targetFile" -ForegroundColor Green
Write-Host "[OK] Tamano actual:  $($contenidoActual.Length) caracteres" -ForegroundColor Green
Write-Host ''

if (-not $Aplicar) {
    Write-Host '[DRY RUN] No se escribe nada. Agregar -Aplicar para aplicar.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Acciones que se realizarian:' -ForegroundColor Yellow
    Write-Host "  1. Backup de $targetFile" -ForegroundColor Yellow
    Write-Host "     -> $backupFile" -ForegroundColor Yellow
    Write-Host '  2. Sobrescribir con version SCOPE-TOTAL-S20.' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# --- Backup -----------------------------------------------------------------

if (-not (Test-Path -LiteralPath $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "[OK] Carpeta de backup creada: $backupDir" -ForegroundColor Green
}

Copy-Item -LiteralPath $targetFile -Destination $backupFile -Force
Write-Host "[OK] Backup: $backupFile" -ForegroundColor Green

# --- Contenido nuevo --------------------------------------------------------

$nuevo = @'
# ============================================================================
# 59-auditar-ga4.ps1  [SCOPE-TOTAL-S20]
# ----------------------------------------------------------------------------
# Auditoria de uso real de credenciales GA4 en TODO el repositorio.
#
# Resuelve SEC-023: GA4 tiene 2 juegos de credenciales coexistiendo en Vercel.
#   Grupo A (Service Account):     GA4_PROJECT_ID, GA4_PRIVATE_KEY, GA4_CLIENT_EMAIL
#   Grupo B (Measurement Protocol): GA4_API_SECRET, GA_PROPERTY_ID
#
# SCOPE-TOTAL-S20: a diferencia de la version S19 (solo src/), esta version
# recorre todo el repo excepto node_modules, .next, .git, backups, out, dist
# y archivos temporales (dump-*, *.log, *.backup*, *-audit-*.txt, *-endpoints-*.txt).
#
# Solo lectura. No modifica codigo. No commitea.
# Escribe docs/audits/2026-10-13-inicial/36-audit-ga4.txt (temporal).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/docs/59-auditar-ga4.ps1
#
# Referencia: script 54 (auditar-secrets, S18) y 52 (auditar-n8n, S18).
# ============================================================================

$ErrorActionPreference = 'Stop'

$repoRoot  = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outDir    = Join-Path $repoRoot 'docs\audits\2026-10-13-inicial'
$outFile   = Join-Path $outDir  '36-audit-ga4.txt'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' 59 - Auditoria GA4 (SEC-023) - SCOPE TOTAL' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

# --- Validaciones previas ---------------------------------------------------

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

# --- Exclusiones de scope ---------------------------------------------------

$excluirCarpetas = @(
    'node_modules',
    '.next',
    '.git',
    'backups',
    'out',
    'dist'
)

$excluirPatrones = @(
    '*.log',
    'dump-*.txt',
    '*.backup',
    '*.backup.*',
    '*-audit-*.txt',
    '*-endpoints-*.txt'
)

$incluirExtensiones = @(
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.json', '.md',
    '.env',
    '.yml', '.yaml',
    '.ps1', '.psm1',
    '.sql'
)

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

Add-Linea "=== AUDITORIA GA4 (SCOPE TOTAL) - 2026-10-13-inicial ==="
Add-Linea "Fecha: $fecha"
Add-Linea "Script: scripts/docs/59-auditar-ga4.ps1 [SCOPE-TOTAL-S20]"
Add-Linea "Objetivo: resolver SEC-023 (2 juegos de credenciales GA4 en Vercel)"
Add-Linea ""
Add-Linea "Scope: TODO el repo, excepto:"
Add-Linea ("  Carpetas:  " + ($excluirCarpetas -join ', '))
Add-Linea ("  Archivos:  " + ($excluirPatrones -join ', '))
Add-Linea ("  Extensiones incluidas: " + ($incluirExtensiones -join ' '))
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

# --- Recolectar archivos ----------------------------------------------------

$todos = Get-ChildItem -Path $repoRoot -Recurse -File -ErrorAction SilentlyContinue

$archivosFiltrados = $todos | Where-Object {
    $rel = $_.FullName.Substring($repoRoot.Length + 1)

    # Excluir por carpeta
    $excluir = $false
    foreach ($c in $excluirCarpetas) {
        $patron = [regex]::Escape("\$c\")
        if ($rel -match $patron -or $rel -like "$c\*" -or $rel -like "*\$c\*") {
            $excluir = $true
            break
        }
    }
    if ($excluir) { return $false }

    # Excluir por patron de archivo
    foreach ($p in $excluirPatrones) {
        if ($_.Name -like $p) { return $false }
    }

    # Incluir por extension
    $ext = $_.Extension.ToLower()
    if ($incluirExtensiones -contains $ext) { return $true }
    # .env* (sin extension o .env.local, .env.production, etc)
    if ($_.Name -like '.env*') { return $true }

    return $false
}

$archivosFiltrados = @($archivosFiltrados)
$totalArchivos = $archivosFiltrados.Count

Add-Linea "============================================================"
Add-Linea " RESULTADOS POR VARIABLE"
Add-Linea "============================================================"
Add-Linea ""
Add-Linea "Archivos en scope: $totalArchivos"
Add-Linea ""

# --- Auditoria por variable -------------------------------------------------

foreach ($var in $todas) {

    $hits = @()

    foreach ($archivo in $archivosFiltrados) {
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
        Add-Linea "  (sin coincidencias en todo el repo)"
    }
    Add-Linea ""

    $hitTotal += $totalVar
}

# --- Resumen por grupo ------------------------------------------------------

function Contar-Grupo {
    param([array]$vars)
    $n = 0
    foreach ($var in $vars) {
        foreach ($archivo in $archivosFiltrados) {
            $c = Get-Content -LiteralPath $archivo.FullName -Raw -ErrorAction SilentlyContinue
            if ($c -and $c.Contains($var)) { $n++; break }
        }
    }
    return $n
}

$hitsA = Contar-Grupo -vars $grupoA
$hitsB = Contar-Grupo -vars $grupoB
$hitsC = Contar-Grupo -vars $contexto

Add-Linea "============================================================"
Add-Linea " RESUMEN"
Add-Linea "============================================================"
Add-Linea ""
Add-Linea "Total coincidencias en repo: $hitTotal"
Add-Linea ""
Add-Linea "Presencia por grupo (archivos con al menos 1 coincidencia):"
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
    Add-Linea "NINGUN grupo aparece. Verificar manualmente antes de eliminar."
    Add-Linea "Revisar tambien: scripts/, docs/, endpoints dinamicos, o strings parciales."
}
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
'@

[System.IO.File]::WriteAllText($targetFile, $nuevo, (New-Object System.Text.UTF8Encoding $false))

Write-Host "[OK] Reescrito: $targetFile" -ForegroundColor Green
Write-Host "[OK] Nuevo tamano: $($nuevo.Length) caracteres" -ForegroundColor Green
Write-Host ''
Write-Host 'Siguiente: correr 64b (reescribir 60) y luego 64c (orquestar).' -ForegroundColor Yellow
Write-Host ''