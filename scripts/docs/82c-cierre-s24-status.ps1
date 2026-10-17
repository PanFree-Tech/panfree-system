# scripts/docs/82c-cierre-s24-status.ps1
# S24 - Actualizar STATUS.md: header + bloque S24
# Preserva line endings. Idempotente.

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\STATUS.md"
$rutaAbs = (Resolve-Path $archivo).Path

$bytes = [System.IO.File]::ReadAllBytes($rutaAbs)
$contenido = [System.Text.Encoding]::UTF8.GetString($bytes)

$cuentaCRLF = ([regex]::Matches($contenido, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($contenido, "`n")).Count
$esCRLF = ($cuentaCRLF -gt ($cuentaLF - $cuentaCRLF))
$le = if ($esCRLF) { "`r`n" } else { "`n" }
Write-Host "[INFO] Line ending: $(if ($esCRLF) { 'CRLF' } else { 'LF' })" -ForegroundColor DarkGray

if ($contenido.Contains('**2026-10-17 - Sesion 24 (ENV) - COMPLETA**')) {
    Write-Host "[SKIP] S24 ya esta en STATUS." -ForegroundColor Yellow
    exit 0
}

$antesHeader = '**Ultima actualizacion:** 2026-10-17 (fin Sesion 23)'
$despuesHeader = '**Ultima actualizacion:** 2026-10-17 (fin Sesion 24)'
if ($contenido.Contains($antesHeader)) {
    $contenido = $contenido.Replace($antesHeader, $despuesHeader)
    Write-Host "[OK] Header actualizado." -ForegroundColor Green
} elseif ($contenido.Contains($despuesHeader)) {
    Write-Host "[SKIP] Header ya actualizado." -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] No se encontro el header esperado." -ForegroundColor Red
    exit 1
}

$marcaS23 = '**2026-10-17 - Sesion 23 (ENV) - COMPLETA**'
$idxS23 = $contenido.IndexOf($marcaS23)
if ($idxS23 -lt 0) {
    Write-Host "[ERROR] No se encontro S23 en STATUS." -ForegroundColor Red
    exit 1
}

$idxDespues = $contenido.IndexOf("`n## ", $idxS23)
if ($idxDespues -lt 0) { $idxDespues = $contenido.Length }

$bloqueS24 = @(
    '',
    '---',
    '',
    '**2026-10-17 - Sesion 24 (ENV) - COMPLETA**',
    '- F4-01: purga de historial de Git (SEC-001).',
    '  - Backup previo (bundle 73MB + mirror 68MB).',
    '  - git filter-repo con --force: 363 commits, 32 con .env* reescritos.',
    '  - HEAD: 691ea92c -> 7526022c.',
    '  - Verificacion: 0 .env en historial, .env.example intacto.',
    '  - Push force OK. Doc 41-f4-01-purga-historial.md creado.',
    '- F4-02: ticket a GitHub Support enviado.',
    '- Progreso: 81% (38/47) sin cambios (F4-01 cierra SEC-001, pero fase F4 sigue en 0/8).',
    ''
)

$contenido = $contenido.Substring(0, $idxDespues) + ($bloqueS24 -join $le) + $contenido.Substring($idxDespues)

$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $contenido, $utf8SinBom)

$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)
if (-not $verif.Contains('**2026-10-17 - Sesion 24 (ENV) - COMPLETA**')) {
    Write-Host "[ERROR] Post-write: no se encontro bloque S24." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] STATUS.md actualizado." -ForegroundColor Green