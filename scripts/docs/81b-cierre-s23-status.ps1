# scripts/docs/81b-cierre-s23-status.ps1
# S23 - Actualizar STATUS.md: header + metricas + agregar bloque S23 al final de Ultima Actividad
# Preserva line endings (STATUS es LF).
# Idempotente. Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\81b-cierre-s23-status.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\STATUS.md"
$rutaAbs = (Resolve-Path $archivo).Path

# --- Leer byte-safe ---
$bytes = [System.IO.File]::ReadAllBytes($rutaAbs)
$contenido = [System.Text.Encoding]::UTF8.GetString($bytes)

# --- Detectar line ending ---
$cuentaCRLF = ([regex]::Matches($contenido, "`r`n")).Count
$cuentaLF   = ([regex]::Matches($contenido, "`n")).Count
$esCRLF = ($cuentaCRLF -gt ($cuentaLF - $cuentaCRLF))
$le = if ($esCRLF) { "`r`n" } else { "`n" }
Write-Host "[INFO] Line ending: $(if ($esCRLF) { 'CRLF' } else { 'LF' })" -ForegroundColor DarkGray

# --- Idempotencia ---
if ($contenido.Contains('**2026-10-17 - Sesion 23 (ENV) - COMPLETA**')) {
    Write-Host "[SKIP] S23 ya esta en STATUS." -ForegroundColor Yellow
    exit 0
}

# --- Backup ---
$backup = "$archivo.bak-s23-81b"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Cambio 1: header "Ultima actualizacion" ---
$antesHeader = '**Ultima actualizacion:** 2026-10-16 (fin Sesion 22)'
$despuesHeader = '**Ultima actualizacion:** 2026-10-17 (fin Sesion 23)'
if ($contenido.Contains($antesHeader)) {
    $contenido = $contenido.Replace($antesHeader, $despuesHeader)
    Write-Host "[OK] Header actualizado." -ForegroundColor Green
} elseif ($contenido.Contains($despuesHeader)) {
    Write-Host "[SKIP] Header ya actualizado." -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] No se encontro el header esperado." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# --- Cambio 2: agregar bloque S23 al final de "Ultima actividad" ---
# La seccion 5 termina en el ultimo bloque "Sesion 22". Insertar S23 despues.
$marcaS22 = '**2026-10-16 - Sesion 22 (ENV) - COMPLETA**'
$idxS22 = $contenido.IndexOf($marcaS22)
if ($idxS22 -lt 0) {
    Write-Host "[ERROR] No se encontro S22 en STATUS." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# Buscar el final del bloque S22: el proximo "\n## " o "\n---\n"
$idxDespues = $contenido.IndexOf("`n## ", $idxS22)
if ($idxDespues -lt 0) { $idxDespues = $contenido.Length }

$bloqueS23 = @(
    '',
    '---',
    '',
    '**2026-10-17 - Sesion 23 (ENV) - COMPLETA**',
    '- Bloque 0: fix de documentacion post-S22 (6 archivos).',
    '  - PLAN-DE-TRABAJO: F3-08 y F3-09 marcados OK (44a44c21).',
    '  - Tracking: Aceptados 3 -> 2 (51f82788).',
    '  - BITACORA: cierre S18 reformateado (7039034b).',
    '  - STATUS: S16-S22 reordenadas (cee6bce9).',
    '  - ROTACION-CLAVES: mojibake + nota S23 + homogeneizar S20-S22 (3efd3cf0, e2875579, 11d84163).',
    '  - GUIA-RAPIDA: rutas obsoletas (ae3cd460).',
    '- Sin hallazgos tecnicos cerrados ni nuevos.',
    '- Progreso: 81% (38/47) sin cambios.',
    ''
)

$contenido = $contenido.Substring(0, $idxDespues) + ($bloqueS23 -join $le) + $contenido.Substring($idxDespues)

# --- Escribir byte-safe ---
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($rutaAbs, $contenido, $utf8SinBom)

# --- Verificacion ---
$bytesV = [System.IO.File]::ReadAllBytes($rutaAbs)
$verif = [System.Text.Encoding]::UTF8.GetString($bytesV)

if (-not $verif.Contains('**2026-10-17 - Sesion 23 (ENV) - COMPLETA**')) {
    Write-Host "[ERROR] Post-write: no se encontro bloque S23." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}
if (-not $verif.Contains($despuesHeader)) {
    Write-Host "[ERROR] Post-write: header no actualizado." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

Write-Host "[OK] Verificacion post-write OK." -ForegroundColor Green
Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(status): actualizar STATUS a cierre S23"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}