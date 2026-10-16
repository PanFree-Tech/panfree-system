# scripts/docs/75-fix-plan-f3-08-09.ps1
# S23 - Marcar F3-08 y F3-09 como OK en PLAN-DE-TRABAJO.md
# Idempotente. Uso: .\75-fix-plan-f3-08-09.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

# $PSScriptRoot = scripts\docs ; repoRoot = dos niveles arriba
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\operations\PLAN-DE-TRABAJO.md"

if (-not (Test-Path $archivo)) {
    Write-Host "[ERROR] No existe: $archivo" -ForegroundColor Red
    exit 1
}

$contenido = Get-Content $archivo -Raw

# --- Idempotencia: verificar si YA esta aplicado ---
$marcaF308 = '| F3-08 | CONF-001: ESLint en build | P2 | S | OK | ignoreDuringBuilds: false (commit a9fa9a7b) |'
$marcaF309 = '| F3-09 | CONF-002: headers de seguridad | P2 | S | OK | 4 headers activos (commit ce7cdd70) |'

if ($contenido.Contains($marcaF308) -and $contenido.Contains($marcaF309)) {
    Write-Host "[SKIP] F3-08 y F3-09 ya estan marcados como OK." -ForegroundColor Yellow
    exit 0
}

# --- Backup ---
$backup = "$archivo.bak-s23-75"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Reemplazo 1: F3-08 ---
$antesF308 = '| F3-08 | CONF-001: ESLint en build | P2 | S | Pendiente | ignoreDuringBuilds: false |'
if ($contenido.Contains($antesF308)) {
    $contenido = $contenido.Replace($antesF308, $marcaF308)
    Write-Host "[OK] F3-08 reemplazado." -ForegroundColor Green
} elseif (-not $contenido.Contains($marcaF308)) {
    Write-Host "[ERROR] No se encontro patron F3-08 (ni Pendiente ni OK)." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
} else {
    Write-Host "[SKIP] F3-08 ya estaba OK." -ForegroundColor Yellow
}

# --- Reemplazo 2: F3-09 ---
$antesF309 = '| F3-09 | CONF-002: headers de seguridad | P2 | S | Pendiente | CSP, HSTS, X-Frame-Options |'
if ($contenido.Contains($antesF309)) {
    $contenido = $contenido.Replace($antesF309, $marcaF309)
    Write-Host "[OK] F3-09 reemplazado." -ForegroundColor Green
} elseif (-not $contenido.Contains($marcaF309)) {
    Write-Host "[ERROR] No se encontro patron F3-09 (ni Pendiente ni OK)." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
} else {
    Write-Host "[SKIP] F3-09 ya estaba OK." -ForegroundColor Yellow
}

# --- Escribir con UTF-8 SIN BOM (evita el drama de S11/S12) ---
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $contenido, $utf8SinBom)

# --- Verificacion post-write ---
$verificacion = Get-Content $archivo -Raw
if (-not ($verificacion.Contains($marcaF308) -and $verificacion.Contains($marcaF309))) {
    Write-Host "[ERROR] Verificacion post-write fallo. Restaurando backup." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

Write-Host "[OK] Verificacion post-write: F3-08 y F3-09 en OK." -ForegroundColor Green
Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): marcar F3-08 y F3-09 como OK en PLAN"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado. Verifica con git diff." -ForegroundColor Cyan
}