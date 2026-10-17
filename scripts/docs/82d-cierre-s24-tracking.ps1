# scripts/docs/82d-cierre-s24-tracking.ps1
# S24 - Tracking: SEC-001 -> Cerrado, header, resumen
# Preserva line endings. Idempotente.

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\audits\2026-10-13-inicial\06-hallazgos-tracking.md"
$rutaAbs = (Resolve-Path $archivo).Path

$bytes = [System.IO.File]::ReadAllBytes($rutaAbs)
$contenido = [System.Text.Encoding]::UTF8.GetString($bytes)

$cuentaCRLF = ([regex]::Matches($contenido, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($contenido, "`n")).Count
$esCRLF = ($cuentaCRLF -gt ($cuentaLF - $cuentaCRLF))
$le = if ($esCRLF) { "`r`n" } else { "`n" }
Write-Host "[INFO] Line ending: $(if ($esCRLF) { 'CRLF' } else { 'LF' })" -ForegroundColor DarkGray

if ($contenido.Contains('**Ultima actualizacion:** 2026-10-17 (fin Sesion 24)')) {
    Write-Host "[SKIP] Tracking ya actualizado a S24." -ForegroundColor Yellow
    exit 0
}

$antesHeader = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 22)'
$despuesHeader = '**Ultima actualizacion:** 2026-10-17 (fin Sesion 24)'
if ($contenido.Contains($antesHeader)) {
    $contenido = $contenido.Replace($antesHeader, $despuesHeader)
    Write-Host "[OK] Header actualizado." -ForegroundColor Green
} else {
    Write-Host "[WARN] Header no matcheo el patron esperado." -ForegroundColor Yellow
}

$antesSEC001 = '| SEC-001 | .env en historial Git | F4 | P0 | Abierto | - |'
$despuesSEC001 = '| SEC-001 | .env en historial Git | F4 | P0 | Cerrado | 82a (S24) |'
if ($contenido.Contains($antesSEC001)) {
    $contenido = $contenido.Replace($antesSEC001, $despuesSEC001)
    Write-Host "[OK] SEC-001 -> Cerrado." -ForegroundColor Green
} elseif ($contenido.Contains($despuesSEC001)) {
    Write-Host "[SKIP] SEC-001 ya cerrado." -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] No se encontro la fila de SEC-001." -ForegroundColor Red
    exit 1
}

$antesResumen = '| Cerrado | 44 |'
$despuesResumen = '| Cerrado | 45 |'
if ($contenido.Contains($antesResumen)) {
    $contenido = $contenido.Replace($antesResumen, $despuesResumen)
    Write-Host "[OK] Resumen Cerrado: 44 -> 45." -ForegroundColor Green
}

$antesAbierto = '| Abierto | 25 |'
$despuesAbierto = '| Abierto | 24 |'
if ($contenido.Contains($antesAbierto)) {
    $contenido = $contenido.Replace($antesAbierto, $despuesAbierto)
    Write-Host "[OK] Resumen Abierto: 25 -> 24." -ForegroundColor Green
}

$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $contenido, $utf8SinBom)

$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)

if (-not $verif.Contains($despuesSEC001)) {
    Write-Host "[ERROR] Post-write: SEC-001 no quedo cerrado." -ForegroundColor Red
    exit 1
}
if (-not $verif.Contains($despuesHeader)) {
    Write-Host "[ERROR] Post-write: header no actualizado." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Tracking actualizado." -ForegroundColor Green