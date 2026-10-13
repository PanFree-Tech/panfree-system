# 10-fix-gitignore.ps1
# Commitea el .gitignore pendiente (bloqueo de backups).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\10-fix-gitignore.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\10-fix-gitignore.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Fix .gitignore pendiente ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que .gitignore este modificado
$status = git status --short
if (-not ($status -match "M\s+\.gitignore")) {
    Write-Host "[INFO] .gitignore no tiene cambios pendientes. Nada que hacer." -ForegroundColor Yellow
    exit 0
}

Write-Host "--- Diff de .gitignore vs HEAD ---" -ForegroundColor Yellow
Write-Host ""
git diff .gitignore
Write-Host ""

# Verificar que no haya nada mas modificado (para no commitear de mas)
$otrosCambios = $status | Where-Object { $_ -notmatch "\.gitignore" }
if ($otrosCambios) {
    Write-Host "ADVERTENCIA: hay otros cambios sin commitear:" -ForegroundColor Red
    $otrosCambios | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Este script solo commitea .gitignore." -ForegroundColor Yellow
    Write-Host "Revisa que no estes mezclando temas." -ForegroundColor Yellow
    Write-Host ""
}

if ($NoCommit) {
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:"
    Write-Host "  git add .gitignore"
    Write-Host "  git commit -m `"chore(repo): bloquear backups en .gitignore`""
    Write-Host "  git push origin main"
    exit 0
}

Write-Host ""
$resp = Read-Host "Hacer commit y push del .gitignore? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add .gitignore
git commit -m "chore(repo): bloquear backups en .gitignore"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -3