# scripts/docs/76-fix-tracking-aceptados.ps1
# S23 - Corregir conteo de Aceptados en tracking (3 -> 2)
# Idempotente. Uso: .\76-fix-tracking-aceptados.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md"

if (-not (Test-Path $archivo)) {
    Write-Host "[ERROR] No existe: $archivo" -ForegroundColor Red
    exit 1
}

$contenido = Get-Content $archivo -Raw

# --- Idempotencia ---
$marca = '| Aceptado | 2 |'
if ($contenido.Contains($marca)) {
    Write-Host "[SKIP] El conteo ya esta corregido (Aceptado = 2)." -ForegroundColor Yellow
    exit 0
}

# --- Backup ---
$backup = "$archivo.bak-s23-76"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Reemplazo literal ---
$antes = '| Aceptado | 3 |'
if (-not $contenido.Contains($antes)) {
    Write-Host "[ERROR] No se encontro el patron: $antes" -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

$contenido = $contenido.Replace($antes, $marca)
Write-Host "[OK] Reemplazo aplicado: 'Aceptado | 3' -> 'Aceptado | 2'." -ForegroundColor Green

# --- Escribir UTF-8 sin BOM ---
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $contenido, $utf8SinBom)

# --- Verificacion post-write ---
$verificacion = Get-Content $archivo -Raw
if (-not $verificacion.Contains($marca)) {
    Write-Host "[ERROR] Verificacion post-write fallo. Restaurando backup." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# Verificar tambien que NO quedo el 3 suelto en el bloque resumen
if ($verificacion -match '(?m)^\| Aceptado \| 3 \|') {
    Write-Host "[ERROR] Todavia queda 'Aceptado | 3' en el archivo. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

Write-Host "[OK] Verificacion post-write: Aceptado = 2." -ForegroundColor Green
Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): corregir conteo de Aceptados en tracking (3->2)"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}