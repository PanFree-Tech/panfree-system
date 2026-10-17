<#
.SYNOPSIS
    Marca SEC-001 como Cerrado en 01-secretos-git.md.
.DESCRIPTION
    SEC-001 se cerro tecnicamente en S24 (F4-01, purga de historial).
    Este script actualiza el documento del hallazgo.
.PARAMETER Commit
    Si esta presente, commitea el cambio.
.NOTES
    Script: scripts/docs/92e-cerrar-sec-001.ps1
    Sesion: S26 (2026-10-17)
#>
[CmdletBinding()]
param([switch]$Commit, [switch]$NoCommit)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

$archivo = 'docs/audits/2026-10-13-inicial/01-secretos-git.md'
if (-not (Test-Path $archivo)) { throw "No existe: $archivo" }

$bytes  = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$texto  = [System.Text.Encoding]::UTF8.GetString($bytes)
$esCRLF = ([regex]::Matches($texto, "`r`n")).Count -gt 0
$eol    = if ($esCRLF) { "`r`n" } else { "`n" }

if ($texto.Contains('**Estado:** Cerrado (S24, F4-01')) {
    Write-Host "[SKIP] 92e: SEC-001 ya esta cerrado (idempotente)." -ForegroundColor Yellow
    return
}

$viejo = @(
    '**Severidad:** Critica',
    '**Estado:** Abierto',
    '**Fecha:** 2026-10-13'
) -join $eol

$nuevo = @(
    '**Severidad:** Critica',
    '**Estado:** Cerrado (S24, F4-01 - purga de historial completada)',
    '**Fecha:** 2026-10-13',
    '**Cierre:** 2026-10-17 (ver [41-f4-01-purga-historial.md](./41-f4-01-purga-historial.md))'
) -join $eol

if (-not $texto.Contains($viejo)) {
    throw "[ERROR] 92e: no encuentro el bloque de cabecera esperado en $archivo."
}

$texto = $texto.Replace($viejo, $nuevo)
$bytesOrig = [System.IO.File]::ReadAllBytes((Resolve-Path $archivo).Path)
$teniaBom  = ($bytesOrig.Length -ge 3 -and $bytesOrig[0] -eq 0xEF -and $bytesOrig[1] -eq 0xBB -and $bytesOrig[2] -eq 0xBF)
$enc       = New-Object System.Text.UTF8Encoding($teniaBom)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $texto, $enc)
Write-Host "[OK] 92e: SEC-001 marcado Cerrado." -ForegroundColor Green

$verif = Get-Content $archivo -Raw
if (-not $verif.Contains('**Estado:** Cerrado (S24, F4-01')) { throw "[ERROR] 92e: verificacion fallo." }

if ($Commit) {
    git add $archivo
    git commit -m "docs(audit): cerrar SEC-001 (purga de historial, S24)"
} else {
    Write-Host "[DRY-RUN] 92e sin commit." -ForegroundColor Cyan
}