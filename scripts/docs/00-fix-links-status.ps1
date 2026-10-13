# 00-fix-links-status.ps1
# Corrige los links relativos rotos en docs/STATUS.md
# (quitando el "../" que sobra porque STATUS.md esta en la raiz de docs/)
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\docs\00-fix-links-status.ps1 -NoCommit
#   powershell -ExecutionPolicy Bypass -File scripts\docs\00-fix-links-status.ps1

param(
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $RepoRoot

Write-Host "=== Corrigiendo links rotos en docs/STATUS.md ===" -ForegroundColor Cyan
Write-Host ""

$statusPath = Join-Path $RepoRoot "docs/STATUS.md"
if (-not (Test-Path $statusPath)) {
    Write-Host "ERROR: no existe docs/STATUS.md" -ForegroundColor Red
    exit 1
}

$content = Get-Content $statusPath -Raw -Encoding UTF8

# Mapeo de reemplazos: solo dentro de links relativos
$replacements = @(
    @{ From = '](../02-operaciones/'; To = '](02-operaciones/' },
    @{ From = '](../04-auditorias/';  To = '](04-auditorias/'  }
)

$originalContent = $content
foreach ($r in $replacements) {
    $content = $content.Replace($r.From, $r.To)
}

if ($content -eq $originalContent) {
    Write-Host "No se encontro ningun link a corregir. El archivo ya esta OK." -ForegroundColor Yellow
    exit 0
}

# Escribir sin BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($statusPath, $content, $utf8NoBom)
Write-Host "[OK] docs/STATUS.md corregido" -ForegroundColor Green

Write-Host ""
Write-Host "=== Verificando que ya no queden links rotos ===" -ForegroundColor Cyan
Write-Host ""

# Correr el verificador
& powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\docs\00-verificar-links.ps1")
$verifyExit = $LASTEXITCODE

Write-Host ""
if ($verifyExit -ne 0) {
    Write-Host "ADVERTENCIA: aun quedan links rotos. Revisar arriba." -ForegroundColor Red
    exit 1
}

Write-Host "Git status:" -ForegroundColor Yellow
git status --short

if ($NoCommit) {
    Write-Host ""
    Write-Host "=== -NoCommit activado ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para commitear manualmente:"
    Write-Host "  git add scripts/docs/00-verificar-links.ps1"
    Write-Host "  git add scripts/docs/00-fix-links-status.ps1"
    Write-Host "  git add docs/STATUS.md"
    Write-Host "  git commit -m `"chore(scripts): agregar verificador de links y corregir STATUS`""
    Write-Host "  git push origin main"
    exit 0
}

Write-Host ""
$resp = Read-Host "Hacer commit y push? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Commit cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Commiteando ===" -ForegroundColor Cyan

git add scripts/docs/00-verificar-links.ps1
git add scripts/docs/00-fix-links-status.ps1
git add docs/STATUS.md

git commit -m "chore(scripts): agregar verificador de links y corregir STATUS"
git push origin main

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
git log --oneline -3