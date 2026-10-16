# scripts/docs/78-fix-status-orden.ps1
# S23 - Reordenar STATUS.md: mover bloque S16-S22 entre seccion 5 y seccion 6
# Idempotente. Uso: powershell -ExecutionPolicy Bypass -File scripts\docs\78-fix-status-orden.ps1 [-NoCommit]

[CmdletBinding()]
param(
    [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$archivo = "docs\STATUS.md"

if (-not (Test-Path $archivo)) {
    Write-Host "[ERROR] No existe: $archivo" -ForegroundColor Red
    exit 1
}

$lineas = Get-Content $archivo
$total = $lineas.Count

Write-Host "[INFO] Total de lineas leidas: $total" -ForegroundColor DarkGray

# --- Idempotencia: verificar que S16 este ANTES de ## 6. Comandos utiles ---
$idxS16  = -1
$idxSec6 = -1
$idxSec7 = -1

for ($i = 0; $i -lt $total; $i++) {
    if ($idxS16 -lt 0 -and $lineas[$i] -match '^\*\*2026-10-15 - Sesion 16 \(COMPLETA\)\*\*') {
        $idxS16 = $i
    }
    if ($idxSec6 -lt 0 -and $lineas[$i] -eq '## 6. Comandos utiles') {
        $idxSec6 = $i
    }
    if ($idxSec7 -lt 0 -and $lineas[$i] -eq '## 7. Documentos relacionados') {
        $idxSec7 = $i
    }
}

if ($idxS16 -lt 0) {
    Write-Host "[ERROR] No se encontro la linea de inicio de S16." -ForegroundColor Red
    exit 1
}
if ($idxSec6 -lt 0) {
    Write-Host "[ERROR] No se encontro '## 6. Comandos utiles'." -ForegroundColor Red
    exit 1
}
if ($idxSec7 -lt 0) {
    Write-Host "[ERROR] No se encontro '## 7. Documentos relacionados'." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] S16 empieza en indice: $idxS16 (linea $($idxS16 + 1))" -ForegroundColor DarkGray
Write-Host "[INFO] ## 6. Comandos utiles en indice: $idxSec6 (linea $($idxSec6 + 1))" -ForegroundColor DarkGray
Write-Host "[INFO] ## 7. Documentos relacionados en indice: $idxSec7 (linea $($idxSec7 + 1))" -ForegroundColor DarkGray

# --- Idempotencia real: si S16 ya esta ANTES de seccion 6, skip ---
if ($idxS16 -lt $idxSec6) {
    Write-Host "[SKIP] El bloque S16-S22 ya esta antes de la seccion 6." -ForegroundColor Yellow
    exit 0
}

# --- Verificar orden actual esperado: 5 < 6 < 7 < S16 ---
if (-not ($idxSec6 -lt $idxSec7 -and $idxSec7 -lt $idxS16)) {
    Write-Host "[ERROR] Orden inesperado. Se esperaba: seccion 6 < seccion 7 < S16." -ForegroundColor Red
    Write-Host "        Encontrado: seccion6=$idxSec6, seccion7=$idxSec7, S16=$idxS16" -ForegroundColor Red
    exit 1
}

# --- Backup ---
$backup = "$archivo.bak-s23-78"
Copy-Item $archivo $backup -Force
Write-Host "[OK] Backup en: $backup" -ForegroundColor DarkGray

# --- Construir los 3 bloques ---
# A = [0 .. idxSec6 - 1]    -> Secciones 1-5 (incluye la linea vacia antes de ## 6)
$A = $lineas[0..($idxSec6 - 1)]

# B = [idxS16 .. total - 1] -> Bloque S16-S22 completo
$B = $lineas[$idxS16..($total - 1)]

# C = [idxSec6 .. idxS16 - 1] -> Secciones 6, 7, separadores, lineas vacias
$C = $lineas[$idxSec6..($idxS16 - 1)]

Write-Host "[INFO] Bloque A (Secciones 1-5): $($A.Count) lineas" -ForegroundColor DarkGray
Write-Host "[INFO] Bloque B (S16-S22):       $($B.Count) lineas" -ForegroundColor DarkGray
Write-Host "[INFO] Bloque C (Secciones 6-7): $($C.Count) lineas" -ForegroundColor DarkGray

$nuevo = @($A) + @($B) + @($C)

# --- Verificacion pre-write: misma cantidad de lineas ---
if ($nuevo.Count -ne $total) {
    Write-Host "[ERROR] Cantidad de lineas cambio: $total -> $($nuevo.Count). Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# --- Escribir con UTF-8 sin BOM y LF ---
$textoNuevo = ($nuevo -join "`n") + "`n"
$utf8SinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $archivo).Path, $textoNuevo, $utf8SinBom)

# --- Verificacion post-write ---
$verif = Get-Content $archivo

# 1. Total de lineas
if ($verif.Count -ne $total) {
    Write-Host "[ERROR] Post-write: total de lineas cambio: $total -> $($verif.Count). Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 2. Localizar de nuevo los indices
$idxS16v  = -1
$idxSec6v = -1
$idxSec7v = -1

for ($i = 0; $i -lt $verif.Count; $i++) {
    if ($idxS16v -lt 0 -and $verif[$i] -match '^\*\*2026-10-15 - Sesion 16 \(COMPLETA\)\*\*') {
        $idxS16v = $i
    }
    if ($idxSec6v -lt 0 -and $verif[$i] -eq '## 6. Comandos utiles') {
        $idxSec6v = $i
    }
    if ($idxSec7v -lt 0 -and $verif[$i] -eq '## 7. Documentos relacionados') {
        $idxSec7v = $i
    }
}

# 3. Orden esperado: 5 < S16 < 6 < 7
if (-not ($idxS16v -lt $idxSec6v)) {
    Write-Host "[ERROR] Post-write: S16 ($idxS16v) NO esta antes de seccion 6 ($idxSec6v). Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

if (-not ($idxSec6v -lt $idxSec7v)) {
    Write-Host "[ERROR] Post-write: seccion 6 ($idxSec6v) NO esta antes de seccion 7 ($idxSec7v). Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 4. Verificar que seccion 5 sigue existiendo
$tieneSec5 = $false
foreach ($l in $verif) {
    if ($l -eq '## 5. Ultima actividad') { $tieneSec5 = $true; break }
}
if (-not $tieneSec5) {
    Write-Host "[ERROR] Post-write: falta '## 5. Ultima actividad'. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

# 5. Verificar que S22 sigue existiendo
$tieneS22 = $false
foreach ($l in $verif) {
    if ($l -match '^\*\*2026-10-16 - Sesion 22 \(ENV\) - COMPLETA\*\*') { $tieneS22 = $true; break }
}
if (-not $tieneS22) {
    Write-Host "[ERROR] Post-write: falta 'Sesion 22 (ENV) - COMPLETA'. Restaurando." -ForegroundColor Red
    Move-Item $backup $archivo -Force
    exit 1
}

Write-Host "[OK] Verificacion post-write:" -ForegroundColor Green
Write-Host "     Total lineas: $total (sin cambios)" -ForegroundColor Green
Write-Host "     Orden: 1-5 -> S16-S22 -> 6-7" -ForegroundColor Green
Write-Host "     Sesion 5, Sesion 16, Sesion 22 presentes" -ForegroundColor Green

Remove-Item $backup -Force

# --- Commit opcional ---
if (-not $NoCommit) {
    git add $archivo
    git commit -m "docs(sync): reordenar sesiones S16-S22 en STATUS"
    git push origin main
    Write-Host "[OK] Commit + push hechos." -ForegroundColor Green
} else {
    Write-Host "[NoCommit] Cambio aplicado, NO commiteado." -ForegroundColor Cyan
}