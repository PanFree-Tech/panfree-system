<#
.SYNOPSIS
    Orquesta el cierre de la auditoria inicial (scripts 92a-92g).
.DESCRIPTION
    Ejecuta en orden los 7 scripts de cierre. Con -Commit commitea cada
    paso. Sin -Commit hace dry-run (solo modifica, no commitea).
.PARAMETER Commit
    Si esta presente, pasa -Commit a cada script hijo.
.PARAMETER NoCommit
    Dry-run explicito (default).
.EXAMPLE
    .\scripts\docs\92h-orquestar-cierre.ps1 -NoCommit
    .\scripts\docs\92h-orquestar-cierre.ps1 -Commit
.NOTES
    Script: scripts/docs/92h-orquestar-cierre.ps1
    Sesion: S26 (2026-10-17)
    Invocacion directa (& script.ps1), NO powershell -File anidado
    (bug S22: orquestador GA4 con loop infinito).
#>
[CmdletBinding()]
param([switch]$Commit, [switch]$NoCommit)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

$scripts = @(
    '92a-actualizar-plan-f2-14.ps1',
    '92b-actualizar-status-cierre.ps1',
    '92c-actualizar-resumen-ejecutivo.ps1',
    '92d-actualizar-tracking-cierre.ps1',
    '92e-cerrar-sec-001.ps1',
    '92f-crear-doc-cierre.ps1',
    '92g-agregar-bitacora-s26.ps1'
)

Write-Host ""
Write-Host "=== Orquestador de cierre de auditoria (S26) ===" -ForegroundColor Cyan
Write-Host "Modo: $(if ($Commit) { 'COMMIT' } else { 'DRY-RUN (sin commit)' })" -ForegroundColor Cyan
Write-Host ""

$errores = 0
foreach ($s in $scripts) {
    $ruta = Join-Path $PSScriptRoot $s
    if (-not (Test-Path $ruta)) {
        Write-Host "[ERROR] No existe: $s" -ForegroundColor Red
        $errores++
        continue
    }
    Write-Host ">>> Ejecutando $s" -ForegroundColor Magenta
    try {
        if ($Commit) {
            & $ruta -Commit
        } else {
            & $ruta -NoCommit
        }
    } catch {
        Write-Host "[ERROR] $s fallo: $_" -ForegroundColor Red
        $errores++
    }
    Write-Host ""
}

Write-Host "=== Fin del orquestador ===" -ForegroundColor Cyan
if ($errores -gt 0) {
    Write-Host "[WARN] $errores script(s) fallaron. Revisar manualmente." -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Todos los scripts corrieron sin error." -ForegroundColor Green
if (-not $Commit) {
    Write-Host ""
    Write-Host "Siguiente paso: revisar diff y correr con -Commit:" -ForegroundColor Cyan
    Write-Host "  git diff --stat" -ForegroundColor Cyan
    Write-Host "  .\scripts\docs\92h-orquestar-cierre.ps1 -Commit" -ForegroundColor Cyan
}